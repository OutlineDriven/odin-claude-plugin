#!/usr/bin/env python3
"""Regenerate the embedded doctrine cascade in every output-style.

Each output-style is a persona preamble followed by a byte-identical copy of
`system-prompt-baseline.md`. The Claude Code loader does not resolve references, so the
copy cannot be replaced by a pointer -- it has to be embedded, and therefore generated.

The cascade starts at the file's SECOND `<role>` line: the first opens the persona voice,
the second opens the canonical charter.

Byte-exact throughout: text-mode reads translate platform newlines, so a CRLF-only change
would compare equal to the expected bytes and survive a rewrite. Every read, compare, and
write uses raw bytes; each raw input is decoded once to keep strict UTF-8 validation.
"""

import argparse
import sys
import traceback
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CANONICAL = REPO_ROOT / "system-prompt-baseline.md"
STYLES_DIR = REPO_ROOT / "plugins" / "odin-core" / "output-styles"
ROLE_LINE = b"<role>"


class CascadeError(Exception):
    """A style file does not have the structure the generator requires."""


def read_utf8_bytes(path: Path) -> bytes:
    """Return the file's raw bytes, failing on invalid UTF-8."""
    raw = path.read_bytes()
    raw.decode("utf-8")
    return raw


def split_preamble(path: Path) -> bytes:
    """Return everything before the style's cascade region.

    Raises CascadeError when the file lacks the two `<role>` lines the layout requires,
    rather than silently emitting a file with no persona or a doubled charter.
    """
    lines = read_utf8_bytes(path).splitlines(keepends=True)
    role_indices = [i for i, line in enumerate(lines) if line.rstrip(b"\r\n") == ROLE_LINE]
    if len(role_indices) < 2:
        raise CascadeError(
            f"{path.relative_to(REPO_ROOT)}: found {len(role_indices)} '<role>' line(s), "
            "need at least 2 (persona voice, then canonical charter)"
        )
    return b"".join(lines[: role_indices[1]])


def render(path: Path, canonical: bytes) -> bytes:
    return split_preamble(path) + canonical


def drifted_from_canonical(path: Path, canonical: bytes) -> bool:
    """Return True when one style's bytes differ from the expected cascade."""
    return read_utf8_bytes(path) != render(path, canonical)


def check_one(path: Path, canonical: bytes) -> bool:
    """Report drift for one style without writing."""
    return drifted_from_canonical(path, canonical)


def sync_one(path: Path, canonical: bytes) -> bool:
    """Rewrite one style when it drifted. Return True when it differed."""
    if not drifted_from_canonical(path, canonical):
        return False
    path.write_bytes(render(path, canonical))
    print(f"synced {path.relative_to(REPO_ROOT)}")
    return True


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
        canonical = read_utf8_bytes(CANONICAL)
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
            changed = check_one(path, canonical) if args.check else sync_one(path, canonical)
            if changed:
                drifted.append(str(path.relative_to(REPO_ROOT)))
        except (CascadeError, OSError, UnicodeDecodeError) as err:
            # A crashed run must not share the rewrite exit 1, which the
            # render recipe treats as success.
            print(f"error: {err}", file=sys.stderr)
            return 2

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
    try:
        sys.exit(main())
    except Exception:
        # Exit 1 is the re-stage convention; an unhandled exception must never
        # share it, so convert every crash to the hard-fail code the recipe rejects.
        traceback.print_exc()
        sys.exit(2)
