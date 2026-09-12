---
name: linux-perf
description: 'Use when collecting sampling profiles with perf record, reading perf report or perf annotate, measuring PMU counters with perf stat -e, or using PAPI instrumentation to interpret IPC, miss rates, MPKI, or memory bandwidth on Linux. Not for SVG rendering: use flamegraphs.'
---

# Linux perf and PMU counters

`perf` ships in the kernel source tree under `tools/perf`, so its feature set follows the running kernel line (mainline 7.2, LTS 6.18). This skill covers the three jobs perf does for a CPU-bound program: count hardware events with `perf stat`, sample where cycles go with `perf record` and `perf report`, and attribute samples to instructions with `perf annotate`. It also covers PAPI region instrumentation, counter-derived metrics, memory-bandwidth counters, and raw PMU event lookup.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A Linux program is slow or CPU-bound and the user wants hot functions, counter totals, or instruction-level attribution from `perf`, or asks for PAPI instrumentation, IPC, miss rates, MPKI, or counter-based memory bandwidth. Also fires on `[unknown]` frames, `Permission denied` from perf, or a request to feed perf data to a flamegraph pipeline. |
| Authority | Reversible local: writes only `perf.data` files (or the `-o` target), compiled or PAPI-instrumented test binaries, and PMU tool checkouts in the working directory; rollback is deleting those files. `sysctl` and MSR module changes are proposed to the user, never applied. No remote mutation. |
| Side effect | Profile and counter data on disk. Counting mode (`perf stat`) adds negligible overhead; PAPI adds instrumentation overhead around the measured region; sampling mode slows the program by a small factor that depends on sample frequency and call-graph mode. |
| Done | The report names the hot symbols with their sample share, every counter metric carries its formula, raw counts, workload, microarchitecture, and comparison it supports, and any unresolved frame is explained with its fix. |

## Inputs

- Target program and a representative workload (required). Short programs need a longer input or a higher `-F`.
- Debug symbols (required for symbol names and source lines): build with `-g`. For frame-pointer call graphs add `-fno-omit-frame-pointer`; otherwise use `--call-graph dwarf`.
- CPU model (`lscpu`) and whether the host is virtualized: a VM often exposes no hardware events.
- Value of `/proc/sys/kernel/perf_event_paranoid` (gathered by the skill). Meaning: `2` allows user-space measurement of the caller's own processes only, `1` adds kernel measurement, `0` adds CPU-wide events, `-1` removes all restrictions. Values above `2` block unprivileged perf entirely.
- A question: which function is hot, which counter or derived metric is high, which source line causes misses, or which instruction stalls. The question picks the subcommand or counter mode.
- For PAPI: `libpapi` headers and library (`-lpapi`), PAPI 7.3.0 at grounding.

## Procedure
1. Check permissions. Read `cat /proc/sys/kernel/perf_event_paranoid`. If the value blocks the intended measurement, propose `sudo sysctl -w kernel.perf_event_paranoid=1` for the session, or the persistent form `echo 'kernel.perf_event_paranoid=1' | sudo tee /etc/sysctl.d/99-perf.conf` followed by `sudo sysctl -p /etc/sysctl.d/99-perf.conf`. Wait for the user to apply it. Done when: perf can open the events the plan needs, or the user has declined and the plan is narrowed to what the current level allows.
2. Build with symbols: `gcc -g -O2 -fno-omit-frame-pointer -o prog main.c`. Keep the optimization level of the real build, because a `-O0` profile points at code that does not exist in production. Done when: `nm prog | head` shows symbols and the binary runs the workload.
3. Counter mode. Confirm what the CPU exposes with `perf list hw`, `perf list cache`, and `perf list pmu`; the first prints generic hardware events, the second cache events, and the third CPU-specific names. If `perf list hw` is empty, the host is virtualized or the PMU is locked and only software events remain. Run `perf stat ./prog` for the default set, then `perf stat -e cycles,instructions,cache-references,cache-misses,branches,branch-misses ./prog` for named events. For cache and TLB pairs, use `perf stat -e L1-dcache-loads,L1-dcache-load-misses,LLC-loads,LLC-load-misses ./prog` and `perf stat -e dTLB-loads,dTLB-load-misses,iTLB-loads,iTLB-load-misses ./prog`. Use `perf stat -r 5 -e instructions,cycles ./prog` to average five runs and print the spread; attach to a live process with `perf stat -p <pid> sleep 10`. Group events that must be measured together in one `-e` list; when more events are requested than counters exist, perf multiplexes and scales them, and prints the percentage of time each was counted. Done when: the events for the chosen metric appear in `perf list` (or software-only operation is recorded), and raw counts for every event are recorded with the run spread.

   Read derived metrics as conditional signals, not verdicts:

   | Metric | Formula | Reading |
   |---|---|---|
   | IPC | `instructions / cycles` | Ceiling is the core's issue width. Compare two builds on the same core; a memory-bound or pointer-chasing loop has a low IPC by nature, and a lower IPC after a change is the signal, not the level |
   | L1 miss rate | `L1-dcache-load-misses / L1-dcache-loads` | Meaningful with the absolute miss count beside it; streaming through a large array raises it by design |
   | LLC miss rate | `LLC-load-misses / LLC-loads` | High rate plus high absolute count means DRAM traffic; check bandwidth below |
   | Branch miss rate | `branch-misses / branches` | Data-dependent branches drive it; if sorting the input lowers it, the branches are the cost |
   | MPKI | `misses / (instructions / 1000)` | Normalizes misses to work done; use it to compare builds with different instruction counts |

   Done when: each metric carries its formula, raw counts, workload, CPU model, and the build comparison it supports.

   When whole-program totals are too coarse, use the PAPI region mode. The low-level API (the old `PAPI_start_counters` and `PAPI_stop_counters` are gone from PAPI 7.x) is:

   ```c
   #include <papi.h>
   #include <stdio.h>

   int main(void) {
       int events[] = { PAPI_TOT_INS, PAPI_TOT_CYC, PAPI_L2_TCM, PAPI_BR_MSP };
       long long values[4];
       int set = PAPI_NULL;

       if (PAPI_library_init(PAPI_VER_CURRENT) != PAPI_VER_CURRENT) return 1;
       if (PAPI_create_eventset(&set) != PAPI_OK) return 1;
       for (int i = 0; i < 4; i++)
           if (PAPI_add_event(set, events[i]) != PAPI_OK) return 1;

       PAPI_start(set);
       do_work();
       PAPI_stop(set, values);

       printf("IPC %.2f  L2 misses %lld  branch mispredicts %lld\n",
              (double)values[0] / values[1], values[2], values[3]);
       return 0;
   }
   ```

   Build with `gcc -O2 -g -o prog prog.c -lpapi`. The high-level API wraps the same region in `PAPI_hl_region_begin("name")` and `PAPI_hl_region_end("name")` with events chosen through `PAPI_EVENTS`. `papi_avail -a` lists the presets this CPU supports (`PAPI_TOT_INS`, `PAPI_TOT_CYC`, `PAPI_L1_DCM`, `PAPI_L2_TCM`, `PAPI_L3_TCM`, `PAPI_BR_MSP`, `PAPI_TLB_DM`, `PAPI_FP_INS`, `PAPI_VEC_INS`); `papi_native_avail` lists native events. A preset absent from `papi_avail -a` fails in `PAPI_add_event`. Done when: the region's counts print and the preset list confirms each event.

   When LLC misses are high, measure memory bandwidth. Uncore IMC events count DRAM transactions: `perf stat -e uncore_imc/cas_count_read/,uncore_imc/cas_count_write/ -a ./prog` on Intel hosts that expose the `uncore_imc` PMU in `perf list pmu`; system-wide `-a` needs paranoid level 0 or root. Intel PCM (`https://github.com/intel/pcm`, built with `cmake`, binaries in `build/bin`) reports socket bandwidth with `pcm-memory 1` and core metrics with `pcm 1`, both with a `-csv` mode. PCM reads MSRs and needs root or `CAP_SYS_RAWIO`, or its daemon mode for unprivileged readers. Done when: achieved bandwidth is recorded next to the platform peak.

   When generic names do not cover the question, reach raw events: `perf list pmu` prints the CPU's named events, and the raw form is `perf stat -e cpu/event=0x..,umask=0x../`. `pmu-tools` (`git clone https://github.com/andikleen/pmu-tools`, run `./ocperf.py` from the checkout) translates vendor event names to raw codes; `showevtinfo` from libpfm4 lists what the library knows. Done when: the raw event's name and code are recorded together.
4. Sample with `perf record`. Use `perf record -F 999 -g ./prog` for a frame-pointer call graph at 999 Hz (an odd frequency avoids lock-step with periodic timers). Use `perf record -F 999 --call-graph dwarf ./prog` when the binary or its libraries lack frame pointers; cap the copied stack with `--call-graph dwarf,4096` if the data file grows too fast. Sample a specific event with `-e cache-misses`; for miss attribution use `-e LLC-load-misses` and add the `:p` or `:pp` suffix when the PMU supports precise sampling. Attach with `-p <pid> sleep 30`, sample all CPUs with `-a`, and name the output with `-o app.perf.data`. Done when: `perf record` prints the sample count and the data file exists.
5. Read the report. `perf report` opens the TUI on `perf.data`; `perf report -i app.perf.data` reads a named file; `perf report --stdio` prints text; `perf report --no-children` shows self time instead of inclusive time; `perf report --sort comm,dso,sym` groups by process, library, and symbol. In the TUI, `Enter` expands a symbol, `a` annotates it, `d` filters by DSO, `t` filters by thread, and `?` lists keys. Done when: the top symbols by self time are listed with their percentages.
6. Annotate the hot symbol. `perf annotate -i perf.data --symbol=<name> --stdio` prints the disassembly with per-instruction sample shares; `s` in the TUI toggles source when debug info is present. A high share on a load instruction (`mov`, `vmovdqa`) marks a stall on that load, usually a cache miss. For miss attribution, the percentage next to a source line is the share of miss samples landing there; a loop body with a strided access pattern shows the load instruction at the top. Done when: the hottest instructions and source lines (or, for miss attribution, the top source lines by miss samples) are named.
7. Watch live when the workload is long-running: `sudo perf top -g` or `sudo perf top -p <pid>`. Done when: the live view confirms or refutes the recorded hotspot.
8. Export for a flamegraph: `perf script -i perf.data > out.perf`, then hand `out.perf` to `flamegraphs` (`stackcollapse-perf.pl` and `flamegraph.pl`). Done when: `out.perf` exists.
9. Resolve any bad frames or empty output using the failure table below before reporting. Done when: no `[unknown]` frame remains in the top entries, or its cause is stated.

Event names to reach for: hardware `cycles`, `instructions`, `cache-references`, `cache-misses`, `branches`, `branch-misses`, `stalled-cycles-frontend`, `stalled-cycles-backend`; cache `L1-dcache-loads`, `L1-dcache-load-misses`, `LLC-loads`, `LLC-load-misses`, `dTLB-load-misses`; software `context-switches`, `cpu-migrations`, `page-faults`, `major-faults`; tracepoints such as `sched:sched_switch` (need paranoid level 0 or root). `perf list` prints what this CPU exposes; `perf list hw`, `perf list cache`, `perf list sw`, and `perf list tracepoint` filter by class. Raw PMU codes are CPU-specific, and `:u`, `:k`, `:p`, and `:pp` modifiers restrict counting or request precise sampling. Full event notes live in `references/events.md`.

## Failure and recovery

| Failure | Cause | Fix |
|---|---|---|
| `Permission denied` or `Error: Access to performance monitoring and observability operations is not permitted` | `perf_event_paranoid` above the needed level | Propose the `sysctl` change from step 1, or run the measurement with `sudo` |
| `[unknown]` frames | No frame pointers or no debug info | Rebuild with `-g -fno-omit-frame-pointer`, or record with `--call-graph dwarf` |
| Kernel frames show as addresses | Kernel symbols hidden | Record with `sudo`; `kptr_restrict` at `0` (`/proc/sys/kernel/kptr_restrict`) exposes `/proc/kallsyms`; install the kernel debug symbols package for the running kernel |
| Empty report for a short program | Too few samples | Raise `-F` toward the value in `kernel.perf_event_max_sample_rate`, or lengthen the workload |
| DWARF unwinding is slow or the data file is huge | Whole user stack copied per sample | `--call-graph dwarf,4096` or a smaller size, or add frame pointers and use `-g` |
| Counter shows `<not supported>` | Event absent on this CPU or virtualized | Pick a name from `perf list`; in a VM only software events may exist |
| Counter shows `<not counted>` or a low multiplex percentage | More events than counters | Split the events across runs, or group the ones that must be read together |
| Miss rate looks alarming | Absolute count is small | Report the count beside the rate; a rate on few references is noise |
| `PAPI_add_event` fails | Preset not available or counter conflict | Check `papi_avail -a`; reduce the event set |
| Uncore events are missing | PMU not exposed or paranoid level too high | Propose paranoid level 0 or root for `-a`; use PCM or the vendor profiler (`intel-vtune-amd-uprof`) |
| Numbers differ run to run | Frequency scaling, SMT sibling, or cache state | Use `-r`, pin with `taskset`, and report the spread |

A partial profile or counter report is reported as partial: the report states which steps ran and which measurement is missing.

## Output

A profile report containing the counter table from step 3 with formulas, raw counts, run spread, workload, CPU model, and the comparison it supports; the top symbols by self time from step 5 with percentages; the hot instructions and source lines from step 6; the bandwidth figure and platform peak when measured; the PAPI region output when instrumented; the path of every data file written; and any unresolved frame with its cause and fix.
