#!/usr/bin/env python3
"""Rewrite each external carrier's shared doctrine from the baseline.

The carriers live outside the repository, in the home directory of whoever runs
the harness. Their shared sections must match `system-prompt-baseline.md` byte
for byte, while each keeps its own tool layer. This generator does what
`check-carriers.py` proves: it rewrites every shared section from the baseline
and leaves the four tool-layer sections alone.

Run it by hand (`just sync-carriers`), never as a hook. A hook that rewrites
home-directory files on every commit would fire on machines with no carriers
to repair.
"""

import importlib.util
import re
import sys
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
TOOL_LAYER = _mod.TOOL_LAYER
OVERLAY_TAGS = _mod.OVERLAY_TAGS
read_exact = _mod.read_exact

ROOT = Path(__file__).resolve().parent.parent
BASELINE = ROOT / "system-prompt-baseline.md"

_TAG_RE = re.compile(r"^</?(\w[\w-]*)>$", re.M)

_USAGE = """\
Usage: sync-carriers.py [options]

Rewrite each external carrier's shared doctrine sections from the baseline.

Options:
  --check            Report what would change; exit 1 if anything would,
                     otherwise print the in-sync count and exit 0.
  --carrier NAME=PATH
                     Override the carrier path for NAME (codex or omp).
                     Repeatable; a missing path is skipped with a notice.
  -h, --help         Show this help and exit.

With no arguments, rewrites every carrier that exists. A missing carrier
prints a notice and is skipped. The four tool-layer sections (git, directives,
code_tools, thinking) are never modified.
"""


def _blocks(text):
    """Return ordered (tag, body, body_start, body_end) for whole-line tag blocks.

    Mirrors sections() in check-carriers.py but keeps the byte offsets needed
    to replace a body in place.
    """
    marks = [
        (m.group(1), m.group(0).startswith("</"), m.start(), m.end())
        for m in _TAG_RE.finditer(text)
    ]
    stack = []
    out = []
    for tag, closing, start, end in marks:
        if not closing:
            stack.append((tag, end))
        elif stack and stack[-1][0] == tag:
            open_tag, body_start = stack.pop()
            out.append((open_tag, text[body_start:start], body_start, start))
    return out


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
    canonical = dict(sections(baseline_text))
    shared = [t for t, _ in sections(baseline_text) if t not in TOOL_LAYER]

    blocks = _blocks(carrier_text)
    code_tools_pos = _code_tools_pos(carrier_text)

    edits = []       # (start, end, replacement) for body replacements
    insertions = []  # (position, text) for missing sections
    changes = []     # ("rewrite", tag) or ("insert", tag)

    for tag in shared:
        found = [(b[2], b[3], b[1]) for b in blocks if b[0] == tag]
        if found:
            if tag in OVERLAY_TAGS:
                # Replace only the last block; earlier overlays stay.
                start, end, body = found[-1]
                if body != canonical[tag]:
                    edits.append((start, end, canonical[tag]))
                    changes.append(("rewrite", tag))
            else:
                for start, end, body in found:
                    if body != canonical[tag]:
                        edits.append((start, end, canonical[tag]))
                        changes.append(("rewrite", tag))
        else:
            if code_tools_pos is None:
                return changes, carrier_text, (
                    f"cannot insert <{tag}>: carrier has no <code_tools> line"
                )
            insertions.append(
                (code_tools_pos, f"<{tag}>{canonical[tag]}</{tag}>\n")
            )
            changes.append(("insert", tag))

    if not changes:
        return changes, carrier_text, None

    # Stitch edits and insertions into the original text, sorted by position.
    # Insertions at the same offset stay in baseline order (stable sort).
    all_edits = [(s, e, r) for s, e, r in edits]
    all_edits += [(p, p, t) for p, t in insertions]
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
        if not path.exists():
            print(f"sync-carriers: {path}: not found, skipped")
            continue

        carrier_text = read_exact(path)
        changes, new_text, error = _plan(baseline_text, carrier_text)

        if error:
            print(f"sync-carriers: {path}: {error}", file=sys.stderr)
            any_error = True
            continue

        if not changes:
            in_sync += 1
            if not check_mode:
                print(f"sync-carriers: {path}: in sync")
            continue

        any_change = True
        if not check_mode:
            try:
                path.write_bytes(new_text.encode("utf-8"))
            except PermissionError:
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

    if check_mode:
        if any_change or any_error:
            return 1
        print(f"sync-carriers: {in_sync} carrier(s) in sync")
        return 0

    return 1 if any_error else 0


if __name__ == "__main__":
    sys.exit(main())
