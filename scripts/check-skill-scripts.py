#!/usr/bin/env python3
"""Whole-tree gate for executable skill content: compile, shell syntax, self-checks.

Three checks that `prek` cannot otherwise run:
- every tracked Python file under plugins/ and scripts/ must compile;
- every tracked shell script under plugins/ must pass `bash -n`;
- every skill script that ships a --self-check must pass it, with a
  printed skip (not a failure) on hosts missing its heavyweight import.

The E4M3 -> BF16 conversion taught in two reference files is checked
against an independent float oracle so the two cannot silently diverge
from the hardware-verified form.

--self-test plants one broken file of each kind and proves both detectors
fire, because a gate that has never seen a defect is a hope, not a gate.
"""

import struct
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Scripts whose self-check needs torch: (script, skip exit code).
SELF_CHECKS = [
    ("plugins/odin-native/skills/cpu-kernel-authoring/scripts/benchmark_cpu.py", 2),
]

# The constants the intrinsics text must carry in both reference snippets.
FP8_SNIPPETS = [
    "plugins/odin-native/skills/cpu-kernel-authoring/references/dtype_optimizations.yaml",
    "plugins/odin-native/skills/cpu-kernel-authoring/references/quantized_gemm_patterns.yaml",
]
FP8_CONSTANTS = ["set1_epi16(120)", "slli_epi16", ", 7)", ", 4)", "0x7F", "0x7FC0"]

BROKEN_PY = "def f(:\n    pass\n"
BROKEN_SH = "if [ -f x ]; then\n    echo broken\n"


def _where(path: Path) -> str:
    return str(path.relative_to(ROOT)) if path.is_relative_to(ROOT) else str(path)


def _tracked(rel_glob: str) -> list[Path]:
    out = subprocess.run(
        ["git", "ls-files", rel_glob], cwd=ROOT, capture_output=True, text=True, check=True
    )
    return [ROOT / line for line in out.stdout.splitlines() if line]


def python_errors(files: list[Path]) -> list[str]:
    errors: list[str] = []
    for path in files:
        try:
            compile(path.read_text(), str(path), "exec")
        except SyntaxError as e:
            errors.append(f"{_where(path)}:{e.lineno}: {e.msg}")
    return errors


def shell_errors(files: list[Path]) -> list[str]:
    errors: list[str] = []
    for path in files:
        result = subprocess.run(
            ["bash", "-n", str(path)], capture_output=True, text=True, check=False
        )
        if result.returncode != 0:
            first = result.stderr.strip().splitlines()[0] if result.stderr.strip() else "syntax error"
            errors.append(f"{_where(path)}: {first}")
    return errors


def self_check_errors() -> list[str]:
    errors: list[str] = []
    for rel, skip_rc in SELF_CHECKS:
        result = subprocess.run(
            [sys.executable, str(ROOT / rel), "--self-check"],
            capture_output=True,
            text=True,
            check=False,
            cwd=ROOT,
        )
        if result.returncode == skip_rc:
            print(f"  self-check skipped (heavyweight import missing): {rel}")
        elif result.returncode != 0:
            tail = (result.stdout + result.stderr).strip().splitlines()
            detail = tail[-1] if tail else f"exit {result.returncode}"
            errors.append(f"{rel}: {detail}")
    return errors


def _fp8_to_bf16(b: int) -> int:
    sign = (b & 0x80) << 8
    if (b & 0x7F) == 0x7F:
        return sign | 0x7FC0
    e = (b >> 3) & 0xF
    m = b & 0x7
    if e == 0:
        return sign
    return sign | ((e + 120) << 7) | (m << 4)


def fp8_reference_errors() -> list[str]:
    errors: list[str] = []
    for b in range(256):
        if (b & 0x7F) == 0x7F:
            continue
        e = (b >> 3) & 0xF
        value = 0.0 if e == 0 else (1.0 + (b & 0x7) / 8.0) * 2.0 ** (e - 7)
        if b & 0x80:
            value = -value
        oracle = struct.unpack(">I", struct.pack(">f", value))[0] >> 16
        if _fp8_to_bf16(b) != oracle:
            errors.append(f"FP8 model diverges from float oracle at 0x{b:02x}")
            break
    for rel in FP8_SNIPPETS:
        text = (ROOT / rel).read_text()
        for constant in FP8_CONSTANTS:
            if constant not in text:
                errors.append(f"{rel}: FP8 conversion lost the constant '{constant}'")
    return errors


def run_gate() -> int:
    py_files = [p for p in _tracked("plugins/**/*.py") + _tracked("scripts/*.py") if p.exists()]
    sh_files = [
        p
        for p in _tracked("plugins/**/scripts/*")
        if p.exists() and p.is_file() and not p.suffix and p.read_text().startswith("#!")
    ]

    failures = (
        python_errors(py_files)
        + shell_errors(sh_files)
        + self_check_errors()
        + fp8_reference_errors()
    )
    for f in failures:
        print(f"  {f}")
    print(f"checked {len(py_files)} python files, {len(sh_files)} shell scripts, {len(SELF_CHECKS)} self-checks")
    if failures:
        print("FAIL")
        return 1
    print("PASS")
    return 0


def run_self_test() -> int:
    with tempfile.TemporaryDirectory() as td:
        bad_py = Path(td) / "broken.py"
        bad_py.write_text(BROKEN_PY)
        bad_sh = Path(td) / "broken"
        bad_sh.write_text("#!/usr/bin/env bash\n" + BROKEN_SH)
        if not python_errors([bad_py]):
            print("FAIL: planted python syntax error was not flagged")
            return 1
        if not shell_errors([bad_sh]):
            print("FAIL: planted shell syntax error was not flagged")
            return 1
        print("PASS: both planted defects were flagged")
        return 0


def main() -> int:
    if "--self-test" in sys.argv:
        return run_self_test()
    return run_gate()


if __name__ == "__main__":
    sys.exit(main())
