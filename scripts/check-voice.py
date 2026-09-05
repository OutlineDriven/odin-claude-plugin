#!/usr/bin/env python3
"""Enforce the measurable half of docs/specs/voice.md over authored prose.

Five gates, each density-based, because one instance is usually fine and a run is the defect:

  (a) a run of lines opening with a bold span: two or more colon-bearing labels, or five lead-ins
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
import shutil
import subprocess
import sys
import tempfile

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
# Harness carriers live outside the repository, so git cannot enumerate them. The list is
# defined once in carriers.py: a second hand-maintained copy here hardcoded an absolute
# path with a username and resolved to nothing on any other machine.
from carriers import CARRIERS

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
        "plugins/odin-knowledge/skills/knowledge-refresh/SKILL.md",
        "plugins/odin-writing/skills/copywriting/SKILL.md",
        "plugins/odin-writing/skills/copywriting-prose-creator/SKILL.md",
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
# gate, making the rule evadable by putting a colon in it. No upper bound anywhere: neither the
# label span nor the interposed text carries one, because [^*\n] already stops at the closing
# asterisks and a cap only moved the hole. The interposed region used to be capped at 30
# characters, which let "**Label** long interposed clause: value" match BOLD_LEAD but not
# BOLD_LABEL, so a pair of those counted as zero labels, classified as a lead run of two, and
# passed under the lead threshold. A table row never matches, because no colon follows its closing
# asterisks.
BOLD_LABEL = re.compile(
    r"^\s*(?:[-*+]\s*)?\*\*"
    r"(?:[^*\n]{2,}\*\*[^*\n]*:"
    r"|[^*\n]{2,}:\s*\*\*)"
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
# A line that opens with a bold span is either a colon-bearing label ("**Scope:** text") or a
# colon-less lead-in ("**Latency** is measured first"). Both are fake structure when they run, at
# different densities: two labels in a row are a disguised definition list, while two lead-ins are
# ordinary emphasis and only five in a row stop reading as prose.
#
# The two shapes are therefore one walk over their union, classified by what the finished run
# contains. They were first built as two walks, each excluding the other's lines, and that split
# was itself the evasion: five lines alternating label and lead scored one in each walk and the
# gate reported clean, so mixing the forms became easier to slip past than either form alone. A
# line belongs to exactly one run, and a run yields at most one finding, so nothing is counted
# twice without anything being split.
# No upper bound on the span: [^*\n] already stops at the closing asterisks and at the line end,
# so a length cap was never doing work the character class does not already do. It only moved the
# hole, exactly as the old 80-character label cap did before it was raised to 120. Both patterns
# carry the same bound on purpose: if the union walk accepted a longer span than the label test
# did, a pair of long colon-bearing labels would count as zero labels, get classified as a lead run
# of two, and pass under the lead threshold. Membership and classification have to agree.
BOLD_LEAD = re.compile(r"^\s*(?:[-*+]\s*)?\*\*[^*\n]{2,}\*\*")
BOLD_LEAD_RUN = 5


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


def git_tracked(pathspecs):
    """Repository-relative paths the index tracks, matched against these pathspecs.

    The index is the scope. Untracked and ignored content is invisible to it, so no exclusion
    list is needed and a new scratch directory cannot widen the gate by accident. Passing an
    explicit pathspec list queries the index without touching the filesystem, which is what lets
    the self-test assert that an ignored path is dropped without writing a fixture file.
    """
    try:
        result = subprocess.run(
            ["git", "ls-files", "-z", "--", *pathspecs],
            cwd=ROOT, capture_output=True, text=True, check=True)
    except FileNotFoundError:
        sys.exit("check-voice: git is not installed, and the gate's scope comes from the index. "
                 "Refusing to fall back to a directory walk, which would silently change scope.")
    except subprocess.CalledProcessError as exc:
        sys.exit(f"check-voice: git cannot report the tracked files for {ROOT} "
                 f"({exc.stderr.strip().rstrip('.')}). This path is not a work tree, or its index "
                 "is unreadable. Refusing to fall back to a directory walk, which would silently "
                 "change scope.")
    return [path for path in result.stdout.split("\0") if path]


def carrier_targets(carriers):
    """The harness carriers to gate, with absent and unfixable kept apart.

    An absent carrier is skipped with a notice, because a fresh clone on another machine has
    neither and there is nothing there to repair. A carrier that exists but cannot be written is
    still gated: if it is clean, nothing is lost by checking it, and dropping it would hide the
    drift that reaching outside the repository exists to catch. If it carries findings, the run
    fails outright and says why, because those findings cannot be repaired here and a notice
    anyone can scroll past is how an unsatisfiable gate stops being a gate. The Landlock jail that
    made a skip necessary is gone, so an unwritable carrier is now an environment defect worth
    stopping on rather than working around.
    """
    present = []
    for carrier in carriers:
        if not carrier.is_file():
            print(f"check-voice: skipping {carrier} (absent on this machine)", file=sys.stderr)
            continue
        if not writable(carrier):
            blocking = audit(carrier)
            if blocking:
                sys.exit(f"check-voice: {carrier} cannot be written and carries "
                         f"{len(blocking)} finding(s); repair its permissions or remove it, "
                         "because they cannot be fixed here")
        present.append(carrier)
    return present


def default_targets():
    """Every tracked markdown file plus the two harness carriers.

    Scope comes from the git index rather than a directory walk. The same script reported clean
    in this worktree and 3725 findings across 3918 files in the source checkout, because an
    untracked npm staging tree sat inside the repository. An exclusion list would have to grow
    with every scratch directory that appears, and the three defects this rule has already shipped
    were all exclusions.

    The harness carriers live outside the repository, so git cannot enumerate them and they stay
    explicit named additions.
    """
    return sorted(ROOT / path for path in git_tracked(["*.md"])) + carrier_targets(CARRIERS)


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


def bold_runs(prose):
    """Every maximal run of lines opening with a bold span, as (first line, length, label count).

    Blank lines do not break a run. A non-blank line that does not open with a bold span does.
    Fenced blocks and inline spans are already gone by the time this sees the text.
    """
    runs = []
    start = 0
    length = 0
    labels = 0
    for number, line in enumerate(prose.split("\n"), start=1):
        if BOLD_LEAD.match(line):
            if length == 0:
                start = number
            length += 1
            labels += bool(BOLD_LABEL.match(line))
        elif line.strip():
            if length:
                runs.append((start, length, labels))
                length = 0
                labels = 0
    if length:
        runs.append((start, length, labels))
    return runs


def classify_run(labels):
    """(kind, threshold) for a finished run, decided by what the run contains.

    Two or more colon-bearing labels make it a label pseudo-list, which is a defect at two. Below
    that the run is a density of lead-ins and needs five. A single colon inside a five-line run is
    incidental emphasis, not a list of one, so such a run is caught at the lead threshold rather
    than escaping between the two: adding a colon to one line can no longer drop a run below every
    threshold.
    """
    if labels >= 2:
        return "label", BOLD_RUN
    return "lead", BOLD_LEAD_RUN


def bold_findings(prose):
    """One finding per tripping bold run, reported at the run's first line.

    The label message names both numbers, because a mixed run is not all labels. Reporting the
    run length as the label count told an author with three labels and two lead-ins to fix five
    label lines, which is the wrong instruction; the run length is what tripped the threshold and
    the label count is what makes it a pseudo-list rather than a density of emphasis.
    """
    found = []
    for start, length, labels in bold_runs(prose):
        kind, threshold = classify_run(labels)
        if length < threshold:
            continue
        if kind == "label":
            found.append((start, f"{length} consecutive bold lines, {labels} with labels; "
                                 "use a list or table"))
        else:
            found.append((start, f"{length} consecutive bold lead-ins; "
                                 "use a list, a table, or plain text"))
    return found


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

    for line, message in bold_findings(prose):
        found.append(f"{rel}:{line}: {message}")

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


# The bold rule has been silently wrong four times: first it could not see a label whose text held
# a colon, then two separate walks each excluding the other's lines let a run that alternated the
# two forms score one in each walk and pass clean, then an 80-character span bound exempted a
# label whose parenthesized version list ran past it, then a 30-character cap on interposed text
# made membership count zero labels where classification saw a lead run, so a pair of long
# colon-bearing labels passed under the lead threshold. An evadable rule is worse than no rule,
# because it reports clean. These cases are inline literals rather than fixture files on purpose:
# markdown files inside the repository are gated, so a fixture that carries a finding by design
# would need an exclusion, and an excluded directory is the same escape hatch the rule keeps
# closing.
#
# Each case names the kind it must classify as when caught, because the two thresholds are
# different and a run that trips the wrong one passes for the wrong reason. expect is
# (caught, kind); kind is None when the run must not be caught at all.
L1 = "**Latency** is the first thing to measure.\n"
L2 = "**Throughput** follows from it.\n"
L3 = "**Allocation** decides both.\n"
L4 = "**Locality** then sets the ceiling.\n"
L5 = "**Occupancy** is what is left to tune.\n"
D1 = "**Discipline (defend at boundaries, trust interior, fail fast; ban slop, keep craft):**\n"
D2 = "**Security (OWASP Top 10:2025, CWE Top 25 2025):**\n"
S1 = "**Scope**: what this covers.\n"
S2 = "**Response language:** All English.\n"

SELF_TEST = (
    ("colon-bearing label with an internal colon is caught", D1 + D2, (True, "label")),
    ("colon-bearing label without an internal colon is caught", S1 + S2, (True, "label")),
    ("mid-sentence emphasis is not caught",
     "You **MUST** use the gate, and you **SHOULD NOT** skip it.\n"
     "This line carries **bold emphasis** but no label colon.\n", (False, None)),
    ("bold label inside a fenced block is not caught", "```\n" + D1 + D2 + "```\n", (False, None)),
    ("run of five colon-less lead-ins is caught", L1 + L2 + L3 + L4 + L5, (True, "lead")),
    ("run of four colon-less lead-ins is not caught", L1 + L2 + L3 + L4, (False, None)),
    ("blank lines do not break a lead run",
     "\n".join((L1, L2, L3, L4, L5)) + "\n", (True, "lead")),
    ("lead-ins inside a fenced block are not caught", "```\n" + L1 + L2 + L3 + L4 + L5 + "```\n",
     (False, None)),
    ("mid-sentence emphasis is not caught at any density",
     "Measure **latency** before anything else.\nThen weigh **throughput** against it.\n"
     "Watch **allocation**, which decides both.\nMind **locality**, which sets the ceiling.\n"
     "Tune **occupancy** last, if at all.\nReport **variance**, never a single run.\n",
     (False, None)),
    # regression: the alternating run that the two-walk design let pass clean
    ("alternating label and lead run of five is caught",
     S1 + L1 + S2 + L2 + "**Allocation:** decides both.\n", (True, "label")),
    # a lone colon inside a five-line run is incidental; the run is fake structure at five
    ("one label plus four leads is caught as a lead run",
     S1 + L1 + L2 + L3 + L4, (True, "lead")),
    ("two labels plus one lead is caught at the label threshold",
     S1 + S2 + L1, (True, "label")),
    ("one label plus three leads is not caught", S1 + L1 + L2 + L3, (False, None)),
    # the remedy is a plain-labelled list, not a bulleted bold one: both patterns allow a leading
    # "- ", so a bulleted pair is still a label run
    ("bulleted colon-bearing labels are caught", "- **Scope:** a.\n- **Domain:** b.\n",
     (True, "label")),
    ("bulleted plain labels are not caught", "- Scope: a.\n- Domain: b.\n", (False, None)),
    # the case a {2,120} span bound silently exempted: five long lead-ins, each over 120 characters
    ("run of five over-long lead-ins is caught",
     "".join(f"**{w} {'padding ' * 18}** opens a long line {i}.\n"
             for i, w in enumerate(("Latency", "Throughput", "Allocation", "Locality",
                                    "Occupancy"))),
     (True, "lead")),
    # and its label twin: two long colon-bearing labels must classify as a label run, not fall
    # through to a lead run of two, which is what a bound on one pattern but not the other gives
    ("two over-long colon-bearing labels are caught as a label run",
     "".join(f"**{w} {'padding ' * 18}:** value {i}.\n" for i, w in enumerate(("Scope", "Domain"))),
     (True, "label")),
)


def run_verdict(prose):
    """(caught, kind) for the first bold run that trips its threshold."""
    for _, length, labels in bold_runs(prose):
        kind, threshold = classify_run(labels)
        if length >= threshold:
            return True, kind
    return False, None


# Scope cases, driven against git_tracked with a fixture pathspec list so they create nothing on
# disk. Creating an ignored fixture would mean writing into an ignored directory, and an ignored
# directory the gate can see is the escape hatch this scope removes. Each case asserts its own
# witness exists, so a witness that disappears fails the case rather than passing for nothing.
#   AGENTS.md      tracked, so it is a target
#   .git/config    on disk, not tracked; a directory walk claims it and the index does not
#   ignored files  discovered live, since which ones exist is not something to hardcode
def ignored_witness():
    """An ignored file that exists in the tree, or None on a clean clone.

    The ignored case needs a file that is both present and ignored, and creating one would mean
    writing into an ignored directory, which is the escape hatch this scope removes. So the case
    borrows whatever the tree already has. It prefers a witness outside the names the old
    exclusion list spelled, because only such a witness separates the index from a walk that kept
    that list; on a tree with neither, it falls back to any ignored file it can find.
    """
    result = subprocess.run(
        ["git", "ls-files", "-z", "--others", "--ignored", "--exclude-standard"],
        cwd=ROOT, capture_output=True, text=True, check=True)
    found = [p for p in result.stdout.split("\0") if p and (ROOT / p).is_file()]
    for path in found:
        if not path.startswith((".git/", ".outline/")):
            return path
    return found[0] if found else None


def ignored_case(got):
    """The index must return nothing for a path that exists but is ignored.

    With a real ignored file the case is strong: the file is on disk and the index still drops it.
    With none, as on a fresh clone, it falls back to a hypothetical path under an ignored
    directory, which proves the rule is not suffix-based but is weaker, so it says so.
    """
    witness = ignored_witness()
    return got == [] and (witness is None or Path(witness).is_file())

def untracked_witness_probe():
    """Gate an untracked, non-ignored markdown file that carries a finding by construction.

    Created transiently inside the repository and removed in a finally block. This is the exact
    class of file that caused the regression the scope rule removed: a retired npm staging tree
    sat untracked and unignored inside the repository, and the directory walk gated it, so the
    same script reported clean in one checkout and thousands of findings in another. A permanent
    fixture cannot stand in for it: committing it makes it tracked, which is the thing under test,
    and ignoring it makes the old walk blind to it too.

    Returns whether the witness was picked up, the target count with and without it on disk, and
    whether the witness really does carry a finding, so the case cannot pass by quietly testing a
    file the rule would not flag anyway.
    """
    without = len(default_targets())
    dir_ = tempfile.mkdtemp(dir=ROOT)
    try:
        witness = Path(dir_) / "witness.md"
        witness.write_text("**Scope:** a.\n**Domain:** b.\n", encoding="utf-8")
        targets = default_targets()
        return (witness in targets, len(targets), without, bool(audit(witness)))
    finally:
        shutil.rmtree(dir_, ignore_errors=True)


def untracked_witness_case(probe):
    picked_up, with_count, without_count, carries = probe
    return not picked_up and with_count == without_count and carries


TARGET_CASES = (
    ("a tracked markdown file is a target",
     lambda: git_tracked(["AGENTS.md"]),
     lambda got: "AGENTS.md" in got),
    # `.git` is the one path guaranteed to exist and guaranteed never to be tracked. Naming
    # `.git/config` instead would pass only where `.git` is a directory: a linked worktree
    # stores a gitlink file there, so the case's own precondition would fail and report a
    # defect in the gate where there is none.
    ("a path that exists but is not tracked is not a target",
     lambda: git_tracked(["AGENTS.md", ".git"]),
     lambda got: Path(".git").exists() and ".git" not in got),
    ("an ignored file inside the repository is not a target",
     lambda: git_tracked([ignored_witness() or ".outline/whatever.md"]),
     ignored_case),
    ("both harness carriers are targets when present",
     lambda: [str(c) for c in carrier_targets(CARRIERS)],
     lambda got: all(str(c) in got for c in CARRIERS if c.is_file())),
    ("an untracked non-ignored markdown file is not a target",
     untracked_witness_probe,
     untracked_witness_case),
)


def self_test():
    """Run every bold and scope case against the compiled rule; return the exit code."""
    failed = 0
    for name, text, (want_caught, want_kind) in SELF_TEST:
        caught, kind = run_verdict(prose_only(text))
        ok = caught == want_caught and (not caught or kind == want_kind)
        failed += not ok
        detail = f"kind={kind}" if caught else "not caught"
        want = f"{want_kind} at its threshold" if want_caught else "clean"
        print(f"{'PASS' if ok else 'FAIL'}: {name} ({detail}, expected {want})")
    for name, select, holds in TARGET_CASES:
        got = select()
        ok = holds(got)
        failed += not ok
        print(f"{'PASS' if ok else 'FAIL'}: {name} ({len(got)} path(s) selected)")
    total = len(SELF_TEST) + len(TARGET_CASES)
    print(f"check-voice self-test: {total - failed}/{total} passed",
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
