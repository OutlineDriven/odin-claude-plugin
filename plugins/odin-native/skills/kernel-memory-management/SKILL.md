---
name: kernel-memory-management
description: 'Use when using kmalloc, vmalloc, or the page allocator, sizing kmalloc allocations, working with SLUB or the buddy allocator, or debugging memory zones and kernel OOM.'
---

# Kernel memory management

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Allocating kernel memory in a driver or subsystem: `kmalloc` versus `vmalloc`, GFP flags, the buddy allocator, SLUB caches, DMA-coherent buffers, or OOM and slab corruption debugging. |
| Authority | Read-only. Writes nothing. Chat output only. No remote mutation. |
| Side effect | Returns allocation choices and debug commands. No source files are modified. |
| Done | The allocator choice per allocation site, the GFP flag per context, and a debug path for any reported memory symptom are delivered. |

## Inputs

1. Allocation sites (required): each buffer with its size, lifetime, and the context that allocates it.
2. Hardware requirement (optional): which buffers feed a DMA device, and the device's addressing limits.
3. Failure report (optional): OOM kills, slab corruption reports, or allocation failures under load.

## Procedure

1. Pick the allocator per site from the contiguity and size facts.

   ```
   Physically contiguous needed (device DMA)?
   ├── Yes: dma_alloc_coherent() or the CMA pool
   └── No
       ├── Small buffer: kmalloc / kzalloc
       ├── Large buffer, virtual contiguity is enough: vmalloc / vzalloc
       └── Whole pages with manual layout: alloc_pages() / __free_pages()
   ```

   `kmalloc` returns physically contiguous memory from SLUB caches; above the largest cache the call falls back to the page allocator, which still yields contiguous pages up to the allocator's order limit. Check the real limits per architecture and page size in `include/linux/slab.h` (`KMALLOC_MAX_CACHE_SIZE`, `KMALLOC_MAX_SIZE`) instead of quoting a fixed byte ceiling. `vmalloc` gets virtual contiguity from scattered pages and must not back device DMA without `dma_map_*`. Done when: every site names its allocator and the reason.
2. Match the GFP flag to the context.

   | GFP flag | Context |
   |---|---|
   | `GFP_KERNEL` | Process context, may sleep |
   | `GFP_ATOMIC` | IRQ or spinlock held; draws from smaller reserves |
   | `GFP_DMA` | Legacy 32-bit devices limited to the DMA zone |

   Done when: no sleeping allocation can run in an atomic context, and atomic allocations are small and rare.
3. Inspect SLUB state when allocation behavior needs evidence.

   ```bash
   cat /proc/slabinfo           # per-cache counts; root-readable
   cat /sys/kernel/slab/kmalloc-1k/object_size
   ```

   SLUB is the only in-tree SLAB allocator since kernel 6.12 removed the legacy SLAB backend; the kernel floor here (LTS 6.18, mainline 7.2) has no SLAB. Done when: the cache sizes behind a hot allocation path are known from the running system.
4. Use the page allocator for page-granular structures.

   ```c
   struct page *page = alloc_pages(GFP_KERNEL, order);
   void *addr = page_address(page);
   __free_pages(page, order);
   ```

   An `order` of n allocates 2^n pages. Zone selection (`ZONE_DMA`, `ZONE_NORMAL`, `ZONE_MOVABLE`) lives in `include/linux/mmzone.h`. Done when: the order and the free call match the allocation.
5. Handle NUMA deliberately on multi-node systems. `kmalloc` already prefers the local node; bind hot per-node structures with `alloc_pages_node()`. In user space, control placement with `numactl` or `mbind` for HPC paths. Done when: per-node placement is stated for each latency-critical buffer.
6. Debug the reported symptom from evidence.

   ```bash
   cat /proc/meminfo
   cat /proc/slabinfo
   dmesg | grep -i oom
   ```

   For use-after-free and corruption hunts, build with `CONFIG_SLUB_DEBUG` and `CONFIG_KASAN`. Route deeper work: `virtual-memory-paging-and-tlb` for paging mechanics, `mmio-and-bit-manipulation` for register-level access around mapped buffers, `dma-baremetal` for bare-metal DMA setup. Done when: the symptom maps to one row of the failure table.

## Failure and recovery

| Symptom | Cause | Recovery |
|---|---|---|
| Large `kmalloc` fails | Above the allocator's contiguous limit | Move to `vmalloc`, or redesign around pages; check `KMALLOC_MAX_SIZE`. |
| Device reads garbage from a buffer | `vmalloc` memory handed to DMA | Allocate with `dma_alloc_coherent`, or map with `dma_map_*`. |
| OOM killer fires | Unbounded cache growth | Cap pool sizes; use a shrinker. |
| Slab corruption report | Use-after-free or double free | Enable KASAN; audit `kfree` pairing. |
| Sleep warning under load | `GFP_KERNEL` in atomic context | Switch that site to `GFP_ATOMIC` or defer the work. |

## Output

The allocator choice with reasons per site; the GFP flag per context; the SLUB inspection evidence; the page-allocation orders; the NUMA placement plan; the debug transcript for the reported symptom; the routing to related skills.
