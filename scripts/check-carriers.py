#!/usr/bin/env python3
"""Prove each external harness carrier holds the canonical shared doctrine.

AGENTS.md fixes the rule this enforces: every harness-independent section must match
`system-prompt-baseline.md` byte for byte, while each carrier keeps its own tool layer.
So the four tool-surface sections may diverge in content and the rest may not.

A style check cannot stand in for this. Running the voice gate over a carrier passes for
any style-clean file, whatever doctrine it carries, which is the defect class this
replaces.
"""

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

ROOT = Path(__file__).resolve().parent.parent
BASELINE = ROOT / "system-prompt-baseline.md"

from carriers import CARRIERS

# Sections carrying harness tool names, so their bodies are expected to differ.
# AGENTS.md: "Preserve each carrier's harness-specific <code_tools> layer and tool
# names. Codex shells out through rtk; omp and Claude Code provide native file tools."
# Their bodies are ignored, but each must still be present: a carrier that drops one
# has lost that doctrine entirely rather than adapted it.
TOOL_LAYER = frozenset({"git", "directives", "code_tools", "thinking"})

# Tags a carrier may repeat in order to prepend its own material ahead of the canonical
# block. The omp carrier does exactly this: a persona overlay sits above the charter
# <role> and declares that it overrules the cascade on identity conflict. For every
# other shared tag, a repeat is how divergent doctrine would hide behind a matching
# copy, so repeats are rejected.
OVERLAY_TAGS = frozenset({"role"})


def read_exact(path):
    """Read a file without translating line endings.

    `Path.read_text()` opens in universal-newlines mode, so a CRLF carrier compares
    equal to an LF baseline and newline drift passes a contract that claims to be byte
    for byte.
    """
    return path.read_bytes().decode("utf-8")


def sections(text):
    """Return ordered (tag, body) for whole-line <tag> ... </tag> blocks.

    The match is anchored to a full line on purpose. An unanchored pattern starts on a
    tag name mentioned in prose and swallows the neighbouring section, which reports
    drift that is not there. Repeated tags are returned separately rather than
    collapsed, because collapsing them hides a divergent copy behind a matching one.
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


def audit(baseline_text, carrier_text, label="carrier"):
    """Return (shared_matched, failures) comparing one carrier to the baseline."""
    base = sections(baseline_text)
    base_tags = [t for t, _ in base]
    failures = []
    if len(set(base_tags)) != len(base_tags):
        failures.append("the baseline itself repeats a section, so no comparison is trustworthy")
        return 0, failures
    canonical = dict(base)
    shared = [t for t in base_tags if t not in TOOL_LAYER]

    carrier = sections(carrier_text)
    seen = [t for t, _ in carrier]

    for tag in dict.fromkeys(seen):
        if tag not in canonical:
            failures.append(f"{label}: section <{tag}> is not part of the doctrine")

    for tag in base_tags:
        if tag in TOOL_LAYER and tag not in seen:
            failures.append(f"{label}: tool-layer section <{tag}> is absent")

    matched = 0
    for tag in shared:
        found = [body for t, body in carrier if t == tag]
        if not found:
            failures.append(f"{label}: section <{tag}> is absent")
        elif tag in OVERLAY_TAGS:
            # The documented cascade puts the carrier's overlay above the canonical
            # block, which stays last and stays byte-identical. Bound the shape rather
            # than accept any matching copy: an altered extra block still steers
            # behaviour, so only one overlay is allowed and it may not sit below.
            if found[-1] != canonical[tag]:
                failures.append(f"{label}: the last <{tag}> block is not the canonical one")
            elif len(found) > 2:
                failures.append(f"{label}: <{tag}> appears {len(found)} times, at most one overlay is allowed")
            else:
                matched += 1
        elif all(body == canonical[tag] for body in found):
            matched += 1
        elif len(found) > 1:
            failures.append(f"{label}: <{tag}> appears {len(found)} times and not every copy matches")
        else:
            failures.append(f"{label}: section <{tag}> diverges from the baseline")
    return matched, failures


def main():
    if not BASELINE.exists():
        print(f"check-carriers: {BASELINE} is missing", file=sys.stderr)
        return 1
    baseline_text = read_exact(BASELINE)
    shared = [t for t, _ in sections(baseline_text) if t not in TOOL_LAYER]
    present = [c for c in CARRIERS if c.exists()]
    if not present:
        # The carriers live outside this repository, in the home directory of whoever
        # runs the harness. A contributor who uses neither Codex nor omp has neither,
        # and must not be blocked by their absence.
        print("check-carriers: no external carrier is installed here, nothing to compare")
        return 0
    failures, total = [], 0
    for carrier in present:
        matched, found = audit(baseline_text, read_exact(carrier), carrier.name)
        total += matched
        failures += found
        state = "ok" if not found else f"{len(found)} problem(s)"
        print(f"check-carriers: {carrier} {matched}/{len(shared)} shared sections match, {state}")
    for line in failures:
        print(f"check-carriers: {line}", file=sys.stderr)
    print(f"check-carriers: {total}/{len(shared) * len(present)} shared section comparisons matched")
    return 1 if failures else 0


def self_test():
    """Prove the audit catches each way a carrier can drift.

    Every fixture is synthetic, so this runs identically on a machine with no carrier
    installed. The live carriers are reported when present and never asserted, because
    this runs as an unconditional hook and a contributor who uses neither harness must
    not be blocked.
    """
    baseline_text = read_exact(BASELINE)
    ordered = sections(baseline_text)
    canonical = dict(ordered)
    shared = [t for t, _ in ordered if t not in TOOL_LAYER]
    victim = next(t for t in reversed(shared) if t not in OVERLAY_TAGS)
    tool = next(t for t, _ in ordered if t in TOOL_LAYER)

    def carrier_with(**edits):
        text = baseline_text
        for tag, replacement in edits.items():
            text = text.replace(f"<{tag}>{canonical[tag]}</{tag}>", replacement, 1)
        return text

    body = canonical[victim]

    def loader_preserves_crlf():
        """Read a CRLF file through the real loader and prove it was not translated."""
        import tempfile

        with tempfile.TemporaryDirectory() as d:
            crlf = Path(d) / "carrier.md"
            crlf.write_bytes(baseline_text.replace("\n", "\r\n").encode("utf-8"))
            return bool(audit(baseline_text, read_exact(crlf))[1])

    matched_all, no_failures = audit(baseline_text, baseline_text)
    checks = [
        ("the carrier list still names at least one path", bool(CARRIERS)),
        ("an unmodified copy passes", not no_failures),
        (
            f"an unmodified copy matches all {len(shared)} shared sections",
            matched_all == len(shared),
        ),
        ("the loader does not translate line endings", loader_preserves_crlf()),
        (
            "a baseline that repeats a section refuses to be an authority",
            bool(audit(
                baseline_text.replace(
                    f"<{victim}>{body}</{victim}>",
                    f"<{victim}>{body}</{victim}>\n<{victim}>{body}</{victim}>",
                    1,
                ),
                baseline_text,
            )[1]),
        ),
        (
            f"an inline </{victim}> at the body boundary cannot mask what follows",
            bool(audit(baseline_text, carrier_with(**{
                victim: f"<{victim}>{body}</{victim}>smuggled doctrine\n</{victim}>"
            }))[1]),
        ),
        (
            f"repeated <{victim}> blocks are compared separately, not collapsed",
            len([tag for tag, _ in sections(
                carrier_with(**{victim: f"<{victim}>{body}</{victim}>\n<{victim}>{body}</{victim}>"})
            ) if tag == victim]) == 2,
        ),
        (
            f"an altered <{victim}> is caught",
            bool(audit(baseline_text, carrier_with(**{victim: f"<{victim}>{body}\nan unauthorised line\n</{victim}>"}))[1]),
        ),
        (
            f"a divergent duplicate <{victim}> hiding behind a matching copy is caught",
            bool(audit(baseline_text, carrier_with(**{
                victim: f"<{victim}>{body}\nsmuggled doctrine\n</{victim}>\n<{victim}>{body}</{victim}>"
            }))[1]),
        ),
        (
            f"a differing <{tool}> body is tolerated",
            not audit(baseline_text, carrier_with(**{tool: f"<{tool}>{canonical[tool]}\na harness tool line\n</{tool}>"}))[1],
        ),
        (
            f"a missing tool-layer <{tool}> is caught",
            bool(audit(baseline_text, carrier_with(**{tool: ""}))[1]),
        ),
        (
            f"a missing shared <{victim}> is caught",
            bool(audit(baseline_text, carrier_with(**{victim: ""}))[1]),
        ),
        (
            "a carrier-only doctrine section is caught",
            bool(audit(baseline_text, baseline_text + "\n<policy>\nsmuggled doctrine\n</policy>\n")[1]),
        ),
        (
            "line-ending drift in a shared section is caught",
            bool(audit(baseline_text, baseline_text.replace("\n", "\r\n"))[1]),
        ),
        (
            "an overlay prepended above the canonical role is tolerated",
            not audit(baseline_text, carrier_with(**{
                "role": f"<role>\na carrier persona overlay\n</role>\n<role>{canonical['role']}</role>"
            }))[1],
        ),
        (
            "an altered role below the canonical one is caught",
            bool(audit(baseline_text, carrier_with(**{
                "role": f"<role>{canonical['role']}</role>\n<role>\nan overriding block\n</role>"
            }))[1]),
        ),
        (
            "more than one overlay above the canonical role is caught",
            bool(audit(baseline_text, carrier_with(**{
                "role": f"<role>\nfirst\n</role>\n<role>\nsecond\n</role>\n<role>{canonical['role']}</role>"
            }))[1]),
        ),
    ]

    passed = 0
    for label, ok in checks:
        print(f"{'PASS' if ok else 'FAIL'}: {label}", file=sys.stdout if ok else sys.stderr)
        passed += bool(ok)
    for carrier in CARRIERS:
        if carrier.exists():
            matched, found = audit(baseline_text, read_exact(carrier), carrier.name)
            print(f"check-carriers: observed {carrier} {matched}/{len(shared)} shared, {len(found)} problem(s)")
        else:
            print(f"check-carriers: observed {carrier} not installed")
    print(f"check-carriers self-test: {passed}/{len(checks)} passed")
    return 0 if passed == len(checks) else 1


if __name__ == "__main__":
    sys.exit(self_test() if "--self-test" in sys.argv else main())
