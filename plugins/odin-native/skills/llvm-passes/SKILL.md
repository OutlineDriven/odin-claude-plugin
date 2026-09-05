---
name: llvm-passes
description: 'Use when writing an LLVM pass plugin, registering it for opt -passes, using DominatorTree or LoopInfo, or testing with FileCheck and lit. Not for reading IR: use llvm-ir-and-passes.'
---

# LLVM passes

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user adds a custom transform or analysis to an LLVM-based compiler, needs a plugin that `opt -load-pass-plugin` accepts, uses dominators, loops, or alias analysis inside a pass, or debugs a pass that corrupts IR or leaves analyses stale. |
| Authority | Reversible local: writes only the pass source, its CMake file, and its lit tests inside the project, plus the build directory; rollback is version control and deleting the build directory. No remote mutation. |
| Side effect | A plugin shared object is built and run through `opt` on test IR; the verifier and the lit test decide the result. |
| Done | The plugin loads into the installed `opt`, the pass name resolves in `-passes=`, `-verify-each` reports no broken IR on the test inputs, and the lit test passes. |

## Inputs

1. The transform or analysis to implement (required): what IR pattern it matches and what it produces or reports.
2. Pass scope (required if not obvious): per function or per module.
3. Test IR (required): a `.ll` input that contains the pattern and one that does not.
4. Installed LLVM (gathered by the skill): `llvm-config --version` and `--cmakedir`. Grounded current stable is LLVM 23.1.0; header paths, macros, and flags below are confirmed against it. The plugin must build against the same LLVM that `opt` was built from.

## Procedure

1. Fix the scope. Under the new pass manager, a `ModulePassManager` runs module passes and nests a `FunctionPassManager` per function; an `AnalysisManager` caches analyses and invalidates them when a pass reports that it did not preserve them. A pass that reads only one function at a time is a function pass; a pass that adds globals or functions is a module pass. Done when: the scope is stated with the reason.
2. Write the pass as a `PassInfoMixin` with a `run` method, and export the plugin entry point. The plugin header lives at `llvm/Plugins/PassPlugin.h` in LLVM 23.1.0. Erase instructions through `make_early_inc_range`; erasing inside a plain range loop invalidates the iterator.

   ```cpp
   #include "llvm/ADT/STLExtras.h"
   #include "llvm/IR/PassManager.h"
   #include "llvm/Passes/PassBuilder.h"
   #include "llvm/Plugins/PassPlugin.h"
   using namespace llvm;

   namespace {
   struct RemoveDeadFuncCalls : PassInfoMixin<RemoveDeadFuncCalls> {
       PreservedAnalyses run(Function &F, FunctionAnalysisManager &) {
           bool Changed = false;
           for (BasicBlock &BB : F)
               for (Instruction &I : make_early_inc_range(BB))
                   if (auto *Call = dyn_cast<CallInst>(&I))
                       if (Function *Callee = Call->getCalledFunction();
                           Callee && Callee->getName() == "dead_func") {
                           Call->eraseFromParent();
                           Changed = true;
                       }
           return Changed ? PreservedAnalyses::none() : PreservedAnalyses::all();
       }
   };
   } // namespace

   extern "C" LLVM_ATTRIBUTE_WEAK PassPluginLibraryInfo llvmGetPassPluginInfo() {
       return {LLVM_PLUGIN_API_VERSION, "RemoveDeadFuncCalls", "v0.1", [](PassBuilder &PB) {
           PB.registerPipelineParsingCallback(
               [](StringRef Name, FunctionPassManager &FPM, ArrayRef<PassBuilder::PipelineElement>) {
                   if (Name != "remove-dead-func-calls") return false;
                   FPM.addPass(RemoveDeadFuncCalls());
                   return true;
               });
       }};
   }
   ```

   A module pass has the signature `PreservedAnalyses run(Module &M, ModuleAnalysisManager &)` and registers through the `ModulePassManager` overload of the same callback. Skip declarations with `F.isDeclaration()` when iterating a module. Done when: the source compiles with the pipeline name chosen.
3. Build it as a `MODULE` library against the installed LLVM:

   ```cmake
   cmake_minimum_required(VERSION 3.20)
   project(RemoveDeadFuncCalls C CXX)
   find_package(LLVM REQUIRED CONFIG)
   add_library(RemoveDeadFuncCalls MODULE RemoveDeadFuncCalls.cpp)
   target_include_directories(RemoveDeadFuncCalls SYSTEM PRIVATE ${LLVM_INCLUDE_DIRS})
   target_compile_definitions(RemoveDeadFuncCalls PRIVATE ${LLVM_DEFINITIONS})
   set_target_properties(RemoveDeadFuncCalls PROPERTIES CXX_STANDARD 17)
   ```

   ```bash
   cmake -B build -DLLVM_DIR=$(llvm-config --cmakedir)
   cmake --build build
   ```

   CMake prefixes the module with `lib`. The plugin needs no explicit LLVM link line: `opt` provides the symbols at load time, and the build above links and loads on LLVM 23.1.0. Done when: `build/libRemoveDeadFuncCalls.so` exists.
4. Run it through `opt`, alone and inside a pipeline, with the verifier on:

   ```bash
   opt -load-pass-plugin ./build/libRemoveDeadFuncCalls.so -passes=remove-dead-func-calls -verify-each -S input.ll -o output.ll
   opt -load-pass-plugin ./build/libRemoveDeadFuncCalls.so -passes='function(instcombine,remove-dead-func-calls,dce)' -S input.ll -o out.ll
   ```

   `-S` writes textual IR; without it the output is bitcode. Inside a pipeline string a function pass must sit inside `function(...)`; naming it at module level fails with "unknown module pass". Done when: the pattern is gone from `output.ll` and `-verify-each` prints nothing.
5. Use analyses through the analysis manager; the dependency is tracked by the request, so no `getAnalysisUsage` declaration exists under the new pass manager:

   ```cpp
   #include "llvm/Analysis/AliasAnalysis.h"
   #include "llvm/Analysis/LoopInfo.h"
   #include "llvm/IR/Dominators.h"

   PreservedAnalyses run(Function &F, FunctionAnalysisManager &AM) {
       auto &DT = AM.getResult<DominatorTreeAnalysis>(F);
       auto &LI = AM.getResult<LoopAnalysis>(F);
       auto &AA = AM.getResult<AAManager>(F);
       for (Loop *L : LI) { BasicBlock *Header = L->getHeader(); /* hoist here */ }
       DomTreeNode *Root = DT.getNode(&F.getEntryBlock());
       return PreservedAnalyses::all();
   }
   ```

   Return `PreservedAnalyses::all()` only when the IR is unchanged. After a structural change, either return `none()` or name the analyses that survive (`PA.preserve<DominatorTreeAnalysis>()`). Done when: each analysis the pass reads is requested through `AM`, and the preserved set matches what the pass changed.
6. Modify IR through the builder and the standard utilities, and keep SSA intact:

   ```cpp
   IRBuilder<> Builder(&I);
   Value *NewVal = Builder.CreateAdd(I.getOperand(0), ConstantInt::get(I.getType(), 1));
   I.replaceAllUsesWith(NewVal);
   I.eraseFromParent();

   ValueToValueMapTy VMap;
   BasicBlock *Clone = CloneBasicBlock(OrigBB, VMap, ".clone", &F);   // llvm/Transforms/Utils/Cloning.h

   FunctionCallee Fn = M.getOrInsertFunction("my_fn", FunctionType::get(Builder.getVoidTy(), false));
   ```

   Replace every use before erasing a value; an erased value with remaining uses is the verifier's "use of undefined value" failure. Done when: `-verify-each` passes on every test input after the change.
7. Write a lit test with FileCheck. `lit` is a Python package (`pip install lit`) and `FileCheck` ships with LLVM; a `lit.cfg.py` next to the tests defines the `%shlibdir` substitution to the build directory.

   ```
   ; RUN: opt -load-pass-plugin %shlibdir/libRemoveDeadFuncCalls.so -passes=remove-dead-func-calls -S %s | FileCheck %s
   declare void @dead_func()
   define void @test() {
     call void @dead_func()
     ret void
   }
   ; CHECK-LABEL: define void @test()
   ; CHECK-NOT: dead_func
   ; CHECK: ret void
   ```

   ```bash
   lit test/ -v
   ```

   Done when: the lit run reports the test as passed.
8. When the pass misbehaves, use the pass manager's own instrumentation before adding prints:

   ```bash
   opt -load-pass-plugin ./build/libRemoveDeadFuncCalls.so -passes=remove-dead-func-calls -print-after-all input.ll -o /dev/null
   opt -passes=remove-dead-func-calls -time-passes input.ll -o /dev/null
   opt -passes=remove-dead-func-calls -debug-pass-manager input.ll -o /dev/null
   ```

   `-print-after-all` shows the IR after every pass; `-debug-pass-manager` shows which passes and analyses ran and which were invalidated. Done when: the first pass whose output is wrong is identified.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| `Pass not found` | The plugin did not load or the pipeline name differs from the string in the parsing callback. Confirm the `.so` path and the name; `opt --print-passes` does not list plugin passes. |
| Verifier failure | SSA broken by the transform. Run with `-verify-each`, read the first message, and fix the use-def order in the transform. |
| Analysis stale | The pass changed IR and returned `all()`. Return `none()` or an explicit preserved set. |
| Plugin fails to load | Built against a different LLVM than `opt`. Rebuild with `-DLLVM_DIR=$(llvm-config --cmakedir)` for the `opt` in use. |
| Empty or binary output | `-S` missing. Add it for textual IR. |
| lit test fails on CHECK | The pass output differs from the expectation. Run the `RUN` line by hand with `-S` and compare before editing CHECK lines. |

No partial result is claimed complete. If a step cannot finish, the report states which steps passed and which are blocked.

## Output

A pass delivery containing:
1. Files written: the pass source, CMake file, and lit tests.
2. Build and load evidence: the `opt` command that loaded the plugin and the pipeline string used.
3. Verification: the `-verify-each` result on each test input and the lit result.
4. Preserved analyses: the set the pass declares and why.
