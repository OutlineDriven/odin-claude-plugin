---
name: aflpp
description: 'Use when the user needs AFL++ setup, campaign operation, corpus handling, or crash triage. Produces an instrumented fuzz target running against a seed corpus with interpretable campaign output. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# AFL++

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User needs AFL++ setup, multi-core campaign operation, corpus handling, or AFL++ crash triage. |
| Authority | Reversible local: write only AFL++ build artifacts, corpora, and campaign processes under the working directory. Roll back by killing campaign processes (`kill $(jobs -p)`) and removing the output and state directories. |
| Side effect | Local writes to compiled artifacts, seed and output corpora, log files, and short-lived Docker containers; no mutation of source under test beyond compilation. |
| Done | AFL++ target runs against a seed corpus with the intended instrumentation and produces interpretable campaign output. |

## Inputs

- Target source tree (C/C++) with a fuzz harness or a program that reads stdin, files, or argv. Required.
- Seed corpus directory with at least one non-empty file. Required; created if absent.
- Compilation mode preference (LTO, LLVM, or GCC). Optional; default tries LTO, falls back to LLVM.
- Core count for multi-core campaigns. Optional; default is a single instance.
- Dictionary file for format-aware fuzzing. Optional.
- Sanitizer selection (ASan, UBSan, none). Optional; default none.

## Procedure

1. Create the AFL++ wrapper script in the working directory so every command below can run on host or Docker:
   ```bash
   cat <<'EOF' > ./afl++
   #!/bin/sh
   AFL_VERSION="${AFL_VERSION:-"stable"}"
   case "$1" in
      host)
           shift
           bash -c "$*"
           ;;
       docker)
           shift
           /usr/bin/env docker run -i \
               --privileged \
               -v ./:/src \
               --rm \
               --name "afl_fuzzing_$$" \
               "aflplusplus/aflplusplus:$AFL_VERSION" \
               bash -c "cd /src && bash -c \"$*\""
           ;;
       *)
           echo "Usage: $0 {host|docker}"
           exit 1
           ;;
   esac
   EOF
   chmod +x ./afl++
   ```
   The wrapper joins everything after the mode argument into one shell string. Quoting therefore does not survive: an argument containing a space arrives word-split. Rename files without spaces, or edit the wrapper for that run. The missing `-t` is deliberate. `docker run -ti` aborts with "the input device is not a TTY" when stdin is not a terminal, including in CI and agent-driven runs. Without `-t`, `afl-fuzz` prints plain status lines instead of the full-screen UI. `$$` gives parallel instances distinct container names.

2. Install or pull AFL++: either `apt install afl++ lld-<clang-version>` (host) or `docker pull aflplusplus/aflplusplus:stable` (Docker). Verify the binary is available: `./afl++ host afl-fuzz --version` or `./afl++ docker afl-fuzz --version`.

3. Tune the host kernel for up to 15% more executions per second — run after each reboot:
   ```bash
   ./afl++ host afl-system-config
   ```
   `afl-system-config` tunes the kernel it runs against, so run it on the machine hosting the campaign. For Docker-only installs, `./afl++ docker afl-system-config` reaches the same settings through the `--privileged` container. For maximum performance, disable kernel mitigations (requires grub, not Docker): `./afl++ host afl-persistent-config`, `update-grub`, `reboot`, then `./afl++ host afl-system-config`; verify with `cat /proc/cmdline` showing `mitigations=off`. Do not run `afl-system-config` or `afl-persistent-config` on production or development systems — they disable OS security features; use a dedicated VM.

4. Write or locate a fuzz harness. AFL++ supports libFuzzer-style harnesses:
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

5. Compile the target with the chosen instrumentation mode. Try LTO first for best performance; fall back to LLVM mode if LTO fails to link; use the GCC plugin only when the project requires GCC:
   ```bash
   # LTO mode (preferred)
   ./afl++ docker afl-clang-lto++ -DNO_MAIN=1 -O2 -fsanitize=fuzzer harness.cc main.cc -o fuzz
   # LLVM mode (fallback)
   ./afl++ docker afl-clang-fast++ -DNO_MAIN=1 -O2 -fsanitize=fuzzer harness.cc main.cc -o fuzz
   # GCC plugin
   ./afl++ docker afl-g++-fast -DNO_MAIN=1 -O2 -fsanitize=fuzzer harness.cc main.cc -o fuzz
   ```
   `-DNO_MAIN=1` skips the main function when using a libFuzzer harness. `-g` is added by default. For static libraries and object files, use `-fsanitize=fuzzer-no-link` to instrument without linking the fuzzer runtime. The GCC version must match the version used to compile the AFL++ GCC plugin.

6. Add sanitizers if requested. AddressSanitizer (`AFL_USE_ASAN=1`) and UBSan (`AFL_USE_UBSAN=1`) find memory corruption and undefined behavior that do not crash immediately:
   ```bash
   ./afl++ docker AFL_USE_ASAN=1 afl-clang-fast++ -DNO_MAIN=1 -O2 -fsanitize=fuzzer harness.cc main.cc -o fuzz
   ./afl++ docker AFL_USE_UBSAN=1 afl-clang-fast++ -DNO_MAIN=1 -O2 -fsanitize=fuzzer,undefined harness.cc main.cc -o fuzz
   ```
   The `-m` memory limit flag is not supported with ASan because ASan reserves 20 TB of virtual memory. In multi-core setups, run only one ASan job per 4–8 non-ASan jobs.

7. Create a seed corpus with at least one non-empty file:
   ```bash
   mkdir seeds && echo "aaaa" > seeds/minimal_seed
   ```
   For real projects, gather representative inputs from example files, the project test suite, or minimal valid inputs for the target format.

8. Set the environment variables that matter for the campaign:
   - `AFL_TMPDIR=/dev/shm`: always set; uses tmpfs to improve performance and avoid SSD wear.
   - `AFL_FAST_CAL=1`: for slow targets (>10 ms/exec); speeds calibration ~2.5× with negligible precision loss.
   - `AFL_TESTCACHE_SIZE=100`: on all instances; caches test cases in memory (default 50 MB; 50–250 MB works well).
   - `AFL_FINAL_SYNC=1`: on the primary `-M` instance only; needed for later `afl-cmin`, not for fuzzing itself.
   - `AFL_EXIT_ON_TIME=3600` or `AFL_EXIT_WHEN_DONE=1`: for CI or automated fuzzing to bound runtime.
   - `AFL_NO_UI=1`: for headless environments.

9. Run a single-core campaign:
   ```bash
   ./afl++ docker AFL_TMPDIR=/dev/shm afl-fuzz -i seeds -o out -- ./fuzz
   ```
   Useful flags: `-G 4000` (max input length), `-t 1000` (per-case timeout ms), `-m 1000` (memory limit MB, not with ASan), `-x ./dict.dict` (dictionary).

10. For multi-core campaigns, start a primary instance and one secondary per available core, all sharing the same `-o state` directory:
    ```bash
    ./afl++ docker AFL_TMPDIR=/dev/shm AFL_FINAL_SYNC=1 AFL_TESTCACHE_SIZE=100 afl-fuzz -M primary -i seeds -o state -- ./fuzz 1>primary.log 2>primary.error </dev/null &
    ./afl++ docker AFL_TMPDIR=/dev/shm AFL_TESTCACHE_SIZE=100 afl-fuzz -S secondary01 -i seeds -o state -- ./fuzz 1>secondary01.log 2>secondary01.error </dev/null &
    ./afl++ docker AFL_TMPDIR=/dev/shm AFL_TESTCACHE_SIZE=100 afl-fuzz -S secondary02 -i seeds -o state -- ./fuzz 1>secondary02.log 2>secondary02.error </dev/null &
    ```
    The `</dev/null` redirect is required. `docker run -i` keeps the client reading stdin, and a backgrounded process that reads the terminal receives `SIGTTIN` and stops without the redirect. List running jobs with `jobs`; stop all with `kill $(jobs -p)`.

11. To enable CMPLOG/RedQueen constraint solving, build with `AFL_LLVM_CMPLOG=1` and run one secondary with `-c0`:
    ```bash
    ./afl++ docker AFL_LLVM_CMPLOG=1 make
    ./afl++ docker AFL_TMPDIR=/dev/shm afl-fuzz -c0 -S cmplog -i seeds -o state -- ./fuzz 1>cmplog.log 2>cmplog.error </dev/null &
    ```

12. Monitor the campaign. Without a TTY, `afl-fuzz` writes plain status lines to the log and to `state/<instance>/fuzzer_stats`:
    ```bash
    ./afl++ docker afl-whatsup state/
    ```
    Read these fields: `execs/sec` (speed, higher is better), `cycles done` (queue passes completed), `corpus count` (unique test cases in queue), `saved crashes` (unique crashes found), `stability` (should be near 100%; below 85% indicates non-deterministic behavior). For coverage plots: `./afl++ docker afl-plot state/default out_graph/` (the Docker image ships `gnuplot-nox`; in host mode install `gnuplot` first).

13. Triage crashes by re-executing each file in `state/default/crashes/` (or `out/default/crashes/`) against the target:
    ```bash
    ./afl++ docker ./fuzz state/default/crashes/id:000000,sig:06,src:000002,time:286,execs:13105,op:havoc,rep:4
    ```
    The crash filename encodes the signal (`sig:06`), source, time, execs, operation, and rep. Hangs are in `state/default/hangs/`.

14. Minimize the corpus after a campaign to keep only unique coverage:
    ```bash
    ./afl++ docker afl-cmin -i state/default/queue -o minimized_corpus -- ./fuzz
    ```

15. Stop all campaign processes and clean up: `kill $(jobs -p)`, then remove `out/` or `state/` and log files to roll back. The target source is unchanged except for compiled artifacts.

## Failure and recovery
- **Build failure (LTO link error):** fall back to LLVM mode (`afl-clang-fast`); if the project requires GCC, use `afl-gcc-fast` or `afl-g++-fast`. Do not proceed with an uninstrumented binary — it produces no coverage data.
- **GCC plugin version mismatch:** ensure the system GCC matches the AFL++ plugin build; install `gcc-<version>-plugin-dev`. Do not patch around the mismatch.
- **Low stability (<85%):** the target is non-deterministic. Switch from a `LLVMFuzzerTestOneInput` harness to stdin or file-input fuzzing, or fix the non-determinism in the target. Do not report done with low stability.
- **Low execs/sec (<1k):** switch to a persistent-mode (`LLVMFuzzerTestOneInput`) harness for 10–20× speedup, or set `AFL_TMPDIR=/dev/shm`.
- **No crashes found:** recompile with `AFL_USE_ASAN=1` or `AFL_USE_UBSAN=1`; memory corruption often does not crash without a sanitizer.
- **Memory limit exceeded with ASan:** remove the `-m` flag; ASan reserves 20 TB virtual memory and is incompatible with `-m`.
- **Backgrounded job shows "Stopped":** the `</dev/null` redirect is missing; restart the job with it to avoid `SIGTTIN`.
- **Docker "input device is not a TTY":** the wrapper omits `-t` deliberately; do not add it for non-interactive runs. For the interactive UI, run `host` mode in a terminal.
- **Partial result rule:** if the campaign stops early, the `state/` or `out/` directory still contains valid queue, crashes, and `fuzzer_stats`; report what was captured rather than discarding it.
- **Rollback:** kill all fuzzers (`kill $(jobs -p)`), remove `out/`, `state/`, log files, and the compiled `fuzz` binary. Source under test is unchanged beyond compilation. Do not attempt to reverse `afl-system-config` or `afl-persistent-config` on a shared system — reboot the dedicated VM instead.

## Output
- A compiled, instrumented fuzz target binary.
- A campaign output directory (`out/` or `state/`) containing `queue/` (test cases), `crashes/` (crash-reproducing inputs), `hangs/`, `fuzzer_stats` (campaign statistics), and `plot_data` (coverage time series).
- A status report covering execs/sec, cycles done, corpus count, saved crashes, and stability.
- A crash triage result: each crash file re-executed against the target with its signal and reproduction command recorded.
- A minimized corpus directory when `afl-cmin` was run.

## Provenance

- Origin: https://github.com/trailofbits/skills (Trail of Bits testing-handbook-skills plugin).
- Revision: d1f1575cff97816e5cc08af66cd2506099c681d3.
- Source path: /plugins/testing-handbook-skills/skills/aflpp/SKILL.md.
- License: CC-BY-SA-4.0. Preserve Trail of Bits attribution and the source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding.
- Adaptation: Clean-room procedural rewrite preserving the AFL++ wrapper, compilation-mode decision tree, multi-core process model, environment-variable set, and crash-triage workflow; removed comparison tables, motivational prose, cross-skill pointers, and external resource lists.
