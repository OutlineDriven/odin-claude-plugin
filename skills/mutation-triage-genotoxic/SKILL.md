---
name: mutation-triage-genotoxic
description: 'Use when a passing test suite has survived production-code mutants, removable test statements, or both, and the user needs triage. Classifies every survived mutant and test-removal finding as corroborated, false positive, missing test, or fuzzing target and writes GENOTOXIC_REPORT.md. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Mutation triage genotoxic

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A passing test suite has survived production-code mutants, removable test statements, or both, and the user needs triage |
| Authority | Reversible-local: write only GENOTOXIC_REPORT.md; mutation tools execute read-only against the target test suite; rollback by deleting GENOTOXIC_REPORT.md |
| Side effect | GENOTOXIC_REPORT.md; mutation tools execute against the target test suite |
| Done | Every survived mutant and applicable test-removal finding is classified as corroborated, false positive, missing test, or fuzzing target with no unreported remainder |

## Inputs

- Target test suite path (required).
- Mutation tool output (required): survived mutants list, test-removal findings, or both.
- Source code paths under mutation (required).

## Procedure

1. Collect all survived mutants from mutation tool output.
2. Collect all test-removal findings: removable test statements whose removal did not cause suite failure.
3. For each survived mutant:
   a. Identify the mutated source location and the mutation applied.
   b. Determine whether existing tests exercise the mutated path by examining test coverage of the affected code region.
   c. Classify:
      - **Corroborated**: the mutation is semantically equivalent or the test suite intentionally does not guard this behavior.
      - **False positive**: the mutation tool reports a survivor but the mutation is caught by a test that was not executed in the run (e.g., conditional, integration-only).
      - **Missing test**: no existing test covers the mutated path; a new test would catch this mutant.
      - **Fuzzing target**: the mutated path involves complex input parsing, boundary conditions, or state transitions where property-based or fuzz testing would be more effective than a single unit test.
4. For each test-removal finding:
   a. Identify the removable test statement and the behavior it guards.
   b. Classify using the same four categories from step 3c.
5. Build the mutation-triage ledger: a structured table with columns for finding ID, source location, mutation or removal description, classification, evidence, and recommended action.
6. Write GENOTOXIC_REPORT.md containing the ledger, a summary of counts per classification, and recommended next actions.

## Failure and recovery
- **Incomplete mutation tool output**: report which mutants or findings lack sufficient data; classify as "insufficient-evidence" in the ledger; do not guess classification.
- **Ambiguous classification**: when evidence supports multiple classifications, record all candidates with rationale; do not collapse to a single label without justification.
- **Partial result**: if the run is interrupted, write whatever ledger entries are complete and note the remainder as unprocessed.
- **Rollback**: delete GENOTOXIC_REPORT.md to undo all changes.

## Output
GENOTOXIC_REPORT.md containing:
- Mutation-triage ledger with one row per survived mutant and test-removal finding.
- Summary counts: corroborated, false positive, missing test, fuzzing target.
- Recommended next actions per finding where applicable.

## Provenance

- Origin: Trail of Bits skills repository, genotoxic plugin.
- Revision: d1f1575cff97816e5cc08af66cd2506099c681d3.
- License: CC-BY-SA-4.0 with Trail of Bits attribution preserved; modifications marked; adaptations licensed ShareAlike; no trademark rights claimed; trail-of-bits-mark.svg not reused as branding.
- Adaptation: Clean-room adaptation from four source references (SKILL.md, graph-analysis.md, mutation-frameworks.md, triage-methodology.md). Graph-backed triage replaced with self-contained mutation-triage ledger. No source expression copied verbatim.
