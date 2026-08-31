---
name: spec-to-code-compliance
description: 'Use when implementation must be checked requirement-by-requirement against an authoritative specification, with evidence for each verdict. Not for writing or updating specs — use spec-driven-implementation. Don''t use for remote or irreversible changes.'
---

# Spec to code compliance

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Implementation must be checked path-by-path against an authoritative specification, whitepaper, standard, or design document. |
| Authority | reversible-local: local files and searches only; no remote mutation, no credential exposure, no deployment. |
| Side effect | Per-requirement evidence records, refuted or confirmed divergence findings, reverse undocumented-behavior analysis, and coverage caveats written to local report output only. |
| Done | Each selected requirement has one grounded verdict with searches and lines read, divergences survive independent refutation, and unchecked or unreadable scope is explicit. |

## Inputs

Required:
- `spec`: authoritative specification, whitepaper, standard, or design document. Accepts a file path, URL, or pasted text.
- `implementation`: the codebase or source files to audit. Accepts a directory path or file list.

Optional:
- `requirements`: subset of spec requirements to verify; defaults to all extractable requirements.
- `coverage`: percentage or section target; defaults to 100 percent of stated requirements.
- `divergence_thresholds`: minimum evidence count to confirm a divergence; defaults to two independent reads.

## Refusal

- Missing spec: stop. Report "No specification provided."
- Unreadable spec: stop. Report the file or URL that could not be read.
- Zero requirements extracted: stop. Report "Could not extract verifiable requirements from specification."
- Missing implementation: stop. Report "No implementation provided."
- Empty audit scope: stop. Report "No requirements in scope for audit."
- All requirements unchecked: fail. Report "Audit could not verify any requirement."

## Procedure

1. **Collect specification.** Read or parse the supplied spec document. Confirm it contains identifiable requirements. Done when: the spec is parsed and contains at least one requirement, or a stop condition is reported.
2. **Collect implementation.** List the source files or directories to audit. Done when: at least one implementation path is accessible, or a stop condition is reported.
3. **Extract verifiable requirements.** Enumerate each distinct requirement the spec states. Assign each a stable identifier. Record the expected behavior verbatim from the spec. Done when: every requirement has an identifier and verbatim expected behavior.
4. **Scope audit coverage.** If a `requirements` subset is supplied, limit the audit to those identifiers. If `coverage` is supplied, report the attained coverage fraction. Done when: the audit scope is bounded.
5. **Audit each requirement independently.** For each requirement: locate the corresponding implementation paths using targeted searches, read the specific lines of code or configuration that implement the requirement, compare the observed behavior against the spec's expected behavior, and record the requirement identifier, verdict, evidence (search query used and lines read), and the spec clause matched. Done when: every in-scope requirement has a verdict with evidence.
6. **Test divergences independently.** For each requirement marked divergent: run a second, independent search using a different query path or location strategy. Confirm or refute the divergence with the independent read. If refuted, revert the divergence verdict; if confirmed, retain it with both reads. Done when: every divergence is confirmed or refuted by a second independent read.
7. **Reverse undocumented behavior.** Search the implementation for behaviors not covered by any spec requirement. Flag each as an undocumented behavior with its implementation location. Done when: undocumented behaviors are enumerated.
8. **Compile report.** Assemble all findings into the output format. Mark any requirement that was not auditable due to unreadable paths, binary content, or access errors as `UNCHECKED` with the specific reason. Done when: the report is assembled with every requirement classified.

## Failure modes

- Unauditable requirement: record as `UNCHECKED` with reason; continue to next requirement. Do not fabricate a verdict.
- Partial result: if the audit completes with some `UNCHECKED` or `DIVERGENT` findings, return the partial report with coverage caveat explicitly stated.

## Output

A structured compliance report: `spec_identifier`, `implementation_identifier`, `coverage` (verdicted vs unchecked fraction), `findings` (one record per requirement with `requirement_id`, `status` of `COMPLIANT`/`DIVERGENT`/`UNCHECKED`, `spec_clause`, `evidence`, `divergence_verification` for DIVERGENT, `undocumented_behavior` for step 7 findings), `unchecked_scope` (requirements that could not be audited with reasons).
