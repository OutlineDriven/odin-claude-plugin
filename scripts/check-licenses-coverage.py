#!/usr/bin/env python3
"""Assert skills/LICENSES.md stays in sync with skills/*/SKILL.md and the filesystem.

Three checks, each independent:

1. Every `skills/*/SKILL.md` on disk has either a live (non-struck) row in
   LICENSES.md whose path is that SKILL.md, or is on the ODIN_ORIGINAL
   allowlist below (skills with no upstream-derived SKILL.md attribution).
2. Every struck-through (`~~...~~`) row's path does NOT exist on disk.
3. Every live (non-struck) row's path DOES exist on disk (files, directories
   with a trailing slash, and glob patterns all count).

Plain stdlib only -- no PyYAML, no frontmatter parser. The LICENSES.md table
is parsed with a simple per-line regex, not a markdown/YAML library.

Usage:
    python3 scripts/check-licenses-coverage.py \
        [--skills-root PATH] [--licenses PATH]

Exits 0 with no output on success. Exits 1 with every violation listed on
failure.
"""

from __future__ import annotations

import argparse
import glob
import os
import re
import sys

# ODIN_ORIGINAL: skills whose SKILL.md carries no upstream attribution row in
# LICENSES.md because they are wholly ODIN-authored (no vendored derivation
# to register). Derived mechanically: every skills/*/SKILL.md on disk minus
# every skill directory that owns a live (non-struck) `<dir>/SKILL.md` row in
# LICENSES.md. Recompute this exact diff before editing the list by hand --
# see scripts/check-licenses-coverage.py's own logic (build_owned_skill_dirs)
# for the derivation, or the task-16 report for the one-off command used.
ODIN_ORIGINAL = frozenset(
    {
        "ai-collab-protocols",
        "askme",
        "ast-grep",
        "atomic-issues-prs",
        "axiom-mode",
        "breaking-driven",
        "cascade-dedup",
        "clarify",
        "cleanup-codebase",
        "commit-push",
        "commit-push-current",
        "contexts",
        "contract-driven",
        "dedup-skills",
        "deps-upgrade",
        "design",
        "do-it-now",
        "duet",
        "exhaustive",
        "explore",
        "fix",
        "generate-my-taste",
        "gh-fix-ci",
        "git-branchless",
        "handoff",
        "init",
        "llm-self-loop",
        "memory-clean",
        "memory-sanitize",
        "memory-update",
        "minimalism-driven",
        "mutual-sync",
        "parallel-launch",
        "pr-merge-base",
        "pr-merge-temporal",
        "pr-review",
        "proof-driven",
        "propose-issue",
        "refactor-break-compat",
        "resolve",
        "review-fix-grill-loop",
        "security-review",
        "setup-gitignore",
        "shape",
        "simplify",
        "slop",
        "sophisticate-todos",
        "strict-validation-setup",
        "taste",
        "test-driven",
        "tests-adversarial",
        "tests-purge-unneeded",
        "tidy",
        "to-greenfield",
        "type-driven",
        "update-todos",
        "validation-first-driven",
        "verification-before-completion",
        "workflows-driven",
    }
)

# Matches a markdown table row whose first cell is a single backtick-quoted
# path, optionally struck through with ~~...~~, e.g.:
#   | `foo/SKILL.md` | ... |
#   | `~~foo/SKILL.md~~` | ... |
ROW_RE = re.compile(r"^\|\s*`([^`]+)`")


def parse_rows(licenses_text: str) -> list[tuple[bool, str]]:
    """Return (is_struck, path) for every table row in LICENSES.md."""
    rows = []
    for line in licenses_text.splitlines():
        m = ROW_RE.match(line.strip())
        if not m:
            continue
        raw = m.group(1)
        struck = raw.startswith("~~") and raw.endswith("~~")
        path = raw[2:-2] if struck else raw
        rows.append((struck, path))
    return rows


def path_exists(skills_root: str, path: str) -> bool:
    """True if `path` (relative to skills_root) resolves to something real.

    Handles plain files, trailing-slash directories, and glob patterns
    (e.g. `review/references/personas/*.md`).
    """
    full = os.path.join(skills_root, path)
    if "*" in path or "?" in path or "[" in path:
        return len(glob.glob(full)) > 0
    return os.path.exists(full)


def build_owned_skill_dirs(rows: list[tuple[bool, str]]) -> set[str]:
    """Skill directories with a live `<dir>/SKILL.md` row."""
    owned = set()
    for struck, path in rows:
        if struck:
            continue
        if path.endswith("/SKILL.md"):
            owned.add(path[: -len("/SKILL.md")])
    return owned


def find_skill_md_files(skills_root: str) -> list[str]:
    """Every skills/*/SKILL.md on disk, as skill-dir names."""
    dirs = []
    for name in sorted(os.listdir(skills_root)):
        full = os.path.join(skills_root, name)
        if os.path.isdir(full) and os.path.isfile(os.path.join(full, "SKILL.md")):
            dirs.append(name)
    return dirs


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    parser.add_argument(
        "--skills-root",
        default=os.path.join(repo_root, "skills"),
        help="Path to the skills/ directory (default: repo-relative skills/).",
    )
    parser.add_argument(
        "--licenses",
        default=None,
        help="Path to LICENSES.md (default: <skills-root>/LICENSES.md).",
    )
    args = parser.parse_args()

    skills_root = args.skills_root
    licenses_path = args.licenses or os.path.join(skills_root, "LICENSES.md")

    violations: list[str] = []

    try:
        with open(licenses_path, encoding="utf-8") as f:
            licenses_text = f.read()
    except OSError as exc:
        print(f"FATAL: cannot read {licenses_path}: {exc}", file=sys.stderr)
        return 1

    rows = parse_rows(licenses_text)
    owned_skill_dirs = build_owned_skill_dirs(rows)

    # Check 2 + 3: every row's path must match its strike state.
    for struck, path in rows:
        exists = path_exists(skills_root, path)
        if struck and exists:
            violations.append(
                f"struck row still exists on disk (unstrike or delete the file): `{path}`"
            )
        if not struck and not exists:
            violations.append(
                f"live row's file is missing (strike it or restore the file): `{path}`"
            )

    # Check 1: every skills/*/SKILL.md is either licensed or allowlisted.
    for skill in find_skill_md_files(skills_root):
        if skill in owned_skill_dirs:
            continue
        if skill in ODIN_ORIGINAL:
            continue
        violations.append(
            f"skills/{skill}/SKILL.md has no live LICENSES.md row and is not on "
            "the ODIN_ORIGINAL allowlist in scripts/check-licenses-coverage.py "
            "-- add a LICENSES.md row or add it to ODIN_ORIGINAL if it is "
            "genuinely ODIN-authored"
        )

    # Flag allowlist entries that no longer exist as skills (stale allowlist).
    disk_skills = set(find_skill_md_files(skills_root))
    for skill in sorted(ODIN_ORIGINAL - disk_skills):
        violations.append(
            f"ODIN_ORIGINAL lists `{skill}` but skills/{skill}/SKILL.md no "
            "longer exists -- remove it from the allowlist"
        )

    if violations:
        print(
            f"check-licenses-coverage: {len(violations)} violation(s) found:",
            file=sys.stderr,
        )
        for v in violations:
            print(f"  - {v}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
