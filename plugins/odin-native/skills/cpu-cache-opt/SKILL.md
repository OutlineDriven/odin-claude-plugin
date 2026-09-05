---
name: cpu-cache-opt
description: 'Use when diagnosing cache misses with perf, fixing false sharing, choosing AoS or SoA layout, or adding software prefetch. Not for cache theory: use memory-hierarchy-and-caches.'
---

# CPU cache optimization

Cache performance is a layout property before it is a code property. Measure with hardware counters, move the data so the working set fits, and re-measure. Every change must show up in the counters, or it reverts.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The task diagnoses cache misses, detects or fixes false sharing, restructures data layout, evaluates AoS versus SoA, or decides on software prefetch. |
| Authority | Read-only. The skill runs performance tools that read the program and prints guidance; source and build changes land through the normal coding path. No remote mutation. |
| Side effect | None beyond tool output files that the profiling tools write to their own scratch locations. |
| Done | A measured before and after for the proposed layout change exists, with the cache counters quoted, or the diagnosis names the miss class and the evidence for it. |

## Inputs

- The program and a reproducible workload: required. A benchmark that runs the hot loop long enough to fill counters.
- The build: required, with symbols for attribution and without changing optimization between measurements.
- The target machine: required. Counters and latencies are properties of the specific microarchitecture.

## Procedure

1. Measure before changing anything. Take the generic counters first, then the level-specific ones. Done when: a baseline of counts and miss rates for the real workload is recorded.

```bash
perf stat -e cache-references,cache-misses,cycles,instructions ./bench
perf stat -e L1-dcache-loads,L1-dcache-load-misses,LLC-loads,LLC-load-misses ./bench
```

Interpret relatively. An L1 miss rate that is acceptable for a pointer-chasing graph walk is severe for a streaming numeric kernel; judge each rate against the same program on the same machine, before against after, and against the memory-bound share of the run.

2. Confirm false sharing before padding it. Threads writing to distinct variables that share one line invalidate each other constantly. The Intel HITM events count the modified-line hits that mark it. Done when: the counter either shows the traffic or rules the hypothesis out.

```bash
perf stat -e mem_load_l3_hit_retired.xsnp_hitm,machine_clears.memory_ordering ./bench
```

Event availability differs across vendors and generations; check `perf list` on the target machine and treat a missing event as unknown, not as zero.

3. Apply the layout fixes in order of cost, cheapest first. Done when: each applied fix has a re-measurement from step 1.

- Split hot from cold fields so the hot struct stays one line:

```c
struct record_hot { int id; int value; };            // touched every iteration
struct record_cold { char name[128]; char desc[256]; };
```

- Pad or align per-thread data to its own line:

```c
struct alignas(64) padded_counter {
    int value;
    // the padding keeps the next counter on another line
};
```

In C++17 prefer `std::hardware_destructive_interference_size` over the literal 64, and read the real line size at runtime with `sysconf(_SC_LEVEL1_DCACHE_LINESIZE)`. Sixty-four bytes is the common line on x86-64 and ARM server cores; some consumer and Apple cores use 128.

- Convert array-of-structs to struct-of-arrays when the loop touches few fields. Reading `x[i]` from an SoA stream loads only `x`, and the access vectorizes; the same loop over an AoS drags every field through every line.

4. Remove the pointer chasing that no prefetcher predicts. Linked structures miss once per node. Pool-allocate nodes, replace links with indices into an array, or sort the traversal order to match memory order. Done when: the hot loop's accesses are sequential or the chasing is provably off the critical path.

5. Add software prefetch only where the pattern defeats the hardware prefetcher, such as linked lists and irregular graphs. The hint is a hint; measure or remove it. Done when: a counter or timing improvement proves the hint earns its place.

```c
// issue the hint far enough ahead to cover latency,
// and early enough that the line is not evicted first
for (Node *n = head; n; n = n->next) {
    if (n->next) __builtin_prefetch(n->next, 0, 1);
    process(n);
}
```

`_mm_prefetch` on x86 takes a locality hint (`_MM_HINT_T0` for L1, `T1` for L2, `T2` for L3, `NTA` for non-temporal). Prefetch distance is a tunable per machine, not a constant.

6. Block the loop when the working set exceeds the cache. Choose the block size so one block of the working arrays fits the data cache, and tune the size on the target machine. Done when: the blocked version beats the naive one in step 1's counters.

```c
// process cache-sized tiles instead of whole rows
#define BLOCK 64   // tune on the target machine
for (int i = 0; i < N; i += BLOCK)
for (int k = 0; k < N; k += BLOCK)
for (int j = 0; j < N; j += BLOCK)
    for (int ii = i; ii < i + BLOCK && ii < N; ii++)
    for (int kk = k; kk < k + BLOCK && kk < N; kk++)
    for (int jj = j; jj < j + BLOCK && jj < N; jj++)
        C[ii*N+jj] += A[ii*N+kk] * B[kk*N+jj];
```

7. Verify allocation alignment when the transformation depends on it. `aligned_alloc(64, size)` and `posix_memalign` give line-aligned buffers; check struct layout with `pahole -C MyStruct ./prog`, and let `-Wpadded` report compiler-side padding. Done when: the layout the code assumes is the layout `pahole` prints.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Counters read zero | The event is unavailable or virtualization hides it. Run `perf list` on the target and pick supported events. |
| No change after a layout fix | The loop was not miss-bound. Re-profile for the real bottleneck before the next transform. |
| SoA made it slower | The loop needs whole records, so SoA splits them across lines. Keep AoS and split only the hot fields. |
| Prefetch hurt | The hint came too early and evicted useful lines, or the hardware prefetcher already covered it. Remove the hint. |
| Two threads still slow | The sharing moved. Re-run the HITM counters from step 2 on the new layout. |

## Output

A measurement report: baseline counters, each transformation applied, and the counters after it, with the winning layout named. Counter names, Cachegrind usage, and layout tooling are in `references/cache-counters.md`.
