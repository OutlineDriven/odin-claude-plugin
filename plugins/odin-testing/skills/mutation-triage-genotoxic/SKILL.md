---
name: mutation-triage-genotoxic
description: 'Use when a mutation campaign leaves surviving mutants needing triage. Classifies each as false-positive, missing-test, genotoxic, or removable. Not for setup: use mutation-campaign-configuration.'
---

# Mutation triage genotoxic

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A mutation campaign has produced surviving mutants and the user needs triage. |
| Authority | Reversible local: writes only the classification ledger and test-change proposals; rollback is deleting the ledger. No remote mutation. Does not mutate tests or source directly. |
| Side effect | A classification ledger with one label per mutant and proposed test changes. |
| Done | Every surviving mutant has exactly one classification (false-positive, missing-test, genotoxic, or removable) with coverage-map evidence, and the ledger has no unprocessed remainder. |

## Inputs

- Mutation report (required): the output of a completed mutation campaign listing surviving mutants with source locations and mutations applied.
- Source tree (required): the codebase under mutation, accessible for reading.
- Coverage map (required): a line or branch coverage map showing which tests exercise which source regions. Without this, classification cannot proceed.

## Procedure

1. Ingest the mutation report. Collect every surviving mutant with its source location, mutation applied, and mutant identifier. Group mutants by changed source region (function, method, or block). Done when: every surviving mutant is recorded and grouped by region.
2. For each group, consult the coverage map to determine whether tests exercise the mutated region. Record which tests cover the region and which lines or branches within it are covered. Done when: every group has a coverage determination: covered, partially covered, or uncovered.
3. Classify each mutant as exactly one of:
   - false-positive: the mutant is semantically equivalent to the original, or a test that catches it exists but was not executed in the campaign run. Coverage map shows the region is covered; the mutant's effect is null or already guarded.
   - missing-test: the coverage map shows no test exercises the mutated region. The fix is to write a test that covers the region.
   - genotoxic: the coverage map shows tests exercise the region but the mutant survived. The existing tests touch the code but do not assert the behavior the mutation changed. The fix is to strengthen the existing test or add an assertion.
   - removable: the mutated code is dead, unreachable, or behind a permanently disabled feature flag. The fix is to remove the dead code, not to test it.
   Done when: each mutant has exactly one classification with coverage-map evidence cited.
4. Write proposals to the ledger. For each mutant, record the classification, the coverage evidence, and the proposed action (no action, write test, strengthen test, remove dead code). Done when: every mutant has a ledger entry with classification, evidence, and proposed action.
5. Verify every mutation is accounted for. Count the mutants in the report and the entries in the ledger. If any mutant lacks a classification, return to step 3 for that mutant. Done when: the ledger count equals the report count and no mutant is unprocessed.

## Failure and recovery

- Missing coverage map: the coverage map was not supplied or cannot be read. Stop. Report that classification cannot proceed without coverage evidence. Do not guess coverage from test names or source inspection.
- Unsupported classification: a mutant does not fit any of the four labels. Stop. Report the mutant and the evidence that prevented classification. Do not invent a fifth label or force an unsupported fit.
- Partial write rollback: if the ledger write fails partway, delete the incomplete ledger and report which entries were written and which were not. Do not leave a partial ledger as the result.

## Output

A complete classification ledger with exactly one label per mutant (false-positive, missing-test, genotoxic, or removable), coverage-map evidence for each classification, proposed test changes or code removals, and a summary count per label. No unprocessed remainder.
