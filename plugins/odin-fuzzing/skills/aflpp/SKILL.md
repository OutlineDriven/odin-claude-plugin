---
name: aflpp
description: 'Use when the user needs to set up and run an AFL++ fuzzing campaign for a C/C++ target. Compiles with LTO, LLVM, or GCC instrumentation, runs single or multi-core campaigns, triages crashes, and minimizes the corpus. Requests explicit approval before system-level changes. Not for libFuzzer harness campaigns — use libfuzzer.'
---

# AFL++

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User needs AFL++ setup, multi-core campaign operation, corpus handling, or AFL++ crash triage for a C/C++ target. |
| Authority | Reversible local execution of AFL++ binaries and writes to build artifacts, corpora, logs, and output directories under the working directory. The skill must request explicit user approval before any system-level change: package installation, Docker image pull, kernel tuning, GRUB mutation, or reboot. Roll back by killing campaign processes and removing the output and state directories. |
| Side effect | Local writes to compiled artifacts, seed and output corpora, log files, and short-lived Docker containers. No mutation of source under test beyond compilation. |
| Done | AFL++ target runs against a seed corpus with the intended instrumentation and produces interpretable campaign output. |

## Inputs

- Target source tree (C/C++) with a fuzz harness or a program that reads stdin, files, or argv. Required.
- Seed corpus directory with at least one non-empty file. Required; created if absent.
- Run location: host or Docker. Required; default Docker.
- Compilation mode preference (LTO, LLVM, or GCC). Optional; default tries LTO, falls back to LLVM.
- Core count for multi-core campaigns. Optional; default is a single instance.
- Dictionary file for format-aware fuzzing. Optional.
- Sanitizer selection (ASan, UBSan, none). Optional; default none.

## Procedure

### 1. Select run location and verify AFL++

Choose host or Docker. For Docker, pull the image with explicit user approval:

```bash
docker pull aflplusplus/aflplusplus:stable
```

For host installation, request approval before running:

```bash
apt install afl++ lld-<clang-version>
```

Verify the binary: `afl-fuzz --version` (host) or `docker run --rm aflplusplus/aflplusplus:stable afl-fuzz --version` (Docker).

Kernel tuning (`afl-system-config`) gives up to 15% more executions per second but disables OS security features. Request explicit approval before running it, and only on a dedicated VM. For maximum performance, `afl-persistent-config` plus `update-grub` and reboot are required — these are irreversible system changes that need approval. Do not run kernel tuning on production or development systems.

Done when: AFL++ is verified and any system-level changes were approved by the user.

### 2. Compile the target with instrumentation and sanitizers

Write or locate a fuzz harness. AFL++ supports libFuzzer-style harnesses:

```c++
#include <stdint.h>
#include <stddef.h>
extern "C" int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    if (size < MIN_SIZE || size > MAX_SIZE) return 0;
    target_function(data, size);
    return 0;
}
```

Reset global state between runs, keep the harness deterministic, free allocated memory, and return 0. For programs reading stdin or files, no harness is needed — compile the program directly and fuzz via stdin or the `@@` file placeholder.

Compile with the chosen instrumentation mode. Try LTO first for best performance; fall back to LLVM mode if LTO fails to link; use the GCC plugin only when the project requires GCC:

```bash
# LTO mode (preferred)
afl-clang-lto++ -DNO_MAIN=1 -O2 -fsanitize=fuzzer harness.cc main.cc -o fuzz
# LLVM mode (fallback)
afl-clang-fast++ -DNO_MAIN=1 -O2 -fsanitize=fuzzer harness.cc main.cc -o fuzz
# GCC plugin
afl-g++-fast -DNO_MAIN=1 -O2 -fsanitize=fuzzer harness.cc main.cc -o fuzz
```

`-DNO_MAIN=1` skips the main function when using a libFuzzer harness. For static libraries and object files, use `-fsanitize=fuzzer-no-link` to instrument without linking the fuzzer runtime. The GCC version must match the version used to compile the AFL++ GCC plugin.

Add sanitizers if requested. AddressSanitizer (`AFL_USE_ASAN=1`) and UBSan (`AFL_USE_UBSAN=1`) find memory corruption and undefined behavior that do not crash immediately:

```bash
AFL_USE_ASAN=1 afl-clang-fast++ -DNO_MAIN=1 -O2 -fsanitize=fuzzer harness.cc main.cc -o fuzz
AFL_USE_UBSAN=1 afl-clang-fast++ -DNO_MAIN=1 -O2 -fsanitize=fuzzer,undefined harness.cc main.cc -o fuzz
```

The `-m` memory limit flag is not supported with ASan because ASan reserves 20 TB of virtual memory. In multi-core setups, run only one ASan job per 4–8 non-ASan jobs.

Done when: the target compiles and links with the chosen instrumentation and sanitizer flags.

### 3. Configure environment and run the campaign

Create a seed corpus with at least one non-empty file:

```bash
mkdir seeds && echo "aaaa" > seeds/minimal_seed
```

For real projects, gather representative inputs from example files, the project test suite, or minimal valid inputs for the target format.

Set the environment variables that matter for the campaign:

- `AFL_TMPDIR=/dev/shm`: always set; uses tmpfs to improve performance and avoid SSD wear.
- `AFL_FAST_CAL=1`: for slow targets (>10 ms/exec); speeds calibration ~2.5x with negligible precision loss.
- `AFL_TESTCACHE_SIZE=100`: on all instances; caches test cases in memory (default 50 MB; 50–250 MB works well).
- `AFL_FINAL_SYNC=1`: on the primary `-M` instance only; needed for later `afl-cmin`, not for fuzzing itself.
- `AFL_EXIT_ON_TIME=3600` or `AFL_EXIT_WHEN_DONE=1`: for CI or automated fuzzing to bound runtime.
- `AFL_NO_UI=1`: for headless environments.

Run a single-core campaign:

```bash
AFL_TMPDIR=/dev/shm afl-fuzz -i seeds -o out -- ./fuzz
```

Useful flags: `-G 4000` (max input length), `-t 1000` (per-case timeout ms), `-m 1000` (memory limit MB, not with ASan), `-x ./dict.dict` (dictionary).

For multi-core campaigns, start a primary instance and one secondary per available core, all sharing the same `-o state` directory:

```bash
AFL_TMPDIR=/dev/shm AFL_FINAL_SYNC=1 AFL_TESTCACHE_SIZE=100 afl-fuzz -M primary -i seeds -o state -- ./fuzz 1>primary.log 2>primary.error </dev/null &
AFL_TMPDIR=/dev/shm AFL_TESTCACHE_SIZE=100 afl-fuzz -S secondary01 -i seeds -o state -- ./fuzz 1>secondary01.log 2>secondary01.error </dev/null &
```

The `</dev/null` redirect is required. A backgrounded process that reads the terminal receives `SIGTTIN` and stops without it. List running jobs with `jobs`; stop all with `kill $(jobs -p)`.

To enable CMPLOG/RedQueen constraint solving, build with `AFL_LLVM_CMPLOG=1` and run one secondary with `-c0`:

```bash
AFL_LLVM_CMPLOG=1 afl-fuzz -c0 -S cmplog -i seeds -o state -- ./fuzz 1>cmplog.log 2>cmplog.error </dev/null &
```

Done when: the campaign is running with the configured environment and core count.

### 4. Monitor and triage crashes

Without a TTY, `afl-fuzz` writes plain status lines to the log and to `state/<instance>/fuzzer_stats`. Check status:

```bash
afl-whatsup state/
```

Read these fields: `execs/sec` (speed, higher is better), `cycles done` (queue passes completed), `corpus count` (unique test cases in queue), `saved crashes` (unique crashes found), `stability` (should be near 100%; below 85% indicates non-deterministic behavior). For coverage plots: `afl-plot state/default out_graph/` (requires `gnuplot` on host; the Docker image ships `gnuplot-nox`).

Triage crashes by re-executing each file in `state/default/crashes/` (or `out/default/crashes/`) against the target:

```bash
./fuzz state/default/crashes/id:000000,sig:06,src:000002,time:286,execs:13105,op:havoc,rep:4
```

The crash filename encodes the signal (`sig:06`), source, time, execs, operation, and rep. Hangs are in `state/default/hangs/`.

Done when: campaign status is read and each crash file is re-executed against the target with its signal and reproduction command recorded.

### 5. Minimize corpus and stop

Minimize the corpus after a campaign to keep only unique coverage:

```bash
afl-cmin -i state/default/queue -o minimized_corpus -- ./fuzz
```

Stop all campaign processes and clean up: `kill $(jobs -p)`, then remove `out/` or `state/` and log files to roll back. The target source is unchanged except for compiled artifacts.

Done when: the corpus is minimized and all campaign processes are stopped.

## Failure and recovery

- Build failure (LTO link error): fall back to LLVM mode (`afl-clang-fast`); if the project requires GCC, use `afl-gcc-fast` or `afl-g++-fast`. Do not proceed with an uninstrumented binary — it produces no coverage data.
- GCC plugin version mismatch: ensure the system GCC matches the AFL++ plugin build; install `gcc-<version>-plugin-dev`. Do not patch around the mismatch.
- Low stability (<85%): the target is non-deterministic. Switch from a `LLVMFuzzerTestOneInput` harness to stdin or file-input fuzzing, or fix the non-determinism in the target. Do not report done with low stability.
- Low execs/sec (<1k): switch to a persistent-mode (`LLVMFuzzerTestOneInput`) harness for 10–20x speedup, or set `AFL_TMPDIR=/dev/shm`.
- No crashes found: recompile with `AFL_USE_ASAN=1` or `AFL_USE_UBSAN=1`; memory corruption often does not crash without a sanitizer.
- Memory limit exceeded with ASan: remove the `-m` flag; ASan reserves 20 TB virtual memory and is incompatible with `-m`.
- Backgrounded job shows "Stopped": the `</dev/null` redirect is missing; restart the job with it to avoid `SIGTTIN`.
- Docker "input device is not a TTY": omit `-t` for non-interactive runs. For the interactive UI, run in host mode in a terminal.
- Partial result rule: if the campaign stops early, the `state/` or `out/` directory still contains valid queue, crashes, and `fuzzer_stats`; report what was captured rather than discarding it.
- Rollback: kill all fuzzers (`kill $(jobs -p)`), remove `out/`, `state/`, log files, and the compiled `fuzz` binary. Source under test is unchanged beyond compilation. Do not attempt to reverse `afl-system-config` or `afl-persistent-config` on a shared system — reboot the dedicated VM instead.

## Output

- A compiled, instrumented fuzz target binary.
- A campaign output directory (`out/` or `state/`) containing `queue/` (test cases), `crashes/` (crash-reproducing inputs), `hangs/`, `fuzzer_stats` (campaign statistics), and `plot_data` (coverage time series).
- A status report covering execs/sec, cycles done, corpus count, saved crashes, and stability.
- A crash triage result: each crash file re-executed against the target with its signal and reproduction command recorded.
- A minimized corpus directory when `afl-cmin` was run.
