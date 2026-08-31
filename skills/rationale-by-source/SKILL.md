---
name: rationale-by-source
description: 'Use when asked to investigate design rationale, regression causes, or thresholds via source playbooks. Produce a confidence-tiered cited narrative with unknowns retained. Don''t use for tasks that require source or remote-system changes.'
---

# Rationale by source

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Investigate design rationale, regression causes, or thresholds. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only. Read-only investigation. |
| Done | Confidence-tiered cited narrative with unknowns retained. |

## Inputs

1. **Investigation question** (required) — the design rationale, regression cause, or threshold to investigate.
2. **Source categories** (optional) — subset of available source playbooks to query. Defaults to all available categories.

## Procedure

1. Validate the investigation question is concrete enough to direct evidence collection. If the question is ambiguous, state the ambiguity and the assumed interpretation before proceeding.
2. Map the investigation question to relevant source categories from the available playbooks: code-archaeology, linear, notion, slack, datadog, sentry, databricks, incident-postmortem. Select categories that can yield evidence for the question.
3. For each selected source category, run a per-category investigator in parallel. Each investigator queries its source using the category-specific playbook, collecting evidence with explicit citations (source name, identifier, date, and relevant excerpt or summary).
4. For each collected citation, verify the citation actually supports the attached claim. Flag any citation that does not match its claim as unsupported.
5. Synthesize all verified evidence into a single narrative organized by confidence tier:
   - **Well-sourced**: claims supported by multiple independent citations or one strong primary citation.
   - **Weakly-sourced**: claims supported by a single indirect or secondary citation.
   - **Unsupported**: claims where citations were absent, mismatched, or inaccessible.
   - **Unknown**: aspects of the question where no source yielded any evidence.
6. Present the narrative with unknowns explicitly retained. Do not fill gaps with inference or speculation.

## Failure and recovery
- **Source inaccessible**: A source category cannot be queried (permissions, service down, missing integration). Note the gap in the source coverage summary. Continue with remaining sources. Do not widen scope to substitute.
- **Citation mismatch**: A collected citation does not support its attached claim. Downgrade the claim to unsupported tier. Do not reinterpret the citation to force a match.
- **Scope creep**: The investigation question expands beyond the original ask during evidence collection. Stop at the original scope boundary. Report partial results with the boundary stated.
- **No convergent answer**: Sources contradict each other. Present the contradiction in the narrative with each position cited. Do not resolve contradictions by majority vote or speculation.
- Authority is read-only throughout. No rollback is needed because nothing is mutated.

## Output
A structured report containing:
1. **Investigation question** as stated or disambiguated.
2. **Confidence-tiered narrative** with sections for well-sourced, weakly-sourced, unsupported, and unknown claims.
3. **Source coverage summary** listing each source category queried, whether it was accessible, and the number of citations collected.
4. **Open unknowns** listing aspects of the question where no evidence was found, as candidates for future investigation.

## Provenance

Adapted from pstack/skills/why by Lauren Tan (poteto), revision 68836ddaf5697224520f1847d90cdb90ca8babaa. Licensed under MIT (pstack/LICENSE blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25). Clean-room adaptation: source playbooks and investigation workflow preserved as the distinguishing mechanism; no third-party expression copied.
