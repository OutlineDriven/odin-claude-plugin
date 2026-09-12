---
name: virtual-memory-paging-and-tlb
description: 'Use when explaining page faults, multi-level page tables, TLB misses, huge pages, or mmap and brk behavior. Not for the kernel page allocator: use kernel-memory-management.'
---

# Virtual memory, paging, and TLB

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A segfault or guard page needs explaining, `mmap` or `brk` behavior is in question, a sparse workload is TLB-bound, or a Cortex-M MPU needs contrasting with a full MMU. |
| Authority | Read-only. The skill reads `/proc` and `/sys` files and `pmap` output and answers in chat. Nothing on disk changes, so there is nothing to roll back. No remote mutation. |
| Side effect | Chat output only. |
| Done | The translation path, the fault class, and the page size in play are named, with the `/proc` evidence quoted where a process exists. |

## Inputs

- Symptom or question (required): a fault, a slow mapping, or a concept.
- Process or binary (optional): needed to quote its mappings and fault counts.
- Architecture (optional): x86-64 Linux is the default model; RISC-V and Cortex-M change the answer.

## Procedure

1. Trace one access. The core looks the virtual address up in the TLB. On a hit it has the physical address. On a miss it walks the page tables; a valid entry fills the TLB, an invalid one raises a page fault that the kernel handles. Done when: the user can place a given cost (TLB hit, walk, fault) on this path.
2. Name the page table shape. On x86-64 with four-level paging, `CR3` points at the PML4, which points at a PDPT, then a PD, then a PT, then the frame. Linux on x86-64 uses 4 KiB pages by default and can back a region with 2 MiB or 1 GiB huge pages. Done when: the level count and page sizes for the target are stated.
3. Classify the fault. Done when: the fault has a class and the counter that shows it is quoted.

| Fault | Cause |
|---|---|
| Major | A file-backed page is not in memory and needs a disk read |
| Minor | Zero-fill of a fresh anonymous page, or a copy-on-write break after `fork` |
| Protection | A write to a read-only mapping, an execute of a non-executable page, or a user access to a kernel address |

```bash
grep pgfault /proc/vmstat          # system-wide minor plus major faults
perf stat -e page-faults,minor-faults,major-faults ./app
```

4. Diagnose TLB pressure. A large sparse address space with random pointer chasing misses the TLB on most accesses and pays a page walk each time. Done when: the working set is compared to what the TLB covers at the current page size, and one mitigation is chosen.
   - Back the hot region with huge pages: `mmap` with `MAP_HUGETLB`, or `madvise(MADV_HUGEPAGE)` on a region when `/sys/kernel/mm/transparent_hugepage/enabled` is `always` or `madvise`.
   - Shrink the working set or improve locality so fewer pages are live.
   - On a multi-socket host, bind memory with `numactl --membind` so the walk hits local memory; use `numa-programming`.

```bash
perf stat -e dTLB-load-misses,iTLB-load-misses ./app
```

5. Inspect the mappings of a live process. Done when: the faulting address is placed inside or outside a mapping.

```bash
cat /proc/self/maps
pmap -x <pid>
```

6. Contrast the embedded case when asked. Many Cortex-M parts have a memory protection unit with a fixed number of regions and no translation: addresses are physical, there is no TLB, and the linker script decides where things live. Application processors add an MMU and an OS to manage it. For RISC-V Sv39 and Sv48 page tables, use `os-dev-scratch` and the kernel skills. Done when: the user knows whether the target translates at all.

For the cache behind translation, use `memory-hierarchy-and-caches`. For the kernel side of the fault handler and the allocator, use `kernel-memory-management`.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Segfault at an address | Check `/proc/<pid>/maps`. An address outside every mapping is a stray pointer; one inside a mapping with the wrong permission is a protection fault. |
| Slow `mmap` workload | TLB thrashing. Try huge pages on the hot region and re-measure `dTLB-load-misses`. |
| Fault spike after `fork` | Copy-on-write breaks as the child writes shared pages. This is expected; `MAP_POPULATE` prefaults a mapping when the cost must move to setup. |
| Write-xor-execute fault in a JIT | Keep a writable mapping and an executable mapping separate, or flip permissions with `mprotect` between write and run. |
| Wrong physical address on a microcontroller | There is no MMU. Use the addresses the linker script assigns. |
| `perf stat` denied | Report the `perf_event_paranoid` value the tool prints. Do not change the sysctl. |

## Output

A chat answer that traces the access path, names the fault class and page size, quotes the mapping or counter evidence where a process exists, and states one mitigation with the condition under which it helps.
