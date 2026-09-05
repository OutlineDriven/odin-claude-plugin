---
name: code-generation-and-backends
description: 'Use when reading llc output, tracing IR through legalization and instruction selection, or scoping a new LLVM target. Not for IR-level passes: use llvm-ir-and-passes.'
---

# Code generation and backends

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A user asks how LLVM IR becomes machine code for a target, why the legalizer inserted extra operations, why `llc` and `clang` emit different assembly, what an `llc` fatal error at instruction selection means, or what a port to a new architecture involves. |
| Authority | Reversible local: writes only bitcode and assembly files under a scratch directory named in the report; rollback is deleting that directory. No remote mutation. |
| Side effect | Runs `clang` and `llc` on the supplied source or bitcode and reads the emitted assembly. Project files are not modified. |
| Done | A codegen report names the stage that produced each observed instruction sequence or failure, the triple and feature set in effect, and the fix or expansion path for every failure. |

## Inputs

1. Source file, LLVM IR (`.ll`), or bitcode (`.bc`) (required).
2. Target triple and CPU features (required if not inferrable from the build): for example `aarch64-linux-gnu`, `riscv64-unknown-elf`, `thumbv7em-none-eabi` with `+neon` or `+crc`.
3. The observed symptom (required): the assembly region, the `llc` error text, or the question about the pipeline.
4. Installed LLVM version (`llc --version`) (gathered by the skill). Grounded current stable is LLVM 23.1.0; tool flags below are confirmed against that release.

## Procedure

1. Map the question onto the backend pipeline. Per function, LLVM runs: IR legalization of types and operations the target lacks; `SelectionDAGBuilder`; `LegalizeTypes` and `LegalizeOps`; instruction selection by TableGen pattern match; pre-register-allocation scheduling; register allocation; prolog and epilog insertion; `AsmPrinter` to assembly or object. Name the stage the symptom belongs to. Done when: one stage is named as the owner of the symptom.
2. Reproduce with `llc` in a scratch directory, with the same triple the build uses:

   ```bash
   clang -c -emit-llvm -O2 -o foo.bc foo.c
   llc -mtriple=aarch64-linux-gnu -O2 foo.bc -o foo.s
   llc -mtriple=riscv64-unknown-elf -O2 foo.bc -o foo-rv.s
   llc -mtriple=thumbv7em-none-eabi -mattr=+dsp foo.bc -o foo-m7.s
   ```

   `llc --version` lists registered targets; `llc -mattr=help -mtriple=<triple>` lists feature names; `llc -mcpu=help -mtriple=<triple>` lists CPU names. Done when: the assembly or the error reproduces from bitcode with an explicit triple.
3. When `llc` output and `clang` output differ, compare the triples and feature sets. `clang --target=arm-none-eabi -c -O2 foo.c` bakes the triple into the bitcode; passing a different `-mtriple` or `-mattr` to `llc` changes legalization and selection. Done when: both tools run with the same triple, CPU, and attributes, and the difference is either gone or explained by a flag.
4. For extra operations you did not write, read them as legalization. A type the target has no register for (an `i64` on a 32-bit core, a vector type without a matching unit) is split, promoted, or expanded into a libcall; an operation without a pattern is expanded into a sequence. The fix is either a target feature that makes the type or operation legal, or an IR change that avoids it. Done when: each unexpected instruction sequence is tied to a type or operation the target cannot represent directly.
5. For a `Cannot select` fatal error, identify the IR operation and type in the message, then decide between marking it legal in the target (a backend change), adding a custom lowering hook in `TargetLowering`, or rewriting the IR so the operation is not produced. Done when: one of the three paths is chosen and stated with the operation and type.
6. For wrong soft-float or calling-convention behaviour, check the ABI in the triple (`gnueabi` versus `gnueabihf`) and the float ABI flag passed to `clang`; the target's calling convention lives in TableGen (`CC_AArch64`, `CC_X86_64`) and is selected by the triple. Done when: the triple and float ABI match the ABI the linked objects use. For the ABI rules themselves, use `abi-and-calling-conventions`.
7. For a large stack frame or spill-heavy assembly, treat it as register pressure that survived to allocation, not as a backend defect. Reduce live ranges at the IR or source level. Done when: the spill count changes with the source change, which confirms the diagnosis. For the allocation mechanism, use `compiler-optimizations-deep`.
8. For a question about adding a target, give the outline and the effort: define register classes and instruction formats in TableGen `.td` files; implement lowering hooks in `TargetLowering`; implement the `AsmPrinter` and the MC layer with relocations; implement the calling convention and the object writer for the target format. Patterns such as `Pat<(add i32 GPR:$a, GPR:$b), (ADD32rr GPR:$a, GPR:$b)>` map DAG nodes to machine instructions. Start from the in-tree backend closest to the architecture. A TableGen syntax error is reported by `llvm-tblgen` with the `.td` line. Done when: the four parts and the closest existing backend are named.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Target not registered in the installed `llc` | Report the `llc --version` target list. Stop; a rebuilt LLVM with the target enabled is a prerequisite. |
| Bitcode from a different LLVM major than `llc` | Report both versions. Regenerate the bitcode with the matching `clang`; bitcode is not stable across majors. |
| Triple unknown and not inferrable from the build | Report the ambiguity with the evidence examined. Do not guess a triple. |
| Symptom is at the IR level, not the machine level | Hand off to `llvm-ir-and-passes` and say so; do not narrate a codegen cause for an IR effect. |

No partial result is claimed complete. If a step cannot finish, the report states which steps ran and which are blocked.

## Output

A codegen report containing:
1. Stage attribution: the pipeline stage that owns each observed instruction sequence or error.
2. Effective target: the triple, CPU, and feature set used, and any mismatch found between `clang` and `llc`.
3. Fix path: for each failure, the chosen path (feature flag, IR change, custom lowering, or backend change) with the operation and type involved.
4. Scratch location: the directory holding the generated `.bc` and `.s` files.
