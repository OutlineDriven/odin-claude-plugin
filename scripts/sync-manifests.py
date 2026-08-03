#!/usr/bin/env python3
"""Keep every harness manifest in lockstep with the canonical Claude manifest.

`.claude-plugin/plugin.json` owns `version` and `description`. Every other manifest either
mirrors those (the version-carrying set) or is static metadata validated for shape only.

The static catalogs disagree with each other by design: Codex requires a local `"./"`
source, Kimi rejects one and requires a URL. That contradiction is encoded here rather
than left in prose for someone to rediscover.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
CANONICAL = REPO_ROOT / ".claude-plugin" / "plugin.json"

# Manifests mirroring canonical `version`; the value is the extra key to mirror too.
VERSIONED = {
    "plugin.json": ("version", "description"),
    ".claude-plugin/plugin.json": ("version", "description"),
    ".cursor-plugin/plugin.json": ("version", "description"),
    ".kimi-plugin/plugin.json": ("version", "description"),
}
MARKETPLACE = ".claude-plugin/marketplace.json"

STATIC = (".cursor-plugin/marketplace.json", ".kimi-plugin/marketplace.json",
          ".agents/plugins/marketplace.json")


def load(rel: str) -> dict:
    path = REPO_ROOT / rel
    if not path.is_file():
        raise FileNotFoundError(rel)
    text = path.read_text(encoding="utf-8")
    if not text.strip():
        # check-json passes on a 0-byte file; this is the check that does not.
        raise ValueError(f"{rel}: file is empty")
    return json.loads(text)


def dump(rel: str, data: dict) -> None:
    (REPO_ROOT / rel).write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def validate_static(errors: list[str], plugin_name: str) -> None:
    """Shape checks for catalogs that carry no plugin version."""
    kimi = load(".kimi-plugin/marketplace.json")
    if kimi.get("version") != "2":
        errors.append(
            f".kimi-plugin/marketplace.json: schema version is {kimi.get('version')!r}, "
            'must be the literal "2" (this is the catalog schema, not the plugin version)'
        )
    for entry in kimi.get("plugins", []):
        source = entry.get("source")
        if not isinstance(source, str) or not source.strip():
            errors.append(f".kimi-plugin/marketplace.json: {entry.get('id')!r} needs a non-empty source")
        elif not re.match(r"^[a-z][a-z0-9+.-]*://\S+$", source.strip(), re.IGNORECASE):
            errors.append(
                f".kimi-plugin/marketplace.json: {entry.get('id')!r} source is {source!r}; "
                "Kimi rejects a self-referential source, it must be an absolute URL"
            )
    kimi_ids = sorted(e.get("id") for e in kimi.get("plugins", []))
    if kimi_ids != [plugin_name]:
        errors.append(f".kimi-plugin/marketplace.json: ids {kimi_ids} != [{plugin_name!r}]")

    codex = load(".agents/plugins/marketplace.json")
    for entry in codex.get("plugins", []):
        source = entry.get("source", {})
        if source.get("source") != "local":
            errors.append(
                f".agents/plugins/marketplace.json: {entry.get('name')!r} source.source is "
                f"{source.get('source')!r}; Codex requires \"local\" or the plugin preview shows no skills"
            )
        path_value = source.get("path")
        if not isinstance(path_value, str) or not path_value.startswith("./"):
            errors.append(
                f".agents/plugins/marketplace.json: {entry.get('name')!r} source.path is "
                f"{path_value!r}; Codex resolves it relative to the marketplace root and "
                'requires a "./"-prefixed path'
            )
        for key in ("policy", "category"):
            if not entry.get(key):
                errors.append(f".agents/plugins/marketplace.json: {entry.get('name')!r} missing {key}")
    codex_names = sorted(e.get("name") for e in codex.get("plugins", []))
    if codex_names != [plugin_name]:
        errors.append(f".agents/plugins/marketplace.json: names {codex_names} != [{plugin_name!r}]")

    cursor = load(".cursor-plugin/marketplace.json")
    cursor_names = sorted(e.get("name") for e in cursor.get("plugins", []))
    if cursor_names != [plugin_name]:
        errors.append(f".cursor-plugin/marketplace.json: names {cursor_names} != [{plugin_name!r}]")


def validate_skills_paths(errors: list[str]) -> None:
    for rel in VERSIONED:
        declared = load(rel).get("skills")
        if declared is None:
            continue
        target = (REPO_ROOT / rel).parent.parent / declared if rel != "plugin.json" \
            else REPO_ROOT / declared
        if not target.is_dir():
            errors.append(f"{rel}: declares skills {declared!r} but {target} is not a directory")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true",
                        help="report drift and exit non-zero instead of rewriting")
    args = parser.parse_args()

    try:
        canonical = load(".claude-plugin/plugin.json")
    except (FileNotFoundError, ValueError, json.JSONDecodeError) as err:
        print(f"error: canonical manifest unreadable: {err}", file=sys.stderr)
        return 2

    name, version = canonical["name"], canonical["version"]
    description = canonical["description"]

    errors: list[str] = []
    drifted: list[str] = []

    for rel, keys in VERSIONED.items():
        try:
            data = load(rel)
        except (FileNotFoundError, json.JSONDecodeError) as err:
            errors.append(f"{rel}: {err}")
            continue
        except ValueError as err:
            errors.append(str(err))  # already carries the path
            continue
        wanted = {"version": version, "description": description}
        changes = {k: wanted[k] for k in keys if data.get(k) != wanted[k]}
        if not changes:
            continue
        drifted.append(rel)
        if not args.check:
            data.update(changes)
            dump(rel, data)
            print(f"synced {rel} ({', '.join(changes)})")

    try:
        mkt = load(MARKETPLACE)
        if mkt.get("version") != version or mkt["plugins"][0].get("version") != version:
            drifted.append(MARKETPLACE)
            if not args.check:
                mkt["version"] = version
                mkt["plugins"][0]["version"] = version
                dump(MARKETPLACE, mkt)
                print(f"synced {MARKETPLACE} (version)")
    except (FileNotFoundError, ValueError, KeyError, IndexError, json.JSONDecodeError) as err:
        errors.append(f"{MARKETPLACE}: {err}")

    try:
        validate_static(errors, name)
        validate_skills_paths(errors)
    except (FileNotFoundError, ValueError, json.JSONDecodeError) as err:
        errors.append(str(err))

    if errors:
        print("error: manifest validation failed:", file=sys.stderr)
        for e in dict.fromkeys(errors):  # a broken file trips several checks; report once
            print(f"  {e}", file=sys.stderr)
        return 2
    if drifted:
        if args.check:
            print(f"error: manifests drifted from {CANONICAL.name} (version {version}):",
                  file=sys.stderr)
            for rel in drifted:
                print(f"  {rel}", file=sys.stderr)
            print("run scripts/sync-manifests.py to fix", file=sys.stderr)
        # Non-zero after a rewrite is deliberate and is the pre-commit contract: a hook
        # that edits the tree must fail so the run stops and the fixes get re-staged.
        # Same convention as trailing-whitespace. Exit 0 here would let drift ride
        # through in the very commit meant to correct it.
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
