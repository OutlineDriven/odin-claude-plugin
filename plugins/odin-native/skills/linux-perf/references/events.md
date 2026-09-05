# perf events reference

Sources: `man perf-list`, `man perf-stat` on perf 7.0 (kernel-tools), and `perf list` on the target host. Event availability depends on the CPU and on virtualization; `perf list` is the authority for the machine in front of you.

## Hardware events

Generic names that perf maps onto the CPU's PMU. A VM often exposes none of them.

| Event | Meaning |
|---|---|
| `cycles` | Core clock cycles |
| `instructions` | Instructions retired |
| `cache-references` | Last-level cache accesses (the exact level is CPU-defined) |
| `cache-misses` | Last-level cache misses |
| `branches` (alias `branch-instructions`) | Branch instructions retired |
| `branch-misses` | Mispredicted branches |
| `bus-cycles` | Bus cycles |
| `stalled-cycles-frontend` | Cycles with no instruction issued from the front end |
| `stalled-cycles-backend` | Cycles with instructions waiting on execution resources |
| `ref-cycles` | Reference cycles at the nominal frequency |

Cache events compose a level, an access type, and an outcome: `L1-dcache-loads`, `L1-dcache-load-misses`, `L1-icache-load-misses`, `LLC-loads`, `LLC-load-misses`, `dTLB-loads`, `dTLB-load-misses`, `iTLB-load-misses`. `perf list cache` prints the ones this CPU supports.

Raw PMU events are CPU-specific. `perf list pmu` prints the named events for the host, and the `cpu/event=0x..,umask=0x../` form passes one by code. A modifier suffix restricts the count: `:u` user space, `:k` kernel, `:p` and `:pp` request precise sampling where the PMU offers it.

## Software events

Counted by the kernel, available at any paranoid level that permits perf at all.

| Event | Meaning |
|---|---|
| `cpu-clock` | Per-CPU timer |
| `task-clock` | On-CPU time for the task |
| `page-faults` | Minor plus major page faults |
| `minor-faults` | Page present, mapping missing |
| `major-faults` | Page fetched from storage |
| `context-switches` | Voluntary plus involuntary switches |
| `cpu-migrations` | Task moved to another CPU |
| `alignment-faults` | Kernel-handled misaligned accesses |
| `emulation-faults` | Kernel-emulated instructions |

## Tracepoints

Need `perf_event_paranoid` at `0` or lower, or root. `perf list tracepoint` lists them; filter with a subsystem glob such as `perf list 'sched:*'`. Common ones: `sched:sched_switch`, `sched:sched_wakeup`, `syscalls:sys_enter_read`, `syscalls:sys_exit_read`, `block:block_rq_issue`, `block:block_rq_complete`, `net:netif_receive_skb`.

## Reading derived metrics

The ratios below are conditional readings, not thresholds. Compare them between two builds of the same program on the same machine and workload; a number on its own says little without the core's issue width, the memory system, and the algorithm's intended access pattern.

| Metric | Formula | How to read it |
|---|---|---|
| IPC | `instructions / cycles` | Bounded above by the core's issue width. Falls when the workload waits on memory or mispredicts; a pointer-chasing workload has a low IPC by design, so judge the change, not the level. |
| CPI | `cycles / instructions` | The inverse of IPC. |
| Cache miss rate | `cache-misses / cache-references` | Meaningful only with the absolute miss count beside it; a high rate on a small reference count is noise. |
| Branch miss rate | `branch-misses / branches` | Rises with data-dependent branches. If a sorted input lowers it, the branches are the cost. |
| Front-end stall share | `stalled-cycles-frontend / cycles` | Instruction fetch or decode starvation; correlate with `L1-icache-load-misses` and code size. |
| Back-end stall share | `stalled-cycles-backend / cycles` | Execution or memory waits; correlate with `LLC-load-misses` and `dTLB-load-misses`. |

Patterns that point somewhere:

- Low IPC with high back-end stalls and high LLC misses: memory-bound. Improve locality (`cpu-cache-opt`).
- Low IPC with high front-end stalls: instruction-cache pressure. Split hot and cold code, or use profile-guided optimization.
- High branch miss rate: unpredictable branches. Sort or partition the data, or make the branch branchless.
- Many major faults: the working set exceeds memory. Shrink it or add memory.
