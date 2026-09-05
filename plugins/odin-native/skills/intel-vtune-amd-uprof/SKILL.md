---
name: intel-vtune-amd-uprof
description: 'Use when profiling with Intel VTune or AMD uProf for hotspots, top-down pipeline stalls, memory-bound analysis, or roofline data. Not for raw perf stat counters: use hardware-counters.'
---

# Intel VTune and AMD uProf

VTune Profiler (a free download, standalone or inside the oneAPI toolkits) and AMD uProf (5.3, 2026-06-17) are the vendor profilers that turn PMU samples into named bottleneck categories. Use them after `linux-perf` has named a hot function and the question has become why that function is slow: front end, bad speculation, memory, or core execution.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A hot function is known and the user asks which pipeline stage or memory level limits it, wants DRAM bandwidth utilization, wants a roofline chart, or asks how to run VTune or uProf. |
| Authority | Reversible local: writes only result directories (`-result-dir` or `--output-dir` targets) and report files in the working directory; rollback is deleting them. Driver installation for hardware sampling is proposed to the user, never performed. No remote mutation. |
| Side effect | Result directories on disk. Hardware event collection loads the vendor sampling driver or uses `perf_event_open` under the same paranoid rules as perf. |
| Done | The report names the dominant top-down category for the hot function with its percentage, the memory level or bandwidth figure behind it when memory-bound, and the measured versus peak bandwidth or the roofline position when asked. |

## Inputs

- Binary built with `-g` and the release optimization level; add `-fno-omit-frame-pointer` for reliable stacks.
- CPU vendor: VTune on Intel, uProf on AMD. VTune's hardware analyses need Intel PMU features; on AMD hosts it falls back to software sampling.
- Environment: `source /opt/intel/oneapi/vtune/latest/env/vars.sh` puts `vtune` and `vtune-gui` on the path (default oneAPI layout). uProf installs `AMDuProfCLI`, `AMDuProfPcm`, and the `AMDuProf` GUI; `AMDuProfCLI --version` confirms it.
- The question: where (hotspots), why (top-down), or how far from the hardware ceiling (memory access, roofline).

## Procedure

1. Hotspots first. VTune: `vtune -collect hotspots -result-dir r_hot ./prog`, then `vtune -report hotspots -r r_hot -format csv -report-output hotspots.csv` (`-csv-delimiter comma` fixes the delimiter across locales). uProf: `AMDuProfCLI collect --config tbp --output-dir uprof_out ./prog`, then `AMDuProfCLI report --input-dir uprof_out/<session-dir>` writes a CSV summary. Done when: the top functions by CPU time are listed.
2. Explain the hot function with top-down analysis. VTune: `vtune -collect uarch-exploration -result-dir r_uarch ./prog` and `vtune -report summary -r r_uarch`. The CLI token is `uarch-exploration`; `general-exploration` is the deprecated alias and `microarchitecture-exploration` is the GUI label only. Read the four top-level categories, which sum to the pipeline slots: Retiring (useful work), Bad Speculation (mispredicted paths), Front-End Bound (fetch and decode starvation), Back-End Bound (execution or memory waits), the last split into Memory Bound (L1, L2, L3, DRAM Bound) and Core Bound. VTune highlights a category when it exceeds its own built-in expectation for the workload class; read the highlight, not a fixed number, because the healthy split for a vectorized kernel differs from a branchy parser. uProf: `AMDuProfCLI collect --config hotspots` adds call stacks to time-based sampling; list this version's configurations with `AMDuProfCLI info --list collect-configs` before choosing one. Done when: the dominant category and its share are named for the hot function.
3. When Back-End Bound dominates, measure memory. VTune: `vtune -collect memory-access -result-dir r_mem ./prog`; the summary reports Memory Bound share, LLC miss rate, DRAM bandwidth achieved, and NUMA remote accesses on multi-socket hosts. Compare achieved DRAM bandwidth with the platform peak VTune reports for the socket; a workload at a small fraction of peak with high Memory Bound is latency-bound (pointer chasing, poor locality), one near peak is bandwidth-bound. uProf: `--config memory` samples with IBS to find false cache-line sharing. Fix paths: layout changes and locality (`cpu-cache-opt`), NUMA placement (`numa-programming`). Done when: the memory level or the bandwidth ratio that limits the function is stated.
4. When Retiring dominates but time is still high, the code is compute-bound: vectorization (`simd-intrinsics`) or algorithmic work is the lever. Done when: the recommendation names the lever.
5. Roofline, when asked. `vtune -collect hpc-performance -result-dir r_hpc ./prog` collects the FLOP and bandwidth data; the roofline chart renders in `vtune-gui` (or VTune Profiler Server), not as a CLI report. Read the position: a kernel under the sloped bandwidth roof is memory-bound, one under the flat compute roof is compute-bound. For a manual roofline, arithmetic intensity is FLOPs divided by bytes moved; peak FLOP rate comes from cores times frequency times FLOPs per cycle per core, and peak bandwidth from the platform specification. `likwid-perfctr -C 0 -g FLOPS_DP ./prog` and `-g MEM` measure the two axes on Linux; group names are per microarchitecture and `likwid-perfctr -a` lists the ones for this CPU. Done when: the kernel's roofline position and the limiting roof are stated.
6. Threading, when the program is parallel and scaling is poor: `vtune -collect threading -result-dir r_thr ./prog` reports lock contention and parallel efficiency; uProf's `--config threading` covers the same question. Done when: the top synchronization object or the idle fraction is named.

## Failure and recovery

| Failure | Cause | Fix |
|---|---|---|
| Hardware collection fails or falls back to user-mode sampling | Sampling driver not loaded, or `perf_event_paranoid` too high | Propose loading the vendor driver, or the same `sysctl` change as `linux-perf`; hotspots still work in software mode |
| No symbols in the report | Build lacks `-g` | Rebuild with `-g`; point the profiler at the symbol directory if debug info is split |
| `uarch-exploration` unavailable on this CPU | Non-Intel host or virtualized PMU | Use uProf on AMD; in a VM only software hotspots are available |
| uProf rejects `--config` name | Configuration names vary by version | Run `AMDuProfCLI info --list collect-configs` and pick from that list |
| Roofline chart missing | Looking for it in a CLI report | Open the `hpc-performance` result in `vtune-gui` |
| Categories do not add up | Mixed SMT siblings or frequency scaling during the run | Pin the workload and disable turbo for the measurement, then rerun |

## Output

A microarchitecture report naming the hot functions, the dominant top-down category and share per hot function, the memory level or achieved-versus-peak bandwidth when memory-bound, the roofline position when asked, the result directory paths, and one recommended lever per hot function.
