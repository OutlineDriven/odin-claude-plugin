---
name: evaluation-leakage-audit
description: 'Use when reviewing an evaluation, benchmark, or scoring harness for leakage or contamination. Returns a read-only audit naming detected leakage patterns, where independent ground truth enters or fails to enter, and a fix for each finding.'
---

# Evaluation leakage audit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Building or reviewing an evaluation, benchmark, or scoring harness, or an explicit request to check it for leakage or contamination. |
| Authority | Read-only: inspect supplied evidence and report in chat; do not mutate files, version control, credentials, paid resources, publications, deployments, or remote state. |
| Side effect | Return only a leakage audit naming where independent ground truth enters and where it does not, with an independence fix for each detected pattern. |
| Done | Every applicable pattern below has been tested; only detected patterns are reported; each finding has evidence and an independence fix; if none fire, the report says no leak was found. |

## Inputs

Supply the evaluation or benchmark design and the available artifacts that establish the roles of the model or subject, dataset, labels, scorer, controls, designer, train split, and holdout split. Results, prompts, scoring code, labeler provenance, and subject instructions are optional unless needed to test a pattern. Treat claims about hidden data, independent labels, or private procedures as unverified unless the supplied evidence establishes them.

## Procedure

1. Bound the audit to the supplied evaluation and evidence. Name the model or subject, scorer, designer, dataset, labels, controls, train split, holdout split, and the origin of any claimed ground truth. Mark unavailable components as unknown rather than inferring them. Done when: every role is named or marked unknown.
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
   Done when: every applicable pattern is tested with a firing/non-firing determination.
4. Report a pattern only when evidence shows that it fires. For each finding, identify the component and evidence, explain how independence is broken, and state the concrete independence fix. Do not rewrite the experiment or widen the audit beyond the supplied scope. Done when: every firing pattern is reported with component, evidence, broken-independence explanation, and fix.
5. If no pattern fires after all applicable tests, return a pass that says no leak was found and separately lists unknowns that prevented any pattern from being tested; do not convert missing evidence into either a finding or proof of independence. Done when: a terminal classification of leak found, no leak found, or blocked is returned.

## Failure and recovery
- Missing design evidence: if roles, data lineage, scoring lineage, or label provenance needed for a test are absent, mark that test `blocked` and name the exact missing evidence. Return supported findings as partial results, but do not claim the audit passed.
- Conflicting evidence: identify the conflict and mark affected tests `blocked`; do not choose an account without evidence.
- Out-of-scope access or mutation required: stop at the boundary and state what read-only evidence would resolve the test. Make no changes, so rollback is unnecessary.
- Non-converged classification: if the available evidence supports incompatible leakage classifications that cannot be resolved, return `non-converged` for the affected pattern with both evidence chains. Never suppress the conflict or claim the done predicate.

## Output
A chat report with the audited scope and component map, verified independent ground-truth entry points, detected patterns with evidence and fix, blocked or non-converged tests with required evidence, and a terminal classification of `leak found`, `no leak found`, or `blocked`.
