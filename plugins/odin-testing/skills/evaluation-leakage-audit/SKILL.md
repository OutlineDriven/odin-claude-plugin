---
name: evaluation-leakage-audit
description: 'Use when reviewing an evaluation, benchmark, or scoring harness for leakage, or a validation result that looks self-confirming. Modes: leakage, self-audit. Not for one claim: use verify-both-ways.'
---

# Evaluation leakage audit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Building or reviewing an evaluation, benchmark, or scoring harness, or an explicit request to check it for leakage or contamination (leakage mode); or a validation plan or result meant to show whether something worked, such as an A/B test, holdout, or score, looks too clean or self-confirming (self-audit mode). |
| Authority | Read-only: inspects supplied evidence and reports in chat; writes nothing, so no rollback is needed. No remote mutation. |
| Side effect | Return only a report naming where independent ground truth enters and where it does not, with an independence fix for each detected pattern; self-audit mode also names the audit's own non-independence and one root failure. |
| Done | Every applicable pattern below has been tested; only detected patterns are reported; each finding has evidence and an independence fix; self-audit mode also applies the auditor-bias patterns to the audit itself and names one root independence failure; if none fire, the report says no leak was found. |

## Inputs

- Mode. `leakage` or `self-audit`; when omitted, step 1 selects it: `self-audit` when the subject is a validation result meant to show whether something worked, `leakage` otherwise. Optional.
- Evaluation design and evidence. The evaluation or benchmark design and the artifacts that establish the roles of the model or subject, dataset, labels, scorer, controls, designer, train split, and holdout split. Results, prompts, scoring code, labeler provenance, and subject instructions are optional unless needed to test a pattern. Required.
- Validation subject. Mode self-audit: the validation claim, design, and observed result, plus the intervention, baseline or control, sampling method, evaluator, metric, stopping rule, and raw evidence; an independent auditor's assessment is optional and feeds the N=1 auditor check. Required for self-audit mode.

Treat claims about hidden data, independent labels, or private procedures as unverified unless the supplied evidence establishes them.

## Procedure

1. Bound the audit to the supplied evaluation and evidence. Name the model or subject, scorer, designer, dataset, labels, controls, train split, holdout split, and the origin of any claimed ground truth. Mark unavailable components as unknown rather than inferring them. Mode self-audit: also bound the claim being validated, the intervention, the comparison, the measured outcome, and the decision the result is meant to support. Done when: every role is named or marked unknown, and in self-audit mode the claim, intervention, comparison, outcome, and decision are bounded.
2. Trace each result backward through scoring and labels to determine whether ground truth enters from a source independent of the system, subject, designer, and outputs being judged. Record both the verified independent entry points and the places where no independent ground truth enters. Done when: every result is traced to its ground truth source with entry points and gaps recorded.
3. Test every pattern that the supplied design and evidence make applicable:
   1. **Recall, not reason:** determine whether success can come from reproducing memorized benchmark answers rather than deriving an answer. A firing finding must propose fresh or access-controlled items whose answers are independently produced after model training.
   2. **Wrong null hypothesis:** determine whether a control removes the label while retaining a proxy or signal that predicts it. A firing finding must propose a control that removes or balances the retained signal while preserving unrelated task structure.
   3. **Shared hallucination:** determine whether one generative component validates another without an independent reference. A firing finding must propose externally sourced labels, measurements, or adjudication independent of both components.
   4. **Tautology:** determine whether the scorer grades categories, buckets, or criteria that it created from the same outputs. A firing finding must propose criteria fixed before observing outputs and labels produced independently of the scorer.
   5. **Verifier equals designer:** determine whether the holdout or verification depends on a private, unreproducible recipe controlled by the experiment designer. A firing finding must propose a preregistered, reproducible procedure or independent verifier with access to auditable evidence.
   6. **Shared-pool bias:** determine whether training and holdout labels come from the same labeler pool, allowing shared systematic bias to appear as generalization. A firing finding must propose an independently recruited or independently adjudicated holdout label source.
   7. **Frame injection:** determine whether the prompt or question supplies the hypothesis, expected relation, or answer frame being measured. A firing finding must propose neutral wording and blinded alternatives that do not reveal the target hypothesis.
   8. **Demand characteristics:** determine whether subjects know the behavior or outcome being measured and can adapt to it. A firing finding must propose blinding, masking, or an unobtrusive measure that withholds the tested expectation without compromising consent.
   Mode self-audit: also test these independence patterns:
   9. **Shared implementation:** determine whether the intervention and the control share an implementation, so a common defect or feature appears as a treatment effect. A firing finding must propose a separately implemented control.
   10. **Evaluator awareness:** determine whether the evaluator knows the expected result and can steer the measurement. A firing finding must propose a blinded evaluator.
   11. **Post-hoc metric:** determine whether the metric or criteria were selected after observing outcomes. A firing finding must propose a preregistered metric fixed before results are seen.
   12. **Optional stopping:** determine whether collection stopped at a convenient result or reporting was selective. A firing finding must propose a preregistered stopping rule and complete reporting.
   13. **Dependent observations:** determine whether observations presented as independent share a subject, session, or unit, inflating the effective sample. A firing finding must propose the correct unit of analysis.
   Done when: every applicable pattern is tested with a firing/non-firing determination.
4. Report a pattern only when evidence shows that it fires. For each finding, identify the component and evidence, explain how independence is broken, and state the concrete independence fix. Do not rewrite the experiment or widen the audit beyond the supplied scope. Done when: every firing pattern is reported with component, evidence, broken-independence explanation, and fix.
5. Mode self-audit: audit the auditor. Apply patterns 10-12 to this audit: check whether the auditor knows the desired verdict, chose criteria after seeing the result, or stopped after finding a convenient explanation; if any fires, mark the audit `non-independent audit` and prescribe a blinded auditor, preregistered criteria, or a fixed stopping rule. When an independent assessment is available, compare it as an N=1 auditor check and treat disagreement as evidence requiring resolution, not a majority vote. Then identify the single root independence failure that best explains the supported findings, keeping secondary patterns only when they require a distinct fix. Done when: the auditor self-audit and the N=1 comparison are complete or noted unavailable, and one root failure is identified.
6. If no pattern fires after all applicable tests, return a pass that says no leak was found and separately lists unknowns that prevented any pattern from being tested; do not convert missing evidence into either a finding or proof of independence. Mode self-audit: the terminal verdict is `independent`, `not independent`, or `blocked`. Done when: a terminal classification of leak found, no leak found, blocked, or a self-audit verdict is returned.

## Failure and recovery
- Missing design evidence: if roles, data lineage, scoring lineage, or label provenance needed for a test are absent, mark that test `blocked` and name the exact missing evidence. Return supported findings as partial results, but do not claim the audit passed.
- Conflicting evidence: identify the conflict and mark affected tests `blocked`; do not choose an account without evidence.
- Entangled auditor: in self-audit mode, return `non-independent audit`, name which auditor-bias pattern fired, and require a blinded auditor, preregistered criteria, or a fixed stopping rule before trusting the audit.
- No external ground truth: state that the validation is self-referential and require an independent outcome measure; do not convert internal agreement into proof.
- Multiple plausible roots: in self-audit mode, return the minimum distinguishing evidence needed; do not produce an unranked laundry list.
- Out-of-scope access or mutation required: stop at the boundary and state what read-only evidence would resolve the test. Make no changes, so rollback is unnecessary.
- Non-converged classification: if the available evidence supports incompatible leakage classifications that cannot be resolved, return `non-converged` for the affected pattern with both evidence chains. Never suppress the conflict or claim the done predicate.

## Output
A chat report with the audited scope and component map, verified independent ground-truth entry points, detected patterns with evidence and fix, blocked or non-converged tests with required evidence, and a terminal classification of `leak found`, `no leak found`, or `blocked`. Mode self-audit: the report also carries the bounded claim, the auditor self-audit result, the N=1 auditor comparison when available, one root independence failure, and a terminal verdict of `independent`, `not independent`, `non-independent audit`, or `blocked`.
