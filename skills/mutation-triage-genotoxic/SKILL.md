---
name: mutation-triage-genotoxic
description: 'Use when a passing test suite has survived production mutants or removable test statements and needs triage. Classifies each finding as corroborated, false positive, missing test, or fuzzing target. Not for running campaigns — use mutation-campaign-configuration.'
---

# Mutation triage genotoxic

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A passing test suite has survived production-code mutants, removable test statements, or both, and the user needs triage. |
| Authority | Reversible-local: write only GENOTOXIC_REPORT.md; mutation tools execute read-only against the target test suite; rollback by deleting GENOTOXIC_REPORT.md. |
| Side effect | GENOTOXIC_REPORT.md; mutation tools execute against the target test suite. |
| Done | Every survived mutant and applicable test-removal finding is classified as corroborated, false positive, missing test, or fuzzing target with no unreported remainder. |

## Inputs

- Target test suite path (required).
- Mutation tool output (required): survived mutants list, test-removal findings, or both.
- Source code paths under mutation (required).

## Procedure

1. Collect all survived mutants from mutation tool output. Done when: every survived mutant is recorded with its source location and mutation applied.
2. Collect all test-removal findings: removable test statements whose removal did not cause suite failure. Done when: every test-removal finding is recorded with its statement and guarded behavior.
3. For each survived mutant: identify the mutated source location and the mutation applied; determine whether existing tests exercise the mutated path by examining test coverage of the affected code region; classify as corroborated (semantically equivalent or intentionally unguarded), false positive (caught by a test not executed in the run), missing test (no existing test covers the path), or fuzzing target (complex input parsing, boundary conditions, or state transitions where property-based testing would be more effective). Done when: the mutant has exactly one classification with evidence.
4. For each test-removal finding: identify the removable test statement and the behavior it guards; classify using the same four categories from step 3. Done when: the finding has exactly one classification with evidence.
5. Build the mutation-triage ledger: a structured table with columns for finding ID, source location, mutation or removal description, classification, evidence, and recommended action. Done when: every finding has a ledger row.
6. Write GENOTOXIC_REPORT.md containing the ledger, a summary of counts per classification, and recommended next actions. Done when: the report file exists and contains every ledger row, the summary counts, and the recommendations.

## Failure and recovery

- **Incomplete mutation tool output**: report which mutants or findings lack sufficient data; classify as `insufficient-evidence` in the ledger; do not guess classification.
- **Ambiguous classification**: when evidence supports multiple classifications, record all candidates with rationale; do not collapse to a single label without justification.
- **Partial result**: if the run is interrupted, write whatever ledger entries are complete and note the remainder as unprocessed.
- **Rollback**: delete GENOTOXIC_REPORT.md to undo all changes.

## Output

GENOTOXIC_REPORT.md: mutation-triage ledger, per-classification summary counts, and recommended next actions — ordered by the procedure steps that produced them.

## Provenance

- Origin: Trail of Bits skills repository, genotoxic plugin.
- Revision: d1f1575cff97816e5cc08af66cd2506099c681d3.
- License: CC-BY-SA-4.0 with Trail of Bits attribution preserved; modifications marked; adaptations licensed ShareAlike; no trademark rights claimed; trail-of-bits-mark.svg not reused as branding.
- Adaptation: Clean-room adaptation from four source references (SKILL.md, graph-analysis.md, mutation-frameworks.md, triage-methodology.md). Graph-backed triage replaced with self-contained mutation-triage ledger. No source expression copied verbatim.
