---
name: apple-silicon
description: 'Use when tuning or profiling native code on Apple M-series Macs: unified memory, 16 KiB pages, Accelerate and Metal for matrix work, xctrace and leaks, Rosetta 2, or sysctl hardware queries.'
---

# Apple Silicon

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Code runs on an M-series Mac and needs to be checked for page-size assumptions, moved onto Accelerate or Metal for matrix work, profiled with Instruments or the command-line memory tools, or diagnosed for Rosetta 2 translation. |
| Authority | Read-only: reads the host through `sysctl`, `arch`, `lipo`, `file`, `xctrace`, `vmmap`, `heap`, `leaks`, and `sample`, and writes traces only under the output path the user names; rollback is deleting those trace files. No remote mutation. |
| Side effect | Trace and sample files in the named output directory. Profiling attaches to the target process. |
| Done | The report names the chip and its features from `sysctl`, states whether the binary runs native or translated, lists every page-size assumption found in the code with its fix, and points each hotspot at the Accelerate, Metal, or threading change that addresses it. |

## Inputs

- The binary or source under review, and how it is launched.
- Whether the workload is matrix or convolution heavy (Accelerate and Metal candidates) or general CPU work.
- Output directory for traces.
- Xcode command-line tools installed (`xcode-select -p` prints the path).

## Procedure

1. Read the hardware. All CPU cores, the GPU, and the Neural Engine share one DRAM pool, so a Metal buffer in shared storage mode needs no copy to reach the GPU, and one process's memory total includes its GPU allocations. Done when: chip name, core counts, memory size, cache line, and page size are recorded.

   ```bash
   sysctl -n machdep.cpu.brand_string
   sysctl hw.physicalcpu hw.logicalcpu hw.memsize
   sysctl hw.cachelinesize
   sysctl hw.pagesize            # 16384 on Apple Silicon macOS
   sysctl hw.optional.arm        # FEAT_* flags; grep for the one in question
   ```

   M4 exposes `hw.optional.arm.FEAT_SME`; no M-series chip through M4 exposes non-streaming SVE, so SVE intrinsics outside streaming mode raise `SIGILL` there (see `arm-sve`).

2. Find 16 KiB page assumptions. Anything that hard-codes 4096 for `mmap` offsets, guard pages, or allocator arenas breaks or wastes memory. Done when: every page-size constant in the code reads `sysconf(_SC_PAGESIZE)` or `getpagesize()` instead.

   ```c
   size_t page = sysconf(_SC_PAGESIZE);   /* 16384 here, 4096 on x86 CI */
   void *buf = aligned_alloc(page, size);
   mmap(NULL, size, PROT_READ | PROT_WRITE, MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
   ```

   An `mmap` `offset` that is not a multiple of the page size fails with `EINVAL`; a test suite that only ran on 4 KiB Linux hosts will not have caught it.

3. Route matrix work through Accelerate. The AMX coprocessor has no public instruction-level documentation; Accelerate (BLAS, LAPACK, vDSP, BNNS) is the supported way onto it. Done when: the hot GEMM calls `cblas_sgemm` or the vDSP equivalent and the leading dimensions match the storage order.

   ```c
   #include <Accelerate/Accelerate.h>

   void matmul(const float *A, const float *B, float *C, int M, int N, int K) {
       cblas_sgemm(CblasRowMajor, CblasNoTrans, CblasNoTrans,
                   M, N, K, 1.0f, A, K, B, N, 0.0f, C, N);
   }
   ```

   ```bash
   clang -O2 -framework Accelerate -o gemm gemm.c
   ```

4. Move large GPU-friendly kernels to Metal Performance Shaders. Allocate buffers with `MTLResourceStorageModeShared` so the CPU and GPU read the same memory. Done when: the MPS kernel runs on a real device (the simulator has no Metal GPU) and its result matches the CPU reference.

   ```objc
   #import <Metal/Metal.h>
   #import <MetalPerformanceShaders/MetalPerformanceShaders.h>

   id<MTLDevice> device = MTLCreateSystemDefaultDevice();
   id<MTLCommandQueue> queue = [device newCommandQueue];
   MPSMatrixMultiplication *gemm = [[MPSMatrixMultiplication alloc]
       initWithDevice:device transposeLeft:NO transposeRight:NO
       resultRows:M resultColumns:N interiorColumns:K alpha:1.0 beta:0.0];
   ```

5. Profile with Instruments from the command line. `xctrace` records a template into a `.trace` bundle that Instruments opens; `--toc` lists what a trace holds. Done when: a Time Profiler trace and an Allocations trace exist for the workload.

   ```bash
   xctrace record --template 'Time Profiler' --output app.trace --launch -- ./app
   xctrace record --template 'Allocations'   --output alloc.trace --launch -- ./app
   xctrace record --template 'Leaks'         --output leaks.trace --launch -- ./app
   xctrace export --input app.trace --toc
   ```

   | Template | Answers |
   |---|---|
   | Time Profiler | Where CPU time goes, and on which core type |
   | Allocations | Heap growth and the call trees that allocate |
   | Leaks | Blocks with no remaining reference |
   | System Trace | Thread scheduling and system calls |

   In Xcode the same templates are under Product, then Profile.

6. Inspect a running process without Instruments. Done when: the leak or growth is attributed to a call stack.

   ```bash
   vmmap <pid>                    # regions and their sizes
   heap <pid>                     # heap objects by class and size
   leaks <pid>                    # unreferenced blocks with backtraces
   sample <pid> 5 -file sample.txt   # 5 seconds of stack samples
   ```

7. Check for Rosetta 2. A translated x86_64 process reports `sysctl.proc_translated` as 1. Done when: the binary is known to be arm64, universal, or x86_64-only, and an x86_64-only hot path has a plan to ship arm64.

   ```bash
   sysctl -n sysctl.proc_translated   # 1 inside a translated process
   lipo -info app                     # architectures in the binary
   file app
   arch -arm64  ./app                 # force a slice of a universal binary
   arch -x86_64 ./app
   ```

8. Build for the chip. `-mcpu=apple-m1` through `-mcpu=apple-m4` are accepted by the installed clang; pick the oldest chip the binary must run on. Heavy threads request a performance-core class through `pthread_set_qos_class_self_np(QOS_CLASS_USER_INITIATED, 0)`; the scheduler, not the program, decides the core. Done when: the release build passes `-arch arm64` and a `-mcpu` no newer than the deployment floor.

   ```bash
   clang -arch arm64 -O3 -mcpu=apple-m1 -o app app.c
   ```

## Failure and recovery

| Symptom | Cause | Fix |
|---|---|---|
| `mmap` fails with `EINVAL` | Offset or length assumes 4 KiB pages | Round with `sysconf(_SC_PAGESIZE)`. |
| Slow binary, `proc_translated` is 1 | Running under Rosetta 2 | Build arm64 or universal. |
| `MTLCreateSystemDefaultDevice` returns nil | Simulator, or no GPU access in the sandbox | Run on the device; check the entitlement. |
| Wrong results from `cblas_sgemm` | Row or column major mismatch | Match `CblasRowMajor` and the leading dimensions to the storage. |
| Empty `xctrace` recording | Target not signed for debugging, or launched outside the developer tools | Sign with `get-task-allow`, or record from Xcode. |
| `sysctl: unknown oid` | Key differs by chip or macOS | List with `sysctl hw.optional.arm` and pick the key that exists. |

## Output

A report to chat naming the chip and feature flags, the native or translated status of each binary, every page-size assumption with its fix, the profiler templates recorded and where the trace files are, and the Accelerate, Metal, or threading change proposed for each hotspot.
