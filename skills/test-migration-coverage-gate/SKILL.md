---
name: test-migration-coverage-gate
description: 'Delete a superseded test only after every assertion maps to its replacement, with a coverage receipt in the commit. Not for tests that catch no real bug — use tests-purge-unneeded; not for untracked data or changes without VCS rollback.'
---

# Test migration coverage gate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | About to delete a test on the claim that a new harness, suite, or scenario already covers it. |
| Authority | vcs-reversible-destructive: restrict changes to VCS-tracked test files, show the exact set before deletion, and use version control as recovery. |
| Side effect | Deletes only those test files whose every assertion was matched, leaving the rest in place; each deletion carries its coverage receipt in the commit message. |
| Done | For every deleted test, a per-assertion table produced by an independent reviewer maps each original assertion to a specific check in the replacement; unmatched assertions resulted in either an extended replacement or a kept test; and a tree-wide scrub shows no dangling references to deleted paths, with historical documents annotated rather than rewritten. |

## Inputs

1. **Original test path** (required): path to the test file claimed to be superseded.
2. **Replacement test or suite path** (required): path to the file or directory that allegedly covers every assertion in the original.
3. **Project root** (required): root directory for the tree-wide dangling-reference scrub.

## Refusals

- Will not delete a test whose replacement is missing or unparseable.
- Will not delete a test whose assertions cannot be extracted for review.
- Will not delete a test with unmatched assertions after extension attempt — keep it.
- Will not commit a deletion while dangling references remain unresolved.
- In every failure class, keep the test by default.

## Procedure

1. Read the original test file. Extract every assertion: each `expect`, `assert`, `check`, `should`, `verify`, or equivalent call that exercises observable behavior. Record the assertion type, the subject under test, and the expected outcome or predicate for each. **Done when:** every assertion in the original test is recorded with type, subject, and expected outcome.
2. Read the replacement test file or, when the replacement is a directory, every test file within it. Extract assertions using the same method. **Done when:** every assertion in the replacement is recorded.
3. Build a per-assertion coverage table. For each original assertion, identify the replacement assertion that exercises the same observable behavior. Mark each mapping as matched or unmatched. **Done when:** the table covers every original assertion with a matched or unmatched label.
4. Review the table. For every unmatched assertion, either extend the replacement test to cover it or mark the original test as kept. Repeat steps 2-4 until every assertion is either matched or the original test is kept. **Done when:** every assertion is matched or the original test is marked kept.
5. For tests with every assertion matched, prepare a commit message that embeds the per-assertion coverage table as a receipt, listing each original assertion and its covering replacement check. **Done when:** the commit message contains the full coverage table.
6. Delete the original test file. Stage and commit with the coverage-receipt message. **Done when:** the deletion is committed and the commit SHA is recorded.
7. Search the entire project tree for references to the deleted file path: import statements, require calls, configuration entries, CI references, and documentation links. Update or remove each live reference. Leave historical documents (changelogs, commit messages, release notes) annotated with a note that the test was superseded rather than rewriting them. **Done when:** no dangling references remain and historical documents are annotated.
8. Report the final per-assertion coverage table, the commit SHA, and the list of updated references. **Done when:** the report is emitted.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Replacement missing or unparseable | Stop immediately; do not delete the original test. Report that the replacement cannot be verified. |
| Assertions unextractable from original | Stop immediately; do not delete. Report the parsing failure and request manual review. |
| Unmatched assertions after extension attempt | Keep the original test file in place. Report which assertions remain uncovered. |
| Dangling references remain after scrub | Stop before committing the deletion. Report every unresolved reference with its file and line. |
| Commit fails | Restore the deleted file from version control. Report the commit failure. |

## Output

Per-assertion coverage table mapping each original assertion to its replacement check, a commit message receipt embedded in the deletion commit, the list of updated or annotated references across the project tree, and the commit SHA confirming the deletion.

## Provenance

Adapted from the independent-reviewer per-assertion coverage gate mechanism described in obra/superpowers at revision b36e0829c6d0140e93cfef2ca599b1b07d4a7797, path docs/superpowers/specs/2026-05-06-lift-drill-into-evals-design.md. Licensed MIT, copyright 2025 Jesse Vincent. This is a clean-room adaptation of the mechanism, not a copy of the source expression.
