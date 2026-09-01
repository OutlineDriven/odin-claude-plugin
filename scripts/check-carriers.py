#!/usr/bin/env python3
"""Prove each external harness carrier holds the canonical shared doctrine.

AGENTS.md fixes the rule this enforces: every harness-independent section must match
`system-prompt-baseline.md` byte for byte, while each carrier keeps its own tool layer.
So the four tool-surface sections are allowed to diverge and the rest are not.

A style check cannot stand in for this. Running the voice gate over a carrier passes for
any style-clean file, whatever doctrine it carries, which is the defect class this
replaces.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASELINE = ROOT / "system-prompt-baseline.md"

CARRIERS = (
    Path.home() / ".codex" / "AGENTS.md",
    Path.home() / ".omp" / "agent" / "AGENTS.md",
)

# Sections that carry harness tool names, and so are expected to differ.
# AGENTS.md: "Preserve each carrier's harness-specific <code_tools> layer and tool
# names. Codex shells out through rtk; omp and Claude Code provide native file tools."
TOOL_LAYER = frozenset({"git", "directives", "code_tools", "thinking"})


def sections(text):
    """Return ordered (tag, body) for whole-line <tag> ... </tag> blocks.

    The match is anchored to a full line on purpose. An unanchored pattern starts on a
    tag name mentioned in prose and swallows the neighbouring section, which reports
    drift that is not there.
    """
    marks = [
        (m.group(1), m.group(0).startswith("</"), m.start(), m.end())
        for m in re.finditer(r"^</?(\w[\w-]*)>$", text, re.M)
    ]
    out, stack = [], []
    for tag, closing, start, end in marks:
        if not closing:
            stack.append((tag, end))
        elif stack and stack[-1][0] == tag:
            open_tag, body_start = stack.pop()
            out.append((open_tag, text[body_start:start]))
    return out


def audit(baseline_text, carrier_path):
    """Return (shared_matched, failures) for one carrier."""
    if not carrier_path.exists():
        return 0, [f"{carrier_path}: absent"]
    carrier = dict(sections(carrier_path.read_text("utf-8")))
    failures, matched = [], 0
    for tag, body in sections(baseline_text):
        if tag in TOOL_LAYER:
            continue
        found = carrier.get(tag)
        if found is None:
            failures.append(f"{carrier_path.name}: section <{tag}> is absent")
        elif found != body:
            failures.append(f"{carrier_path.name}: section <{tag}> diverges from the baseline")
        else:
            matched += 1
    return matched, failures


def main():
    if not BASELINE.exists():
        print(f"check-carriers: {BASELINE} is missing", file=sys.stderr)
        return 1
    baseline_text = BASELINE.read_text("utf-8")
    shared = [t for t, _ in sections(baseline_text) if t not in TOOL_LAYER]
    present = [c for c in CARRIERS if c.exists()]
    if not present:
        # The carriers live outside this repository, in the home directory of whoever
        # runs the harness. A contributor who does not use Codex or omp has neither, and
        # must not be blocked by their absence.
        print("check-carriers: no external carrier is installed here, nothing to compare")
        return 0
    all_failures, total = [], 0
    for carrier in present:
        matched, failures = audit(baseline_text, carrier)
        total += matched
        all_failures += failures
        state = "ok" if not failures else f"{len(failures)} problem(s)"
        print(f"check-carriers: {carrier} {matched}/{len(shared)} shared sections match, {state}")
    for line in all_failures:
        print(f"check-carriers: {line}", file=sys.stderr)
    print(f"check-carriers: {total}/{len(shared) * len(present)} shared section comparisons matched")
    return 1 if all_failures else 0


def self_test():
    """Prove the audit reports a planted divergence rather than passing everything."""
    import tempfile

    baseline_text = BASELINE.read_text("utf-8")
    shared = [t for t, _ in sections(baseline_text) if t not in TOOL_LAYER]
    checks = []

    live = [c for c in CARRIERS if c.exists()]
    checks.append(("an installed carrier is available to compare", bool(live)))

    clean = bool(live) and all(not audit(baseline_text, c)[1] for c in live)
    checks.append(("every installed carrier matches the baseline", clean))

    with tempfile.TemporaryDirectory() as d:
        # A carrier with one shared section altered must fail.
        victim = shared[-1]
        body = dict(sections(baseline_text))[victim]
        mutated = Path(d) / "mutated.md"
        mutated.write_text(
            baseline_text.replace(body, body + "\nan unauthorised doctrine line\n", 1), "utf-8"
        )
        checks.append((f"an altered <{victim}> is caught", bool(audit(baseline_text, mutated)[1])))

        # A carrier whose tool layer differs must still pass.
        tool = sorted(TOOL_LAYER)[0]
        tbody = dict(sections(baseline_text)).get(tool)
        if tbody:
            tolerant = Path(d) / "toolonly.md"
            tolerant.write_text(
                baseline_text.replace(tbody, tbody + "\na harness-specific tool line\n", 1), "utf-8"
            )
            checks.append((f"a differing <{tool}> is tolerated", not audit(baseline_text, tolerant)[1]))

        # A carrier missing a shared section must fail.
        gone = Path(d) / "missing.md"
        gone.write_text(baseline_text.replace(f"<{shared[-1]}>", "<removed>", 1), "utf-8")
        checks.append((f"a missing <{shared[-1]}> is caught", bool(audit(baseline_text, gone)[1])))

    passed = 0
    for label, ok in checks:
        print(f"{'PASS' if ok else 'FAIL'}: {label}", file=sys.stderr if not ok else sys.stdout)
        passed += bool(ok)
    print(f"check-carriers self-test: {passed}/{len(checks)} passed")
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    sys.exit(self_test() if "--self-test" in sys.argv else main())
