---
name: memory-hierarchy-and-caches
description: 'Use when explaining cache levels, associativity, cache lines, false sharing, prefetching, or MESI coherence. Not for measuring and fixing cache misses in a program: use cpu-cache-opt.'
---

# Memory hierarchy and caches

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Padding fixed a scaling problem and needs explaining, a struct layout for multicore needs choosing, a cache miss counter needs interpreting, or a DMA buffer disagrees with the CPU cache on an embedded SoC. |
| Authority | Read-only. The skill reads `getconf`, `lscpu`, and `perf stat` output and answers in chat. Nothing on disk changes, so there is nothing to roll back. No remote mutation. |
| Side effect | Chat output only. |
| Done | The answer names the level and the miss class involved, quotes the host's line size and cache sizes from the tools, and states the layout or access change with its condition. |

## Inputs

- Code or data layout (required): the struct, array, or access pattern in question.
- Target machine (optional): needed for real sizes and counters. Cache geometry is a property of the part.
- Thread model (optional): which threads write which fields.

## Procedure

1. Read the geometry from the machine rather than from memory. Done when: line size and per-level sizes for the target are recorded.

```bash
getconf -a | grep -i CACHE     # line sizes, sizes, associativity
lscpu | grep -i cache
```

Line size is 64 bytes on current x86-64 and most AArch64 parts, and the tools above confirm it. Per-core L1 and L2 sizes and the shared last-level size vary by part; quote the numbers the tool prints. A microcontroller may have only tightly coupled memory and no L2 or L3 at all.

2. Explain the level and the miss class. A line maps to one set and competes within that set's ways; many addresses aliasing to one set cause conflict misses even when the cache is mostly empty. A working set larger than a level causes capacity misses at that level. Done when: the miss the user sees has a class.
3. Diagnose false sharing when a multithreaded counter stops scaling. Two variables written by different cores on one 64-byte line bounce that line between cores through the coherence protocol. Done when: the fields on the shared line are identified and separated.

```c
/* Two counters share one line; two cores fight over it. */
struct {
    atomic_int counter_a;
    atomic_int counter_b;
} stats;

/* Each counter owns a line. */
struct {
    alignas(64) atomic_int counter_a;
    alignas(64) atomic_int counter_b;
} stats;
```

4. Explain coherence with MESI: a line is Modified, Exclusive, Shared, or Invalid in each core's cache. A write invalidates every other core's copy, which is why a lock or atomic on a hot line costs a round trip per contended write. Done when: the user can say which state transition the contention pays for.
5. Judge prefetching. Hardware stride prefetchers follow sequential and constant-stride access; pointer chasing defeats them. A software prefetch such as `__builtin_prefetch(&data[i + 8], 0, 3)` helps only when the address is known several iterations ahead and the access would otherwise miss. Done when: the prefetch is kept with a measured gain or removed.
6. Measure. Done when: baseline and post-change counters are recorded for the real workload, or the answer is marked unmeasured.

```bash
perf stat -e cache-references,cache-misses,L1-dcache-load-misses ./app
```

For the layout work itself (AoS versus SoA, blocking, measured prefetch) use `cpu-cache-opt`. For the load-use stall this produces, use `cpu-pipelines-and-hazards`. For the translation miss that precedes the cache, use `virtual-memory-paging-and-tlb`. For remote-node latency, use `numa-programming`.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| No target machine | Deliver the mechanism and mark every size as to be read from the target. Do not quote recalled sizes as fact. |
| `perf stat` denied | Report the `perf_event_paranoid` value the tool prints. Do not change the sysctl. |
| Scaling collapses with threads | False sharing. Align per-thread data to the line size and re-measure. |
| High last-level misses | Working set exceeds the shared cache. Block the algorithm or pin to one NUMA node. |
| Device sees stale data | The CPU cache and the DMA engine disagree. On Linux use the `dma_sync_*` API around each transfer; on a microcontroller clean or invalidate the buffer's lines explicitly. |
| Manual prefetch slowed the loop | The access was already covered by the hardware prefetcher or the address was not known early enough. Remove it. |

## Output

A chat answer that quotes the target's line size and cache sizes, names the level and miss class, and gives one layout or access change with the counter that will confirm it.
