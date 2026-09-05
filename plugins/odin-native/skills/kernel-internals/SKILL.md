---
name: kernel-internals
description: 'Use when diagnosing scheduler latency, kmalloc vs vmalloc, page cache, meminfo under pressure, or OOM victim choice, or when reading kernel/sched, mm, or fs source.'
---

# Kernel internals

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A diagnosis or explanation inside the scheduler, the memory allocators, the VFS, the page cache, or the OOM killer; also reading kernel source in `kernel/sched/`, `mm/`, or `fs/`. |
| Authority | Read-only. Analysis and measurements stay in chat; no file writes, no rollback needed. No remote mutation. |
| Side effect | A subsystem diagnosis grounded in the running kernel's version and measurements. Nothing is written. |
| Done | The observed behavior is explained by one subsystem mechanism with the measurement that confirms it, or the mismatch between the claim and the kernel is named. |

## Inputs

1. The question or symptom (required): latency, allocation failure, cache behavior, memory pressure, OOM victim.
2. Target access (optional): `/proc`, `/sys`, and `perf` on the running machine.
3. Kernel version (optional): mainline 7.2 or LTS 6.18 assumed when not stated.

## Procedure

1. **Pin the kernel and the scheduler it runs.** `uname -r` first. EEVDF (Earliest Eligible Virtual Deadline First) replaced CFS: merged as an option in 6.6, the transition completed in 6.12, so mainline 7.2 and LTS 6.18 run EEVDF. On 6.6 through 6.11, check which one is active before applying CFS reasoning. Each CPU carries a runqueue with three classes:

   ```
   Per-CPU runqueue (struct rq)
   +-- cfs_rq  fair-class tasks ordered by eligibility and deadline
   +-- rt_rq   real-time tasks (FIFO/RR)
   +-- dl_rq   SCHED_DEADLINE tasks
   ```

   Done when: the kernel version and the active fair scheduler are recorded.
2. **Measure scheduling before touching anything.** `chrt -p <pid>` reads the class, `/proc/<pid>/sched` the per-task counters, `/sys/kernel/debug/sched/debug` the runqueue state, and `perf sched record` with `perf sched latency` the delay picture. The old CFS sysctls (`kernel.sched_latency_ns`, `kernel.sched_min_granularity_ns`, `kernel.sched_wakeup_granularity_ns`) were removed in 6.12 with EEVDF; they exist only on pre-6.12 kernels. `vruntime` is virtual runtime: CPU time consumed, normalized by weight. Under EEVDF a task with positive lag is eligible and the earliest eligible virtual deadline wins. Done when: one measurement names the unfair or slow path.
3. **Read the buddy allocator from `/proc`.** Physical pages are handed out in power-of-two orders; order 0 is one page, 4 KiB on default x86-64 and arm64 configs. `/proc/buddyinfo` shows free blocks per order and zone, `/proc/zoneinfo` the per-zone counts. `ZONE_HIGHMEM` exists on 32-bit and selected configs only; on 64-bit x86-64 and arm64 essentially all RAM sits in `ZONE_NORMAL`. Done when: the fragmentation picture comes from `buddyinfo`, not from a guess.
4. **Pick the allocation API by the constraint that binds.**

   | API | Use when |
   |---|---|
   | `kmalloc(size, GFP_KERNEL)` | Physically contiguous, size bounded by `KMALLOC_MAX_SIZE` (arch dependent) |
   | `kzalloc(size, flags)` | Zeroed `kmalloc` |
   | `vmalloc(size)` | Virtually contiguous, large, may be physically fragmented |
   | `__get_free_pages(gfp, order)` | Direct page-granular allocation |

   ```c
   void *buf = kmalloc(4096, GFP_KERNEL);
   if (!buf)
       return -ENOMEM;
   kfree(buf);
   ```

   Done when: the chosen API matches the contiguity and size bound the caller actually needs.
5. **Read VFS pressure through its caches.** A path lookup walks the dentry cache, the inode carries metadata and ops, and `struct file` holds per-open state. `/proc/mounts` lists mounts, `vm.vfs_cache_pressure` sets how eagerly the dentry and inode caches are reclaimed (higher reclaims sooner), and `/proc/<pid>/fd` counts open files. Done when: cache pressure is distinguished from file-leak pressure.
6. **Judge the page cache with the writeback state.** `Cached` in meminfo is page cache and tmpfs; `Dirty` pages wait for writeback. `blockdev --getra` reads the readahead window and `--setra` changes it per device. `echo 3 > /proc/sys/vm/drop_caches` after `sync` drops caches for benchmarking only; it is destructive to performance and proves nothing in steady state. Done when: cache and dirty state are read together.
7. **Interpret `/proc/meminfo` field by field.**

   | Field | Meaning |
   |---|---|
   | `MemTotal` | Total usable RAM |
   | `MemFree` | Completely unused pages |
   | `MemAvailable` | Estimated allocatable memory including reclaimable cache |
   | `Cached` | Page cache and tmpfs |
   | `Buffers` | Block device metadata cache |
   | `SwapTotal` / `SwapFree` | Swap space |
   | `Dirty` | Pages pending writeback |
   | `AnonPages` | Anonymous heap and stack pages |
   | `Slab` | Kernel object cache |
   | `SReclaimable` / `SUnreclaim` | Slab split by reclaimability |

   ```
   MemAvailable low + Cached high -> reclaim page cache, pressure is not fatal
   AnonPages high + SwapFree low  -> OOM risk
   Slab huge                      -> kernel object leak, check /proc/slabinfo
   Dirty high                     -> writeback lag, check the I/O scheduler
   ```

   Done when: the pressure verdict comes from two or more fields read together.
8. **Explain the OOM pick, then move the pick.** The killer scores candidates from memory use, child processes, and `oom_score_adj` (-1000 to 1000). Protect a daemon by lowering its adj; cap a service with a cgroup `memory.max` instead of tuning adj upward for everyone else. Events land in `dmesg` and `journalctl -k`. Done when: the victim choice is explained and the correction is in place for the next episode.

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| `kmalloc: allocation failed` | Fragmentation or size over `KMALLOC_MAX_SIZE` | Use `vmalloc`, reduce pressure, reserve `GFP_ATOMIC` for non-sleeping paths |
| High iowait with low `MemAvailable` | Page cache thrashing | Add RAM or cut the working set, tune `vfs_cache_pressure` last |
| OOM kills the wrong process | Big user with a neutral adj | Set `oom_score_adj`, cap with `memory.max` |
| Unfair scheduling | Real-time starving the fair class | `chrt` audit, `isolcpus` to split CPUs |
| SLUB corruption | Use-after-free in a module | `KASAN`, `slub_debug=P` |
| Slow file reads | Readahead window too small | Raise readahead, check the backing device |

| Failure class | Behavior |
|---|---|
| The claim contradicts the running kernel | Trust the kernel: re-read the sysctl or counter, and restate the claim with the version attached. |
| A tunable is missing | The version removed it (EEVDF removed the CFS sysctls in 6.12); do not advise it for newer kernels. |
| Two metrics disagree | Measure again under the same load before explaining; never average across episodes. |

## Output

1. The mechanism that explains the observation.
2. The measurements that confirm it, with the kernel version attached.
3. The specific correction to apply.
