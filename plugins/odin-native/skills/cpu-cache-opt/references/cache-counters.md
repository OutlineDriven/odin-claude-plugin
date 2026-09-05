# Cache performance counters reference

## perf stat cache events

Generic, portable across CPUs:

| Event | Meaning |
|-------|---------|
| `cache-references` | Last-level cache accesses |
| `cache-misses` | Last-level cache misses |

x86 Intel PMU events for a level breakdown:

```bash
perf stat -e \
    L1-dcache-loads,L1-dcache-load-misses, \
    L2-dcache-loads,L2-dcache-load-misses, \
    LLC-loads,LLC-load-misses ./prog
```

Retired-load events on Intel:

```bash
perf stat -e \
    mem_load_retired.l1_miss, \
    mem_load_retired.l2_miss, \
    mem_load_retired.l3_miss, \
    mem_inst_retired.all_loads ./prog
```

Event names differ by vendor and generation. Run `perf list` on the target machine and confirm each name before scripting it; a name the PMU lacks reports zero or errors, never a warning.

## False sharing detection

HITM events count cache lines that were modified elsewhere and hit in a shared state, which is the signature of two cores fighting over one line:

```bash
perf stat -e \
    mem_load_l3_hit_retired.xsnp_hitm, \
    mem_load_l3_miss_retired.remote_hitm, \
    machine_clears.memory_ordering ./prog
```

## Interpreting rates

Compute miss rates from the counters of one run and compare them against the same program, same machine, different layout. There is no universal healthy threshold: a pointer-chasing workload tolerates rates that would sink a streaming kernel, and hardware prefetchers change the meaning of a raw count. Report rates as before and after pairs.

## Cachegrind, the simulator

```bash
valgrind --tool=cachegrind --cache-sim=yes \
         --I1=32768,8,64 --D1=32768,8,64 --LL=6291456,12,64 ./prog
cg_annotate cachegrind.out.* --auto=yes
cg_diff cachegrind.out.before cachegrind.out.after
```

Cachegrind models a fixed cache geometry, so use it for relative comparisons between layouts, not for absolute rates.

## Struct layout analysis

```bash
pahole -C MyStruct ./myapp
gcc -g -O0 -Wpadded -c hot.c
```

`pahole` output:

```text
struct MyStruct {
    int      x;     /*     0     4 */
    /* XXX 4 bytes hole, try to pack */
    double   y;     /*     8     8 */
    int      z;     /*    16     4 */
    /* size: 24, cachelines: 1 */
};
```

## Aligned allocation

```c
#include <stdlib.h>

void *buf = aligned_alloc(64, 1024 * sizeof(float));   // C11

void *buf2;
posix_memalign(&buf2, 64, 1024 * sizeof(float));       // POSIX
```

```cpp
alignas(64) float buf[1024];   // stack
```

## Hardware prefetcher behavior

The prefetcher detects sequential streams and constant strides. It cannot follow pointer chasing or computed indices. Manual prefetch earns its keep where the address is known early but the pattern is irregular, as in linked lists and sparse graphs:

```c
Node *n = head;
while (n) {
    if (n->next) __builtin_prefetch(n->next, 0, 1);
    process(n);
    n = n->next;
}
```

Prefetch distance is a per-machine tunable: too early and the line is evicted before use, too late and the latency is not hidden. Measure with the counters above and keep only what wins.
