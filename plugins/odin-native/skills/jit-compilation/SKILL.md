---
name: jit-compilation
description: 'Use when adding code generation with LLVM ORC or LLJIT, Cranelift, or dynasm, lazy compilation or inline caches, or fixing W^X faults. Not for AST-to-IR: use compiler-frontend.'
---

# JIT compilation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user adds a JIT hot path to an interpreter, compiles functions lazily on first call, embeds code generation in a REPL or engine, needs inline caches for polymorphic call sites, or hits symbol lookup, ABI, or W^X failures in JIT code. |
| Authority | Reversible local: writes only the JIT source files the user names inside the project and scratch build outputs; rollback is version control. No remote mutation. |
| Side effect | JIT source is created or edited, built, and executed on a test function whose result is checked. |
| Done | The chosen backend compiles a test function at runtime, the call through the returned pointer produces the expected value, and code memory is never writable and executable at the same time. |

## Inputs

1. Host language and backend (required): C++ with LLVM ORC or LLJIT, Rust with Cranelift, or Rust with `dynasm`. If undecided, step 1 chooses.
2. The input form (required): AST, bytecode, or an IR the frontend already emits.
3. A test function (required): source or IR for a function with a known result, for example `add(3, 4) == 7`.
4. Installed toolchain (gathered by the skill): `llvm-config --version` for LLVM (grounded current stable 23.1.0; header paths below are confirmed against it), `cargo` for Rust crates (Cranelift samples confirmed against `cranelift-jit` 0.134.4).

## Procedure

1. Choose the backend by the constraint that dominates. LLVM optimizations needed: ORC or LLJIT. Fast compile and a small embeddable dependency: Cranelift. Small hand-written assembly snippets without an LLVM dependency: `dynasm`. An MLIR pipeline lowers to LLVM IR and then enters ORC. The architecture is the same in every case: source or bytecode to IR, IR to an in-memory object, a runtime linker resolves symbols, code lands in read-and-execute memory, and the caller receives a function pointer. Done when: one backend is named with the constraint that chose it.
2. For LLVM, start with LLJIT, the packaged ORC setup. Build a module, add it, look up the symbol, and convert the address to a typed pointer:

   ```cpp
   #include "llvm/ExecutionEngine/Orc/LLJIT.h"
   #include "llvm/IR/IRBuilder.h"
   #include "llvm/IR/LLVMContext.h"
   #include "llvm/IR/Module.h"
   using namespace llvm;
   using namespace llvm::orc;

   int main() {
       auto JIT = cantFail(LLJITBuilder().create());
       auto Ctx = std::make_unique<LLVMContext>();
       auto M = std::make_unique<Module>("jit", *Ctx);
       IRBuilder<> B(*Ctx);
       auto *FT = FunctionType::get(B.getInt32Ty(), {B.getInt32Ty(), B.getInt32Ty()}, false);
       auto *AddFn = Function::Create(FT, Function::ExternalLinkage, "add", M.get());
       B.SetInsertPoint(BasicBlock::Create(*Ctx, "entry", AddFn));
       B.CreateRet(B.CreateAdd(AddFn->getArg(0), AddFn->getArg(1)));
       cantFail(JIT->addIRModule(ThreadSafeModule(std::move(M), std::move(Ctx))));
       auto Add = cantFail(JIT->lookup("add")).toPtr<int (*)(int, int)>();
       return Add(3, 4) == 7 ? 0 : 1;
   }
   ```

   ```bash
   clang++ -std=c++17 jit.cpp $(llvm-config --cxxflags --ldflags --libs core orcjit native) -o jit
   ```

   The `LLVMContext` moves into the `ThreadSafeModule` with the module; a context that outlives its module on the stack is a use-after-free when the JIT tears down. Done when: the binary exits 0.
3. When LLJIT's defaults do not fit, assemble the ORC layers directly. `ExecutionSession` owns symbol lookup and `JITDylib`s; an object layer links relocatable objects; an IR layer compiles IR into objects for the layer below:

   ```cpp
   #include "llvm/ExecutionEngine/Orc/CompileUtils.h"
   #include "llvm/ExecutionEngine/Orc/Core.h"
   #include "llvm/ExecutionEngine/Orc/SelfExecutorProcessControl.h"
   #include "llvm/ExecutionEngine/Orc/IRCompileLayer.h"
   #include "llvm/ExecutionEngine/Orc/JITTargetMachineBuilder.h"
   #include "llvm/ExecutionEngine/Orc/RTDyldObjectLinkingLayer.h"
   #include "llvm/ExecutionEngine/SectionMemoryManager.h"

   auto EPC = cantFail(SelfExecutorProcessControl::Create());
   ExecutionSession ES(std::move(EPC));
   JITDylib &MainJD = ES.createBareJITDylib("main");
   RTDyldObjectLinkingLayer ObjLayer(ES, [] { return std::make_unique<SectionMemoryManager>(); });
   auto JTMB = cantFail(JITTargetMachineBuilder::detectHost());
   IRCompileLayer CompileLayer(ES, ObjLayer, std::make_unique<ConcurrentIRCompiler>(std::move(JTMB)));
   cantFail(CompileLayer.add(MainJD, std::move(TSM)));
   auto Sym = cantFail(ES.lookup({&MainJD}, ES.intern("my_func")));
   ```

   Lazy compilation on first call goes through ORC's lazy reexports (`LazyReexports.h`): the symbol resolves to a call-through stub, the first call triggers compilation, and the stub is updated to the compiled address. Done when: a symbol added through the layers resolves and calls correctly, and, when lazy compilation is requested, a counter proves the function compiled on first call and not at add time.
4. For a dynamic language, add inline caches at call sites. A monomorphic cache stores the receiver's class id and the resolved target; a hit calls the cached target, a miss re-resolves and overwrites the cache. The JIT emits specialized code for the cached type and deoptimizes to the generic path on a miss. Keep the cache check cheap: one compare on the class id. Done when: a call site with a stable receiver type executes the fast path, measured by a hit counter.
5. For Cranelift, build a `JITModule` from the host ISA, declare and define the function, finalize, and call through the returned pointer:

   ```rust
   use cranelift::prelude::*;
   use cranelift_jit::{JITBuilder, JITModule};
   use cranelift_module::{Linkage, Module};

   let isa = cranelift_native::builder()?.finish(settings::Flags::new(settings::builder()))?;
   let mut module = JITModule::new(JITBuilder::with_isa(isa, cranelift_module::default_libcall_names()));
   let mut sig = module.make_signature();
   sig.params.push(AbiParam::new(types::I32));
   sig.params.push(AbiParam::new(types::I32));
   sig.returns.push(AbiParam::new(types::I32));
   let func_id = module.declare_function("add", Linkage::Export, &sig)?;
   let mut ctx = module.make_context();
   ctx.func.signature = sig;
   // build the body with FunctionBuilder here
   module.define_function(func_id, &mut ctx)?;
   module.clear_context(&mut ctx);
   module.finalize_definitions()?;
   let code = module.get_finalized_function(func_id);
   let add: fn(i32, i32) -> i32 = unsafe { std::mem::transmute(code) };
   assert_eq!(add(3, 4), 7);
   ```

   Done when: the assertion passes.
6. For `dynasm`, assemble into an executable buffer and take the entry offset before the first instruction:

   ```rust
   use dynasmrt::{dynasm, DynasmApi};

   let mut asm = dynasmrt::x64::Assembler::new()?;
   let entry = asm.offset();
   dynasm!(asm
       ; .arch x64
       ; mov eax, edi
       ; add eax, esi
       ; ret
   );
   let buf = asm.finalize().expect("no live executors");
   let add: extern "sysv64" fn(i32, i32) -> i32 = unsafe { std::mem::transmute(buf.ptr(entry)) };
   assert_eq!(add(3, 4), 7);
   ```

   Name the calling convention on the function pointer type; the register choice above is the System V AMD64 convention. Done when: the assertion passes.
7. Keep code memory under W^X: a page is writable or executable, never both. On Linux, map read-write, write the code, then `mprotect` to read-execute:

   ```c
   #include <sys/mman.h>
   void *mem = mmap(NULL, size, PROT_READ | PROT_WRITE, MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
   if (mem == MAP_FAILED) return -1;
   memcpy(mem, code, size);
   if (mprotect(mem, size, PROT_READ | PROT_EXEC) != 0) return -1;
   ```

   `MAP_JIT` is a macOS flag for the hardened runtime, not a Linux one. On Linux a sealed `memfd_create` region (`MFD_ALLOW_SEALING`) is the option when a policy forbids anonymous executable mappings. The ORC memory managers and the `dynasm` assembler already follow this rule. Done when: no mapping in `/proc/<pid>/maps` shows `rwx` while the JIT runs.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Symbol not found on lookup | The name is mangled or not exported. Emit the function with external linkage and an unmangled name; look up the exact string the module defines. |
| Segfault when calling JIT code | The pointer type does not match the emitted signature or calling convention. Match parameter types, return type, and convention on both sides. |
| `mprotect` or `mmap` with `PROT_EXEC` fails | A policy denies executable memory: an SELinux `execmem` denial shows in `ausearch -m avc -ts recent`. Use the sealed memfd path or adjust the policy with the operator; do not fall back to `rwx`. |
| Stale code after recompilation | A caller holds the old pointer. Invalidate caches and route calls through a stub that is updated on recompile. |
| Compile latency dominates | The JIT optimizes at `-O2` on every function. Compile cold code at `-O0` and re-optimize functions that a counter marks hot. |
| Cranelift verifier error | The CLIF is invalid. Run `cranelift_codegen::verify_function` on the function with the ISA flags and fix the reported instruction. |

No partial result is claimed complete. If a step cannot finish, the report states which steps passed and which are blocked.

## Output

A JIT delivery containing:
1. Backend and reason: the chosen backend and the constraint that chose it.
2. Files written: each source file created or edited.
3. Verification: the test function, the observed result of the call through the JIT pointer, and the W^X check.
4. Lazy and cache evidence: when requested, the counters proving first-call compilation and inline-cache hits.
