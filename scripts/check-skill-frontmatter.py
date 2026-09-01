#!/usr/bin/env python3
"""Strict-scalar validation of every SKILL.md frontmatter, standard library only.

The manifest gate (scripts/render-skill-manifests.mjs) parses frontmatter with a
hand-rolled scalar reader that uses lastIndexOf("'") to bracket single-quoted
values, so an unescaped apostrophe inside the scalar is silently swallowed
instead of rejected. `gh skill publish` uses a strict YAML parser and rejects
the same file with `yaml: did not find expected key`, leaving the skill
unpublishable on the Agent Plugins surface while every local gate stays green.

This checker closes that hole without a third-party parser. The repository
constraint is that every script is dependency-free Node ESM or standard-library
Python, and an `import yaml` here would take the whole gate set down with
ModuleNotFoundError on any machine without PyYAML.

A YAML reimplementation is not needed, because the frontmatter shape is closed:
one flat mapping, keys drawn from a fixed set, values either plain or quoted on
a single line. No block scalars, no flow collections, no continuation lines. The
checker validates exactly that shape and walks each quoted scalar by the quoting
rules a strict parser applies. Anything outside the shape fails loudly and names
what it saw, so an author who introduces a new value form is told to extend the
checker rather than passing silently.

Run `--self-test` to check the checker against its own fixtures.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ALLOWED_KEYS = {"name", "description", "disable-model-invocation", "argument-hint", "allowed-tools"}
REQUIRED_KEYS = ("name", "description")
# A plain scalar starting with one of these is an indicator character in YAML and
# means something other than the text it appears to be.
PLAIN_INDICATORS = "[]{}&*!|>%@`\"'#,?:"


def scan_single_quoted(value):
    """Walk a single-quoted scalar. Return None when valid, else the reason."""
    i = 1
    while i < len(value):
        c = value[i]
        if c != "'":
            i += 1
            continue
        if value[i + 1 : i + 2] == "'":  # '' is one literal apostrophe
            i += 2
            continue
        rest = value[i + 1 :].strip()
        if rest:
            return f"content after the closing quote: {rest[:40]!r}"
        return None
    return "single-quoted scalar never closes"


def scan_double_quoted(value):
    """Walk a double-quoted scalar. Return None when valid, else the reason."""
    i = 1
    while i < len(value):
        c = value[i]
        if c == "\\":
            i += 2
            continue
        if c == '"':
            rest = value[i + 1 :].strip()
            if rest:
                return f"content after the closing quote: {rest[:40]!r}"
            return None
        i += 1
    return "double-quoted scalar never closes"


def scan_plain(value):
    """Validate a plain (unquoted) scalar. Return None when valid, else the reason."""
    if value[0] in PLAIN_INDICATORS:
        return f"plain scalar starts with the indicator character {value[0]!r}"
    if ": " in value or value.endswith(":"):
        return "plain scalar contains ': ', which a parser reads as a nested mapping"
    if " #" in value:
        return "plain scalar contains ' #', which a parser reads as a comment"
    return None


def check_frontmatter(text):
    """Return a list of reasons the frontmatter is not strictly parseable."""
    if not text.startswith("---\n"):
        return ["missing opening frontmatter fence"]
    end = text.find("\n---", 4)
    if end == -1:
        return ["missing closing frontmatter fence"]

    reasons = []
    seen = []
    for lineno, line in enumerate(text[4:end].splitlines(), start=2):
        if not line.strip():
            continue
        if line[0].isspace():
            reasons.append(f"line {lineno}: indented continuation line is outside the supported shape")
            continue
        key, sep, raw = line.partition(":")
        if not sep or not key or not all(c.isalnum() or c in "_-" for c in key):
            reasons.append(f"line {lineno}: not a 'key: value' pair")
            continue
        seen.append(key)
        if key not in ALLOWED_KEYS:
            reasons.append(f"line {lineno}: unknown key {key!r}")
        value = raw.strip()
        if not value:
            reasons.append(f"line {lineno}: key {key!r} has an empty value")
            continue
        why = (
            scan_single_quoted(value) if value[0] == "'"
            else scan_double_quoted(value) if value[0] == '"'
            else scan_plain(value)
        )
        if why:
            reasons.append(f"line {lineno}: key {key!r}: {why}")

    for key in REQUIRED_KEYS:
        if key not in seen:
            reasons.append(f"missing required key {key!r}")
    for key in sorted({k for k in seen if seen.count(k) > 1}):
        reasons.append(f"duplicate key {key!r}")
    return reasons


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


CASES = [
    ("a properly escaped apostrophe is clean",
     "---\nname: x\ndescription: 'Use when it''s needed. Not for other things.'\n---\n", True),
    ("an unescaped apostrophe mid-scalar is caught",
     "---\nname: x\ndescription: 'Use when it's needed. Not for other things.'\n---\n", False),
    ("a scalar that never closes is caught",
     "---\nname: x\ndescription: 'Use when needed.\n---\n", False),
    ("trailing content after the closing quote is caught",
     "---\nname: x\ndescription: 'Use when needed.' stray\n---\n", False),
    ("a plain scalar is clean",
     "---\nname: x\ndescription: 'y'\ndisable-model-invocation: true\n---\n", True),
    ("a plain scalar carrying ': ' is caught",
     "---\nname: a: b\ndescription: 'y'\n---\n", False),
    ("a plain scalar opening a flow sequence is caught",
     "---\nname: x\ndescription: 'y'\nallowed-tools: [Read, Bash]\n---\n", False),
    ("a missing required key is caught",
     "---\nname: x\n---\n", False),
    ("an unknown key is caught",
     "---\nname: x\ndescription: 'y'\nlicense: MIT\n---\n", False),
    ("a duplicate key is caught",
     "---\nname: x\ndescription: 'y'\ndescription: 'z'\n---\n", False),
    ("an indented continuation line is caught",
     "---\nname: x\ndescription: 'y'\n  continued: here\n---\n", False),
    ("a missing closing fence is caught",
     "---\nname: x\ndescription: 'y'\n", False),
    ("a double-quoted scalar with an escaped quote is clean",
     '---\nname: x\ndescription: "Use when \\"quoted\\" text appears."\n---\n', True),
    ("an empty value is caught",
     "---\nname: x\ndescription:\n---\n", False),
]


def self_test():
    passed = 0
    for label, text, want_clean in CASES:
        reasons = check_frontmatter(text)
        got_clean = not reasons
        ok = got_clean == want_clean
        passed += ok
        if not ok:
            print(f"FAIL: {label} (expected {'clean' if want_clean else 'caught'}, "
                  f"got {reasons or 'clean'})", file=sys.stderr)
        else:
            print(f"PASS: {label}")
    print(f"check-skill-frontmatter self-test: {passed}/{len(CASES)} passed")
    sys.exit(0 if passed == len(CASES) else 1)


def main():
    if "--self-test" in sys.argv:
        self_test()
    failures = []
    total = 0
    for _plugin_id, _slug, path in catalog_skills():
        total += 1
        rel = path.relative_to(ROOT)
        if not path.is_file():
            failures.append(f"{rel}: missing SKILL.md")
            continue
        for reason in check_frontmatter(path.read_text("utf-8")):
            failures.append(f"{rel}: {reason}")

    if failures:
        for f in failures:
            print(f"check-skill-frontmatter: {f}", file=sys.stderr)
        print(f"check-skill-frontmatter: {len(failures)} failure(s) across {total} skill(s)",
              file=sys.stderr)
        sys.exit(1)
    print(f"check-skill-frontmatter: {total} skill(s) ok")


if __name__ == "__main__":
    main()
