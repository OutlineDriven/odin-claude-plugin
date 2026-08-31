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
| Bold pseudo-list | Two or more consecutive bold label lines, with the colon inside, against, or behind interposed text after the closing asterisks | A real bullet list or table carries labels |
| Dash run | Five or more em or en dashes within 600 characters | A single parenthetical pair is fine; a dense run is the tell |
| Title-case heading | A minor word capitalized past the first position, followed by another capitalized word | Sentence case, proper nouns only |
| Banned words | The filler senses of `delve`, `leverage`, `seamless`, `underscore`, plus `holistic` and `synergy` | Named in the doctrine as AI-marker vocabulary |
| Curly quotes | Any of the four smart quote characters | Straight quotes survive copy and paste into a shell |

The script reads prose only. Fenced blocks and inline spans are stripped first, so a shell flag or a
code sample never trips a gate. That exemption is why the ban list writes its own words in
backticks, and why hiding prose in backticks to silence a finding is gaming the gate rather than
fixing anything.

## What a bold-label finding means

A run of plain `- Label: text` bullets is not a defect, and the gate does not flag one. The
doctrine bans the bold-header pseudo-list specifically, and bans plain bullet lists only where
prose would be clearer, which is a judgment no regex makes. So dropping the asterisks and keeping
the bullets is a valid fix when the items are genuinely parallel. Use a table for label-and-value
pairs and prose for conditions or cases. Do not reshape a list that already reads as a list.

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
