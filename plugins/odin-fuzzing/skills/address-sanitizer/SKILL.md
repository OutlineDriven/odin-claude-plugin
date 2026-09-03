---
name: address-sanitizer
description: 'Use when building or running native code under AddressSanitizer, or when interpreting an existing ASan report. Instruments C/C++ or Rust unsafe/FFI targets, sets ASAN_OPTIONS for fuzzer integration, and classifies each reported error with its faulting and allocation sites. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# AddressSanitizer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User needs to build or run native code with ASan, interpret an ASan report, or debug a memory-corruption failure. |
| Authority | Reversible local: write only the instrumented build artifacts and test invocations named by the user; discard the instrumented binary and rebuild without `-fsanitize=address` to roll back. |
| Side effect | Instrumented native build and test process under the target project directory. |
| Done | When building or running: the target is instrumented, exercised, and any reported memory error is explained with a reproducible location. When interpreting an existing report: the error type, faulting source location, and allocation/deallocation sites are extracted from the report and mapped to a root cause, without requiring a fresh instrumented run. |

## Inputs

Required when building or running: the native source or build target to instrument (C/C++ source, Rust crate with unsafe blocks or FFI, or an existing fuzz harness) and the command that exercises it.

Required when interpreting a report: a specific ASan report file or captured ASan output.

Optional: a preferred sanitizer combination, or a fuzzer in use (libFuzzer, AFL++, cargo-fuzz, honggfuzz). When interpreting a report, the build target and exercise command are also optional and used only to confirm the root cause against source.

## Procedure

1. Determine the invocation mode. If the user supplies an existing ASan report or captured output, take the report-interpretation branch (step 2R) and skip the build-and-run steps (3–9). If the user asks to build or run a target under ASan, take the build-and-run branch (steps 3–9). Done when: the mode is selected.

2R. Report interpretation. Read the supplied ASan report and extract the error type (heap-buffer-overflow, use-after-free, double-free, stack-buffer-overflow, memory leak), the faulting stack trace with source file and line, and the allocation/deallocation traces. If source is available, correlate the faulting and alloc/dealloc frames to the source to state the root cause. Done when: the error type, faulting location, and alloc/dealloc locations are extracted from the report and the root cause is stated. This branch does not require a fresh instrumented run.

3. Confirm the target is C/C++ or Rust with unsafe blocks or FFI. ASan is not useful for pure safe languages without FFI. Linux gives full support; macOS and Windows have limited or experimental support — state the platform limitation before proceeding. Done when: the target is confirmed and platform limitations are stated.
4. Compile and link the target with `-fsanitize=address -g`. Apply the flag in both the compile and link steps; missing it at link time produces "ASan runtime not initialized." Add `-O2` or `-O3` if the uninstrumented slowdown exceeds roughly 4x. Done when: the target compiles and links with `-fsanitize=address -g`.
5. Set `ASAN_OPTIONS` for the run: `verbosity=1` to confirm ASan is active at startup, `abort_on_error=1` when a fuzzer requires `abort()` instead of `_exit()`, and `detect_leaks=0` during fuzzing to keep LeakSanitizer output from cluttering crash reports. Join multiple options with colons. Done when: `ASAN_OPTIONS` are set for the run.
6. If a fuzzer drives the target, lift its memory limit because ASan maps approximately 20 TB of virtual memory: libFuzzer `-rss_limit_mb=0`, AFL++ `-m none`. For libFuzzer combine `-fsanitize=fuzzer,address`; for AFL++ set `AFL_USE_ASAN=1` on the compiler; for cargo-fuzz pass `--sanitizer=address`; for honggfuzz compile the target with `hfuzz-clang -fsanitize=address`. Done when: the fuzzer's memory limit is lifted for ASan's virtual mapping.
7. Run the instrumented binary or fuzzer. When ASan reports an error, extract the error type (heap-buffer-overflow, use-after-free, double-free, stack-buffer-overflow, memory leak), the faulting stack trace with source file and line, and the allocation/deallocation traces that show where the memory was created and freed. Done when: ASan output is captured with error type, stack trace, and alloc/dealloc traces.
8. Map the error to a reproducible location: the faulting frame names the file and line of the illegal access; the alloc/dealloc frames name where the memory was born and died. Correlate these to the source to state the root cause. Done when: the root cause is stated with file, line, and alloc/dealloc locations.
9. To combine with undefined-behavior detection, add `,undefined` to the `-fsanitize` value (`-fsanitize=address,undefined`). Done when: `-fsanitize=address,undefined` is set if UBSan is requested.

## Failure and recovery
- ASan runtime not initialized: `-fsanitize=address` was missing from the link step. Re-link with the flag and rerun.
- Fuzzer kills the process immediately: memory limit is below ASan's 20 TB virtual mapping. Set `-rss_limit_mb=0` or `-m none` and rerun.
- LeakSanitizer output obscures crash reports: set `ASAN_OPTIONS=detect_leaks=0` during fuzzing; review leak reports separately at the end of a campaign.
- ASan prints no startup info: the binary was not instrumented. Rebuild with the flag and confirm `verbosity=1` prints ASan initialization.
- Partial result rule: a run that reports one memory error stops at that error; do not claim the target is clean. Report the error and its location; further runs may surface additional errors.
- Rollback: delete the instrumented binary and rebuild without `-fsanitize=address`. No source change is required for instrumentation-only builds.

## Output
When building or running: an instrumented binary or fuzz target, the exercise run result, and for any detected memory error a statement of the error type, the faulting source location, and the allocation/deallocation locations — sufficient to reproduce the failure. When interpreting a report: a statement of the error type, the faulting source location, and the allocation/deallocation locations extracted from the supplied report, with the root cause mapped to source where available.
