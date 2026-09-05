# Workflow details (CPU kernels)

## Analysis

Given a target PyTorch operation:

1. Parse the operation: input and output shapes and dtypes, the mathematical operations (matmul, activation, reduction), the memory access pattern (row-wise, column-wise, random), and the compute intensity (FLOPs per byte moved).
2. Read the knowledge base in `references/`:

   | File | Content |
   |---|---|
   | `runtime_dispatch.yaml` | `cpu_features.hpp` pattern, dispatch tiers |
   | `build_system.md` | `build.toml` multi-target compilation |
   | `implementation_reference.md` | C++ templates, `Unroll<N>`, tinygemm |
   | `correctness.yaml` | Constraints every kernel must hold |
   | `simd_optimization_patterns.yaml` | AVX512 vector abstractions |
   | `brgemm_patterns.yaml` | brgemm API (GEMM kernels only) |

3. Run `python scripts/analyze_op.py --op <op_name> --shapes <shapes>` to classify the kernel type, then pick the matching template in `references/implementation_reference.md`.

## Design

1. Identify the kernel type: element-wise, reduction, GEMM, or attention.
2. Select the strategy: element-wise uses AVX512 vectorization with OpenMP; GEMM uses the tinygemm and brgemm dual path with `parallel_2d`; attention uses tiled attention with brgemm.
3. Apply the constraints from `references/correctness.yaml`: unaligned loads (`_mm512_loadu_*`), one ISA tier per translation unit, tail handling for sizes that are not a multiple of the vector width, `registration.h` in `torch_binding.cpp`, and a per-kernel `cpu_features.hpp` in the kernel's own namespace.

## Trial loop

For each trial:

### a. Implement or modify the kernel

Start from a template in `references/implementation_reference.md` or modify the previous trial.

### b. Validate

```bash
python scripts/validate_cpu_kernel.py .
```

A validation failure is fixed in place and does not count as a trial.

### c. Build

```bash
kernel-builder build --release
pip install dist/*.whl --force-reinstall
```

### d. Save the trial

```bash
python scripts/trial_manager.py save <kernel_name> <kernel_dir> --parent <parent_id> --strategy "description"
```

Omit `--parent` for the first trial.

### e. Benchmark

```bash
# Trial t0 measures both baseline and kernel:
python scripts/benchmark_cpu.py baseline.py --kernel-package my_kernel --op my_kernel.forward

# Trials t1 and later reuse the cached baseline time:
python scripts/trial_manager.py baseline-us <kernel_name>
python scripts/benchmark_cpu.py baseline.py --kernel-package my_kernel --op my_kernel.forward --baseline-us <cached_value>
```

### f. Record the result

```bash
python scripts/trial_manager.py result <kernel_name> <trial_id> \
    --correctness <pass|fail> --speedup <float> \
    --baseline_us <float> --kernel_us <float>
```

### g. Decide the next trial

| Condition | Action |
|---|---|
| Speedup above `early_stop_speedup` | Stop. This is the only valid early stop. |
| Speedup improved | Continue on this branch with the next optimization. |
| Speedup regressed | Branch back to the best trial and try a different strategy. |
| Correctness failed | Fix on the same branch. Read the leaf path in the benchmark output; the usual causes are alignment and tail handling. |
| After t1, when `perf_stat_enabled` is true | Run `cpu_profiler.py` once before choosing the next optimization. |
| IPC under 1.0 together with a high L1 or LLC miss rate | Memory bound: add prefetch or reduce the tile size. A pure AVX512 FMA loop has low IPC by design, so IPC alone does not decide. |
| L1 miss rate above 10% | Tile too large: reduce it to fit L1 (48 KB per core on the target Xeon). |
| LLC miss rate above 20% | Working set too large: add cache blocking within the 1 MB L2 budget. |
| Plateau after two or more trials | Switch algorithm (tinygemm or brgemm, different blocking). |
| `max_trials` reached | Stop. Every trial in `config.yaml` must run. |

### h. Check status

```bash
python scripts/trial_manager.py status <kernel_name>
python scripts/trial_manager.py best <kernel_name>
```

## Trial manager commands

```bash
python scripts/trial_manager.py init <kernel_name> <baseline_file>
python scripts/trial_manager.py save <kernel_name> <source> [--parent <parent_id>] [--strategy "..."]
python scripts/trial_manager.py result <kernel_name> <trial_id> [--correctness pass] [--speedup 3.2] [--baseline_us 150.0] [--kernel_us 47.0]
python scripts/trial_manager.py status <kernel_name>
python scripts/trial_manager.py best <kernel_name>
python scripts/trial_manager.py baseline-us <kernel_name>
python scripts/trial_manager.py finalize <kernel_name> <output_path>
```

## Benchmarking

`scripts/benchmark_cpu.py` runs two checks, and both must pass for a trial to count as completed.

Correctness compares the kernel output to the baseline output with a structure-aware comparator. Tuples, lists, and dicts are walked element-wise and must agree in type, length, and keys. Every tensor leaf must agree in dtype and shape and is compared in its own dtype against a per-dtype tolerance: half an ulp relative for bf16 and fp16, `atol=1e-6, rtol=1e-5` for fp32, `atol=1e-12, rtol=1e-9` for fp64, and exact equality for integer and bool dtypes. A mismatch names the leaf path, for example `output[1]`. Pass `--atol` and `--rtol` to widen every floating tolerance when the kernel's accumulation order legitimately differs from the reference. The baseline must define `get_inputs()` and either `get_reference_output()` or a `Model` class.

Performance times both implementations with `torch.utils.benchmark.Timer.blocked_autorange(min_run_time=2.0)` and reports the median time and the speedup.

`python scripts/benchmark_cpu.py --self-check` exercises the comparator on a wrong second tuple element, a bf16 truncation error, a scalar reference paired with a tensor kernel output, and the structure, dtype, and shape checks; it exits 1 if any expectation fails and exits 2 with a stated reason when torch is not installed, so the check fails closed on a host without torch.

## Profiling with perf stat

```bash
python scripts/cpu_profiler.py --kernel-package my_kernel --op my_kernel.forward
```

The script runs `perf stat`, collects hardware counters, and maps each finding to a reference file.

Run it after the first benchmarked trial (t1), again when the speedup plateaus after two or more further trials, and whenever the next optimization level is unclear.

It reports:

| Counter | What it tells you |
|---|---|
| IPC (instructions per cycle) | Compute versus memory bound, read together with the miss rates |
| L1 cache miss rate | Tile sizing |
| LLC (L3) miss rate | Working set size |
| Branch miss rate | SIMD versus scalar branching |

The output names a reference file for each recommendation, for example:

```
>> IPC < 1.0: memory-bound or dependency-bound if L1 or LLC miss rates are also high;
   - Add prefetch instructions (_mm_prefetch with _MM_HINT_T0 or _MM_HINT_T1)
   - Reduce cache blocking tile size
   Reference: references/memory_patterns.yaml
```

Read the referenced file and apply the pattern in the next trial.

## Skill layout

```
cpu-kernel-authoring/
├── SKILL.md                            # Contract, procedure, failure table
├── references/                         # Knowledge base
│   ├── implementation_reference.md     # C++ templates, Unroll<N>, tinygemm
│   ├── optimization_strategies.md      # Levels, decision tree, checklist
│   ├── workflow_details.md             # This file
│   ├── build_system.md               # build.toml multi-target compilation
│   ├── runtime_dispatch.yaml           # cpu_features.hpp and dispatch
│   ├── correctness.yaml                # Constraints
│   ├── simd_optimization_patterns.yaml # AVX512 vector abstractions
│   ├── quantized_gemm_patterns.yaml    # LUT, tinygemm, brgemm
│   ├── brgemm_patterns.yaml            # brgemm API, VNNI packing
│   ├── memory_patterns.yaml            # Prefetch, cache blocking
│   ├── threading_patterns.yaml         # OpenMP patterns
│   ├── dtype_optimizations.yaml        # bf16, fp8, int8 handling
│   ├── optimization_levels.yaml        # L1 to L4 checklist
│   └── huggingface-kernels-integration.md # Hub integration
└── scripts/                            # Tools the procedure runs; do not recreate them
    ├── config.py                       # Shared config loader
    ├── config.yaml                     # Session config
    ├── analyze_op.py                   # Op analysis: kernel type and strategy
    ├── validate_cpu_kernel.py          # Static checks on C++ kernel code
    ├── benchmark_cpu.py                # Correctness and performance
    ├── cpu_profiler.py                 # perf stat and recommendations
    └── trial_manager.py                # Trial tree management
```
