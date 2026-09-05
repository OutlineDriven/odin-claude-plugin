#!/usr/bin/env python3
"""Regenerate the embedded doctrine cascade in every output-style.

Each output-style is a persona preamble followed by a byte-identical copy of
`system-prompt-baseline.md`. The Claude Code loader does not resolve references, so the
copy cannot be replaced by a pointer -- it has to be embedded, and therefore generated.

The cascade starts at the file's SECOND `<role>` line: the first opens the persona voice,
the second opens the canonical charter.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CANONICAL = REPO_ROOT / "system-prompt-baseline.md"
STYLES_DIR = REPO_ROOT / "plugins" / "odin-core" / "output-styles"
ROLE_LINE = "<role>"


class CascadeError(Exception):
    """A style file does not have the structure the generator requires."""


def split_preamble(path: Path) -> str:
    """Return everything before the style's cascade region.

    Raises CascadeError when the file lacks the two `<role>` lines the layout requires,
    rather than silently emitting a file with no persona or a doubled charter.
    """
    lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
    role_indices = [i for i, line in enumerate(lines) if line.rstrip("\r\n") == ROLE_LINE]
    if len(role_indices) < 2:
        raise CascadeError(
            f"{path.relative_to(REPO_ROOT)}: found {len(role_indices)} '{ROLE_LINE}' line(s), "
            "need at least 2 (persona voice, then canonical charter)"
        )
    return "".join(lines[: role_indices[1]])


def render(path: Path, canonical: str) -> str:
    return split_preamble(path) + canonical


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="report drift and exit non-zero instead of rewriting",
    )
    parser.add_argument(
        "files",
        nargs="*",
        type=Path,
        help="style files to process (default: every output-styles/*.md)",
    )
    args = parser.parse_args()

    if not CANONICAL.is_file():
        print(f"error: canonical baseline missing at {CANONICAL}", file=sys.stderr)
        return 2
    try:
        canonical = CANONICAL.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as err:
        # A crashed run must not share the rewrite exit 1, which the
        # render recipe treats as success.
        print(f"error: {err}", file=sys.stderr)
        return 2

    targets = args.files or sorted(STYLES_DIR.glob("*.md"))
    # pre-commit passes every staged file; keep only the styles this script owns.
    targets = [p for p in targets if p.resolve().parent == STYLES_DIR]
    if not targets:
        return 0

    drifted: list[str] = []
    for path in targets:
        try:
            expected = render(path, canonical)
            drifted_now = path.read_text(encoding="utf-8") != expected
            if drifted_now and not args.check:
                path.write_text(expected, encoding="utf-8")
                print(f"synced {path.relative_to(REPO_ROOT)}")
        except (CascadeError, OSError, UnicodeDecodeError) as err:
            # A crashed run must not share the rewrite exit 1, which the
            # render recipe treats as success.
            print(f"error: {err}", file=sys.stderr)
            return 2
        if drifted_now:
            drifted.append(str(path.relative_to(REPO_ROOT)))

    if not drifted:
        return 0
    if args.check:
        print(
            "error: output-style cascade drifted from system-prompt-baseline.md:",
            file=sys.stderr,
        )
        for rel in drifted:
            print(f"  {rel}", file=sys.stderr)
        print("run scripts/sync-baseline.py to fix", file=sys.stderr)
        return 1
    return 1  # files were rewritten; fail the hook so the run is re-staged


if __name__ == "__main__":
    sys.exit(main())
