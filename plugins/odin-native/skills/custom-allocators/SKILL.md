---
name: custom-allocators
description: 'Use when implementing pool/slab/arena allocators, tuning jemalloc/mimalloc/tcmalloc, writing a Rust GlobalAlloc, or benchmarking allocator performance and fragmentation.'
---

# Custom allocators

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Memory allocator design, tuning, or benchmarking for C, Rust, or systems workloads. |
| Authority | Read-only. No source or remote mutation. Chat output only. |
| Side effect | Emits a structured guidance report to chat. |
| Done | The report names the allocator type, shows a pool or arena implementation, lists jemalloc/mimalloc/tcmalloc tuning options, shows a Rust GlobalAlloc pattern, and gives fragmentation and benchmarking steps. |

## Inputs

1. **Target language and allocator type** (required): C pool/arena, Rust GlobalAlloc, or tuning jemalloc/mimalloc/tcmalloc.
2. **Workload pattern** (required): allocation size distribution, object lifetime, thread count, and latency or throughput goal.
3. **Observed symptom** (optional): OOM, RSS growth, fragmentation, allocator contention, or unexpected latency.

## Procedure

1. **Classify the allocator type.** Match the workload to one of the allocator types below. Done when: the type is named.

   | Type | Best for | Allocation | Free |
   |---|---|---|---|
   | Pool/fixed-size | Fixed-size objects with a known maximum count | Constant time | Constant time |
   | Slab | Size-class caching, kernel-style caches | Constant time | Constant time |
   | Arena/bump | Request-scoped or frame-scoped allocations | Fast pointer bump | Bulk reset |
   | Buddy | Power-of-two blocks, large allocations | Split and merge by power of two | Coalesce |
   | General | jemalloc, mimalloc, tcmalloc | Variable time | Variable time |

2. **Build or review a pool allocator.** Use the C example below. Align backing memory to a cache line. Track the block size, block count, and a free list. Done when: the init, alloc, and free paths are shown.

   ```c
   #include <stddef.h>
   #include <stdint.h>
   #include <stdlib.h>

   typedef struct pool_block {
       struct pool_block *next;
   } pool_block_t;

   typedef struct {
       void   *memory;
       size_t  block_size;
       size_t  num_blocks;
       pool_block_t *free_list;
   } pool_t;

   int pool_init(pool_t *p, size_t block_size, size_t num_blocks) {
       p->block_size = block_size < sizeof(pool_block_t)
           ? sizeof(pool_block_t) : block_size;
       p->num_blocks = num_blocks;
       p->memory = aligned_alloc(64, p->block_size * num_blocks);
       if (!p->memory) return -1;
       p->free_list = NULL;
       for (size_t i = 0; i < num_blocks; i++) {
           pool_block_t *blk = (pool_block_t *)((char *)p->memory
               + i * p->block_size);
           blk->next = p->free_list;
           p->free_list = blk;
       }
       return 0;
   }

   void *pool_alloc(pool_t *p) {
       if (!p->free_list) return NULL;
       pool_block_t *blk = p->free_list;
       p->free_list = blk->next;
       return blk;
   }

   void pool_free(pool_t *p, void *ptr) {
       pool_block_t *blk = (pool_block_t *)ptr;
       blk->next = p->free_list;
       p->free_list = blk;
   }
   ```

3. **Build or review an arena allocator.** Use the C example below. Align each allocation. Reset the arena after the scope ends. Done when: the arena alloc and reset paths are shown.

   ```c
   typedef struct {
       char  *base;
       size_t capacity;
       size_t offset;
   } arena_t;

   void *arena_alloc(arena_t *a, size_t size, size_t align) {
       uintptr_t cur = (uintptr_t)(a->base + a->offset);
       uintptr_t aligned = (cur + align - 1) & ~(align - 1);
       size_t padding = aligned - cur;
       if (a->offset + padding + size > a->capacity)
           return NULL;
       a->offset += padding + size;
       return (void *)aligned;
   }

   void arena_reset(arena_t *a) { a->offset = 0; }
   ```

4. **Tune jemalloc.** Preload the jemalloc shared object and set `MALLOC_CONF`. Explain size classes, tcache, and arenas. Use `mallctl` to refresh allocator statistics or enable heap profiling. Done when: the tuning commands and concepts are listed.

   ```bash
   # Debian/Ubuntu example path; the exact name may differ on other distributions
   LD_PRELOAD=/usr/lib/x86_64-linux-gnu/libjemalloc.so.2 ./myapp

   export MALLOC_CONF="background_thread:true,dirty_decay_ms:1000,muzzy_decay_ms:1000"

   # Profiling build of jemalloc: configure with --enable-prof
   export MALLOC_CONF="prof:true,prof_active:true,lg_prof_sample:19"

   # Print statistics on exit
   export MALLOC_CONF="stats_print:true"
   ```

5. **Tune mimalloc.** Preload the mimalloc shared object and set `MIMALLOC_SHOW_STATS` and `MIMALLOC_PAGE_RESET`. Explain the segment, page, and block hierarchy. Done when: the tuning options are listed.

   ```bash
   LD_PRELOAD=/usr/lib/libmimalloc.so ./myapp

   export MIMALLOC_SHOW_STATS=1
   export MIMALLOC_PAGE_RESET=1
   ```

6. **Tune tcmalloc.** Preload the tcmalloc shared object and set `TCMALLOC_SAMPLE_PARAMETER` for sampling. Explain per-thread caches and the central heap. Done when: the tuning options are listed.

   ```bash
   LD_PRELOAD=/usr/lib/x86_64-linux-gnu/libtcmalloc.so.4 ./myapp

   export TCMALLOC_SAMPLE_PARAMETER=524288
   ```

7. **Implement Rust GlobalAlloc.** Implement the `GlobalAlloc` trait, handle `Layout` correctly, and register the allocator with `#[global_allocator]`. Track allocated bytes with atomics if needed. For `no_std`, use the `alloc` crate without `System`. Done when: the trait implementation and registration are shown.

   ```rust
   use std::alloc::{GlobalAlloc, Layout, System};
   use std::sync::atomic::{AtomicUsize, Ordering};

   struct TrackingAllocator;

   static ALLOCATED: AtomicUsize = AtomicUsize::new(0);

   unsafe impl GlobalAlloc for TrackingAllocator {
       unsafe fn alloc(&self, layout: Layout) -> *mut u8 {
           let ptr = System.alloc(layout);
           if !ptr.is_null() {
               ALLOCATED.fetch_add(layout.size(), Ordering::Relaxed);
           }
           ptr
       }
       unsafe fn dealloc(&self, ptr: *mut u8, layout: Layout) {
           System.dealloc(ptr, layout);
           ALLOCATED.fetch_sub(layout.size(), Ordering::Relaxed);
       }
   }

   #[global_allocator]
   static GLOBAL: TrackingAllocator = TrackingAllocator;
   ```

8. **Measure fragmentation.** Distinguish internal fragmentation from external fragmentation. Read allocator statistics and compare RSS to allocated bytes. Done when: the metrics are listed.

   | Type | Definition | Detection |
   |---|---|---|
   | Internal | Allocated block is larger than requested | Allocator stats; size class rounding |
   | External | Free memory is not usable for a request | `mallinfo` or `malloc_info`; RSS minus heap |

9. **Benchmark the allocator.** Compare single-thread alloc and free, multi-thread contention, and a mixed size distribution. Use `perf stat` or a microbenchmark harness. Done when: the benchmark design is listed.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Pool alloc returns NULL | Increase the pool size or check for leaks. |
| jemalloc RSS does not drop | Lower `dirty_decay_ms` or call `madvise` where appropriate. |
| Arena OOM | Reset the arena between phases or chain multiple arenas. |
| Rust allocator undefined behavior | Store the size and alignment with each allocation and pass the same `Layout` to `dealloc`. |
| Worse performance with mimalloc | Benchmark the workload against jemalloc and select the better fit. |
| High external fragmentation | Segregate allocations by lifetime or use pools for long-lived mixed sizes. |

## Output

1. The chosen allocator type and the matching workload pattern.
2. A pool or arena implementation, or tuning commands for jemalloc/mimalloc/tcmalloc.
3. A Rust `GlobalAlloc` example when Rust is the target.
4. Fragmentation metrics and a benchmark plan.
