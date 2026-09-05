#!/usr/bin/env python3
"""
Benchmark a CPU kernel against its PyTorch baseline.

Checks correctness with a structure- and dtype-aware comparator, then measures
performance with torch.utils.benchmark.

Usage:
    python scripts/benchmark_cpu.py baseline.py --kernel-package my_kernel --op my_kernel.forward
    python scripts/benchmark_cpu.py baseline.py --kernel-package my_kernel --op my_kernel.forward --baseline-us 123.45
    python scripts/benchmark_cpu.py --self-check

The first trial measures both baseline and kernel. Later trials pass the cached
baseline time with --baseline-us so only the kernel is timed.
"""

import argparse
import importlib
import importlib.util
import logging
import sys
from pathlib import Path

# torch is imported at module load inside try/except so that --self-check can
# exit 2 with a clear reason on a host without torch instead of dying with an
# ImportError traceback at import time.
try:
    import torch
except ImportError:  # pragma: no cover - exercised only on hosts without torch
    torch = None


def _load_module(filepath: Path, module_name: str):
    spec = importlib.util.spec_from_file_location(module_name, filepath)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _load_kernel_func(kernel_package: str, op_path: str):
    """Resolve 'package.attr[.attr]' to the callable inside the installed package."""
    parts = op_path.split(".")
    if len(parts) < 2:
        print("Error: --op should be package.function (e.g., my_kernel.forward)")
        sys.exit(1)

    func = importlib.import_module(parts[0])
    for attr in parts[1:]:
        func = getattr(func, attr)
    return func


def _default_tolerances():
    # Tolerances are keyed by the leaf's own dtype so that a bf16 output is judged
    # at bf16 resolution. Upcasting both sides to float32 and using one loose
    # tolerance hid one-ulp bf16 errors (a truncating conversion instead of
    # round-to-nearest-even is 7.8e-3 relative, under the old 1e-2 atol).
    # For bf16 and fp16 the rtol is half an ulp of the dtype, so any full-ulp
    # difference fails. Widen with --rtol when the kernel's accumulation order
    # legitimately differs from the reference.
    return {
        torch.bfloat16: (0.0, 2.0**-9),
        torch.float16: (0.0, 2.0**-11),
        torch.float32: (1e-6, 1e-5),
        torch.float64: (1e-12, 1e-9),
    }


def _leaf_mismatch(ref, out, path, tolerances):
    """Return a mismatch message for one tensor leaf, or None when it matches."""
    if not isinstance(out, torch.Tensor):
        return f"{path}: reference is a tensor, kernel returned {type(out).__name__}"
    if ref.dtype != out.dtype:
        return f"{path}: dtype mismatch ref={ref.dtype} kernel={out.dtype}"
    if ref.shape != out.shape:
        return f"{path}: shape mismatch ref={tuple(ref.shape)} kernel={tuple(out.shape)}"

    if ref.dtype in tolerances:
        atol, rtol = tolerances[ref.dtype]
        # allclose is evaluated in the leaf's own dtype: no upcast, so the
        # tolerance is applied at the resolution the consumer will see.
        if torch.allclose(ref, out, atol=atol, rtol=rtol, equal_nan=True):
            return None
        # The diff is widened to float64 only for reporting, where exactness of
        # the printed number matters and rounding in-dtype would mislead.
        diff = (ref.double() - out.double()).abs()
        flat = diff.argmax().item()
        idx = []
        remaining = flat
        for dim in reversed(ref.shape):
            idx.insert(0, remaining % dim)
            remaining //= dim
        return (
            f"{path}: value mismatch dtype={ref.dtype} atol={atol:g} rtol={rtol:g} "
            f"max_diff={diff.max().item():.6e} mean_diff={diff.mean().item():.6e} "
            f"worst at {tuple(idx)}: ref={ref.flatten()[flat].item():.6g} "
            f"kernel={out.flatten()[flat].item():.6g}"
        )

    # Integer and bool leaves carry no rounding, so any difference is a bug.
    if torch.equal(ref, out):
        return None
    diff_count = (ref != out).sum().item()
    return f"{path}: {diff_count} element(s) differ in exact dtype {ref.dtype}"


def compare_structured(ref, out, tolerances, path="output"):
    """Walk ref and out together; return a list of mismatch messages (empty means equal).

    Tuples, lists, and dicts are walked element-wise and must agree in type,
    length, and key set. Every tensor leaf must agree in dtype and shape and
    fall within the tolerance for its dtype. Each message names the leaf path
    so a wrong second output is reported as such instead of being dropped.
    """
    if isinstance(ref, torch.Tensor):
        msg = _leaf_mismatch(ref, out, path, tolerances)
        return [msg] if msg else []

    if isinstance(ref, (tuple, list)):
        if type(out) is not type(ref):
            return [f"{path}: reference is {type(ref).__name__}, kernel returned {type(out).__name__}"]
        if len(ref) != len(out):
            return [f"{path}: length mismatch ref={len(ref)} kernel={len(out)}"]
        mismatches = []
        for i, (r, o) in enumerate(zip(ref, out)):
            mismatches += compare_structured(r, o, tolerances, f"{path}[{i}]")
        return mismatches

    if isinstance(ref, dict):
        if not isinstance(out, dict):
            return [f"{path}: reference is dict, kernel returned {type(out).__name__}"]
        if set(ref) != set(out):
            return [f"{path}: key mismatch ref={sorted(map(str, ref))} kernel={sorted(map(str, out))}"]
        mismatches = []
        for k in ref:
            mismatches += compare_structured(ref[k], out[k], tolerances, f"{path}[{k!r}]")
        return mismatches

    # ref cannot be a tensor here (dispatched above), but `out` can: `!=`
    # against a tensor is element-wise, and a multielement result raises the
    # ambiguous truth-value RuntimeError instead of naming the path.
    if isinstance(out, torch.Tensor):
        return [f"{path}: reference is {type(ref).__name__}, kernel returned {type(out).__name__}"]
    if ref != out:
        return [f"{path}: scalar mismatch ref={ref!r} kernel={out!r}"]
    return []


def _reference_output(baseline_mod, inputs):
    if hasattr(baseline_mod, "get_reference_output"):
        return baseline_mod.get_reference_output(*inputs)
    if hasattr(baseline_mod, "Model"):
        init_inputs = baseline_mod.get_init_inputs() if hasattr(baseline_mod, "get_init_inputs") else []
        model = baseline_mod.Model(*init_inputs)
        model.eval()
        with torch.no_grad():
            return model(*inputs)
    raise AttributeError("baseline must define get_reference_output() or a Model class")


def run_correctness(baseline_mod, kernel_func, tolerances):
    """Compare the kernel output to the baseline output; return True when they match."""
    print("\n  Correctness Check (per-dtype tolerances)")
    for dtype, (atol, rtol) in tolerances.items():
        print(f"    {dtype}: atol={atol:g} rtol={rtol:g}")
    print("    integer and bool dtypes: exact")

    try:
        if not hasattr(baseline_mod, "get_inputs"):
            print("  Error: baseline must define get_inputs()")
            return False
        inputs = baseline_mod.get_inputs()
        ref_output = _reference_output(baseline_mod, inputs)

        with torch.no_grad():
            kernel_output = kernel_func(*inputs)

        mismatches = compare_structured(ref_output, kernel_output, tolerances)
        if mismatches:
            print("  FAIL:")
            for m in mismatches:
                print(f"    {m}")
            return False
        print("  PASS: structure, dtype, shape, and values match")
        return True

    except Exception:
        logging.getLogger(__name__).exception("Kernel correctness check failed")
        return False


def run_performance(baseline_mod, kernel_func, baseline_us=None, warmup=10, iters=100):
    """Time baseline and kernel with torch.utils.benchmark; return (baseline_us, kernel_us, speedup)."""
    from torch.utils.benchmark import Timer

    print(f"\n  Performance Benchmark (warmup={warmup}, iters={iters})")

    if not hasattr(baseline_mod, "get_inputs"):
        print("  Error: baseline must define get_inputs()")
        return None, None, None
    inputs = baseline_mod.get_inputs()

    if baseline_us is not None:
        # The baseline does not change between trials, so re-timing it only adds
        # noise and wall time to the trial loop.
        print(f"  Using cached baseline: {baseline_us:.2f} us")
        bl_us = baseline_us
    else:
        if hasattr(baseline_mod, "get_reference_output"):
            ref_func = baseline_mod.get_reference_output
        elif hasattr(baseline_mod, "Model"):
            init_inputs = baseline_mod.get_init_inputs() if hasattr(baseline_mod, "get_init_inputs") else []
            model = baseline_mod.Model(*init_inputs)
            model.eval()
            ref_func = lambda *args: model(*args)
        else:
            print("  Error: baseline must define get_reference_output() or Model class")
            return None, None, None

        bl_timer = Timer(
            stmt="ref_func(*inputs)",
            globals={"ref_func": ref_func, "inputs": inputs},
            label="Baseline",
            description="PyTorch",
            num_threads=torch.get_num_threads(),
        )
        bl_result = bl_timer.blocked_autorange(min_run_time=2.0)
        bl_us = bl_result.median * 1e6
        print(f"  Baseline: {bl_us:.2f} us (median)")

    kr_timer = Timer(
        stmt="kernel_func(*inputs)",
        globals={"kernel_func": kernel_func, "inputs": inputs},
        label="Kernel",
        description="CPU Kernel",
        num_threads=torch.get_num_threads(),
    )
    kr_result = kr_timer.blocked_autorange(min_run_time=2.0)
    kr_us = kr_result.median * 1e6
    print(f"  Kernel:   {kr_us:.2f} us (median)")

    speedup = bl_us / kr_us if kr_us > 0 else 0
    marker = "+" if speedup >= 1.0 else "-"
    print(f"  Speedup:  {speedup:.2f}x {marker}")

    return bl_us, kr_us, speedup


def _legacy_first_element_float32_close(ref, out, atol=1e-2, rtol=1e-2):
    # The comparator this file replaced: first tuple element only, both sides
    # upcast to float32, one loose tolerance. Kept only so the self-check can
    # show what it let through.
    ref = ref[0] if isinstance(ref, tuple) else ref
    out = out[0] if isinstance(out, tuple) else out
    return torch.allclose(ref.float(), out.float(), atol=atol, rtol=rtol)


def self_check():
    """Prove the comparator catches the defects the old one hid.

    Exit 0 when every expectation holds, 1 when one fails, and 2 when torch is
    missing so the check fails closed on a host without torch.
    """
    if torch is None:
        print("FAIL: torch is not installed; the comparator operates on torch tensors and cannot be exercised here.")
        return 2

    torch.manual_seed(0)
    tolerances = _default_tolerances()
    failures = []

    def expect(name, condition):
        print(f"  {'ok  ' if condition else 'FAIL'} {name}")
        if not condition:
            failures.append(name)

    print("Self-check: identical structured output passes")
    a = torch.randn(4, 8).to(torch.bfloat16)
    b = torch.randn(4, 8)
    expect("identical (bf16, fp32) tuple passes", compare_structured((a, b), (a.clone(), b.clone()), tolerances) == [])
    expect("identical dict of tensors passes", compare_structured({"y": a, "n": 3}, {"y": a.clone(), "n": 3}, tolerances) == [])

    print("Self-check: wrong second tuple element is caught")
    wrong_second = (a.clone(), b + 0.5)
    legacy_pass = _legacy_first_element_float32_close((a, b), wrong_second)
    mismatches = compare_structured((a, b), wrong_second, tolerances)
    expect("legacy comparator passed the wrong second element", legacy_pass)
    expect("structured comparator fails", len(mismatches) == 1)
    expect("mismatch names path output[1]", bool(mismatches) and mismatches[0].startswith("output[1]:"))
    for m in mismatches:
        print(f"      {m}")

    print("Self-check: bf16 truncation instead of round-to-nearest-even is caught")
    # Values in [1, 2) so that every element has the same exponent and the
    # rounding-mode error is exactly one bf16 ulp (2^-7 = 7.8e-3) on the
    # elements whose low 16 bits round up. float32 upcasting with atol=1e-2
    # accepts a 7.8e-3 error; half-ulp rtol in bf16 does not.
    x = torch.rand(64, 64) + 1.0
    ref_rne = x.to(torch.bfloat16)
    truncated = (x.view(torch.int32) & -65536).view(torch.float32).to(torch.bfloat16)
    differing = (ref_rne != truncated).sum().item()
    expect(f"fixture differs in {differing} elements (needs > 0)", differing > 0)
    legacy_pass = _legacy_first_element_float32_close(ref_rne, truncated)
    mismatches = compare_structured(ref_rne, truncated, tolerances)
    expect("legacy float32 comparator passed the truncated bf16", legacy_pass)
    expect("structured comparator fails in bf16", len(mismatches) == 1)
    for m in mismatches:
        print(f"      {m}")

    print("Self-check: structure, dtype, and shape are enforced")
    expect("dtype mismatch fails", compare_structured(a, a.float(), tolerances) != [])
    expect("shape mismatch fails", compare_structured(b, b.t().contiguous(), tolerances) != [])
    expect("tuple length mismatch fails", compare_structured((a, b), (a,), tolerances) != [])
    expect("dict key mismatch fails", compare_structured({"y": a}, {"z": a}, tolerances) != [])
    expect("list vs tuple fails", compare_structured([a], (a,), tolerances) != [])
    i = torch.arange(10)
    expect("integer off-by-one fails", compare_structured(i, i + (i == 3).long(), tolerances) != [])
    scalar_vs_tensor = compare_structured(2.0, torch.tensor([2.0, 2.0]), tolerances)
    expect(
        "scalar reference vs multielement tensor fails and names the path",
        len(scalar_vs_tensor) == 1 and scalar_vs_tensor[0].startswith("output:"),
    )

    if failures:
        print(f"\nSelf-check FAILED: {len(failures)} expectation(s) not met")
        return 1
    print("\nSelf-check passed")
    return 0


def main():
    parser = argparse.ArgumentParser(description="Benchmark CPU kernel against PyTorch baseline")
    parser.add_argument("baseline_file", type=Path, nargs="?", help="PyTorch baseline file")
    parser.add_argument("--kernel-package", help="Kernel package name (pip-installed)")
    parser.add_argument("--op", help="Kernel function path (e.g., my_kernel.forward)")
    parser.add_argument("--baseline-us", type=float, default=None, help="Cached baseline time in microseconds")
    parser.add_argument("--atol", type=float, default=None, help="Override absolute tolerance for every floating dtype")
    parser.add_argument("--rtol", type=float, default=None, help="Override relative tolerance for every floating dtype")
    parser.add_argument("--self-check", action="store_true", help="Run the comparator self-check and exit")
    args = parser.parse_args()

    if args.self_check:
        sys.exit(self_check())

    if torch is None:
        print("Error: torch is not installed")
        sys.exit(1)
    if args.baseline_file is None or not args.kernel_package or not args.op:
        parser.error("baseline_file, --kernel-package, and --op are required")
    if not args.baseline_file.exists():
        print(f"Error: Baseline file not found: {args.baseline_file}")
        sys.exit(1)

    tolerances = _default_tolerances()
    if args.atol is not None or args.rtol is not None:
        tolerances = {
            dtype: (args.atol if args.atol is not None else atol, args.rtol if args.rtol is not None else rtol)
            for dtype, (atol, rtol) in tolerances.items()
        }

    print(f"\n{'=' * 70}")
    print("CPU Kernel Benchmark")
    print(f"{'=' * 70}")
    print(f"Baseline:       {args.baseline_file}")
    print(f"Kernel package: {args.kernel_package}")
    print(f"Op:             {args.op}")
    print(f"Threads:        {torch.get_num_threads()}")

    baseline_mod = _load_module(args.baseline_file, "baseline")

    try:
        kernel_func = _load_kernel_func(args.kernel_package, args.op)
    except (ImportError, AttributeError) as e:
        print(f"\nError loading kernel: {e}")
        print(f"Make sure '{args.kernel_package}' is installed: pip install dist/*.whl --force-reinstall")
        sys.exit(1)

    print(f"\n{'=' * 70}")
    print("Correctness")
    print(f"{'=' * 70}")
    correct = run_correctness(baseline_mod, kernel_func, tolerances)
    print(f"\n  Result: {'PASSED' if correct else 'FAILED'}")

    print(f"\n{'=' * 70}")
    print("Performance")
    print(f"{'=' * 70}")
    bl_us, kr_us, speedup = run_performance(baseline_mod, kernel_func, baseline_us=args.baseline_us)

    print(f"\n{'=' * 70}")
    print("Summary")
    print(f"{'=' * 70}")
    print(f"Correctness: {'PASSED' if correct else 'FAILED'}")
    if speedup is not None:
        print(f"Baseline:    {bl_us:.2f} us")
        print(f"Kernel:      {kr_us:.2f} us")
        print(f"Speedup:     {speedup:.2f}x")
    print()

    if correct and speedup is not None and speedup >= 1.0:
        print("All checks passed!")
        sys.exit(0)
    print("Some checks FAILED - see output above")
    sys.exit(1)


if __name__ == "__main__":
    main()
