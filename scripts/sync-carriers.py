#!/usr/bin/env python3
"""Rewrite each external carrier's shared doctrine from the baseline.

The carriers live outside the repository, in the home directory of whoever runs
the harness. Their shared sections must match `system-prompt-baseline.md` byte
for byte, while each keeps its own tool layer. `--check` reuses the
`check-carriers.py` audit, so a structurally broken carrier cannot pass just
because the shared bodies already match. The four tool-layer sections are never
modified.

Run the rewriter by hand (`just sync-carriers`), never as a rewrite hook. A hook
that rewrites home-directory files on every commit would fire on machines with
no carriers to repair. `--self-test` is a hook: it uses synthetic fixtures and
does not touch a live carrier.
"""

import importlib.util
import io
import os
import re
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from carriers import CARRIERS

# check-carriers.py has a hyphen in its name, so import it by path.
_spec = importlib.util.spec_from_file_location(
    "check_carriers", Path(__file__).resolve().parent / "check-carriers.py"
)
_mod = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_mod)

sections = _mod.sections
blocks = _mod.blocks
TOOL_LAYER = _mod.TOOL_LAYER
OVERLAY_TAGS = _mod.OVERLAY_TAGS
read_exact = _mod.read_exact
audit = _mod.audit

ROOT = Path(__file__).resolve().parent.parent
BASELINE = ROOT / "system-prompt-baseline.md"

_USAGE = """\
Usage: sync-carriers.py [options]

Rewrite each external carrier's shared doctrine sections from the baseline.

Options:
  --check            Report what would change; also run the carrier-shape
                     audit from check-carriers.py. Exit 1 if anything would
                     change, the audit fails, or a path is not a file.
  --self-test        Prove the planner on synthetic fixtures and exit.
  --carrier NAME=PATH
                     Override the carrier path for NAME (codex or omp).
                     Repeatable; a missing path is skipped with a notice.
                     An existing non-file path is an error, not a skip, and
                     a symlink is an error even when its target is missing.
  -h, --help         Show this help and exit.

With no arguments, rewrites every carrier that exists. A missing carrier
prints a notice and is skipped; a symlink carrier is an error, even a
dangling one. The four tool-layer sections (git, directives, code_tools,
thinking) are never modified.
"""

def _code_tools_pos(text):
    """Return the byte offset of the <code_tools> opening tag line, or None."""
    m = re.search(r"^<code_tools>$", text, re.M)
    return m.start() if m else None


def _carrier_name(path):
    """Return 'codex' or 'omp' for a carrier path, or None."""
    if ".codex" in path.parts:
        return "codex"
    if ".omp" in path.parts:
        return "omp"
    return None


def _plan(baseline_text, carrier_text):
    """Return (changes, new_text, error) for one carrier.

    changes is a list of ("rewrite", tag) or ("insert", tag). new_text is the
    carrier text after all edits. error is a string when the carrier cannot be
    fully synced, otherwise None.
    """

    base_sections = sections(baseline_text)
    canonical = dict(base_sections)
    shared = [t for t, _ in base_sections if t not in TOOL_LAYER]
    carrier_blocks = blocks(carrier_text)
    code_tools_pos = _code_tools_pos(carrier_text)

    edits = []       # (start, end, replacement) for body replacements
    insertions = []  # (position, text) for missing sections
    changes = []     # ("rewrite", tag) or ("insert", tag)

    for tag in shared:
        found = [(b[2], b[3], b[1]) for b in carrier_blocks if b[0] == tag]
        canonical_block = f"<{tag}>{canonical[tag]}</{tag}>\n"
        if tag in OVERLAY_TAGS:
            if not found:
                if code_tools_pos is None:
                    return changes, carrier_text, (
                        f"cannot insert <{tag}>: carrier has no <code_tools> line"
                    )
                insertions.append((code_tools_pos, canonical_block))
                changes.append(("insert", tag))
            else:
                start, end, body = found[-1]
                if body == canonical[tag]:
                    pass
                elif len(found) == 1:
                    # Overlay only: keep it and insert the canonical block after.
                    close_end = end + len(f"</{tag}>")
                    if close_end < len(carrier_text) and carrier_text[close_end] == "\n":
                        close_end += 1
                    insertions.append((close_end, canonical_block))
                    changes.append(("insert", tag))
                else:
                    edits.append((start, end, canonical[tag]))
                    changes.append(("rewrite", tag))
        elif found:
            for start, end, body in found:
                if body != canonical[tag]:
                    edits.append((start, end, canonical[tag]))
                    changes.append(("rewrite", tag))
        else:
            if code_tools_pos is None:
                return changes, carrier_text, (
                    f"cannot insert <{tag}>: carrier has no <code_tools> line"
                )
            insertions.append((code_tools_pos, canonical_block))
            changes.append(("insert", tag))

    if not changes:
        return changes, carrier_text, None

    # Stitch edits and insertions into the original text, sorted by position.
    # Insertions at the same offset stay in baseline order (stable sort).
    all_edits = edits + [(p, p, t) for p, t in insertions]
    all_edits.sort(key=lambda e: e[0])

    parts = []
    last = 0
    for start, end, replacement in all_edits:
        parts.append(carrier_text[last:start])
        parts.append(replacement)
        last = end
    parts.append(carrier_text[last:])
    new_text = "".join(parts)

    return changes, new_text, None


def _carrier_missing(path):
    """Return True when the carrier is absent, not merely unusable.

    A dangling symlink is not absent: it reaches the symlink rejection in
    _carrier_path_error instead of the not-found skip.
    """
    return not path.is_symlink() and not path.exists()


def _carrier_path_error(path):
    """Return an error string for an unusable existing path, else None.

    Missing paths are skipped by the caller, not reported here.
    """
    if path.is_symlink():
        return "symlink"
    if path.exists() and not path.is_file():
        return "not a file"
    return None


def _evaluate(baseline_text, carrier_text, label="carrier"):
    """Return (changes, new_text, plan_error, audit_failures) for one carrier."""
    changes, new_text, error = _plan(baseline_text, carrier_text)
    if error:
        return changes, new_text, error, []
    result = new_text if changes else carrier_text
    _, failures = audit(baseline_text, result, label)
    return changes, new_text, None, failures


def self_test():
    """Prove the planner preserves an overlay and that --check reuses the audit."""

    baseline_text = read_exact(BASELINE)
    ordered = sections(baseline_text)
    canonical = dict(ordered)
    overlay_body = "\na carrier persona overlay\n"
    overlay = f"<role>{overlay_body}</role>"
    overlay_only = baseline_text.replace(
        f"<role>{canonical['role']}</role>", overlay, 1
    )

    checks = []

    changes, new_text, error, failures = _evaluate(baseline_text, overlay_only)
    overlay_ok = (
        error is None
        and ("insert", "role") in changes
        and overlay in new_text
        and f"<role>{canonical['role']}</role>" in new_text
        and overlay_body in new_text
        and not failures
    )
    checks.append(("an overlay-only <role> keeps the overlay and inserts canonical", overlay_ok))

    extra = baseline_text + "\n<policy>\nsmuggled doctrine\n</policy>\n"
    changes, _, error, failures = _evaluate(baseline_text, extra)
    checks.append((
        "an unknown section fails the audit when shared bodies already match",
        error is None and not changes and bool(failures),
    ))

    tool_body = next(body for tag, body in ordered if tag == "code_tools")
    missing_tool = baseline_text.replace(
        f"<code_tools>{tool_body}</code_tools>", "", 1
    )
    changes, _, error, failures = _evaluate(baseline_text, missing_tool)
    checks.append((
        "a missing tool-layer section fails the audit when shared bodies match",
        error is None and not changes and bool(failures),
    ))

    with tempfile.TemporaryDirectory() as d:
        directory = Path(d)
        msg = _carrier_path_error(directory)
        checks.append(("an existing directory override is reported as not a file", msg == "not a file"))
        missing = directory / "absent.md"
        checks.append(("a missing path is not an error in _carrier_path_error", _carrier_path_error(missing) is None))
        file_path = directory / "carrier.md"
        file_path.write_text(baseline_text, encoding="utf-8")
        checks.append(("a regular file has no path error", _carrier_path_error(file_path) is None))
        linked = directory / "linked.md"
        linked.symlink_to(file_path)
        checks.append(("a symlink carrier is rejected", _carrier_path_error(linked) == "symlink"))
        dangling = directory / "dangling.md"
        dangling.symlink_to(directory / "no-such-target.md")
        checks.append((
            "a dangling symlink reaches the symlink rejection, not the skip",
            _carrier_path_error(dangling) == "symlink",
        ))
        saved_argv, saved_stdout, saved_stderr = sys.argv, sys.stdout, sys.stderr
        sys.argv = [
            "sync-carriers.py",
            "--carrier", f"codex={dangling}",
            "--carrier", f"omp={file_path}",
        ]
        captured = io.StringIO()
        sys.stdout = sys.stderr = captured
        try:
            ret = main()
        finally:
            sys.argv, sys.stdout, sys.stderr = saved_argv, saved_stdout, saved_stderr
        checks.append((
            "main rejects a dangling-symlink carrier override",
            ret == 1 and "symlink" in captured.getvalue(),
        ))

    passed = 0
    for label, ok in checks:
        print(f"{'PASS' if ok else 'FAIL'}: {label}", file=sys.stdout if ok else sys.stderr)
        passed += bool(ok)
    print(f"sync-carriers self-test: {passed}/{len(checks)} passed")
    return 0 if passed == len(checks) else 1


def main():
    args = sys.argv[1:]
    check_mode = False
    overrides = {}

    i = 0
    while i < len(args):
        arg = args[i]
        if arg == "--check":
            check_mode = True
            i += 1
        elif arg == "--self-test":
            return self_test()
        elif arg == "--carrier":
            i += 1
            if i >= len(args):
                print("sync-carriers: --carrier needs NAME=PATH", file=sys.stderr)
                return 2
            spec = args[i]
            if "=" not in spec:
                print(
                    f"sync-carriers: --carrier expects NAME=PATH, got {spec!r}",
                    file=sys.stderr,
                )
                return 2
            name, _, raw_path = spec.partition("=")
            name = name.strip()
            if name not in ("codex", "omp"):
                print(
                    f"sync-carriers: --carrier name must be 'codex' or 'omp', "
                    f"got {name!r}",
                    file=sys.stderr,
                )
                return 2
            overrides[name] = Path(raw_path)
            i += 1
        elif arg in ("--help", "-h"):
            print(_USAGE, end="")
            return 0
        else:
            print(f"sync-carriers: unknown argument {arg!r}", file=sys.stderr)
            return 2

    if not BASELINE.exists():
        print(f"sync-carriers: {BASELINE} is missing", file=sys.stderr)
        return 1
    baseline_text = read_exact(BASELINE)

    # Build the carrier list, applying overrides.
    carriers = []
    for c in CARRIERS:
        name = _carrier_name(c)
        if name and name in overrides:
            carriers.append((name, overrides[name]))
        else:
            carriers.append((name or str(c), c))

    any_change = False
    any_error = False
    in_sync = 0

    for _name, path in carriers:
        if _carrier_missing(path):
            print(f"sync-carriers: {path}: not found, skipped")
            continue
        path_error = _carrier_path_error(path)
        if path_error:
            print(f"sync-carriers: {path}: {path_error}", file=sys.stderr)
            any_error = True
            continue

        carrier_text = read_exact(path)
        changes, new_text, error, failures = _evaluate(
            baseline_text, carrier_text, str(path)
        )

        if error:
            print(f"sync-carriers: {path}: {error}", file=sys.stderr)
            any_error = True
            continue

        if changes and not check_mode:
            tmp_path = None
            try:
                with tempfile.NamedTemporaryFile(
                    dir=path.parent,
                    prefix=f".{path.name}.tmp.",
                    mode="wb",
                    delete=False,
                ) as tmp:
                    tmp.write(new_text.encode("utf-8"))
                    tmp_path = Path(tmp.name)
                if path.exists():
                    os.chmod(tmp_path, path.stat().st_mode)
                os.replace(tmp_path, path)
            except PermissionError:
                if tmp_path is not None and tmp_path.exists():
                    try:
                        os.unlink(tmp_path)
                    except OSError:
                        # Temp cleanup is best-effort; the real error is already reported.
                        pass
                # Report and keep going: the other carrier still gets repaired.
                print(f"sync-carriers: {path}: not writable, skipped", file=sys.stderr)
                any_error = True
                continue
        for action, tag in changes:
            if action == "insert":
                verb = "would insert" if check_mode else "inserted"
            else:
                verb = "would rewrite" if check_mode else "rewrote"
            print(f"sync-carriers: {path}: {verb} <{tag}>")

        for line in failures:
            print(f"sync-carriers: {line}", file=sys.stderr)
            any_error = True

        if changes:
            any_change = True
        elif not failures:
            in_sync += 1
            if not check_mode:
                print(f"sync-carriers: {path}: in sync")

    if check_mode:
        if any_change or any_error:
            return 1
        print(f"sync-carriers: {in_sync} carrier(s) in sync")
        return 0

    return 1 if any_error else 0


if __name__ == "__main__":
    sys.exit(main())
