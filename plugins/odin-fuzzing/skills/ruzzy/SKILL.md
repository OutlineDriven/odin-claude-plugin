---
name: ruzzy
description: 'Use when asked to set up and run coverage-guided fuzzing of Ruby code or C extensions with Ruzzy, producing crash reports or clean campaign summaries. Not for C/C++ fuzzing — use fuzzing.'
---

# Ruzzy fuzzing campaign

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User needs Ruzzy to run coverage-guided fuzzing on Ruby code or a Ruby native extension. |
| Authority | reversible-local: write only harness, tracer, sanitizer preload, and corpus files to the working directory. State rollback as file deletion. |
| Side effect | Write Ruzzy harness scripts, tracer scripts, sanitizer LD_PRELOAD paths, and corpus files — local working directory only. |
| Done | Ruzzy executes the intended Ruby target with the correct tracer or extension setup and reproduces saved failures. |

## Inputs

Required: Ruby target path or gem name, sanitizer selection (ASan or UBSan).

Optional: corpus directory path, libFuzzer arguments (e.g., `-max_len=1024`), crash file to reproduce.

## Procedure

1. Confirm target: pure Ruby (requires tracer) or C extension (single harness).
2. Confirm sanitizer: ASan (`Ruzzy::ASAN_PATH`) or UBSan (`Ruzzy::UBSAN_PATH`).
3. For pure Ruby targets, write a tracer script calling `Ruzzy.trace('harness.rb')` and a separate harness script calling `Ruzzy.fuzz(test_one_input)`. For C extensions, write one harness script calling `Ruzzy.fuzz(test_one_input)`; no tracer required.
4. Write the harness as a lambda named `test_one_input` that accepts data and returns `0`. Catch Ruby exceptions in C extension harnesses; let them propagate in pure Ruby harnesses.
5. Set `ASAN_OPTIONS=allocator_may_return_null=1:detect_leaks=0:use_sigaltstack=0`. Do not export `LD_PRELOAD`; use it inline with the ruby command.
6. Install the gem with clang and sanitizer flags: `CC`, `CXX`, `LDSHARED`, `LDSHAREDXX` pointing to clang; `CFLAGS` and `CXXFLAGS` containing `-fsanitize=address,fuzzer-no-link -fno-omit-frame-pointer -fno-common -fPIC -g`.
7. Run: `LD_PRELOAD=$(ruby -e 'require "ruzzy"; print Ruzzy::<SAN>_PATH') ruby <harness-or-tracer>.rb [corpus] [libfuzzer-options]`.
8. On `ERROR: AddressSanitizer:` or `ERROR: UndefinedBehaviorSanitizer:` — capture the crash file path, Base64 content, and reproducer command. Write `crash-*` files to the working directory.
9. To reproduce a saved failure, run the same command passing the crash file path as the final argument.

## Failure and recovery
| Failure class | Meaning | Recovery |
|---|---|---|
| `platform-missing` | Platform is not Linux x86-64/ARM64, clang is unavailable, or Ruby is not installed | Halt; suggest Docker environment |
| `dependency-missing` | Gem not installed or wrong clang | Install gem with sanitizer flags; verify `Ruzzy::<SAN>_PATH` resolves |
| `harness-error` | Ruby exception exits the fuzzer | Adjust exception handling for a C extension harness; a pure Ruby harness must not catch exceptions |
| `sanitizer-report` | ASan or UBSan error detected | Capture crash file; report class, address, reproducer |
| `no-crashes-found` | Fuzzer ran without sanitizer violations | Report campaign completed cleanly |
| `env-misconfigured` | Missing ASAN_OPTIONS or LD_PRELOAD | Set ASAN_OPTIONS and re-run inline LD_PRELOAD |

Rollback: delete written harness, tracer, and corpus files. No VCS mutation.

## Output
Fuzzing campaign report containing:

- Target gem or file fuzzed
- Sanitizer and version
- libFuzzer options used
- Execution duration and corpus state
- For each crash: sanitizer error type, crash file path, Base64 input, reproducer command
- If clean: total inputs, exec/s, coverage summary lines
