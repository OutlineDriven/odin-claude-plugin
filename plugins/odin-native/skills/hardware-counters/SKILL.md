---
name: hardware-counters
description: 'Use when measuring PMU events with perf stat -e or PAPI, computing IPC, miss rates, or MPKI, or attributing cache misses to source lines with perf annotate. Not for sampling profiles: use linux-perf.'
---

# Hardware performance counters

Every modern core exposes a performance monitoring unit (PMU) that counts events: cycles, retired instructions, cache and TLB misses, branch mispredictions. This skill reads those counters three ways: whole-program totals with `perf stat -e`, in-process regions with the PAPI library, and per-source-line attribution by sampling on a miss event and annotating. The numbers are ratios to compare across builds on one machine, not grades against a fixed scale.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks for a cache miss rate, branch misprediction rate, IPC, MPKI, memory bandwidth from counters, PAPI instrumentation, or which source lines cause the misses. |
| Authority | Reversible local: writes only `perf.data` files, PAPI-instrumented test binaries, and any PMU tool checkout in the working directory; rollback is deleting them. `sysctl` and MSR module changes are proposed to the user, never applied. No remote mutation. |
| Side effect | Profile data on disk. Counting mode (`perf stat`) adds negligible overhead; sampling mode slows the program by a small factor. |
| Done | Each metric is reported with its formula, the raw counts it came from, the workload, and the microarchitecture, and the comparison it supports (build A versus build B) is stated. |

## Inputs

- Target binary built with `-g` at the release optimization level.
- CPU model (`lscpu`) and whether the host is virtualized: a VM often exposes no hardware events.
- `perf_event_paranoid` level (see `linux-perf` for the meaning of each value).
- The metric of interest, which selects the events: IPC needs `instructions` and `cycles`; miss rates need the access and miss pair for one cache level; MPKI needs `instructions` and one miss event.
- For PAPI: `libpapi` headers and library (`-lpapi`), PAPI 7.3.0 at grounding.

## Procedure

1. Confirm what the CPU exposes. `perf list hw` prints generic hardware events, `perf list cache` the cache events, `perf list pmu` the CPU-specific named events. If `perf list hw` is empty, the host is virtualized or the PMU is locked and only software events remain. Done when: the events for the chosen metric appear in `perf list`.
2. Take the default summary: `perf stat ./prog`. perf prints the counts and derived annotations such as `insn per cycle` and `% of all cache refs`. Done when: the default table is recorded.
3. Count the events the metric needs:

   ```bash
   perf stat -e instructions,cycles,cache-references,cache-misses,branches,branch-misses ./prog
   perf stat -e L1-dcache-loads,L1-dcache-load-misses,LLC-loads,LLC-load-misses ./prog
   perf stat -e dTLB-loads,dTLB-load-misses,iTLB-loads,iTLB-load-misses ./prog
   perf stat -r 5 -e instructions,cycles ./prog
   ```

   Group events that must be measured together in one `-e` list; when more events are requested than counters exist, perf multiplexes and scales them, and prints the percentage of time each was counted. Repeat with `-r` and report the spread. Done when: raw counts for every event in the metric are recorded with the run spread.
4. Compute and read the metrics as conditional signals:

   | Metric | Formula | Reading |
   |---|---|---|
   | IPC | `instructions / cycles` | Ceiling is the core's issue width. Compare two builds on the same core; a memory-bound or pointer-chasing loop has a low IPC by nature, and a lower IPC after a change is the signal, not the level |
   | L1 miss rate | `L1-dcache-load-misses / L1-dcache-loads` | Meaningful with the absolute miss count beside it; streaming through a large array raises it by design |
   | LLC miss rate | `LLC-load-misses / LLC-loads` | High rate plus high absolute count means DRAM traffic; check bandwidth in step 6 |
   | Branch miss rate | `branch-misses / branches` | Data-dependent branches drive it; if sorting the input lowers it, the branches are the cost |
   | MPKI | `misses / (instructions / 1000)` | Normalizes misses to work done; use it to compare builds with different instruction counts |

   Done when: each metric carries its formula, raw counts, workload, and CPU model.
5. Attribute misses to source. Sample on the miss event and annotate: `perf record -e LLC-load-misses -g ./prog`, then `perf annotate --stdio` or `perf annotate --symbol=<fn> --stdio`; in `perf report`, `a` on a function opens the same view. The percentage next to a source line is the share of miss samples landing there; a loop body with a strided access pattern shows the load instruction at the top. Precise sampling (`:p` or `:pp` suffix) tightens instruction attribution where the PMU supports it. Done when: the top source lines by miss samples are named.
6. Measure memory bandwidth when LLC misses are high. Uncore IMC events count DRAM transactions: `perf stat -e uncore_imc/cas_count_read/,uncore_imc/cas_count_write/ -a ./prog` on Intel hosts that expose the `uncore_imc` PMU in `perf list pmu` (system-wide `-a`, so it needs paranoid level 0 or root). Intel PCM (`https://github.com/intel/pcm`, built with `cmake`, binaries in `build/bin`) reports socket bandwidth with `pcm-memory 1` and core metrics with `pcm 1`, both with a `-csv` mode; PCM reads MSRs and needs root or `CAP_SYS_RAWIO`, or its daemon mode for unprivileged readers. Done when: achieved bandwidth is recorded next to the platform peak.
7. Instrument a region with PAPI when whole-program totals are too coarse. The low-level API (the old `PAPI_start_counters` and `PAPI_stop_counters` are gone from PAPI 7.x):

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

   Build with `gcc -O2 -g -o prog prog.c -lpapi`. The high-level API wraps the same in `PAPI_hl_region_begin("name")` and `PAPI_hl_region_end("name")` with events chosen through `PAPI_EVENTS`. `papi_avail -a` lists the presets this CPU supports (`PAPI_TOT_INS`, `PAPI_TOT_CYC`, `PAPI_L1_DCM`, `PAPI_L2_TCM`, `PAPI_L3_TCM`, `PAPI_BR_MSP`, `PAPI_TLB_DM`, `PAPI_FP_INS`, `PAPI_VEC_INS`); `papi_native_avail` lists native events. A preset absent from `papi_avail -a` fails in `PAPI_add_event`. Done when: the region's counts print and the preset list confirms each event.
8. Reach raw events when the generic names do not cover the question. `perf list pmu` prints the CPU's named events; the raw form is `perf stat -e cpu/event=0x..,umask=0x../`. `pmu-tools` (`git clone https://github.com/andikleen/pmu-tools`, run `./ocperf.py` from the checkout) translates vendor event names to raw codes; `showevtinfo` from libpfm4 lists what the library knows. Done when: the raw event's name and code are recorded together.

## Failure and recovery

| Failure | Cause | Fix |
|---|---|---|
| `<not supported>` beside an event | Event absent on this CPU or in this VM | Choose from `perf list`; fall back to software events or a bare-metal host |
| `<not counted>` or low multiplex percentage | More events than counters | Split the events across runs, or group the ones that must be read together |
| Miss rate looks alarming | Absolute count is small | Report the count beside the rate; a rate on few references is noise |
| `PAPI_add_event` fails | Preset not available or counter conflict | Check `papi_avail -a`; reduce the event set |
| Uncore events missing | PMU not exposed or paranoid level too high | Propose paranoid level 0 or root for `-a`; use PCM or the vendor profiler (`intel-vtune-amd-uprof`) |
| Numbers differ run to run | Frequency scaling, SMT sibling, cache state | Use `-r`, pin with `taskset`, report the spread |

## Output

A counter report listing each metric with its formula, raw counts, run spread, workload, and CPU model; the top source lines by miss samples when attribution was requested; the bandwidth figure and platform peak when measured; and the PAPI region output when instrumented.
