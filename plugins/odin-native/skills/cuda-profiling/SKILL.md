---
name: cuda-profiling
description: 'Use when profiling CUDA with Nsight Systems or Nsight Compute, reading roofline and occupancy metrics, or annotating phases with NVTX. Not for correctness: use cuda-debugging.'
---

# CUDA profiling

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A CUDA kernel or pipeline is slow or unexplained, and the job is timeline capture, per-kernel metrics, roofline reading, occupancy analysis, or NVTX annotation. |
| Authority | Reversible local. Writes are limited to profiler reports and logs under the project tree; rollback is deleting those files. No remote mutation. |
| Side effect | Report files (`.nsys-rep`, `.ncu-rep`, CSV), possibly elevated-privilege profiling runs, and a diagnosis. |
| Done | The bottleneck is named with a measured metric, and the recommended fix targets that measurement. |

## Inputs

1. Workload (required): the application or kernel to profile and one representative input.
2. Question (required): timeline overlap, per-kernel cost, occupancy, or memory versus compute balance.
3. GPU and toolkit (required): `nvidia-smi` and `nvcc --version`. Grounded current stable: CUDA Toolkit 13.3 Update 1.
4. Profiling permissions (required on locked-down hosts): membership checks in step 7.

## Procedure

1. Pick the tool by question. System-wide timeline across CPU, GPU, and CUDA API calls goes to Nsight Systems (`nsys`). Per-kernel counters and stall analysis goes to Nsight Compute (`ncu`). A single metric in CI goes to `ncu --metrics`. Done when: the tool matches the question.
2. Build with line info and no `-G`:

```bash
nvcc -lineinfo -O3 -arch=sm_80 -o app main.cu
```

Done when: the profiled binary carries line info for source correlation.
3. Capture the timeline first:

```bash
nsys profile --trace=cuda,nvtx,osrt --output=timeline ./app
nsys stats timeline.nsys-rep          # CLI summary
nsys-ui timeline.nsys-rep             # GUI
```

Read the timeline for gaps between launches (CPU bottleneck or sync stalls), `cudaDeviceSynchronize` waits, overlap between copies and kernels across streams, and CUDA API overhead. `--capture-range=cudaProfilerApi` limits capture to a marked region. Done when: each observed gap is attributed to a named cause.
4. Annotate phases with NVTX so timeline bands match application stages:

```cpp
#include <nvtx3/nvtx3.hpp>

nvtxRangePushA("H2D copy");
cudaMemcpyAsync(d_in, h_in, size, cudaMemcpyHostToDevice, stream);
nvtxRangePop();
```

The nvtx3 header-only form is preferred; the C API links with `-lnvToolsExt`. Done when: every phase in the timeline shows as a named band.
5. Analyze the hot kernel in Nsight Compute:

```bash
ncu -o kernel_report ./app
ncu --kernel-name regex:matmul_tiled ./app
ncu --kernel-name regex:hot_kernel --set full ./app
ncu-ui kernel_report.ncu-rep
```

Read the Speed of Light section first: it compares achieved SM and memory throughput against peak. Then read Occupancy, Memory Workload Analysis (hit rates, coalescing), and Warp State Statistics (stall reasons). Done when: the hot kernel's throughput, occupancy, and dominant stall reason are recorded.
6. Collect individual metrics for CI or quick comparison:

```bash
ncu --metrics \
  sm__throughput.avg.pct_of_peak_sustained_elapsed,\
  dram__throughput.avg.pct_of_peak_sustained_elapsed,\
  sm__warps_active.avg.pct_of_peak_sustained_active,\
  l1tex__t_sectors_pipe_lsu_mem_global_op_ld.sum,\
  smsp__sass_thread_inst_executed_op_ffma_pred_on.sum \
  ./app

ncu --csv --metrics dram__bytes_read.sum,dram__bytes_write.sum ./app > dram.csv
```

Filter with `--kernel-name` and skip warmup with `--launch-skip` when full sets cost too much. Replay mode controls counter accuracy: `--replay-mode application` replays the whole application per pass. Done when: the metric set answers the stated question and runs in acceptable time.
7. Diagnose memory-bound versus compute-bound from the measurements, not from intuition:

| Reading | Meaning | Fix direction |
|---|---|---|
| `dram__throughput` near peak, `sm__throughput` low | Memory-bound | Coalescing, shared memory tiling, fewer bytes moved |
| `sm__throughput` near peak, `dram__throughput` low | Compute-bound | Tensor cores, unrolling, more ILP |
| Both low | Launch config, occupancy, or sync overhead | Block size, grid size, barrier audit |

Roofline reading: arithmetic intensity in FLOP per byte against the machine's balance point. Approximate single-precision intensity as `smsp__sass_thread_inst_executed_op_ffma_pred_on.sum * 2 / dram__bytes.sum`; treat it as a lower bound, since it counts FMA instructions only. Done when: the kernel is classified with the two throughput numbers attached.
8. Attribute occupancy limits before tuning:

```bash
ncu --metrics sm__warps_active.avg.pct_of_peak_sustained_active,\
launch__occupancy_limit_registers,\
launch__occupancy_limit_shared_mem,\
launch__occupancy_limit_block_size ./app
```

| Limiting factor | Typical fix |
|---|---|
| Registers | `-maxrregcount`, or simplify the kernel |
| Shared memory | Smaller tile, split phases |
| Block size | Try 128 or 256 instead of 512+ |

Done when: the binding limit is named and the fix addresses it.
9. On permission errors, fix the environment before re-running. `ERR_NVGPUCTRPERM` means the driver blocks non-admin counters; the module parameter `NVreg_RestrictProfilingToAdminUsers=0` lifts it, or the run goes under sudo. Verify the intended GPU is visible through `CUDA_VISIBLE_DEVICES`. Done when: the counter access error is gone or the constraint is reported to the user.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| `ERR_NVGPUCTRPERM` | Profiling permission missing. Apply step 9 or report the needed driver setting. |
| All metrics read zero | Wrong GPU visible or profiling disabled. Check `CUDA_VISIBLE_DEVICES`; use `--target-processes all` for child processes. |
| NCU report empty | Kernel too short or never launched. Enlarge the workload; verify `cudaGetLastError()`. |
| Profiling overhead distorts behavior | Full metric sets on many kernels. Filter with `--kernel-name`, skip with `--launch-skip`. |
| Timeline shows no overlap | Single default stream. Introduce streams and async copies, then recapture. |
| Occupancy high but kernel slow | Latency is not hidden or access is uncoalesced. Cross-check with gpu-memory-model and recollect stall reasons. |

## Output

A diagnosis: the classified bottleneck, the metrics that support it, the timeline or kernel report path, and the fix ranked by expected effect. Report files stay in the project tree for comparison runs; name them per variant so before-and-after CSVs stay aligned.
