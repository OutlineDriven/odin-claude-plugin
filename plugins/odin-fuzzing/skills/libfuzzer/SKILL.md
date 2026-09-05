---
name: libfuzzer
description: 'Use when asked to build, run, or triage a coverage-guided C/C++ fuzz campaign on the libFuzzer or AFL++ engine. Not for harness design: use fuzz-harness-writing.'
---

# libFuzzer and AFL++

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User needs to build, run, tune, or triage a coverage-guided C/C++ fuzzing campaign or `LLVMFuzzerTestOneInput` harness on the libFuzzer engine (default) or the AFL++ engine (afl mode). |
| Authority | Human-gated: in afl mode, request explicit user approval before a package installation or a Docker image pull; otherwise reversible local: writes only named fuzzing artifacts (binary, corpus and output directories, crash files, logs); rollback is deleting them and killing campaign processes. Kernel-tuning steps that need a reboot or degrade OS security are out of scope. No remote mutation. |
| Side effect | Local write to a compiled fuzzing binary, its corpus or output directory, log files, and any crash artifacts written by the target; afl mode may run a short-lived Docker container. |
| Done | The instrumented binary runs against its corpus and any crash artifact reproduces in the same target with identical sanitizer output or signal. |

## Inputs

- Required: Engine: `libfuzzer` (default) or `afl`.
- Required: Source or object files for the code under test.
- Required (libfuzzer engine): Clang compiler (`clang++`) with the libFuzzer runtime present, and one `LLVMFuzzerTestOneInput` harness function visible to the linker.
- Required (afl engine): `afl-fuzz` on the host or the `aflplusplus/aflplusplus` Docker image, and a harness or a program that reads stdin, files, or argv.
- Optional: Seed corpus directory. It may be empty; when omitted, create `./corpus/` (libfuzzer) or `seeds/` with one non-empty file (afl).
- Optional: Fuzzing dictionary file (see Dictionary format below).
- Optional (libfuzzer): Clang build flags: `-fsanitize=address`, `-fsanitize=undefined`, `-g`, `-O2`, `-max_len`, `-dict`, `-timeout`, `-close_fd_mask`, `-fork`, `-ignore_crashes`.
- Optional (afl): run location host or Docker (default Docker); instrumentation mode LTO, LLVM, or GCC (default tries LTO, falls back to LLVM); core count (default single instance); sanitizer selection ASan, UBSan, or none (default none).

## Procedure

1. **Select the engine.** `libfuzzer` is the default. Choose `afl` when the user names AFL++, needs multi-core `afl-fuzz` campaigns, or lacks a Clang libFuzzer runtime. Done when: the engine is selected.

2. **Verify the toolchain.** libfuzzer: run `clang++ --version`; stop if Clang is absent and install it before proceeding. Mode `afl`: verify `afl-fuzz --version` on the host or `docker run --rm aflplusplus/aflplusplus:stable afl-fuzz --version`; request explicit approval before `apt install afl++ lld` or `docker pull aflplusplus/aflplusplus:stable`. Done when: the engine binary is verified and any install was approved.

3. **Build the harness binary.** libfuzzer: compile with:
   ```
   clang++ -fsanitize=fuzzer[,address,undefined] -g -O2 -U_FORTIFY_SOURCE <harness>.cc <target>.cc -o <binary>
   ```
   `-fsanitize=fuzzer` links the libFuzzer runtime and provides `main`. Add `,address` for heap/stack buffer overflow, use-after-free, and double-free detection. Add `,undefined` for signed-integer overflow, null dereference, and similar undefined behavior. Add `-U_FORTIFY_SOURCE` when using ASan to avoid fortification interference. Omit `-fsanitize=address` for a faster build when only checking sanitizer-uncovered defects.
   Mode `afl`: compile with the chosen instrumentation mode; try LTO first, fall back to LLVM mode if LTO fails to link, and use the GCC plugin only when the project requires GCC:
   ```bash
   afl-clang-lto++  -DNO_MAIN=1 -O2 -fsanitize=fuzzer harness.cc main.cc -o fuzz   # LTO (preferred)
   afl-clang-fast++ -DNO_MAIN=1 -O2 -fsanitize=fuzzer harness.cc main.cc -o fuzz   # LLVM (fallback)
   afl-g++-fast     -DNO_MAIN=1 -O2 -fsanitize=fuzzer harness.cc main.cc -o fuzz   # GCC plugin
   ```
   `-DNO_MAIN=1` skips the main function when using a libFuzzer harness. For programs reading stdin or files, no harness is needed: compile the program directly and fuzz via stdin or the `@@` file placeholder. For static libraries and object files, use `-fsanitize=fuzzer-no-link` to instrument without linking the fuzzer runtime. The GCC version must match the version used to compile the AFL++ GCC plugin. Add `AFL_USE_ASAN=1` or `AFL_USE_UBSAN=1` when sanitizers are requested. The `-m` memory limit flag is unsupported with ASan because ASan reserves 20 TB of virtual memory; in multi-core setups run only one ASan job per 4-8 non-ASan jobs. Done when: the binary compiles and links with the chosen instrumentation and sanitizer flags.

4. **Prepare the corpus.** libfuzzer: create `<corpus_dir>/` and optionally seed it with valid example inputs representing the target format. Mode `afl`: create `seeds/` with at least one non-empty file; for real projects gather representative inputs from example files, the project test suite, or minimal valid inputs for the target format. Done when: the corpus directory exists and is seeded.

5. **Run the campaign.** libfuzzer:
   ```
   <binary> [-max_len=<N>] [-timeout=<S>] [-dict=<dict_file>] [-close_fd_mask=3] [-fork=1 -ignore_crashes=1] [-jobs=<N> -workers=<N>] <corpus_dir>/
   ```
   `-max_len`: cap per-input byte size (2x minimal realistic input is a reasonable start; omit to let libFuzzer grow dynamically). `-timeout`: abort test cases exceeding this many seconds. `-dict`: pass a fuzzing dictionary for format-aware mutation. `-close_fd_mask=3`: close stdout and stderr for a speed boost when the target writes to them. `-fork=1 -ignore_crashes=1`: continue after finding a crash rather than exiting. `-jobs`/`-workers`: run N parallel jobs sharing the corpus.
   Mode `afl`: set the environment variables that matter: `AFL_TMPDIR=/dev/shm` always (tmpfs improves performance and avoids SSD wear); `AFL_FAST_CAL=1` for slow targets (>10 ms/exec); `AFL_TESTCACHE_SIZE=100` on all instances; `AFL_FINAL_SYNC=1` on the primary `-M` instance only (needed for later `afl-cmin`); `AFL_EXIT_ON_TIME=3600` or `AFL_EXIT_WHEN_DONE=1` for CI or automated runs; `AFL_NO_UI=1` for headless environments. Single core:
   ```bash
   AFL_TMPDIR=/dev/shm afl-fuzz -i seeds -o out -- ./fuzz
   ```
   Useful flags: `-G 4000` (max input length), `-t 1000` (per-case timeout ms), `-m 1000` (memory limit MB, not with ASan), `-x ./dict.dict` (dictionary). Multi-core: start a primary instance and one secondary per available core, all sharing the same `-o state` directory:
   ```bash
   AFL_TMPDIR=/dev/shm AFL_FINAL_SYNC=1 AFL_TESTCACHE_SIZE=100 afl-fuzz -M primary -i seeds -o state -- ./fuzz 1>primary.log 2>primary.error </dev/null &
   AFL_TMPDIR=/dev/shm AFL_TESTCACHE_SIZE=100 afl-fuzz -S secondary01 -i seeds -o state -- ./fuzz 1>secondary01.log 2>secondary01.error </dev/null &
   ```
   The `</dev/null` redirect is required: a backgrounded process that reads the terminal receives `SIGTTIN` and stops without it. List running jobs with `jobs`; stop all with `kill $(jobs -p)`. For CMPLOG/RedQueen constraint solving, build with `AFL_LLVM_CMPLOG=1` and run one secondary with `-c0`. Done when: the campaign runs with the configured environment and core count.

6. **Monitor and collect crashes.** libfuzzer: when the binary exits with a deadly signal or sanitizer report, libFuzzer writes an artifact named `crash-<SHA1-hash-of-content>` in the current directory; record the artifact path and the sanitizer output. Mode `afl`: without a TTY, `afl-fuzz` writes status to the log and to `state/<instance>/fuzzer_stats`; check status with `afl-whatsup state/`. Read `execs/sec` (higher is better), `cycles done`, `corpus count`, `saved crashes`, and `stability` (near 100%; below 85% indicates non-deterministic behavior). Coverage plots: `afl-plot state/default out_graph/` (needs `gnuplot` on host; the Docker image ships `gnuplot-nox`). Crash files live in `state/default/crashes/` with the signal encoded in the filename (`sig:06`); hangs live in `state/default/hangs/`. Done when: every crash artifact path and its sanitizer output or signal are recorded.

7. **Reproduce the crash.** libfuzzer: re-run the binary directly on the artifact: `<binary> ./crash-<hash>`. Mode `afl`: re-execute each crash file against the target: `./fuzz state/default/crashes/<id>`. Verify the same sanitizer error or signal recurs. If it does not, check for non-determinism in the harness or target (remove random-number generators and uninitialized-memory reads). Done when: the crash reproduces with identical sanitizer output or signal, or non-determinism is identified.

8. **Minimize and report.** Mode `afl`: minimize the corpus to unique coverage with `afl-cmin -i state/default/queue -o minimized_corpus -- ./fuzz`, then stop all campaign processes with `kill $(jobs -p)`. Both engines: state the artifact path, the sanitizer violation type or signal, and whether reproduction succeeded. Done when: the report states artifact path, violation type, and reproduction result, and afl processes are stopped.

### LLVMFuzzerTestOneInput harness signature

```
extern "C" int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    if (size < <minimum>) return 0;      // reject undersized inputs
    // parse or pass data to target
    return 0;                            // always return 0
}
```

Rules: do not call `exit()`; join all threads before returning; keep execution fast (target hundreds to thousands of executions per second); maintain determinism (no `rand()`, no reading from `/dev/random`); reset global state between calls. AFL++ accepts the same harness as a persistent-mode entry point.

### Dictionary format

One quoted string per line; `#` marks a comment line:
```
"\\x89PNG"
"GET"
"Content-Type"
```
Generate from headers with `grep -o '"[^"]*"' <header.h>`, from binary strings with `strings ./binary | sed 's/^/"/; s/$/"/'`, or from man pages with `man <cmd> | grep -oP '^\s*(--|-)\K\S+' | sed 's/[,.]//g' | sed 's/^/"/; s/$/"/' | sort -u`. Pass it with `-dict=` (libfuzzer) or `-x` (afl).

### Interpreting output

| libFuzzer line | Meaning |
|---|---|
| `INITED` | Initialization complete, corpus loaded |
| `NEW cov: N` | New coverage edge found; input added to corpus |
| `stat::cov: N` | Running coverage edge count |
| `exec/s: N` | Executions per second |
| `libFuzzer: deadly signal` | Crash: signal received (SEGV, ABRT, etc.) |
| `AddressSanitizer: <type>` | ASan violation: heap/stack/global buffer overflow, use-after-free, double-free, or leak |
| `UndefinedBehaviorSanitizer: <type>` | UBSan violation: signed-integer overflow, null dereference, etc. |

For afl mode, read `fuzzer_stats` fields instead: `execs/sec`, `cycles done`, `corpus count`, `saved crashes`, `stability`.

## Failure and recovery
| Failure class | Diagnosis | Recovery |
|---|---|---|
| `no-clang` | `clang++ --version` fails or reports GCC | Install LLVM/Clang; re-run Step 3 |
| `link-error` | Undefined references to target symbols | Verify all source and library objects are passed to the compiler |
| `sanitizer-violation` (expected) | Deadly signal or sanitizer report during fuzzing | Artifacts written to `./crash-*`; reproduce per Step 7; report type and artifact path |
| `hang` | No output for > timeout interval | Increase `-timeout`; check whether target is entering an infinite loop or blocking I/O |
| `no-coverage` | Fuzzer runs but `stat::cov` never increases | Add seed corpus inputs; supply a dictionary; verify harness calls the target; use `-runs=0 <corpus_dir>/` to exhaust the static corpus first |
| `non-reproducible` | Crash artifact does not reproduce | Remove non-determinism from harness and target; rebuild without `-fsanitize=fuzzer-no-link` |
| `corpus-exhausted` | `stat::cov` plateaus, no new coverage for extended runtime | Extend corpus, add dictionary, improve seed inputs, run coverage analysis |
| `afl-build-failure` | LTO link error | Fall back to LLVM mode (`afl-clang-fast++`); use `afl-g++-fast` only when the project requires GCC. Never proceed with an uninstrumented binary; it produces no coverage data |
| `afl-gcc-plugin-mismatch` | GCC plugin version mismatch | Match the system GCC to the AFL++ plugin build; install `gcc-<version>-plugin-dev`. Do not patch around the mismatch |
| `afl-low-stability` | `stability` below 85% | The target is non-deterministic; switch to stdin or file-input fuzzing or fix the non-determinism. Do not report done |
| `afl-low-throughput` | `execs/sec` below 1k | Use a persistent-mode `LLVMFuzzerTestOneInput` harness for 10-20x speedup, or set `AFL_TMPDIR=/dev/shm` |
| `afl-no-crashes` | Campaign finds nothing | Recompile with `AFL_USE_ASAN=1` or `AFL_USE_UBSAN=1`; memory corruption often does not crash without a sanitizer |
| `afl-asan-m-flag` | Memory limit exceeded with ASan | Remove `-m`; ASan reserves 20 TB of virtual memory |
| `afl-job-stopped` | Backgrounded job shows "Stopped" | The `</dev/null` redirect is missing; restart the job with it to avoid `SIGTTIN` |
| `afl-docker-tty` | Docker reports "input device is not a TTY" | Omit `-t` for non-interactive runs; for the interactive UI run in host mode in a terminal |

Partial-result rule: if the campaign finds no crash after a bounded run, report the final coverage count and `non-converged`. In afl mode, an early-stopped campaign still leaves valid `queue/`, `crashes/`, and `fuzzer_stats` under `state/` or `out/`; report what was captured rather than discarding it.

Rollback: libfuzzer: delete the compiled `<binary>`, the `<corpus_dir>/` contents, and any `crash-*` files. afl: `kill $(jobs -p)`, then remove `out/` or `state/`, log files, and the compiled binary. The target source is unchanged beyond compilation.

## Output

Terminal classification: `non-converged` (binary exits zero or no sanitizer violation, with final coverage count), crash found (artifact path, sanitizer violation type or signal, reproduction result), compilation failure (compiler error message), or failure class name with diagnostic message. In afl mode the report also covers the campaign output directory contents (`queue/`, `crashes/`, `hangs/`, `fuzzer_stats`, `plot_data`), a status summary (execs/sec, cycles done, corpus count, saved crashes, stability), and the minimized corpus path when `afl-cmin` ran.
