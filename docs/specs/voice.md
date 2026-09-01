# Voice

The authoring register for every skill in this tree.

Two sources define it. The ODIN doctrine in `system-prompt-baseline.md` sets the engineering
register: opinion rather than options, special-case elimination, cleanup on the touched surface. The
spine sets the taste register through ten influence-pegged anchors and a two-sided ban list.

The spine itself is user-private, at `~/.claude/skills/spine/`. It is read from this repository and
never edited here. This document carries what a maintainer needs to author or rewrite a skill
without loading it, and `scripts/check-voice.py` enforces the part a script can measure.

## The ten anchors

Each anchor is a positive directive. Load them before producing; walk them against the artifact
afterward.

| Anchor | Influence | Concept |
|---|---|---|
| Rams | Dieter Rams | Subtraction earns its absence; less but better |
| Maeda | John Maeda | Subtract the obvious, add the meaningful |
| Hoare | Tony Hoare | Named precondition, postcondition, invariant |
| Carmack | John Carmack | Atomic principles first |
| Bass | Saul Bass | One compositional gesture; the rest is flat ground |
| Feynman | Richard Feynman | Build from the bottom; no jargon where a common word works |
| Erickson | Milton Erickson | Tailor the framing to the reader |
| Tolkien | J.R.R. Tolkien | Derive meaning from sound, root, and system |
| Ive | Jony Ive | Care finishes the unseen; build the inside like the outside |
| Hara | Kenya Hara | Emptiness is the vessel; leave space the reader completes |

When two anchors collide, surface the tension rather than picking silently. Rams says compress and
Erickson says shape to the reader; which wins is the author's call, stated once.

## Both failure modes, one root

Slop and overkill are siblings. Slop refuses to commit by averaging into the default; overkill
refuses by piling decoration on nothing. An artifact can fail both at once, with slop framing around
an overkill core.

Slop, the centroid default:

| Ban | Why |
|---|---|
| Generic openers and validation phrases | Performs warmth or agreement without a claim |
| Hedge-stacks and 50/50 decision hedges | No claim survives the layering; the matrix is the alibi |
| Equal-weighted sentences in a row | No rhythm, no emphasis; reads as preset |
| Bullet lists where prose is clearer | Disguises absent reasoning as structured thought |
| Defer-names such as helper, utils, manager, data | Names committing to nothing produce code committing to nothing |
| Defensive checks an invariant already rules out | Performs caution while signaling the invariant is unknown |

Overkill, decoration over a thin idea:

| Ban | Why |
|---|---|
| Thesaurus-soup prose | Long Latin words doing the work of short Saxon ones |
| Abstraction towers, four layers where one suffices | Performs sophistication at a single call site |
| Weighted scoring matrix for a two-option decision | The math is the alibi for not committing |
| Ceremony and long preamble | The reader does the work the author skipped |
| Configuration flags for hypothetical callers | Configurability standing in for a stance |
| Manifesto framing on a small change | Name-weight exceeding content-weight |

## Measured gates

`scripts/check-voice.py` fails on five formatting tells. Each threshold is density-based, because
one instance is usually fine and a run is the defect. The patterns are heuristics, not proofs; the
known limits below are part of the contract.

| Gate | Threshold | Rationale |
|---|---|---|
| Bold run | One walk over every line that opens with a bold span, bulleted or not, classified by what the finished run holds: two colon-bearing labels in the run trips at 2, five lines otherwise trips at 5 | Repeated line-start bold is fake structure, so the remedy is a real list or table whose labels are plain text. A `- ` prefix does not exempt a line, because the pattern allows one: `- **Name:** value` repeated still fails, and `- Name: value` passes. Two label-and-value lines read as a disguised definition list, while colon-less lead-ins are ordinary emphasis until five stack up |
| Dash run | Five or more em or en dashes within 600 characters | A single parenthetical pair is fine; a dense run is the tell |
| Title-case heading | A minor word capitalized past the first position, followed by another capitalized word | Sentence case, proper nouns only |
| Banned words | The filler senses of `delve`, `leverage`, `seamless`, `underscore`, plus `holistic` and `synergy` | Named in the doctrine as AI-marker vocabulary |
| Curly quotes | Any of the four smart quote characters | Straight quotes survive copy and paste into a shell |

The script reads prose only. Fenced blocks and inline spans are stripped first, so a shell flag or a
code sample never trips a gate. That exemption is why the ban list writes its own words in
backticks, and why hiding prose in backticks to silence a finding is gaming the gate rather than
fixing anything.

## Scope

The bare run gates every markdown file git tracks, authored and generated alike, plus two named
external carriers. Scope comes from the index, so a file is gated because it is tracked, not
because it exists: untracked and ignored content is out of scope by construction rather than by
exclusion. That distinction is the whole reason for the mechanism. The gate used to walk the
directory with a two-name exclusion list, and the same script then reported clean in one checkout
and 3725 findings across 3918 files in another, because a retired npm staging tree sat untracked
inside the repository. An exclusion list is a hole that regenerates, and this rule has been
repaired three times by closing one, so the list is gone rather than extended. A finding in
generated output, such as a plugin README, still names the generator as the defect site, not the
file it wrote. Passing explicit file arguments overrides the default list and gates only those
files.

Two harness carriers live outside the repo, at `~/.omp/agent/AGENTS.md` and `~/.codex/AGENTS.md`.
Git cannot enumerate them, so they stay named additions. They are machine-local, and the two ways
one can be unusable are kept apart. An absent carrier is skipped with a notice, because a fresh
clone on another machine has neither and there is nothing there to repair. A carrier that exists
but cannot be written is still gated when it is clean, and fails the run outright when it carries
findings, because those findings cannot be repaired here and a notice anyone can scroll past is
how an unsatisfiable gate stops being a gate. Writability is settled by attempting the open rather
than by asking `os.access`, because a Landlock jail reports the permission bits as writable while
denying the open.

## What a bold run finding means

One walk covers every line that opens with a bold span, blank lines included, and reports at most
one finding per run, at the run's first line. The finished run is then judged by its content. Two
or more colon-bearing labels make it a label pseudo-list, a defect at two lines. Below that the
run is a density of colon-less lead-ins, which are ordinary emphasis until five of them stack up.
Span length is not a criterion and carries no upper bound: the character class stops at the closing
asterisks, so a cap would exempt long lines without protecting anything, which is how the earlier
80-character bound then exempted a label whose parenthesized version list ran past it.

Building these as two walks, each excluding the other's lines, was the mistake that led here. A run
of five lines alternating label and lead scored one in each walk, cleared both thresholds, and the
gate reported clean — so mixing the two forms became easier to slip past than either form alone,
and the exclusion written to stop double-reporting is what split the run. A line belongs to exactly
one run instead, which gets the same no-double-counting property without the hole. One colon
inside a five-line run is incidental emphasis, not a list of one, so that run is caught at the lead
threshold: adding a colon to a line can no longer drop a run below every threshold.

The fix is to drop the bold, not to restructure the list. A bullet prefix does not exempt a line:
both patterns allow a leading `- `, so `- **Name:** value` repeated is a run and fails, while
`- Name: value` passes. A run of plain `- Label: text` bullets is not a defect and the gate does
not flag one, because the doctrine bans the bold-header pseudo-list specifically and bans plain
bullet lists only where prose would be clearer, which is a judgment no regex makes. The sweep this
phase ran confirms which of the two is the real remedy: the content of every cleared item was
already a genuine list, so the asterisks came off and the bullets, the colons, and the wording
stayed put. Use a table for label-and-value pairs and prose for conditions or cases. Do not reshape
a list that already reads as a list.

The rule carries a self-test, run with `python3 scripts/check-voice.py --self-test`. It pins the
cases that decide whether the rule works, each naming the kind it must classify as when caught:
labels with and without an internal colon, the alternating five that the two-walk design let
through, one label plus four leads, two labels plus one lead, four leads alone, blank lines not
breaking a run, fenced blocks, mid-sentence emphasis at any density, a bulleted pair of labels, and
runs whose spans run past 120 characters. Four more cases pin the scope: a tracked file is a
target, a file that exists but is not tracked is not, an ignored file is not, and both carriers are
when present. The rule has been silently wrong four times, once for a colon inside the label, once
for the split walk, once for a span bound, and once for an interposed-text cap that made membership
and classification disagree, and an evadable rule is worse than no rule because it reports clean.
The cases are inline string literals rather than fixture files because
every tracked markdown file is gated, so a fixture that carries a finding by design would have to
be ignored, and an ignored directory the gate can see is the escape hatch the scope rule removes.

## Known limits

Two senses of `leverage` and `underscore` are legitimate here and the pattern spares both:
Ousterhout's noun, as in high leverage through a small interface, which `codebase-design` uses as
vocabulary, and the underscore character in a slug. The pattern reaches the verb forms only. It
once matched `leverage and` because the determiner alternation lacked a word boundary, and two
files were edited to dodge it before the pattern was fixed; that is the shape of error to expect
from a heuristic, and the fix belongs in the pattern rather than the prose.

`robust` and `paradigm` are not banned. `Robustness` is a finding-category label, and the
doctrine's own design block writes "Paradigms: Post-minimalism | Neo-brutalism" as vocabulary.

Files whose subject is the ban list name their bans in prose and are exempt by an explicit
allowlist in the script. Naming a banned word is not using it.

## What the gates cannot judge

A file passing every gate can still be slop. The gates catch formatting tells, not absent
conviction. Rams, Carmack, and Hara are not scriptable: whether a section earns its place, whether
the principle is atomic, whether the emptiness is deliberate or merely unfinished. Those need the
spine audit, run against the artifact in hand.
