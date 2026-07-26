---
title: "Token-Jaccard thresholds miss semantic duplication in the prompt cascade"
date: 2026-07-27
category: docs/solutions/workflow-issues
module: skills
problem_type: tooling_decision
component: tooling
severity: medium
applies_when:
  - "Running cascade-dedup against output-styles/ and system-prompt-baseline.md"
  - "A dedup pass reports zero duplicates and the result looks suspiciously clean"
  - "Choosing a similarity metric for prompt or doc trees where restatements vary in length"
related_components:
  - documentation
tags:
  - cascade-dedup
  - jaccard
  - prompt-cascade
  - output-styles
  - similarity-metrics
  - measurement-design
---

# Token-Jaccard thresholds miss semantic duplication in the prompt cascade

## Context

`cascade-dedup` Step 2 classifies persona-prefix text against the canonical baseline using
token-Jaccard similarity: a prefix span scoring `>= 0.65` against a baseline rule is a **duplicate**
and gets stripped; `>= 0.45` plus opposing modal verbs is a **conflict**.

Run against this repo's actual cascade, neither bar is reachable.

## What was measured

Step 2 classifies **sentences**, so sentences are the unit that matters. Normalizing tokens
(lowercase, stopwords removed, code spans stripped) and scoring every prefix sentence against every
baseline line, across all five hand-authored styles (`benchmark.md` is excluded — its whole prefix
sits inside the margin-runner auto-generated block, so it has no eligible strip zone):

| Style | Sentences | Max Jaccard vs baseline |
|---|---|---|
| duet | 142 | **0.444** |
| axiom-mode | 79 | 0.385 |
| builder | 80 | 0.385 |
| odin | 65 | 0.385 |
| linus | 31 | 0.125 |

The two bars must be scored separately, because the conflict rule is not a threshold alone: it is
`Jaccard >= 0.45` **and** opposing modal verbs. Restricting to pairs that actually satisfy the modal
condition collapses the ceiling:

| Rule | Bar | Max observed | Shortfall |
|---|---|---|---|
| Duplicate — any pair | 0.65 | **0.444** | 0.206 |
| Conflict — modal-opposed pairs only | 0.45 | **0.136** | 0.314 |

Neither bar is approached. The conflict detector is the weaker of the two by a wide margin: its best
candidate anywhere in the corpus scores under a third of its threshold.

Scoring coarser units understates the effect further — at paragraph-block granularity the corpus max
drops to 0.33, and intra-prefix block-vs-block comparison finds nothing at all above 0.30.

## The corpus's one real contradiction fails the conflict predicate outright

This run found a genuine contradiction by reading, not by scoring. Before the cascade-dedup run that
produced this doc, `builder.md` and `duet.md` each carried a `[MANDATORY]`
block — "invoke the relevant thinking tool ... whenever reasoning is needed" — followed by a later
section licensing the opposite: "reach for them when they actually help, and skip them when the path
is straightforward" (builder), "what you reach for when the natural rhythm of pick-and-execute is no
longer producing decisions" (duet). Both contradict the canonical `sequential-thinking [ALWAYS USE]`.
This run rewrote those trailing clauses, so the quoted wording no longer appears in the working tree.

The important part is that this contradiction fails the documented conflict predicate on **both**
conjuncts, not just the threshold:

- **Score**: the contradicting sentences share almost no tokens with the terse baseline line they
  contradict, landing far below 0.45.
- **Modal opposition**: neither sentence carries a modal form the predicate recognizes. The
  obligation lives in a section *heading* (`[MANDATORY]`) and in the baseline's bracketed
  `[ALWAYS USE]` tag; the permission is carried by the ordinary verb "skip". No `must`/`never`
  pair appears anywhere in the contradicting text.

So the rule would not have flagged this even at a threshold of zero. **A lexical predicate over
modal keywords cannot find a contradiction expressed through ordinary verbs and structural markup**,
which is how contradictions in prose usually arrive. Treat the conflict rule as a detector for
explicitly-worded modal reversals only, and keep reading for the rest.

## Why the metric fails here

Length asymmetry. The canonical baseline states each rule once, tersely — `**Thinking tools:**
sequential-thinking [ALWAYS USE] decomposition/dependencies | actor-critic-thinking alternatives |
shannon-thinking uncertainty/risk`. The persona prefixes restate the same rule across several
sentences, in the persona's own register.

Jaccard is `|A ∩ B| / |A ∪ B|`. The intersection is capped by the short side while the union grows
with the long side, so a faithful but verbose restatement scores *low* precisely because it is
verbose. The metric measures compression ratio as much as semantic overlap. Splitting to sentences
narrows the gap — 0.33 becomes 0.444 — but does not close it, because the restatement spreads one
baseline rule across several sentences and each individual sentence then shares only a fraction of
the rule's tokens.

The duplication in this cascade is real, but it is **semantic**, not lexical. A lexical metric
cannot see it at any threshold that would not also produce false positives everywhere else.

## The instrument that does work

Count how many times a rule is asserted per file, by matching on the rule's distinctive terms rather
than on span overlap:

```bash
rg -ci "absolutely right|validation phrase|great question" <prefix>   # validation-phrase ban
rg -ci "sequential-thinking|shannon-thinking|actor-critic-thinking" <prefix>   # tool routing
```

Measured that way, the same corpus is obviously repetitive:

| Style | Tool routing | Self-skepticism | Validation ban |
|---|---|---|---|
| duet | 5x | 5x | 4x |
| odin | 4x | 4x | 3x |
| axiom-mode | 4x | 4x | 3x |

## The trap this prevents

A future run reads "Step 1 clean 6/6, Step 2 found zero duplicates" as a clean bill of health. It is
not: the metric never fired. **Zero findings from a threshold that cannot be reached is not
evidence of absence.** Before trusting a null result from any similarity gate, check the maximum
score actually observed against the bar — if the max sits at half the threshold, the instrument is
wrong for the corpus, not the corpus clean.

## Contrast with `dedup-skills`

The sibling `dedup-skills` skill uses a *higher* shingle-Jaccard guidance value (~0.85) but scopes
itself explicitly to "verbatim/near-verbatim only" and calls the number guidance rather than a rule.
That combination is coherent: a lexical metric with a high bar, honestly advertised as catching only
lexical copies. The mismatch is specific to `cascade-dedup`, whose 0.65 bar is presented as a
general duplicate detector.

## Also worth knowing

Two structural facts about the cascade that the audit surfaced and that survive this run:

- A **declared** override is not drift. `axiom-mode`'s ASCII keyword register contradicts the
  baseline's ASCII-operator mandate, but its `[baseline]` principle line states the override
  explicitly. "Baseline wins" was written for accidental divergence, not self-documented divergence.
- Stripping repetition from an output style is **unverifiable in-session**: styles load only at
  session start, so adherence effects cannot be tested from the session making the edit. Fold each
  cut rule into a surviving line and name the survivor, rather than trusting that a deletion is safe.
