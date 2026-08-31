---
name: fuzzing-coverage-analysis
description: 'Use when a user needs to measure a fuzz corpus, explain a coverage plateau, or turn uncovered regions into campaign work. Produces a reproducible coverage report that excludes harness noise and identifies concrete reachable or blocked regions. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Fuzzing coverage analysis

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User needs to measure a fuzz corpus, explain a coverage plateau, or turn uncovered regions into campaign work. |
| Authority | Reversible local: write only coverage profiles and reports under a single named target directory for one fuzz target. No VCS, credential, paid, published, deployed, or remote mutation. Roll back by deleting the generated profiles and report directory. |
| Side effect | Coverage profiles (`.profraw`, `.profdata`, `.gcda`) and a coverage report (text and HTML) written under the target directory for the named fuzz target. |
| Done | A reproducible coverage report excludes harness noise and identifies concrete reachable or blocked regions. |

## Inputs

Required:
- The fuzz target: its harness function (e.g. `LLVMFuzzerTestOneInput`) and the system under test source it exercises.
- A post-campaign corpus directory to measure. Use the corpus generated after a fuzzing campaign, not real-time fuzzer statistics, so measurements are reproducible and comparable across tools.
- The target directory for generated profiles and reports.

Optional:
- A prior baseline profile (`.profdata`) for differential coverage against an earlier campaign.
- A known crashing input set, when the corpus may contain inputs that abort the harness.

## Procedure

1. Pick one coverage toolchain and stay on it for the whole target; never mix LLVM and GCC instrumentation in one profile. Use a dedicated coverage tool (`llvm-cov`, `gcovr`, or `cargo fuzz coverage`), not the fuzzer's own reported coverage, because different fuzzers compute coverage differently and their numbers are not comparable.
2. Build the system under test and harness with coverage instrumentation at `-O2` (not `-O3`, which can eliminate code and make coverage misleading). Do not combine `-fsanitize=fuzzer` with profile instrumentation in the coverage build.
   - LLVM/Clang (C/C++): `-fprofile-instr-generate -fcoverage-mapping`.
   - GCC (C/C++): `-ftest-coverage -fprofile-arcs`.
   - Rust: `rustup toolchain install nightly --component llvm-tools-preview`, then `cargo +nightly fuzz coverage <target>`.
3. For C/C++, link a separate execution runtime (not the fuzzer main) that iterates every regular file in the corpus directory and feeds each to `LLVMFuzzerTestOneInput`. This runtime and the harness are measurement scaffolding, not system-under-test code.
4. If the corpus may contain crashing inputs, fork before each `LLVMFuzzerTestOneInput` call (or remove the crashing inputs first) so one aborting input does not prevent coverage generation for the rest of the corpus.
5. Run the instrumented binary over the corpus directory.
   - LLVM: `LLVM_PROFILE_FILE=<target>/fuzz.profraw ./fuzz_exec <corpus>/`.
   - GCC: `./fuzz_exec_gcov <corpus>/` (`.gcda` files accumulate across runs; use `gcovr --delete` to start fresh).
   - Rust: coverage data is produced by `cargo fuzz coverage`.
6. Merge and report, excluding harness and runtime noise so the report reflects system-under-test coverage only.
   - LLVM: `llvm-profdata merge -sparse <target>/fuzz.profraw -o <target>/fuzz.profdata`, then `llvm-cov report ./fuzz_exec -instr-profile=<target>/fuzz.profdata -ignore-filename-regex='harness|execute-rt'` for text and `llvm-cov show ... -format=html -output-dir <target>/html/` for HTML.
   - GCC: `gcovr --gcov-executable "llvm-cov gcov" --exclude harness --exclude execute-rt --root . --html-details -o <target>/coverage.html`.
   - Rust: `cargo +nightly cov -- show -Xdemangler=rustfilt <target-binary> -instr-profile=<profdata> -show-line-counts-or-regions -show-instantiations -format=html -o <target>/html/ <src-filter>`.
7. Classify every uncovered region into one of: reachable-but-uncovered (needs better seeds or harness input shaping), blocked-by-magic-value (a hardcoded conditional guard the fuzzer cannot satisfy), or dead/unreachable through this harness.
8. Turn each uncovered region into concrete campaign work: a dictionary entry for a magic value, a seed input that shapes bytes toward the region, or a harness change that reaches it. For magic-value guards, add the literal bytes (e.g. `"\x7F\x45\x4C\x46"`) to a dictionary file.
9. If a baseline profile was supplied, run `llvm-cov show` with two `-instr-profile` arguments to produce a differential view and report coverage gained or lost versus the earlier campaign.
10. Write the report and the region classification with its campaign-work items into the target directory.

## Failure and recovery
- Missing toolchain (`llvm-cov`, `llvm-profdata`, `gcovr`, or nightly Rust not installed): stop and name the missing tool. Do not substitute the fuzzer's reported coverage for a dedicated-tool measurement.
- `error: no profile data available` or `Failed to load coverage`: the profile was not generated or the binary used for the report is not the instrumented binary. Rebuild the instrumented binary with the same flags used during execution and re-run; do not fabricate a report from a mismatched binary.
- `incompatible instrumentation`: LLVM and GCC coverage were mixed in one profile. Rebuild the whole target with one toolchain.
- Crashing input prevents coverage generation: fork-isolate the crashing input or remove it before profiling; do not swallow the crash or pretend coverage was generated.
- Empty corpus or coverage infrastructure not yet set up: this is a blocked result, not a zero-coverage report. Return blocked with the missing prerequisite named.
- Partial-result rule: if profiling succeeds for part of the corpus, the report covers only the inputs that ran; record which inputs were excluded and why.
- Non-mutation rule: only profiles and reports are written under the target directory. Roll back by deleting that directory; no source, corpus, or VCS state is changed.

## Output
A coverage report (text summary plus HTML detail) and a region classification written under the target directory. The classification lists each uncovered region as reachable-uncovered, blocked-by-magic-value, or dead, each paired with a concrete campaign-work item (dictionary entry, seed input, or harness change). When a baseline was supplied, the output also states coverage gained or lost versus that baseline.

## Provenance

Origin: https://github.com/trailofbits/skills, path `/plugins/testing-handbook-skills/skills/coverage-analysis/SKILL.md`, revision `d1f1575cff97816e5cc08af66cd2506099c681d3`. License: CC-BY-SA-4.0; preserve Trail of Bits attribution and the source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse `trail-of-bits-mark.svg` as branding. Adaptation: clean-room rewrite preserving the source mechanism (dedicated coverage toolchain over a post-campaign corpus, harness-noise exclusion, magic-value and dead-code classification, and conversion of uncovered regions to dictionary/seed/harness work) without copying its expression.
