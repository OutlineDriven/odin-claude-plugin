---
name: cpu-kernel-authoring
description: 'Use when writing, optimizing, or benchmarking a C++ CPU kernel with AVX2 or AVX512 intrinsics for the Hugging Face kernels ecosystem. Not for CUDA kernels: use cuda.'
---

# CPU kernel authoring

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A C++ CPU kernel for the Hugging Face kernels ecosystem must be written, optimized, or benchmarked with AVX2 or AVX512 intrinsics against a PyTorch baseline. |
| Authority | Reversible local. Writes C++ kernel sources, `build.toml`, and `torch_binding.cpp` under the kernel directory, a wheel under `dist/`, the installed kernel package in the active Python environment, and trial state under `trials/<kernel_name>/` and `output/`. Rollback is version control for the sources, `pip uninstall <package>` for the package, and removal of `dist/`, `trials/<kernel_name>/`, and `output/`. No remote mutation. |
| Side effect | Kernel sources and build files change; a wheel is built and installed; trial directories and result records accumulate. |
| Done | The kernel passes the correctness check in `scripts/benchmark_cpu.py`, every trial up to `max_trials` has run or the speedup exceeded `early_stop_speedup`, and the best trial is finalized into `output/` with its final measurement; or a failure class from the table below is reported with the recovery step taken. |

## Inputs

- Kernel name (required): the trial-tree label, for example `my_rmsnorm`. Used only by `trial_manager.py`, which accepts it as a single directory name under `trials/`, never a path.
- Baseline file (required): a `baseline.py` that defines `get_inputs()` and either `get_reference_output()` or a `Model` class (with optional `get_init_inputs()`). It is the ground truth for correctness and the speed reference.
- Operation name (required): the plain name `analyze_op.py --op` looks up, for example `rms_norm`.
- Input shapes (required): comma-separated shape strings for `analyze_op.py --shapes`, for example `"1024x4096,2048x8192"`.
- Package and function path (required from step 5): the installed package name, for example `my_kernel`, and its callable as `package.function`, for example `my_kernel.rms_norm`. `benchmark_cpu.py` and `cpu_profiler.py` take this path as their `--op`; it is not the operation name above.
- Toolchain (required): `kernel-builder`, `pip`, PyYAML (imported by `scripts/config.py`), `numactl` (used by the pinned benchmark in step 8), a C++ compiler with AVX512 support, and PyTorch. `perf` is required only when `perf_stat_enabled` is true.

The work has two phases. The correctness phase builds the tiers in order (generic ATen fallback, optional AVX2, AVX512) and each tier must pass correctness before the next starts. The performance phase iterates on the AVX512 tier through the trial tree until `max_trials` is exhausted or `early_stop_speedup` is exceeded.

## Procedure

1. Read `scripts/config.yaml` and note `max_trials`, `early_stop_speedup`, `perf_stat_enabled`, `vtune_enabled`, `build_command`, and `install_command`. Use those two commands wherever this procedure builds or installs. Done when: every value is known.
2. Run `python scripts/analyze_op.py --op <op_name> --shapes <shapes>` and read the compute and memory characteristics and the suggested SIMD strategy. Read `references/workflow_details.md` for the analysis and design steps. Done when: the kernel type is fixed as element-wise, reduction, GEMM, or attention.
3. Run `python scripts/trial_manager.py init <kernel_name> <baseline_file>`. Done when: `trials/<kernel_name>/` exists and records the baseline.
4. Write the generic tier: `<kernel>_cpu/cpu_features.hpp` in the kernel's own namespace, the dispatcher `<kernel>_cpu/<kernel>_cpu.cpp` with an ATen-only fallback, the bridge `<kernel>_cpu/<kernel>_cpu_torch.cpp`, `torch-ext/torch_binding.cpp` using the `registration.h` macros, and `build.toml` with one `[kernel.*]` section per tier and `include = ["<kernel>_cpu"]` in every section. Read `references/runtime_dispatch.yaml`, `references/build_system.md`, `references/implementation_reference.md`, and `references/correctness.yaml` while writing. Run `python scripts/validate_cpu_kernel.py <kernel_dir>`. Done when: validation reports no error.
5. Build and install with the configured commands, by default `kernel-builder build --release` then `pip install dist/*.whl --force-reinstall --no-deps`. Done when: `python -c "import <package>"` succeeds.
6. Run `python scripts/benchmark_cpu.py <baseline_file> --kernel-package <package> --op <package>.<function>`. The correctness check walks tuples, lists, and dicts element-wise, requires equal structure, dtype, and shape, and compares each tensor leaf in its own dtype: half an ulp relative for bf16 and fp16, `atol=1e-6, rtol=1e-5` for fp32, `atol=1e-12, rtol=1e-9` for fp64, exact for integer and bool. Widen with `--atol` and `--rtol` only when the kernel's accumulation order legitimately differs from the reference, and record the reason in the trial's `--strategy`. Done when: correctness passes and the baseline and kernel times are recorded; on failure, go to the failure table.
7. Add the AVX512 tier in its own translation unit `<kernel>_cpu/<kernel>_avx512.cpp` with its own `cxx-flags` section (`-mavx512f -mavx512bf16 -mavx512vl` for element-wise kernels; GEMM kernels add `-mavx512dq -mavx512bw -mavx512vbmi -mamx-tile -mamx-bf16 -mamx-int8`), and `-fopenmp` in every SIMD section. Add an AVX2 tier only when it gives an element-wise kernel a measurable benefit; GEMM kernels dispatch AVX512 to fallback. Repeat steps 4 to 6, then run `python scripts/trial_manager.py save <kernel_name> <kernel_dir> --strategy "<description>"` and record the numbers with `python scripts/trial_manager.py result <kernel_name> <trial_id> --correctness pass --speedup <x> --baseline_us <us> --kernel_us <us>`. Done when: the AVX512 tier is correct and trial t0 is recorded. This ends the correctness phase.
8. Pin the benchmark to one NUMA node for every later measurement: `numactl --cpunodebind=0 --membind=0 python scripts/benchmark_cpu.py ... --baseline-us <cached>`, where the cached value comes from `python scripts/trial_manager.py baseline-us <kernel_name>`. Done when: the pinned command is the one used from here on.
9. When `perf_stat_enabled` is true, run `python scripts/cpu_profiler.py --kernel-package <package> --op <package>.<function>` once after the first benchmarked trial. Read IPC together with the L1 and LLC miss rates: a pure AVX512 FMA loop has low IPC by design, so a memory bound is claimed only when a miss rate is also high. Done when: the profile is read and the next change is chosen from `references/optimization_strategies.md`.
10. For each remaining trial up to `max_trials`: change one thing in the AVX512 tier (blocking, prefetch, unrolling, threading, or a different algorithm from `references/simd_optimization_patterns.yaml`, `references/memory_patterns.yaml`, `references/threading_patterns.yaml`, `references/dtype_optimizations.yaml`, `references/brgemm_patterns.yaml`, `references/quantized_gemm_patterns.yaml`, and `references/optimization_levels.yaml`), validate, build, benchmark, then `save` with `--parent <best_or_current_id>` and `result`. A regression branches back to the best trial; a plateau after two trials changes the algorithm, data layout, or fusion instead of sweeping the same knobs. Stop early only when the speedup exceeds `early_stop_speedup`. Done when: `max_trials` trials are recorded or the early stop fired.
11. Run `python scripts/trial_manager.py finalize <kernel_name> output/`, then re-run the pinned `benchmark_cpu.py` without `--baseline-us` for the final measurement. Read `references/huggingface-kernels-integration.md` if the kernel is to be published to the Hub. Done when: `output/` holds the best trial's sources and its final correctness and speedup are recorded.

Modify only `.cpp` and `.hpp` files, `torch_binding.cpp`, and `build.toml`. Do not write new benchmark or timing scripts; `scripts/benchmark_cpu.py` is the only timing source. When a script fails, report the error rather than working around it.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| `scripts/config.yaml` missing | Stop and report. Do not assume trial counts. |
| `analyze_op.py` reports no matmul, reduction, or activation for the op | The script recognizes norm, softmax, gemm, linear, matmul, attention, gelu, silu, relu, moe, and megablocks by name and classifies anything else as plain element-wise. Classify the kernel type by hand from the baseline and continue at step 3. |
| `validate_cpu_kernel.py` reports an error | Fix the named file or `build.toml` section; re-run validation. A validation fix does not count as a trial. |
| `kernel-builder build` fails | Read the compiler output; fix the source or the section's `cxx-flags`; rebuild. |
| Correctness fails | Read the leaf path, dtype, and worst-element values in the benchmark output. A wrong second output or a dtype or shape change is a binding or dispatcher bug; a one-ulp bf16 difference on many elements is a rounding-mode or conversion bug; a tail-only difference is missing tail handling; a large scattered difference is an alignment bug. Fix on the same branch, rebuild, re-benchmark. Do not enter the performance phase with a failing kernel. |
| Kernel slower than baseline on small tensors | Add a `num_tokens` threshold below which the dispatcher calls the ATen fallback; see `references/threading_patterns.yaml`. |
| `perf` unavailable or `perf stat` returns no counters | Continue without profiling and report it; choose the next trial from `references/optimization_levels.yaml`. |
| Speedup regressed | `save` the next trial with `--parent` set to the best trial id from `python scripts/trial_manager.py best <kernel_name>`. |
| Plateau after two or more trials | Change algorithm, data layout, or fusion strategy. Do not sweep the same parameters. |
| `max_trials` reached below `early_stop_speedup` | Finalize the best trial and report the speedup reached and the trial tree from `trial_manager.py status`. |

## Output

- Kernel sources: `<kernel>_cpu/` with `cpu_features.hpp`, the dispatcher, the bridge, the AVX512 implementation, and any AVX2 implementation, plus `torch-ext/torch_binding.cpp` and `build.toml`.
- Installed package: the wheel under `dist/` and the installed `<package>`.
- Trial tree: `trials/<kernel_name>/` with each saved trial, its parent, strategy, correctness, and timing.
- Correctness report: the `benchmark_cpu.py` output naming per-dtype tolerances and, on failure, the leaf path of each mismatch.
- Performance report: baseline and kernel microseconds and speedup from the NUMA-pinned run.
- Final kernel: `output/` holding the best trial's sources and its final measurement.
