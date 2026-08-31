---
name: spec-to-code-compliance
description: 'Use when asked to check implementation path-by-path against an authoritative specification and return one grounded verdict per requirement with evidence of matches or divergences. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

## Procedure

1. **Collect specification.** Read or parse the supplied spec document. Confirm it contains identifiable requirements. Stop if the document is unreadable or yields zero requirements.
2. **Collect implementation.** List the source files or directories to audit. Stop if no implementation path is accessible.
3. **Extract verifiable requirements.** Enumerate each distinct requirement the spec states. Assign each a stable identifier. Record the expected behavior verbatim from the spec.
4. **Scope audit coverage.** If a `requirements` subset is supplied, limit the audit to those identifiers. If `coverage` is supplied, report the attained coverage fraction.
5. **Audit each requirement independently.**
   - 5a. For each requirement, locate the corresponding implementation paths using targeted searches across the implementation surface.
   - 5b. Read the specific lines of code or configuration that implement the requirement.
   - 5c. Compare the observed behavior against the spec's expected behavior.
   - 5d. Record the requirement identifier, verdict, evidence (search query used and lines read), and the spec clause matched.
6. **Test divergences independently.** For each requirement marked divergent:
   - 6a. Run a second, independent search using a different query path or location strategy.
   - 6b. Confirm or refute the divergence with the independent read.
   - 6c. If refuted, revert the divergence verdict; if confirmed, retain it with both reads.
7. **Reverse undocumented behavior.** Search the implementation for behaviors not covered by any spec requirement. Flag each as an undocumented behavior with its implementation location.
8. **Compile report.** Assemble all findings into the output format. Mark any requirement that was not auditable due to unreadable paths, binary content, or access errors as `UNCHECKED` with the specific reason.

## Failure and recovery
- **Missing spec:** Stop. Report "No specification provided."
- **Unreadable spec:** Stop. Report the file or URL that could not be read.
- **Zero requirements extracted:** Stop. Report "Could not extract verifiable requirements from specification."
- **Missing implementation:** Stop. Report "No implementation provided."
- **Empty audit scope:** Stop. Report "No requirements in scope for audit."
- **Unauditable requirement:** Record as `UNCHECKED` with reason; continue to next requirement. Do not fabricate a verdict.
- **All requirements unchecked:** Fail. Report "Audit could not verify any requirement."
- Partial-result rule: if the audit completes with some `UNCHECKED` or `DIVERGENT` findings, return the partial report with coverage caveat explicitly stated.

## Output
A structured compliance report containing:

- `spec_identifier`: name or version of the specification used.
- `implementation_identifier`: path or version of the audited codebase.
- `coverage`: fraction of requirements that received a verdict versus those that were unchecked.
- `findings`: array of one record per requirement, each with:
  - `requirement_id`: stable identifier from step 3.
  - `status`: `COMPLIANT`, `DIVERGENT`, or `UNCHECKED`.
  - `spec_clause`: the verbatim expected behavior.
  - `evidence`: search queries used and source lines read.
  - `divergence_verification`: for `DIVERGENT`, both independent reads confirming the gap.
  - `undocumented_behavior`: for undocumented behaviors found in step 7, the location and observed behavior not covered by any spec requirement.
- `unchecked_scope`: list of requirements that could not be audited and the reason for each.

## Provenance

Origin: Trail of Bits skills repository, https://github.com/trailofbits/skills, revision d1f1575cff97816e5cc08af66cd2506099c681d3.

License: CC-BY-SA-4.0. Adaptations preserve attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and do not reuse trail-of-bits-mark.svg as branding.

Source paths adapted:
- /plugins/spec-to-code-compliance/skills/spec-to-code-compliance/SKILL.md
- /plugins/spec-to-code-compliance/agents/spec-compliance-checker.md

Clean-room adaptation: the requirement-to-enforcement audit procedure with independent divergence refutation is preserved as the core mechanism; formatting, section structure, and ODIN frontmatter are authored to ODIN 2.0 specification.
