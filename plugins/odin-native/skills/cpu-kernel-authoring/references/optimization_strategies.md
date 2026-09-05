# Optimization strategies (CPU)

## Optimization levels

Work the levels in order. The speedup column records what existing kernels in the Hugging Face kernels tree reached at each level against the PyTorch baseline; a new kernel on different shapes or hardware will land elsewhere.

| Level | Focus | Speedup seen in existing kernels |
|---|---|---|
| L1 baseline AVX512 | Correct vectorization, unaligned loads, OpenMP threading | 1.5x to 3x |
| L2 memory | Prefetch (L1, L2), cache blocking, streaming stores | 2x to 4x |
| L3 compute | FMA use, loop unrolling, brgemm for GEMM | 3x to 6x |
| L4 expert | 2D thread decomposition, tinygemm micro-kernel, VNNI packing | 5x to 10x and above |

## Decision tree

| Observation after a level | Next action |
|---|---|
| Speedup under 2x after L1 | Apply L2. Confirm the memory bound with `cpu_profiler.py` miss rates before adding prefetch. |
| Speedup 2x to 3x after L2 | Check L3: inspect the disassembly for FMA instructions. |
| Speedup 3x to 5x | Enough for most workloads. Apply L4 only to a GEMM kernel on the critical path. |
| Speedup above `early_stop_speedup` | Stop. |

## Element-wise kernels (RMSNorm, activations)

1. Use `_mm512_loadu_ps` and `_mm512_storeu_ps` for every memory access.
2. Handle tail elements with a scalar loop or masked operations.
3. Use `_mm512_fmadd_ps` for multiply-add.
4. Thread over rows with `#pragma omp parallel for schedule(static)`.
5. Prefetch the next row with `_mm_prefetch(ptr, _MM_HINT_T1)`.
6. Wrap intrinsics in vector types (`FP32Vec16`, `BF16Vec32`) for readability.
7. Use grain size 1024 for `at::parallel_for`.

## GEMM kernels (quantized GEMM, MoE)

1. Implement the dual path: tinygemm for M at or below 4, brgemm above.
2. Use the `Unroll<N>` template for compile-time loop unrolling.
3. Use `_mm512_dpbf16_ps` for bf16 dot-product accumulation in tinygemm.
4. Use `at::native::cpublas::brgemm()` for large-M GEMM.
5. Pack brgemm inputs in VNNI layout: interleave bf16 pairs for AMX.
6. Decompose threads in 2D with `parallel_2d(m, n, fn)`.
7. Unroll the K loop by 4 (`#pragma GCC unroll 4`).
8. Budget 1 MB of L2 (half of a 2 MB L2) for N-blocking.

## Attention kernels (Flash-Attention)

1. Tile attention with BLOCK_M=256 and BLOCK_N=768.
2. Use brgemm for the Q K^T and softmax(S) V matmul blocks.
3. Use online softmax with a running max and sum.
4. Thread over batch, heads, and M tiles.
5. Requires AVX512 and AMX (through brgemm).

## Constraints

- Use `_mm512_loadu_*`; never `_mm512_load_*`. PyTorch does not guarantee 64-byte alignment of a tensor's data pointer.
- Do not mix AVX2 and AVX512 intrinsics in one translation unit.
- Do not call AMX instructions directly; use the brgemm wrapper.
- Do not use `double` in hot paths; use float or bf16.
- Handle the tail for hidden sizes that are not a multiple of the vector width.
- Keep the ATen fallback tier.

## Profiling quick reference

These bands are heuristics for the Xeon cores the existing kernels ran on. Read IPC together with the miss rates: a pure AVX512 FMA loop retires few wide instructions per cycle by design, so a low IPC with low miss rates is not a memory bound.

| Metric | Reading | Action |
|---|---|---|
| IPC under 1.0 with high L1 or LLC miss rate | Memory bound | Add prefetch, reduce tile size |
| L1 miss rate above 10% | Working set exceeds L1 | Reduce blocking to fit L1 (48 KB per core on the target Xeon) |
| LLC miss rate above 20% | Working set exceeds L3 | Add cache blocking for L2 (1 MB budget) |
| Branch miss rate above 5% | Unpredictable branches | Use SIMD masking or `__builtin_expect` |

## Reference index

| Question | File |
|---|---|
| Starting a kernel | `references/implementation_reference.md` |
| Build system | `references/build_system.md` |
| Runtime dispatch | `references/runtime_dispatch.yaml` |
| GEMM kernel | `references/brgemm_patterns.yaml` and `references/quantized_gemm_patterns.yaml` |
| SIMD patterns | `references/simd_optimization_patterns.yaml` |
| Memory issues | `references/memory_patterns.yaml` |
| Threading | `references/threading_patterns.yaml` |
| Wrong results | `references/correctness.yaml` |
| Data types | `references/dtype_optimizations.yaml` |
| More speedup | `references/optimization_levels.yaml` |

## Checklist

- [ ] Operation type identified (element-wise, reduction, GEMM, attention)
- [ ] `cpu_features.hpp` created in the kernel's own namespace
- [ ] ATen fallback implemented in the dispatcher
- [ ] AVX512 implementation compiled with its own flags
- [ ] Tail handling for sizes that are not a multiple of the vector width
- [ ] `torch_binding.cpp` uses the `registration.h` macros
- [ ] `build.toml` has an `include` directive in every section
- [ ] Validated with `python scripts/validate_cpu_kernel.py .`
- [ ] Benchmarked with `python scripts/benchmark_cpu.py`
- [ ] Profiled with `python scripts/cpu_profiler.py` after the first correct trial
