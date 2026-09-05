---
name: fuzzing-coverage-analysis
description: 'Use when a user needs to measure fuzz corpus coverage, explain a coverage plateau, or turn uncovered regions into campaign work. Not for harness creation: use fuzz-harness-writing.'
---

# Fuzzing coverage analysis

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User needs to measure a fuzz corpus, explain a coverage plateau, or turn uncovered regions into campaign work. |
| Authority | Reversible local: writes only coverage profiles, reports, and temporary instrumented binaries under a single named target directory for one fuzz target; rollback is deleting the generated profiles, report directory, and temporary binaries. No remote mutation. No VCS mutation. |
| Side effect | Coverage profiles (`.profraw`, `.profdata`, `.gcda`) and a coverage report (text and HTML) written under the target directory for the named fuzz target. |
| Done | A reproducible coverage report excludes harness noise and identifies concrete reachable or blocked regions. |

## Not for

- Harness creation or improvement: use fuzz-harness-writing.
- Patching the system under test to bypass obstacles: use fuzzing-obstacles.
- Remote, credential, publish, deploy, or irreversible changes.

## Inputs

Required:
- The fuzz target: its harness function (e.g. `LLVMFuzzerTestOneInput`) and the system under test source it exercises.
- A post-campaign corpus directory to measure. Use the corpus generated after a fuzzing campaign, not real-time fuzzer statistics, so measurements are reproducible and comparable across tools.
- The target directory for generated profiles and reports.

Optional:
- A prior baseline profile (`.profdata`) for differential coverage against an earlier campaign.
- A known crashing input set, when the corpus may contain inputs that abort the harness.

## Procedure

1. Pick one coverage toolchain and stay on it for the whole target; never mix LLVM and GCC instrumentation in one profile. Use a dedicated coverage tool (`llvm-cov`, `gcovr`, or `cargo fuzz coverage`), not the fuzzer's own reported coverage, because different fuzzers compute coverage differently and their numbers are not comparable. Done when: one toolchain is selected and committed to.
2. Build the system under test and harness with coverage instrumentation at `-O2` (not `-O3`, which can eliminate code and make coverage misleading). Do not combine `-fsanitize=fuzzer` with profile instrumentation in the coverage build. See `references/toolchain-commands.md` for per-toolchain flags. Done when: the instrumented build is produced at `-O2` without fuzzer instrumentation.
3. For C/C++, link a separate execution runtime (not the fuzzer main) that iterates every regular file in the corpus directory and feeds each to `LLVMFuzzerTestOneInput`. This runtime and the harness are measurement scaffolding, not system-under-test code. Done when: the execution runtime is linked and iterates the corpus.
4. If the corpus may contain crashing inputs, fork before each `LLVMFuzzerTestOneInput` call (or remove the crashing inputs first) so one aborting input does not prevent coverage generation for the rest of the corpus. Done when: crashing inputs are fork-isolated or removed.
5. Run the instrumented binary over the corpus directory. See `references/toolchain-commands.md` for per-toolchain run commands. Done when: the instrumented binary runs over the corpus and produces profile data.
6. Merge and report, excluding harness and runtime noise so the report reflects system-under-test coverage only. See `references/toolchain-commands.md` for per-toolchain merge and report commands. Done when: the merged report excludes harness noise and reflects SUT coverage.
7. Classify every uncovered region into one of: reachable-but-uncovered (needs better seeds or harness input shaping), blocked-by-magic-value (a hardcoded conditional guard the fuzzer cannot satisfy), or dead/unreachable through this harness. Done when: every uncovered region is classified.
8. Turn each uncovered region into concrete campaign work: a proposed dictionary entry for a magic value (passed to fuzzing-dictionary for execution), a seed input that shapes bytes toward the region, or a harness change that reaches it. For magic-value guards, propose the literal bytes (e.g. `"\x7F\x45\x4C\x46"`) as a dictionary entry rather than writing them to a dictionary file directly. Done when: each uncovered region has a concrete campaign-work item.
9. If a baseline profile was supplied, run the differential command for the chosen toolchain to produce a differential view and report coverage gained or lost versus the earlier campaign. For LLVM, generate two `llvm-cov show` reports (one with the baseline profile, one with the target profile) and diff them; for GCC, compare `gcovr` reports from both runs; for Rust, compare `cargo cov` output. See `references/toolchain-commands.md` for per-toolchain differential commands. Done when: the differential view is produced or the step is skipped (no baseline).
10. Write the report and the region classification with its campaign-work items into the target directory. Done when: the report and classification are written to the target directory.

## Failure and recovery

- Missing toolchain (`llvm-cov`, `llvm-profdata`, `gcovr`, or nightly Rust not installed): stop and name the missing tool. Do not substitute the fuzzer's reported coverage for a dedicated-tool measurement.
- `error: no profile data available` or `Failed to load coverage`: the profile was not generated or the binary used for the report is not the instrumented binary. Rebuild the instrumented binary with the same flags used during execution and re-run; do not fabricate a report from a mismatched binary.
- **`incompatible instrumentation`**: LLVM and GCC coverage were mixed in one profile. Rebuild the whole target with one toolchain.
- Crashing input prevents coverage generation: fork-isolate the crashing input or remove it before profiling; do not swallow the crash or pretend coverage was generated.
- Empty corpus or coverage infrastructure not yet set up: this is a blocked result, not a zero-coverage report. Return blocked with the missing prerequisite named.
- Partial-result rule: if profiling succeeds for part of the corpus, the report covers only the inputs that ran; record which inputs were excluded and why.
- Non-mutation rule: only profiles, reports, and temporary instrumented binaries are written under the target directory. Roll back by deleting that directory; no source, corpus, or VCS state is changed.

## Output

A coverage report (text summary plus HTML detail) and a region classification written under the target directory: each uncovered region listed as reachable-but-uncovered, blocked-by-magic-value, or dead, paired with a concrete campaign-work item (dictionary entry, seed input, or harness change); when a baseline was supplied, coverage gained or lost versus that baseline.
