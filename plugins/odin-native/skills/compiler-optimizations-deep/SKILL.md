---
name: compiler-optimizations-deep
description: 'Use when -O3 leaves a hot loop scalar, spills appear in assembly, or a PGO or BOLT deployment is planned or stalls. Not for machine lowering: use code-generation-and-backends.'
---

# Compiler optimizations, deep

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A hot loop stayed scalar at `-O3`, assembly shows spills, `-O3` runs slower than `-O2`, GCC and Clang produce different code for the same source, or a profile-guided or post-link optimization is being planned or produced no gain. |
| Authority | Reversible local: writes only instrumented binaries, profiles, and remark files under a scratch directory named in the report; rollback is deleting that directory. No remote mutation. |
| Side effect | Runs the compiler with remark flags, and when asked, an instrumented build and a training run. Project files are not modified. |
| Done | Each symptom is attributed to a named pipeline stage with the compiler's own remark or output as evidence, and each fix is stated as a source change, a flag, or a workflow step the user can apply. |

## Inputs

1. Source and the exact compile command (required): the flags decide which passes run.
2. Compiler and version (required if not inferrable): `clang --version` or `gcc --version`. Grounded current stables are LLVM/Clang 23.1.0 and GCC 16.2; flags below are confirmed against Clang 23.1.0.
3. The symptom (required): a loop that did not vectorize, spills in a function, a slower `-O3`, or a PGO or BOLT plan.
4. A representative workload (required for PGO or BOLT): the input the production binary will see.

## Procedure

1. Place the symptom in the pipeline. After the frontend emits LLVM IR (or GIMPLE in GCC), the mid-level passes run (dead code elimination, GVN, loop-invariant code motion, inlining), then loop passes (unroll, vectorize), then codegen preparation, instruction selection, register allocation, and scheduling. Pass order matters: LICM must hoist an invariant before the vectorizer can prove the loop simple. Done when: the stage is named.
2. For a loop that did not vectorize, ask the compiler why:

   ```bash
   clang -O3 -Rpass=loop-vectorize -Rpass-missed=loop-vectorize -Rpass-analysis=loop-vectorize -c foo.c
   ```

   `-Rpass-analysis` prints the reason. Map the reason to the fix:

   | Reason in remark | Fix |
   |---|---|
   | Trip count unknown or loop exit not computable | Restructure so the exit is a simple counted loop; peel the remainder. |
   | Memory dependence between iterations | Reorder accesses or use separate accumulators; add `restrict` when the pointers do not alias. |
   | Cannot reorder floating-point operations | A reduction over floats needs reassociation: `#pragma clang loop vectorize(enable)` on the loop or `-ffast-math` on the file, with the precision cost accepted. |
   | Call inside the loop | Inline it, or move the call out of the loop body. |
   | Unknown alignment | `__builtin_assume_aligned` where the alignment is guaranteed by the allocator. |

   Done when: the remark reason is quoted and one fix is chosen for it.
3. For spills, read them as live ranges exceeding the physical registers. The allocator stores values to stack slots and reloads them; each spill is a load or store on the hot path. LLVM's default allocator at `-O2` and above is the greedy allocator (`llc -regalloc=greedy`). Reduce pressure by shortening live ranges: split long-lived variables, compute cheap values where used instead of keeping them, and reduce unrolling in the affected loop. Done when: a source change moves the spill count, which confirms the cause.
4. For `-O3` slower than `-O2`, treat it as a code-size effect: more inlining and unrolling can exceed the instruction cache of the target core. Measure both, and prefer `-O2` plus PGO over `-O3` alone when `-O2` wins. Done when: both builds are timed on the workload and the choice is stated with the numbers.
5. For a PGO deployment with Clang, run the three-step workflow on the representative workload:

   ```bash
   clang -fprofile-instr-generate -O2 -o app foo.c
   ./app            # training run writes default.profraw
   llvm-profdata merge default.profraw -o default.profdata
   clang -fprofile-instr-use=default.profdata -O2 -o app_pgo foo.c
   ```

   The profile improves branch layout, inlining decisions, and the vectorizer's cost decisions. A profile from an unrepresentative input makes the build worse on production input. Done when: the PGO binary is timed against the baseline on production-like input.
6. For a post-link layout pass with BOLT, the binary must keep its symbol table and be linked with relocations (`-Wl,--emit-relocs`; confirm with a `.rela.text` section in `readelf -S`). Collect a profile by instrumentation when `perf` sampling is unavailable, then optimize:

   ```bash
   llvm-bolt app -instrument -o app.inst
   ./app.inst       # writes /tmp/prof.fdata
   llvm-bolt app -o app.bolt -data=/tmp/prof.fdata -reorder-blocks=ext-tsp
   ```

   BOLT is incompatible with GCC's default `-freorder-blocks-and-partition`; add `-fno-reorder-blocks-and-partition` when compiling with GCC. Done when: `app.bolt` runs and `readelf -S app.bolt` shows a `.note.bolt_info` section.
7. For a GCC versus Clang difference, compare at two levels: the IR after optimization and the final assembly. The pass orders differ, so a loop one vectorizes and the other does not is normal; use the remark flags of each compiler to see the reason on each side. Done when: the first diverging decision is named.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| No remark printed for the loop | The loop was not considered; usually it was fully unrolled or deleted earlier. Check with `-Rpass=loop-unroll` and inspect the IR before concluding. |
| PGO shows no gain | Training input did not match production. Re-collect with a representative input before changing flags. |
| BOLT rejects the binary | Symbols stripped or no relocations. Relink with `-Wl,--emit-relocs` and without `strip`. |
| `-ffast-math` changes results | The reduction reorder is the cause. Use the per-loop pragma instead, or keep the loop scalar and accept it. |
| Compiler version older than the grounded stable | Remark names and allocator defaults may differ. Report the version and confirm each flag with `--help` before relying on it. |

No partial result is claimed complete. If a step cannot finish, the report states which steps ran and which are blocked.

## Output

An optimization report containing:
1. Attribution: each symptom, the pipeline stage that caused it, and the compiler remark or output quoted as evidence.
2. Fixes: per symptom, the source change, flag, or workflow step, with any precision or size cost stated.
3. Measurements: baseline and treatment timings for any PGO, BOLT, or `-O2` versus `-O3` comparison.
4. Scratch location: the directory holding remark files, profiles, and instrumented binaries.
