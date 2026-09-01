#!/usr/bin/env python3
"""Strict-YAML validation of every SKILL.md frontmatter.

The manifest gate (scripts/render-skill-manifests.mjs) parses frontmatter with a
hand-rolled scalar reader that uses lastIndexOf("'") to bracket single-quoted
values, so an unescaped apostrophe inside the scalar is silently swallowed
instead of rejected. `gh skill publish` uses a strict YAML parser and rejects
the same file with `yaml: did not find expected key`, leaving the skill
unpublishable on the Agent Plugins surface while every local gate stays green.

This checker closes that hole: it enumerates exactly the skills the catalog
publishes (every direct subdirectory of plugins/<id>/skills/) and runs
yaml.safe_load over each frontmatter block, failing on the same malformed
scalars a strict parser rejects. It is wired into .pre-commit-config.yaml as a
local hook with pass_filenames: false, so it runs over all skills whenever any
SKILL.md or the catalog changes.
"""
import json
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent


def catalog_skills():
    """Yield (plugin_id, slug, skill_md_path) for every catalog-published skill."""
    catalog = json.loads((ROOT / "catalog" / "plugins.json").read_text("utf-8"))
    if catalog.get("schema") != "odin-plugin-catalog/v1":
        raise SystemExit(f"unexpected catalog schema: {catalog.get('schema')}")
    for entry in catalog["entries"]:
        skills_dir = ROOT / entry["directory"] / "skills"
        if not skills_dir.is_dir():
            continue
        for slug in sorted(d.name for d in skills_dir.iterdir() if d.is_dir()):
            yield entry["id"], slug, skills_dir / slug / "SKILL.md"


def extract_frontmatter(text):
    """Return the raw frontmatter block (without the --- fences) or None."""
    if not text.startswith("---\n"):
        return None
    end = text.find("\n---", 4)
    if end == -1:
        return None
    return text[4:end]


def main():
    failures = []
    total = 0
    for plugin_id, slug, path in catalog_skills():
        total += 1
        if not path.is_file():
            failures.append(f"{path.relative_to(ROOT)}: missing SKILL.md")
            continue
        text = path.read_text("utf-8")
        fm = extract_frontmatter(text)
        if fm is None:
            failures.append(f"{path.relative_to(ROOT)}: missing frontmatter fences")
            continue
        try:
            data = yaml.safe_load(fm)
        except yaml.YAMLError as e:
            # Trim the multi-line parser traceback to the first diagnostic line.
            first = str(e).strip().splitlines()[0]
            failures.append(f"{path.relative_to(ROOT)}: {first}")
            continue
        if not isinstance(data, dict):
            failures.append(f"{path.relative_to(ROOT)}: frontmatter is not a mapping")
            continue
        for key in ("name", "description"):
            if key not in data:
                failures.append(f"{path.relative_to(ROOT)}: missing required key '{key}'")

    if failures:
        for f in failures:
            print(f"check-skill-frontmatter: {f}", file=sys.stderr)
        print(
            f"check-skill-frontmatter: {len(failures)} of {total} skill(s) failed",
            file=sys.stderr,
        )
        sys.exit(1)
    print(f"check-skill-frontmatter: {total} skill(s) ok")


if __name__ == "__main__":
    main()
