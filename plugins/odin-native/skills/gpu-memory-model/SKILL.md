---
name: gpu-memory-model
description: 'Use when analyzing warp divergence, memory coalescing, shared memory bank conflicts, cache behavior, atomics, or occupancy tradeoffs on NVIDIA and AMD GPUs. Not for tool commands: use cuda-profiling.'
---

# GPU memory model

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Kernel behavior needs explaining or predicting through the SIMT execution model and the memory hierarchy: divergence costs, coalescing rules, bank conflicts, cache levels, atomic contention, or occupancy versus latency hiding. |
| Authority | Read-only. The skill emits explanations and code patterns; it writes no files. Nothing to roll back. No remote mutation. |
| Side effect | Explanations, access-pattern rewrites, and metric names to confirm each hypothesis. |
| Done | The observed behavior is derived from the model, and a profiler metric that can confirm or refute it is named. |

## Inputs

1. Kernel or pattern (required): the code whose behavior needs explaining.
2. Vendor and architecture family (required): NVIDIA (warp) or AMD (wavefront), CDNA or RDNA for AMD.
3. Symptoms (optional): profiler readings that motivated the question.

## Procedure

1. Ground the execution model. One instruction stream drives a warp or wavefront; each thread keeps its own registers and ID. The SM or CU holds the schedulers, the register file, shared memory or LDS, and usually the L1; L2 is device-wide. Done when: the question is located at one level of that hierarchy.
2. Size the scheduling unit per vendor:

| Vendor | Unit | Notes |
|---|---|---|
| NVIDIA | 32 threads (warp) | All current parts |
| AMD CDNA (MI series) | 64 threads (wavefront) | Fixed width |
| AMD RDNA (consumer) | 32 or 64 threads | Compiler picks per kernel |

Consequences: reduction trees halve 16, 8, 4, 2, 1 on NVIDIA and 32, 16, 8, 4, 2, 1 on 64-lane AMD; block sizes should be multiples of the unit; occupancy counters report active units per SM. Done when: reductions and block sizes match the recorded unit.
3. Price divergence. When lanes take different branches, the hardware serializes the paths, so cost follows the sum of the taken paths, not the maximum:

```c
// Divergent: the two halves issue one after the other
if (threadIdx.x % 2 == 0) { result = expensive_a(d[i]); }
else                      { result = expensive_b(d[i]); }
```

Mitigations, in order of preference: branch on data uniform within a warp; predicate both sides and select with `?:` when the sides are cheap; split into separate kernels when the paths are heavy; regroup work so outcomes land in shared bins instead of per-thread branches. Done when: every hot divergent branch has a mitigation or a measured justification.
4. Check coalescing. Consecutive threads reading consecutive 4-byte words collapse into one wide transaction (a 128-byte sector run on NVIDIA); stride or misalignment multiplies transactions:

```c
int idx = blockIdx.x * blockDim.x + threadIdx.x;
float good = data[idx];                 // coalesced
float bad  = data[threadIdx.x * stride]; // strided
```

Array-of-structs reads of one field stride across the struct size; struct-of-arrays restores contiguity:

```c
struct Particle { float x, y, z; };
float aos_bad = particles[i].x;  // stride 3
float soa_good = pos_x[i];       // stride 1
```

Done when: every hot global access is contiguous across the warp, or the stride is deliberate.
5. Check shared memory bank conflicts. Shared memory and AMD LDS are organized in 32 banks of 4 bytes. Simultaneous accesses to different words in one bank serialize; a broadcast of one address to all lanes does not:

```c
__shared__ float tile[32][32];
float conflict = tile[threadIdx.x][0]; // column 0 maps many lanes to one bank

__shared__ float padded[32][33];       // +1 column breaks the bank alignment
float ok = padded[threadIdx.x][0];
```

Confirm with Nsight Compute shared-load conflict metrics such as `l1tex__data_bank_conflicts_pipe_lsu_mem_shared_op_ld.sum`. Done when: hot shared reads are conflict-free or the conflict count is measured and accepted.
6. Read cache behavior by level: L1 is per SM and often shares capacity with shared memory; L2 is device-wide with 128-byte lines; the read-only path serves uniform lookups through the texture pipeline. Patterns that help: consecutive threads on consecutive addresses; reuse tiles in shared memory before re-fetching; avoid pointer chasing and heavy scatter, which defeat both caches. Done when: the data reuse plan survives one pass through shared memory.
7. Keep atomics off the critical path. `atomicAdd`, `atomicCAS`, and `atomicExch` serialize updates to the same address across the device; ordering beyond that serialization comes from fences and scope:

```c
__threadfence_block();   // visible within the block
__threadfence();         // visible across the device
__threadfence_system();  // visible to the host; expensive
```

Reduce hierarchically: warp reduction, block reduction into shared memory, then one atomic per block:

```c
if (threadIdx.x == 0)
    atomicAdd(&global_sum, block_sum);
```

Done when: contended atomics are reduced to one per block or the contention is measured and justified.
8. Balance occupancy against latency hiding. High occupancy gives the scheduler more warps to hide memory latency and costs register and shared memory headroom per block. Low occupancy with high instruction-level parallelism can still saturate a compute-bound kernel. Decide from measurement, not a fixed occupancy target: run the kernel, then read `sm__warps_active.avg.pct_of_peak_sustained_active` plus the stall reasons in Nsight Compute, and treat low achieved occupancy as a problem only when stalls show memory latency not being hidden. Done when: the occupancy choice is tied to measured stalls.
9. Derive the answer and its confirming metric:

| Symptom | Likely cause | Confirm with |
|---|---|---|
| Low DRAM throughput | Uncoalesced access | Memory workload analysis |
| Shared load stalls | Bank conflicts | Shared conflict counters |
| Barrier stalls | Missing `__syncthreads` or divergence at the barrier | synccheck |
| Atomic bottleneck | Global contention | Warp stall sampling |
| Low occupancy | Register or shared memory pressure | `launch__occupancy_limit_*` |

Done when: the explanation and its metric are both stated.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Symptom fits two causes | Name both, rank by the metric evidence, and name the measurement that separates them. Do not pick silently. |
| Vendor behavior unknown | State the model for the recorded vendor and unit width; do not transfer an NVIDIA rule to AMD without noting the unit difference. |
| Model and measurement disagree | Trust the measurement; revise the explanation and say which assumption failed. |

## Output

An explanation tied to the model: the execution or memory rule, the rewritten pattern where one applies, and the profiler metric that confirms it. Every claim names its vendor and unit width.
