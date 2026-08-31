---
name: validation-self-audit
description: 'Use when asked to audit validation that looks too clean or self-confirming. Name each firing independence failure, prescribe its fix, and audit the auditor''s own evidence. Don''t use for tasks that require source or remote-system changes.'
---

# Validation self audit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Before trusting any how-we'll-know-it-worked validation such as an A/B test, holdout, or score, or when its result looks too clean or self-confirming. |
| Authority | Read-only: inspect supplied validation design and evidence without changing files, VCS, credentials, paid services, published material, deployments, or remote state. |
| Side effect | None; names only the independence failures that fire and the corresponding fixes. |
| Done | Every firing pattern is named with an independence fix, patterns 3–5 are applied to the audit itself, and one root failure is identified instead of returning a laundry list. |

## Inputs

- The validation claim, design, and observed result. Required.
- The intervention, baseline or control, sampling method, evaluator, metric, stopping rule, and raw evidence. Supply every item that exists; identify missing items rather than inventing them.
- An independent auditor's assessment. Optional; use it as the N=1 auditor check when available.

## Procedure

1. Bound the claim being validated, the intervention, the comparison, the measured outcome, and the decision the result is meant to support.
2. Trace independence across eight patterns: shared data between construction and evaluation; shared implementation between intervention and control; evaluator awareness of the expected result; metric selection after observing outcomes; optional stopping or selective reporting; contamination between treatment and holdout; dependence between observations presented as independent; and a benchmark or score that restates the system's own assumptions.
3. Report only patterns supported by supplied evidence. For each firing pattern, name the evidence and prescribe the smallest independence fix: a fresh holdout, separately implemented control, blinded evaluator, preregistered metric and stopping rule, contamination barrier, correct unit of analysis, or external ground truth.
4. Apply patterns 3–5 to this audit: check whether the auditor knows the desired verdict, chose criteria after seeing the result, or stopped after finding a convenient explanation. If any fires, mark the audit non-independent and prescribe its fix.
5. When an independent assessment is available, compare it as an N=1 auditor check. Treat disagreement as evidence requiring resolution, not a majority vote.
6. Identify the single root independence failure that best explains the supported findings. Keep secondary patterns only when they require a distinct fix.
7. Stop with a blocked result when evidence needed to distinguish firing from non-firing patterns is unavailable; do not widen scope or infer clean validation from missing evidence.

## Failure and recovery
- **Missing evidence**: Return `blocked` with the exact missing artifact or fact and the patterns that cannot be classified.
- **Entangled auditor**: Return `non-independent audit`, name which of patterns 3–5 fired, and require a blinded auditor, preregistered criteria, or fixed stopping rule before trusting the audit.
- **No external ground truth**: State that the validation is self-referential and require an independent outcome measure; do not convert internal agreement into proof.
- **Multiple plausible roots**: Return the minimum distinguishing evidence needed; do not produce an unranked laundry list.
- **Partial result**: Preserve supported classifications and mark every unresolved pattern unknown. Never claim the done predicate while the root failure remains unresolved.

## Output
A read-only report containing the bounded validation claim, each firing pattern by name with evidence and its independence fix, the patterns 3–5 self-audit, the optional N=1 auditor comparison, one root independence failure, and a terminal verdict of `independent`, `not independent`, or `blocked`.

## Provenance

Adapted from LilMGenius/paperthin at revision `3bca079a51bcfff5dafb53d1d7f9f523d66ee317`, `skills/depth/mandela/SKILL.md`, under MIT. This is a clean-room restatement of the validation self-audit mechanism; no vendored expression was copied. See root `PROVENANCE.md` for the retained third-party notice and reuse obligations.
