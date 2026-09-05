---
name: triton-lang
description: 'Use when writing Triton kernels with @triton.jit, tl.load and tl.store with masking, tl.atomic_add, autotuning, benchmarking, or integrating kernels into PyTorch. Not for raw CUDA: use cuda.'
---

# Triton

## Contract

| Field | Bound contract |
|---|---|
| Trigger | GPU kernel work in OpenAI Triton: `@triton.jit` kernels, `tl.load`/`tl.store` masking, atomics, `tl.constexpr` block sizes, autotuning, benchmarking, or PyTorch integration. |
| Authority | Read-only. The skill emits guidance and code; it writes no files. Nothing to roll back. No remote mutation. |
| Side effect | Kernel code, autotune configurations, benchmark harnesses, and debugging steps in chat output. |
| Done | A kernel with correct masking, an autotune or benchmark plan, and a PyTorch integration path exist and are checked against a reference implementation. |

## Inputs

1. Operation (required): the math the kernel should perform, or the kernel under review.
2. Triton version (required): `python -c "import triton; print(triton.__version__)"`. Grounded current stable: 3.7.1.
3. Shapes and dtypes (required): tensor shapes, strides, and dtypes for the launch grid and masks.
4. PyTorch version (optional, for integration): custom-op registration needs a recent release.

## Procedure

1. Write the kernel blockwise. `tl.program_id` indexes the block, `tl.arange` spans the block, and a mask covers the tail:

```python
import torch
import triton
import triton.language as tl

@triton.jit
def add_kernel(x_ptr, y_ptr, out_ptr, n, BLOCK: tl.constexpr):
    pid = tl.program_id(0)
    offsets = pid * BLOCK + tl.arange(0, BLOCK)
    mask = offsets < n
    x = tl.load(x_ptr + offsets, mask=mask)
    y = tl.load(y_ptr + offsets, mask=mask)
    tl.store(out_ptr + offsets, x + y, mask=mask)

def add(x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
    n = x.numel()
    out = torch.empty_like(x)
    grid = lambda meta: (triton.cdiv(n, meta["BLOCK"]),)
    add_kernel[grid](x, y, out, n, BLOCK=1024)
    return out
```

`BLOCK: tl.constexpr` is compile-time, so the compiler unrolls and sizes shared memory from it. Done when: every load and store carries the mask.
2. Give masked loads a fill value. A masked lane without `other` reads undefined; `other=0.0` keeps reductions clean:

```python
x = tl.load(x_ptr + offsets, mask=mask, other=0.0)
```

Done when: every masked load that feeds arithmetic names its `other`.
3. Use atomics sparingly. They serialize updates to one address; reduce within the block first, then issue one atomic per block:

```python
@triton.jit
def reduce_kernel(x_ptr, out_ptr, n, BLOCK: tl.constexpr):
    pid = tl.program_id(0)
    offs = pid * BLOCK + tl.arange(0, BLOCK)
    mask = offs < n
    x = tl.load(x_ptr + offs, mask=mask, other=0.0)
    tl.atomic_add(out_ptr, tl.sum(x, axis=0))
```

Done when: atomic count per output element is one or the contention is justified.
4. Autotune block shape and warp count against the input size. The tuner benchmarks each config once per distinct key value and caches the winner:

```python
@triton.autotune(
    configs=[
        triton.Config({"BLOCK": 128}, num_warps=4),
        triton.Config({"BLOCK": 256}, num_warps=4),
        triton.Config({"BLOCK": 512}, num_warps=8),
    ],
    key=["n"],
)
@triton.jit
def tuned_kernel(x_ptr, y_ptr, out_ptr, n, BLOCK: tl.constexpr):
    ...
```

Done when: the config set spans the plausible block range and `key` names every size-dependent argument.
5. Benchmark with the documented harness. `do_bench` returns milliseconds for a quick read; `perf_report` with `Benchmark` sweeps sizes and plots providers:

```python
import triton.testing as tt

ms = tt.do_bench(lambda: add(x, y))
print(f"{ms:.3f} ms")
```

```python
from triton.testing import perf_report, Benchmark

@perf_report(
    Benchmark(
        x_names=["n"],
        x_vals=[2**i for i in range(10, 24)],
        line_arg="provider",
        line_vals=["triton", "torch"],
        line_names=["Triton", "PyTorch"],
        plot_name="add-bench",
        args={},
    )
)
def bench_add(n, provider):
    x = torch.randn(n, device="cuda")
    y = torch.randn(n, device="cuda")
    if provider == "triton":
        return lambda: add(x, y)
    return lambda: x + y
```

Compare against the PyTorch reference on small inputs before scaling up. Done when: the kernel beats or matches the reference at the shapes that matter, with quantiles recorded.
6. Register the kernel as a PyTorch custom op so `torch.compile` can trace it. The fake kernel needs no body, only the output shape:

```python
from torch.library import custom_op

@custom_op("mylib::triton_add", mutates_args=())
def triton_add_op(x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
    return add(x, y)

@triton_add_op.register_fake
def _(x, y):
    return torch.empty_like(x)
```

Keep Python side effects out of the JIT function; they break tracing. Done when: the op runs eagerly and under `torch.compile`.
7. Debug in layers. Compare against a PyTorch reference first. Then gate with `tl.debug_barrier()` to isolate sync bugs, print autotune decisions, and inspect compiled artifacts:

```bash
TRITON_PRINT_AUTOTUNING=1 python script.py
export TRITON_CACHE_DIR=/tmp/triton_cache   # inspect compiled kernels
```

Done when: the failing stage, kernel or integration, is named.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| `OutOfResources` | Block or warp count too large for the device. Lower `BLOCK` or `num_warps`, then re-autotune. |
| Wrong results on the tail | Missing mask on a load or store. Add `mask=offs < n` everywhere. |
| Slower than PyTorch | Block shape mismatched. Autotune; check coalescing through the shape layout. |
| `CompilationError` | Dtype mismatch across the kernel. Normalize with `.to(tl.float32)` and consistent pointer dtypes. |
| NaN in output | Uninitialized masked lanes. Pass `other=0.0` to masked loads. |
| `torch.compile` fails | Missing fake kernel. Register `register_fake` for the op. |

## Output

The kernel with its mask and grid logic, the autotune or benchmark plan with measured numbers, the integration snippet, and the debug steps taken. Each claim names the Triton version it assumes.
