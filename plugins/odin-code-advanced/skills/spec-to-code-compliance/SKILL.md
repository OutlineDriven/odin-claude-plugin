---
name: spec-to-code-compliance
description: 'Use when implementation must be checked requirement-by-requirement against an authoritative specification, with evidence for each verdict. Handles both standalone spec audits and PR-review spec-drift checks against checked-in spec context. Not for writing or updating specs: use spec-driven-implementation. Not for remote or irreversible changes.'
---

# Spec to code compliance

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Implementation must be checked path-by-path against an authoritative specification, whitepaper, standard, or design document; or during PR review when checked-in spec context exists in the repository and the implementation must be compared against it. |
| Authority | Reversible-local: local files and searches only; no remote mutation, no credential exposure, no deployment. For PR-review mode, fold findings into `review.json` only; no GitHub posts, no separate report file. |
| Side effect | Per-requirement evidence records, refuted or confirmed divergence findings, reverse undocumented-behavior analysis, coverage caveats, and (in PR-review mode) spec-drift findings folded into `review.json`. |
| Done | Each selected requirement has one grounded verdict with searches and lines read, divergences survive independent refutation, and unchecked or unreadable scope is explicit. In PR-review mode, `review.json` contains material spec-drift findings or an explicit close-match. |

## Inputs

Required:
- `spec`: authoritative specification, whitepaper, standard, or design document. Accepts a file path, URL, or pasted text. In PR-review mode, this is the checked-in `spec_context.md` or equivalent spec file.
- `implementation`: the codebase or source files to audit. Accepts a directory path or file list. In PR-review mode, this is the PR diff and checked-out branch contents.

Optional:
- `requirements`: subset of spec requirements to verify; defaults to all extractable requirements.
- `coverage`: percentage or section target; defaults to 100 percent of stated requirements.
- `divergence_thresholds`: minimum evidence count to confirm a divergence; defaults to two independent reads.
- `pr_description.md` (PR-review mode only): additional scope or rationale.

## Refusal

- Missing spec: stop. Report "No specification provided."
- Unreadable spec: stop. Report the file or URL that could not be read.
- Zero requirements extracted: stop. Report "Could not extract verifiable requirements from specification."
- Missing implementation: stop. Report "No implementation provided."
- Empty audit scope: stop. Report "No requirements in scope for audit."
- All requirements unchecked: fail. Report "Audit could not verify any requirement."
- Missing spec context (PR-review mode): the skill does not route. Stop without writing `review.json`.

## Procedure

### Standalone audit mode

1. Collect specification. Read or parse the supplied spec document. Confirm it contains identifiable requirements. Done when: the spec is parsed and contains at least one requirement, or a stop condition is reported.
2. Collect implementation. List the source files or directories to audit. Done when: at least one implementation path is accessible, or a stop condition is reported.
3. Extract verifiable requirements. Enumerate each distinct requirement the spec states. Assign each a stable identifier. Record the expected behavior verbatim from the spec. Done when: every requirement has an identifier and verbatim expected behavior.
4. Scope audit coverage. If a `requirements` subset is supplied, limit the audit to those identifiers. If `coverage` is supplied, report the attained coverage fraction. Done when: the audit scope is bounded.
5. Audit each requirement independently. For each requirement: locate the corresponding implementation paths using targeted searches, read the specific lines of code or configuration that implement the requirement, compare the observed behavior against the spec's expected behavior, and record the requirement identifier, verdict, evidence (search query used and lines read), and the spec clause matched. Done when: every in-scope requirement has a verdict with evidence.
6. Test divergences independently. For each requirement marked divergent: run a second, independent search using a different query path or location strategy. Confirm or refute the divergence with the independent read. If refuted, revert the divergence verdict; if confirmed, retain it with both reads. Done when: every divergence is confirmed or refuted by a second independent read.
7. Reverse undocumented behavior. Search the implementation for behaviors not covered by any spec requirement. Flag each as an undocumented behavior with its implementation location. Done when: undocumented behaviors are enumerated.
8. Compile report. Assemble all findings into the output format. Mark any requirement that was not auditable due to unreadable paths, binary content, or access errors as `UNCHECKED` with the specific reason. Done when: the report is assembled with every requirement classified.

### PR-review mode

Use this mode when checked-in spec context exists in the repository and the task is to compare a PR's implementation against that spec.

9. Read `spec_context.md` and extract the concrete commitments it makes: required behaviors (from the product spec), required files or subsystems to change (from the tech spec), stated constraints, and required follow-up steps, validation, or migrations. Done when: the concrete commitments are extracted from the spec context.
10. Compare those commitments against the actual implementation in `pr_diff.txt` and the checked-out files. Done when: every commitment is compared against the implementation.
11. Distinguish acceptable implementation-level adjustments from material mismatches. Small differences in naming, structure, or low-level technique that preserve the spec's intent are acceptable and not flagged. Done when: acceptable adjustments are distinguished from material mismatches.
12. Flag a mismatch only when it is material: a required behavior in the product spec is missing; the implementation contradicts a spec decision; the change introduces significant unplanned scope; or a required validation, migration, or compatibility step from the tech spec is absent. Done when: material mismatches are flagged with evidence from the spec and diff.
13. Fold spec-alignment findings into `review.json`: put broad spec-drift concerns in the review summary; add inline comments only when the mismatch can be tied to changed lines in the diff; treat material spec drift as at least an important concern. If the implementation matches the spec closely enough, record an explicit close-match and add no comments just to mention alignment. Done when: findings are folded into `review.json` with summary and inline comments as appropriate, or an explicit close-match is recorded.

## Failure modes

- Unauditable requirement: record as `UNCHECKED` with reason; continue to next requirement. Do not fabricate a verdict.
- Partial result: if the audit completes with some `UNCHECKED` or `DIVERGENT` findings, return the partial report with coverage caveat explicitly stated.
- PR-review partial-result rule: never create a separate report file. All findings fold into `review.json`, or none are written.
- PR-review non-mutation rule: do not post to GitHub directly. Do not require literal one-to-one implementation of the spec when the PR achieves the same outcome safely.
- Ambiguous whether a PR difference is material: do not flag. Only flag mismatches tied to evidence in `spec_context.md` and the diff.

## Output

### Standalone audit mode

A structured compliance report: `spec_identifier`, `implementation_identifier`, `coverage` (verdicted vs unchecked fraction), `findings` (one record per requirement with `requirement_id`, `status` of `COMPLIANT`/`DIVERGENT`/`UNCHECKED`, `spec_clause`, `evidence`, `divergence_verification` for DIVERGENT, `undocumented_behavior` for step 7 findings), `unchecked_scope` (requirements that could not be audited with reasons).

### PR-review mode

`review.json` updated with material spec-drift findings (broad concerns in the review summary, inline comments tied to changed diff lines) or an explicit close-match entry; no separate report file is produced.
