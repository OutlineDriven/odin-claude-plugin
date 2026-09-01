#!/usr/bin/env python3
"""Enforce the measurable half of docs/specs/voice.md over authored prose.

Five gates, each density-based, because one instance is usually fine and a run is the defect:

  (a) two or more consecutive bold label-and-colon lines, where a list or table belongs
  (b) five or more em or en dashes inside 600 characters
  (c) a heading capitalizing a minor word past the first position
  (d) AI-marker vocabulary
  (e) curly quotes, which break when pasted into a shell

Fenced blocks and inline spans are stripped before any gate runs, so a shell flag, a code
sample, or this spec's own ban list never trips one. That exemption is why the spec writes its
banned words in backticks.

The gates catch formatting tells, not absent conviction. A file passing all five can still be
slop; that judgment needs the spine audit and does not belong in a script.
"""

import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# The doctrine bans delve, leverage, seamless, and underscore. Two of the four have legitimate
# senses in this tree, so the pattern targets only the filler sense:
#   leverage  - the verb ("leverage the framework"), never Ousterhout's noun ("high leverage
#               through a small interface"), which codebase-design uses as vocabulary
#   underscore - the verb ("this underscores the point"), never the character name
# holistic and synergy join them: no sense of either earns a place here. robust stays out, because
# Robustness is a finding-category label, and paradigm stays out, because the doctrine's design
# block writes "Paradigms: Post-minimalism | Neo-brutalism" as its own vocabulary.
BANNED = re.compile(
    r"\b(delve[sd]?|delving"
    r"|leverages|leveraging|leverage(?=\s+(?:the|a|an|this|that|these|those|our|your|its|their|existing)\b)"
    r"|seamless(?:ly)?"
    r"|underscores|underscoring|underscored"
    r"|holistic(?:ally)?"
    r"|synerg(?:y|ies|istic))\b",
    re.I,
)

# Naming a banned word is not using it. These files carry the ban list as their subject.
BAN_LIST_SUBJECTS = frozenset(
    {
        "docs/specs/voice.md",
        "plugins/odin-research/skills/knowledge-refresh/SKILL.md",
        "plugins/odin-writing/skills/copywriting/SKILL.md",
        "plugins/odin-writing-advanced/skills/copywriting-prose-creator/SKILL.md",
    }
)
# Three shapes are the same pseudo-list, so the pattern covers all three. The colon may sit
# against the closing asterisks ("**Scope**:"), behind interposed text ("**Scope** (required):"),
# or inside them ("**Scope:**"). A label is bold markup at line start whose closing asterisks are
# followed by a colon, or whose label text ends in a colon just before them; that line-start-plus-
# colon shape is what separates a label from mid-sentence emphasis like "you **MUST** use", which
# has no colon after the closing asterisks and so matches neither branch. The label text itself may
# contain a colon ("**Security (OWASP Top 10:2025, CWE Top 25 2025):**"), so the second branch no
# longer forbids one inside the label; the earlier [^*\n:] class let such a label slip past the
# gate, making the rule evadable by putting a colon in it. The cap runs to 120 characters because
# doctrine labels carrying parenthesized version lists exceed the old 80. A table row never matches,
# because no colon follows its closing asterisks.
BOLD_LABEL = re.compile(
    r"^\s*(?:[-*+]\s*)?\*\*"
    r"(?:[^*\n]{2,120}\*\*[^:\n]{0,30}:"
    r"|[^*\n]{2,120}:\s*\*\*)"
)
# Title case capitalizes the minor word AND the word after it, which is what separates
# "Fixing The Bug" from sentence case ("1. The wall of options") and from a single-letter
# label ("Task A: run locally", "Side A - slop"). Requiring an uppercase word after the minor
# word settles all three without a per-heading exception list.
MINOR_WORD = re.compile(
    r"^#{2,6} \S+ .*\b(?:The|A|An|Of|And|For|To|In|On|With|From|Is|Are|But|Or|As|At|By)\s+[A-Z]"
)
CURLY = re.compile(r"[\u2018\u2019\u201c\u201d]")
DASH = re.compile(r"[\u2014\u2013]")

DASH_WINDOW = 600
DASH_RUN = 5
BOLD_RUN = 2


def writable(path):
    """Whether a real write open succeeds, which is what Landlock actually gates.

    os.access(path, os.W_OK) reports the file's permission bits and returns True for a
    Landlock-jailed carrier, so it cannot be trusted here; only attempting the open sees the
    denial. A write-only open on the existing file touches nothing and is closed immediately.
    """
    try:
        os.close(os.open(path, os.O_WRONLY))
    except OSError:
        return False
    return True


def default_targets():
    """Every markdown file in the repository plus the two harness carriers.

    The repository walk covers authored and generated surfaces alike; a finding in
    generated output points at the generator as the defect site. The two harness
    carriers live outside the repo and are machine-local. An absent carrier is skipped
    silently so a fresh clone on another machine, which has neither, stays green. A
    carrier that exists but cannot be written is skipped with a visible notice: its
    findings cannot be repaired here, and a gate that reports an unsatisfiable finding
    blocks every commit. The notice goes to stderr and never changes the exit code.
    """
    targets = sorted(p for p in ROOT.rglob("*.md")
                     if ".git" not in p.relative_to(ROOT).parts
                     and ".outline" not in p.relative_to(ROOT).parts)
    for carrier in (Path("/home/alpha/.omp/agent/AGENTS.md"),
                    Path("/home/alpha/.codex/AGENTS.md")):
        if not carrier.is_file():
            continue
        if writable(carrier):
            targets.append(carrier)
        else:
            print(f"check-voice: skipping {carrier} (exists but not writable; "
                  "cannot be repaired here)", file=sys.stderr)
    return targets


def prose_only(text):
    """Drop fenced blocks and inline spans, preserving line count for accurate reporting."""
    out = []
    fenced = False
    for line in text.split("\n"):
        stripped = line.lstrip()
        if stripped.startswith("```") or stripped.startswith("~~~"):
            fenced = not fenced
            out.append("")
            continue
        out.append("" if fenced else re.sub(r"`[^`\n]*`", "", line))
    return "\n".join(out)


def dash_run(prose):
    """Longest dash run inside one window, with the line it starts on."""
    hits = [m.start() for m in DASH.finditer(prose)]
    worst = 0
    where = 0
    for i, start in enumerate(hits):
        j = i
        while j < len(hits) and hits[j] - start <= DASH_WINDOW:
            j += 1
        if j - i > worst:
            worst = j - i
            where = prose.count("\n", 0, start) + 1
    return worst, where


def bold_run(prose):
    """Longest run of consecutive bold label lines, blank lines not breaking the run."""
    run = 0
    worst = 0
    start = 0
    where = 0
    for number, line in enumerate(prose.split("\n"), start=1):
        if BOLD_LABEL.match(line):
            if run == 0:
                start = number
            run += 1
            if run > worst:
                worst = run
                where = start
        elif line.strip():
            run = 0
    return worst, where


def label(path):
    """Repository-relative path when inside the tree, absolute otherwise."""
    try:
        return path.relative_to(ROOT)
    except ValueError:
        return path


def audit(path):
    prose = prose_only(path.read_text(encoding="utf-8", errors="replace"))
    rel = label(path)
    found = []

    worst, line = bold_run(prose)
    if worst >= BOLD_RUN:
        found.append(f"{rel}:{line}: {worst} consecutive bold label lines; use a list or table")

    worst, line = dash_run(prose)
    if worst >= DASH_RUN:
        found.append(f"{rel}:{line}: {worst} dashes within {DASH_WINDOW} characters")

    for number, line_text in enumerate(prose.split("\n"), start=1):
        if MINOR_WORD.match(line_text):
            found.append(f"{rel}:{number}: title-case heading; use sentence case")

    if str(rel) not in BAN_LIST_SUBJECTS:
        for match in BANNED.finditer(prose):
            line = prose.count("\n", 0, match.start()) + 1
            found.append(f"{rel}:{line}: AI-marker word '{match.group(0)}'")

    for match in CURLY.finditer(prose):
        line = prose.count("\n", 0, match.start()) + 1
        found.append(f"{rel}:{line}: curly quote; use a straight quote")

    return found


# The bold-label pattern has already been silently wrong once: it could not see a label whose
# text contains a colon, so four doctrine lines passed the gate while still wearing the banned
# pseudo-list markup. An evadable rule is worse than no rule, because it reports clean. These
# cases are inline literals rather than fixture files on purpose: markdown files inside the
# repository are gated, so a fixture that carries a finding by design would need an exclusion,
# and an exclusion directory is the same escape hatch the pattern just closed.
SELF_TEST = (
    ("bold label with an internal colon is caught",
     "**Discipline (defend at boundaries, trust interior, fail fast; ban slop, keep craft):**\n"
     "**Security (OWASP Top 10:2025, CWE Top 25 2025):**\n",
     True),
    ("bold label without an internal colon is caught",
     "**Scope**: what this covers.\n"
     "**Response language:** All English.\n",
     True),
    ("mid-sentence emphasis is not caught",
     "You **MUST** use the gate, and you **SHOULD NOT** skip it.\n"
     "This line carries **bold emphasis** but no label colon.\n",
     False),
    ("bold label inside a fenced block is not caught",
     "```\n"
     "**Discipline (defend at boundaries, trust interior, fail fast; ban slop, keep craft):**\n"
     "**Security (OWASP Top 10:2025, CWE Top 25 2025):**\n"
     "```\n",
     False),
)


def self_test():
    """Run the bold-label cases against the compiled pattern; return the exit code."""
    failed = 0
    for name, text, expect in SELF_TEST:
        worst, _ = bold_run(prose_only(text))
        caught = worst >= BOLD_RUN
        ok = caught == expect
        failed += not ok
        print(f"{'PASS' if ok else 'FAIL'}: {name} (caught={caught}, expected={expect})")
    print(f"check-voice self-test: {len(SELF_TEST) - failed}/{len(SELF_TEST)} passed",
          file=sys.stderr if failed else sys.stdout)
    return 1 if failed else 0


def main(argv):
    if argv == ["--self-test"]:
        return self_test()
    if argv:
        targets = [Path(a).resolve() for a in argv]
    else:
        targets = default_targets()

    findings = []
    checked = 0
    for path in targets:
        if not path.is_file():
            continue
        checked += 1
        findings.extend(audit(path))

    if findings:
        for finding in findings:
            print(finding, file=sys.stderr)
        print(f"check-voice: {len(findings)} finding(s) across {checked} file(s)", file=sys.stderr)
        return 1

    print(f"voice ok {checked} files")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
