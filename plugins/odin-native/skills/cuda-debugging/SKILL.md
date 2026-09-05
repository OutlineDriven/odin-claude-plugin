---
name: cuda-debugging
description: 'Use when debugging CUDA with cuda-gdb or Compute Sanitizer, reading GPU core dumps, using device printf, or triaging error codes 700, 701, 702, and 719. Not for performance: use cuda-profiling.'
---

# CUDA debugging

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A CUDA program crashes, hangs, or returns wrong values, and the job is interactive GPU thread inspection, automated memory and race checks, core dump analysis, device printf, or runtime error triage. |
| Authority | Reversible local. Writes are limited to debug builds, sanitizer logs, and core dumps in the project tree or `/tmp`; rollback is deleting those files and rebuilds. No remote mutation. |
| Side effect | Rebuilt binaries, sanitizer reports, core dump files, and a triage verdict. |
| Done | The defect class is named with evidence: a sanitizer report, a thread-level observation, or an error-code diagnosis, and the fix location is identified. |

## Inputs

1. Symptom (required): crash, wrong values, hang, or timeout, and when it appears.
2. Kernel source (required): the `.cu` files under suspicion.
3. Toolkit (required): `nvcc --version` and `compute-sanitizer --version`. Grounded current stable: CUDA Toolkit 13.3 Update 1.
4. Target GPU and any MIG layout (optional): `nvidia-smi -L`.

## Procedure

1. Build for the tool. Source-level stepping in cuda-gdb needs `nvcc -G -g -O0`. Sanitizers accept optimized builds and report clearer lines with `-lineinfo -g -O2`:

```bash
nvcc -G -g -O0 -arch=sm_80 -o app_debug main.cu
nvcc -lineinfo -g -O2 -arch=sm_80 -o app_san main.cu
```

Done when: both binaries exist and `-G` is absent from the sanitizer build.

2. Run the Compute Sanitizer tools in order of suspicion. Each tool slows execution sharply; run one at a time:

```bash
compute-sanitizer --tool memcheck ./app_san    # out-of-bounds, misaligned, leaks
compute-sanitizer --tool racecheck ./app_san   # shared and global memory races
compute-sanitizer --tool initcheck ./app_san   # uninitialized reads
compute-sanitizer --tool synccheck ./app_san   # missing or misaligned __syncthreads
compute-sanitizer --tool memcheck --log-file san.log ./app_san
```

A typical memcheck hit names the kernel, line, thread, and address:

```
======== Invalid __global__ write of size 4
========     at 0x1a0 in vector_add(vector_add.cu:12)
========     by thread (0,0,0) in block (0,0,0)
======== Address 0x7f... is out of bounds
```

Done when: the failing tool's report is captured or all four tools pass.

3. Step through the kernel in cuda-gdb when static reports are not enough:

```bash
cuda-gdb ./app_debug
```

```gdb
(cuda-gdb) break vector_add
(cuda-gdb) run
(cuda-gdb) info cuda kernels
(cuda-gdb) cuda kernel 0
(cuda-gdb) cuda thread (0,0,0)   # block (x,y,z), thread (x,y,z)
(cuda-gdb) print data[i]
(cuda-gdb) next                  # standard step commands work in kernels
(cuda-gdb) info cuda threads
```

Done when: the suspect thread's state at the fault is inspected.

4. Use device `printf` for cheap tracing inside kernels. Cap the output to a few threads, and flush with `cudaDeviceSynchronize()` before reading. The printf buffer is finite; `set cuda printf_buffer_size` in cuda-gdb raises it when needed:

```c
if (i < n && i < 5)
    printf("thread %d: data[%d] = %f\n", i, i, data[i]);
```

Done when: printed values confirm or refute the hypothesis.

5. Check every launch and sync for errors before diagnosing deeper:

```c
kernel<<<grid, block>>>(args);
cudaError_t err = cudaGetLastError();
if (err != cudaSuccess)
    fprintf(stderr, "launch: %s\n", cudaGetErrorString(err));
cudaDeviceSynchronize();
err = cudaGetLastError();
if (err != cudaSuccess)
    fprintf(stderr, "exec: %s\n", cudaGetErrorString(err));
```

Triage the returned code:

| Code | Name | Common cause |
|---|---|---|
| 700 | `cudaErrorIllegalAddress` | Out-of-bounds access, stale pointer, use-after-free |
| 701 | `cudaErrorLaunchOutOfResources` | Too much shared memory or registers per block |
| 702 | `cudaErrorLaunchTimeout` | Infinite loop or watchdog limit (Windows TDR) |
| 719 | `cudaErrorLaunchFailure` | Device-side assert or stack overflow |

Done when: the code is mapped to a cause and the corresponding tool from step 2 confirms it.

6. Capture a core dump when the crash cannot be reproduced under a debugger. Export the two variables, run until the fault, then load the dump:

```bash
export CUDA_ENABLE_COREDUMP_ON_EXCEPTION=1
export CUDA_COREDUMP_FILE=/tmp/cuda_coredump_%h.%p
./app_san
cuda-gdb ./app_san /tmp/cuda_coredump_hostname.pid
```

Done when: `bt` and `info cuda kernels` on the dump show the faulting wave.

7. Follow the decision path. Consistent wrong values point to a logic bug; use printf or cuda-gdb. Size-dependent or intermittent failures point to out-of-bounds or races; run memcheck and racecheck. A hang points to an infinite loop or a barrier mismatch; run synccheck and audit every `__syncthreads` path. A program that works under `-G` and fails optimized points to uninitialized memory or a race; run initcheck and racecheck on the release build. An async error that appears late needs a `cudaDeviceSynchronize()` right after the suspect launch. Done when: the observed failure class matches exactly one branch and its evidence exists.
8. For multi-GPU or MIG hosts, isolate the device under test with `CUDA_VISIBLE_DEVICES=0` (a MIG UUID for MIG instances) and confirm the visible set with `nvidia-smi -L`. Done when: the sanitizer or debugger runs against one named device.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| cuda-gdb cannot break in the kernel | The binary lacks `-G`. Rebuild with `nvcc -G -g -O0`. |
| Sanitizer passes but the crash persists | The error surfaces late. Add `cudaDeviceSynchronize()` after each launch and re-run. |
| printf prints nothing | The buffer is full or never flushed. Limit prints, raise `printf_buffer_size`, and sync. |
| racecheck flags atomics | Non-atomic read-modify-write. Route the update through `atomicAdd` or `atomicCAS`. |
| Debugger attach fails | The process has no CUDA context yet. Break after the first `cudaMalloc`. |
| Tool slowdown blocks completion | Narrow the input size or filter with `CUDA_VISIBLE_DEVICES`; keep the full run for the smallest reproducer. |

## Output

A triage verdict: the failure class, the tool and evidence that named it (report excerpt, thread state, or error code), the defect location, and the recommended fix. Sanitizer logs and dumps stay in the project tree or `/tmp` for the caller to delete.
