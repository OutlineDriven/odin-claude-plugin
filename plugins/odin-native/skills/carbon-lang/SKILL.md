---
name: carbon-lang
description: 'Use when evaluating Carbon for a C++ code base, running the carbon toolchain from a nightly or Bazel build, or comparing Carbon with staying on C++. Not for C++ modules: use cpp-modules.'
---

# Carbon

Carbon is an experimental successor language to C++ from the carbon-language project. As of 2026-09-05 there is no 1.0 and no 0.1: the 0.1 milestone is the minimum language for evaluation, and the 2025 roadmap revision moved its earliest realistic date to the end of 2026 after memory-safety design was added to its scope. The only downloads are nightly toolchain tarballs tagged `v0.0.0-0.nightly.YYYY.MM.DD`, on limited platforms. Treat every finding below as dated to the nightly you ran.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A team with a large C++ code base asks whether to evaluate Carbon, wants to run the toolchain, wants to call C++ from Carbon, or asks how Carbon's safety model and readiness compare with C++. |
| Authority | Reversible local: writes only the toolchain checkout or extracted nightly tarball, Carbon source files, and `--output` artifacts in the working directory; rollback is deleting them. No remote mutation. |
| Side effect | A Bazel build of the toolchain compiles a pinned LLVM commit and takes substantial disk and time. |
| Done | The evaluation report states the nightly date or commit used, what compiled and what did not, and a decision (evaluate further or stay on C++) tied to the constraints in step 7. |

## Inputs

- The C++ code base under consideration and its constraints: stdlib and Boost dependence, template depth, platforms.
- A toolchain source: a nightly tarball from the GitHub releases page, or a checkout of `https://github.com/carbon-language/carbon-lang` with Clang 19 or newer, `libc++-dev`, `libc++abi-dev`, and `lld` installed. Bazel is pinned by `.bazelversion` (8.6.0 at grounding) and fetched by `scripts/run_bazelisk.py`; LLVM is pinned as an upstream commit through `git_override` in `MODULE.bazel`, not as a release number.
- The evaluation question: syntax and ergonomics, C++ interop, or readiness.

## Procedure

1. Record the toolchain identity. From a nightly: extract the tarball, take the version from the `carbon_toolchain-${VERSION}` directory name, and run `./carbon_toolchain-${VERSION}/bin/carbon help`. From source: `./scripts/run_bazelisk.py run //toolchain -- help` builds and runs the driver (target `//toolchain:carbon`, alias `//toolchain:toolchain`); `//toolchain/install:carbon_toolchain` packages the tarball. Done when: the nightly tag or commit hash is written into the report.
2. Compile the README example to prove the toolchain works:

   ```carbon
   import Core library "io";

   fn Run() {
     Core.Print(42);
   }
   ```

   `carbon compile --output=forty_two.o forty_two.carbon` then `carbon link --output=forty_two forty_two.o`. Type-check only with `carbon compile --phase=check file.carbon` (phases: `lex`, `parse`, `check`, `lower`, `optimize`, `codegen`). Done when: the binary prints `42`.
3. Read the syntax against the design docs, not against tutorials. A package declaration is `[impl] [package Name] [library "Name"];`; there is no `api` keyword, and an API file is one that omits `impl`. The entry point is a function named `Run` in the default library of the `Main` package; its valid signatures are undecided. Variables are `var x: i32 = 3;`. Printing is `Core.Print(...)` after `import Core library "io";`. Done when: each construct in the evaluation has a line in `docs/design/README.md` behind it.
4. Test C++ interop with the documented form. Import a header into the `Cpp` namespace and call through it:

   ```carbon
   import Cpp library "circle.h";

   fn Area(r: f64) -> f64 {
     return Cpp.circle_area(r);
   }
   ```

   `import Cpp library "<cstdio>";` works for standard headers. Interop is semantic: C++ functions, classes, and macros map into `Cpp.` with explicit-cast rules for types such as `Cpp.int`. The design says Carbon functions and types may be marked as exported to C, comparable to `extern "C"`, but no exported-to-C++ header generator exists in the docs; `Carbon.h` is not a real artifact. Done when: at least one C++ function is called from Carbon on the recorded nightly, or the failure is quoted.
5. State the safety model as designed, not as marketed. Safe and unsafe code are split by a narrow `unsafe` keyword, with two modes: Strict Carbon marks all unsafe code, Permissive Carbon relaxes that for C++ interop and migration. Type safety and temporal and data-race safety are meant to come from the type system at compile time, spatial safety from run-time checks. The docs state the temporal model is expected to follow Rust's direction at the highest level. None of this is implemented enough to evaluate; say so. Done when: the report cites `docs/design/safety/README.md` and marks the model as design-stage.
6. List the limitations that apply today: no standard library comparable to C++'s, toolchain and syntax change nightly, editor support is thin, and the platform list is short. Done when: each limitation is tied to something observed on the recorded nightly.
7. Decide. Evaluate further when the team owns a large C++ code base it intends to migrate gradually, wants C++ interop without an FFI layer, and can absorb nightly churn on an evaluation branch. Stay on C++ when production stability is needed now, when the code leans on the standard library, Boost, or deep template metaprogramming, or when the target platforms exceed the nightly's list. `cpp-modules` and `cpp-templates` cover the C++ side of that comparison. Done when: the decision names the constraint that settled it.

## Failure and recovery

| Failure | Cause | Fix |
|---|---|---|
| Bazel build fails on LLVM | Host Clang older than 19, or `libc++`, `libc++abi`, `lld` missing | Install the listed prerequisites; let Bazel fetch the pinned LLVM commit rather than pointing at a system LLVM |
| C++ import rejects a header | Unsupported C++ feature in the header | Wrap the needed calls in a plain C or simpler C++ shim header and import that |
| Tutorial syntax fails to parse | Pre-0.1 churn | Rewrite against `docs/design/README.md` at the same commit as the toolchain |
| Compiler Explorer and local results differ | Different nightlies | Pin both to the same date; `carbon.compiler-explorer.com` is the project's own instance |
| Needed library function does not exist | No standard library yet | Call the C++ library through `import Cpp library` |
| Link error mixing Carbon and C++ objects | Toolchain mismatch | Link with `carbon link` from the same nightly that compiled the objects |

## Output

An evaluation report naming the nightly tag or commit, the examples that compiled and ran, the C++ interop result, the safety model status as design-stage, the observed limitations, and the decision from step 7 with its deciding constraint.
