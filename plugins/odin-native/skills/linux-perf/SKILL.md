---
name: linux-perf
description: 'Use when collecting sampling profiles with perf record, reading perf report or perf annotate, or measuring counters with perf stat on Linux. Not for SVG rendering: use flamegraphs.'
---

# Linux perf

`perf` ships in the kernel source tree under `tools/perf`, so its feature set follows the running kernel line (mainline 7.2, LTS 6.18). This skill covers the three jobs perf does for a CPU-bound program: count hardware events with `perf stat`, sample where cycles go with `perf record` and `perf report`, and attribute samples to instructions with `perf annotate`.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A Linux program is slow or CPU-bound and the user wants hot functions, counter totals, or instruction-level attribution from `perf`. Also fires on `[unknown]` frames, `Permission denied` from perf, or a request to feed perf data to a flamegraph pipeline. |
| Authority | Reversible local: writes only `perf.data` files (or the `-o` target) and the compiled test binary in the working directory; rollback is deleting those files. A `sysctl` change to `kernel.perf_event_paranoid` is proposed to the user, never applied by the skill. No remote mutation. |
| Side effect | Profile data files on disk. The profiled program runs under sampling, which slows it by a small factor that depends on sample frequency and call-graph mode. |
| Done | The report names the hot symbols with their sample share, every counter reading carries the workload condition it was taken under, and any unresolved frame is explained with its fix. |

## Inputs

- Target program and a representative workload (required). Short programs need a longer input or a higher `-F`.
- Debug symbols (required for symbol names and source lines): build with `-g`. For frame-pointer call graphs add `-fno-omit-frame-pointer`; otherwise use `--call-graph dwarf`.
- Value of `/proc/sys/kernel/perf_event_paranoid` (gathered by the skill). Meaning: `2` allows user-space measurement of the caller's own processes only, `1` adds kernel measurement, `0` adds CPU-wide events, `-1` removes all restrictions. Values above `2` block unprivileged perf entirely.
- A question: which function is hot, which counter is high, or which instruction stalls. The question picks the subcommand.

## Procedure

1. Check permissions. Read `cat /proc/sys/kernel/perf_event_paranoid`. If the value blocks the intended measurement, propose `sudo sysctl -w kernel.perf_event_paranoid=1` for the session, or the persistent form `echo 'kernel.perf_event_paranoid=1' | sudo tee /etc/sysctl.d/99-perf.conf` followed by `sudo sysctl -p /etc/sysctl.d/99-perf.conf`. Wait for the user to apply it. Done when: perf can open the events the plan needs, or the user has declined and the plan is narrowed to what the current level allows.
2. Build with symbols: `gcc -g -O2 -fno-omit-frame-pointer -o prog main.c`. Keep the optimization level of the real build, because a `-O0` profile points at code that does not exist in production. Done when: `nm prog | head` shows symbols and the binary runs the workload.
3. Count first with `perf stat`. Run `perf stat ./prog` for the default set, then `perf stat -e cycles,instructions,cache-references,cache-misses,branches,branch-misses ./prog` for named events, and `perf stat -r 5 ./prog` to average five runs and print the spread. Attach to a live process with `perf stat -p <pid> sleep 10`. Read derived ratios as conditional signals, not verdicts: instructions per cycle depends on the core's issue width and on whether the workload is memory-bound by design, so compare IPC between two builds of the same program on the same machine rather than against a fixed number. A miss rate matters only when the absolute miss count is large relative to runtime. Done when: the counter table and the run-to-run spread are recorded with the workload name.
4. Sample with `perf record`. Use `perf record -F 999 -g ./prog` for a frame-pointer call graph at 999 Hz (an odd frequency avoids lock-step with periodic timers). Use `perf record -F 999 --call-graph dwarf ./prog` when the binary or its libraries lack frame pointers; cap the copied stack with `--call-graph dwarf,4096` if the data file grows too fast. Sample a specific event with `-e cache-misses`, attach with `-p <pid> sleep 30`, sample all CPUs with `-a`, and name the output with `-o app.perf.data`. Done when: `perf record` prints the sample count and the data file exists.
5. Read the report. `perf report` opens the TUI on `perf.data`; `perf report -i app.perf.data` reads a named file; `perf report --stdio` prints text; `perf report --no-children` shows self time instead of inclusive time; `perf report --sort comm,dso,sym` groups by process, library, and symbol. In the TUI, `Enter` expands a symbol, `a` annotates it, `d` filters by DSO, `t` filters by thread, and `?` lists keys. Done when: the top symbols by self time are listed with their percentages.
6. Annotate the hot symbol. `perf annotate -i perf.data --symbol=<name> --stdio` prints the disassembly with per-instruction sample shares; `s` in the TUI toggles source when debug info is present. A high share on a load instruction (`mov`, `vmovdqa`) marks a stall on that load, usually a cache miss. Done when: the hottest instructions and their source lines are named.
7. Watch live when the workload is long-running: `sudo perf top -g` or `sudo perf top -p <pid>`. Done when: the live view confirms or refutes the recorded hotspot.
8. Export for a flamegraph: `perf script -i perf.data > out.perf`, then hand `out.perf` to `flamegraphs` (`stackcollapse-perf.pl` and `flamegraph.pl`). Done when: `out.perf` exists.
9. Resolve any bad frames or empty output using the failure table below before reporting. Done when: no `[unknown]` frame remains in the top entries, or its cause is stated.

Event names to reach for: hardware `cycles`, `instructions`, `cache-references`, `cache-misses`, `branches`, `branch-misses`, `stalled-cycles-frontend`, `stalled-cycles-backend`; cache `L1-dcache-loads`, `L1-dcache-load-misses`, `LLC-loads`, `LLC-load-misses`, `dTLB-load-misses`; software `context-switches`, `cpu-migrations`, `page-faults`, `major-faults`; tracepoints such as `sched:sched_switch` (need paranoid level 0 or root). `perf list` prints what this CPU exposes; `perf list hw`, `perf list cache`, `perf list sw`, and `perf list tracepoint` filter by class. Raw PMU codes are CPU-specific: `perf list pmu` names them, and the form `perf stat -e cpu/event=0xd1,umask=0x20/u` passes one by code. Full event notes live in `references/events.md`.

## Failure and recovery

| Failure | Cause | Fix |
|---|---|---|
| `Permission denied` or `Error: Access to performance monitoring and observability operations is not permitted` | `perf_event_paranoid` above the needed level | Propose the `sysctl` change from step 1, or run the measurement with `sudo` |
| `[unknown]` frames | No frame pointers or no debug info | Rebuild with `-g -fno-omit-frame-pointer`, or record with `--call-graph dwarf` |
| Kernel frames show as addresses | Kernel symbols hidden | Record with `sudo`; `kptr_restrict` at `0` (`/proc/sys/kernel/kptr_restrict`) exposes `/proc/kallsyms`; install the kernel debug symbols package for the running kernel |
| Empty report for a short program | Too few samples | Raise `-F` toward the value in `kernel.perf_event_max_sample_rate`, or lengthen the workload |
| DWARF unwinding is slow or the data file is huge | Whole user stack copied per sample | `--call-graph dwarf,4096` or a smaller size, or add frame pointers and use `-g` |
| Counter shows `<not supported>` | Event absent on this CPU or virtualized | Pick a name from `perf list`; in a VM only software events may exist |

A partial profile is reported as partial: the report states which steps ran and which measurement is missing.

## Output

A profile report containing the counter table from step 3 with its run spread and workload name, the top symbols by self time from step 5 with percentages, the hot instructions and source lines from step 6, the path of every data file written, and any unresolved frame with its cause and fix.
