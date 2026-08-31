---
title: "Token-Jaccard thresholds miss semantic duplication in the prompt cascade"
date: 2026-07-27
category: docs/solutions/workflow-issues
module: skills
problem_type: tooling_decision
component: tooling
severity: medium
applies_when:
  - "Running cascade-dedup against packages/odin-core/output-styles/ and system-prompt-baseline.md"
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

`cascade-dedup` Step 2 classifies persona-prefix text against the canonical baseline using token-Jaccard similarity: it flags prefix spans scoring `>= 0.65` against a baseline rule as **duplicates** and strips them; scores `>= 0.45` combined with opposing modal verbs indicate a **conflict**.

Across this repository's prompt cascade, neither threshold is reachable.

## What the audit measured

Step 2 evaluates text at sentence granularity. Normalizing tokens (converting to lowercase, removing stopwords, and stripping code spans) and scoring each prefix sentence against every baseline line across all five hand-authored styles (excluding `benchmark.md`, whose prefix resides entirely within an auto-generated margin-runner block):

| Style | Sentences | Max Jaccard vs baseline |
|---|---|---|
| duet | 142 | **0.444** |
| axiom-mode | 79 | 0.385 |
| builder | 80 | 0.385 |
| odin | 65 | 0.385 |
| linus | 31 | 0.125 |

The duplicate and conflict rules require separate scoring because the conflict metric requires both `Jaccard >= 0.45` and opposing modal verbs. Restricting evaluation to pairs meeting the modal condition further reduces the observed maximum:

| Rule | Bar | Max observed | Shortfall |
|---|---|---|---|
| Duplicate — any pair | 0.65 | **0.444** | 0.206 |
| Conflict — modal-opposed pairs only | 0.45 | **0.136** | 0.314 |

No pair approaches either threshold in practice. The conflict detector is especially ineffective: its highest candidate scores under one-third of the required threshold.

Evaluating coarser units yields even lower similarity: at paragraph-block granularity the corpus maximum drops to 0.33, while intra-prefix block comparisons remain below 0.30.

## Real contradictions the conflict predicate misses

Manual review identified a genuine contradiction undetected by scoring. Prior to the run documenting this behavior, `builder.md` and `duet.md` each contained a `[MANDATORY]` block requiring thinking tools for reasoning, followed by subsequent text permitting omission: "reach for them when they actually help, and skip them when the path is straightforward" (builder), and "what you reach for when the natural rhythm of pick-and-execute is no longer producing decisions" (duet). Both statements contradicted the canonical `sequential-thinking [ALWAYS USE]`. A rewrite removed these trailing clauses, so the quoted text no longer appears in the working tree.

This contradiction fails the documented conflict predicate on both criteria:

- **Similarity score**: The conflicting sentences share minimal tokens with the concise baseline rule, scoring well below 0.45.
- **Modal opposition**: Neither sentence contains recognized modal opposites. Structural headings (`[MANDATORY]`) and the baseline's `[ALWAYS USE]` tag carry the obligation, while the verb "skip" conveys permission. No standard `must`/`never` pair appears in the conflicting text.

The rule would fail to detect this contradiction even with a threshold of zero. **Lexical predicates over modal keywords cannot detect contradictions expressed through ordinary verbs or markup hierarchy**. The conflict rule functions only for explicit modal reversals; structural review remains necessary for semantic contradictions.

## Why the metric fails here

The core issue is length asymmetry. The canonical baseline states rules concisely: `**Thinking tools:** sequential-thinking [ALWAYS USE] decomposition/dependencies | actor-critic-thinking alternatives | shannon-thinking uncertainty/risk` (as configured during the test run; subsequently integrated into the ordered-decomposition rule). Persona prefixes restate these principles across multiple sentences in their specific register.

Jaccard similarity (`|A ∩ B| / |A ∪ B|`) caps the intersection by the shorter text while the union expands with the longer text. As a result, detailed restatements produce low similarity scores, measuring compression differences rather than semantic divergence. Evaluating by sentence increases the ceiling from 0.33 to 0.444 but cannot resolve the underlying mismatch, as individual sentences contain only a fraction of the baseline rule's tokens.

The prompt cascade exhibits semantic duplication rather than lexical repetition. Lexical metrics cannot detect this overlap without lowering thresholds to levels that produce widespread false positives.

## Effective keyword frequency alternative

Counting specific rule terms per file reveals repetition where span-matching fails:

```bash
rg -ci "absolutely right|validation phrase|great question" <prefix>   # validation-phrase ban
rg -ci "sequential-thinking|shannon-thinking|actor-critic-thinking" <prefix>   # tool routing
```

Term-frequency counts expose substantial repetition across styles:

| Style | Tool routing | Self-skepticism | Validation ban |
|---|---|---|---|
| duet | 5x | 5x | 4x |
| odin | 4x | 4x | 3x |
| axiom-mode | 4x | 4x | 3x |

## Failure modes this prevents

Interpreting zero findings from unreachable thresholds as validation creates a false sense of correctness. **A null result from an unreachable threshold does not indicate the absence of duplication.** Always compare the highest observed score against the target threshold; if the maximum is far below the requirement, the metric is ill-suited for the corpus.

## Comparison with dedup-skills

The `dedup-skills` tool applies a higher shingle-Jaccard threshold (~0.85) explicitly limited to verbatim or near-verbatim matches and treats the value as guidance. This provides a consistent model for lexical matching. In contrast, `cascade-dedup` defines a 0.65 threshold as a general duplicate detector for semantic restatements where it cannot succeed.

## Additional structural findings

Two structural properties observed during the audit remain relevant:

- **Declared overrides do not constitute drift.** `axiom-mode`'s ASCII keyword register contradicts the baseline's ASCII-operator mandate, but its `[baseline]` principle line states the override explicitly. Baseline precedence applies to accidental divergence rather than documented customizations.
- **An active session cannot verify output-style deduplication.** Output styles load exclusively at session start, preventing live validation of adherence changes. Fold each cut rule into a surviving line and name the survivor, rather than trusting that a deletion is safe.
