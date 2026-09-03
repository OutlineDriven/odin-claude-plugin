---
name: rationale-by-source
description: 'Use when asked to investigate design rationale, regression causes, or thresholds via source playbooks. Produces a confidence-tiered cited narrative with unknowns retained. Not for why-style decision rationale from conversation context — use why.'
---

# Rationale by source

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Investigate design rationale, regression causes, or thresholds. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only. Read-only investigation. |
| Done | Confidence-tiered cited narrative with unknowns retained. |

## Refusals

- Source or remote-system changes: rejected. This skill is read-only throughout.
- Filling gaps with inference or speculation: rejected. Unknowns stay unknown.
- **Resolving contradictions by majority vote or speculation**: rejected. Contradictions are presented with each position cited.

## Inputs

1. **Investigation question** (required) — the design rationale, regression cause, or threshold to investigate.
2. **Source categories** (optional) — subset of available source playbooks to query. Defaults to all available categories.

## Procedure

1. Confirm that the investigation question is concrete enough to direct evidence collection. If ambiguous, state the ambiguity and the assumed interpretation before proceeding. **Done when**: the question is concrete or the ambiguity is stated with an assumed interpretation.
2. Map the investigation question to relevant source categories from the available playbooks: code-archaeology, linear, notion, slack, datadog, sentry, databricks, incident-postmortem. Select categories that can yield evidence for the question. **Done when**: the category selection is made and justified.
3. For each selected source category, run a per-category investigator in parallel. Each investigator queries its source using the category-specific playbook, collecting evidence with explicit citations (source name, identifier, date, and relevant excerpt or summary). **Done when**: every selected category has returned its evidence or its access failure.
4. Verify that each citation supports its attached claim. Flag mismatches as unsupported. **Done when**: every citation is verified or flagged.
5. Synthesize all verified evidence into a single narrative organized by confidence tier: **Well-sourced** (multiple independent citations or one strong primary), **Weakly-sourced** (single indirect or secondary citation), **Unsupported** (citations absent, mismatched, or inaccessible), **Unknown** (no source yielded evidence). **Done when**: every claim is placed in a tier.
6. Present the narrative with unknowns intact. Do not fill gaps with inference or speculation. **Done when**: the narrative is delivered with all tiers and unknowns.

## Failure and recovery

- Source inaccessible: note the gap in the source coverage summary. Continue with the remaining sources. Do not widen scope to substitute.
- Citation mismatch: downgrade the claim to the unsupported tier. Do not reinterpret the citation to force a match.
- Scope creep: stop at the original scope boundary. Report partial results with the boundary stated.
- No convergent answer: present the contradiction in the narrative with each position cited.

## Output

A structured report with investigation question, confidence-tiered narrative (well-sourced, weakly-sourced, unsupported, unknown), source coverage summary, and open unknowns, ordered as listed.
