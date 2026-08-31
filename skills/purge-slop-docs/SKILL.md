---
name: purge-slop-docs
description: 'Purge stale docs and repair Markdown hierarchy'
disable-model-invocation: true
---

# Purge slop docs

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A human explicitly asks to purge the docs, clean up stale Markdown, or reorder the documentation hierarchy. |
| Authority | Human-only. Inspect and edit only the requested documentation tree; preview every whole-file deletion and its consequence, then obtain a separate explicit yes for that file before deleting it. |
| Side effect | Edits, moves, and approved deletions within the bounded Markdown tree; do not alter vendored, dependency, generated, or marked auto-generated content. |
| Done | Report per-class finding counts, edits applied versus findings left untouched, the separate approval for every deletion, and a passing check for every link or path affected by a move or rewrite. |

## Inputs

Required: the repository or directory that bounds the Markdown tree and an explicit human cleanup request. Optional: a narrower path or stated exclusions. Determine which Markdown files the project authors and which entry document anchors the tree. Treat vendored trees, dependency directories, generated API output, and files or regions marked generated or do-not-modify as excluded. If authorship, generation status, or scope cannot be established, do not mutate the uncertain target.

## Procedure

1. Enumerate the Markdown files inside the supplied scope, apply the exclusions, and report the resulting file count before changing anything. Do not widen the scope to resolve a finding.
2. Inspect the included files and classify each finding by a concrete evidence test:
   - **Overstatement:** a benchmark lacks a number, a guarantee lacks an enforcing check, a superlative is unproved, or the repository cannot demonstrate the claimed property. Rewrite to the supported claim or remove the sentence.
   - **Jargon:** a plainer word preserves the meaning, or a metaphorical noun obscures the actual mechanism. Substitute the plain term, but retain established project vocabulary.
   - **Outdated:** a named path, symbol, flag, command, or version no longer resolves. Check the referenced path or symbol, or execute a safe read-only form of the documented command when available. Update to verified current evidence or remove the section when no valid replacement exists.
   - **Redundant:** the same meaning has another owner, or prose merely repeats authoritative configuration, command help, or a manifest script. Keep one owner, replace the other copy with a resolving pointer when readers still need navigation, and otherwise remove it.
3. Grade certainty independently from severity. Apply an edit only when a deterministic check makes the finding **HIGH** certainty. Report **MEDIUM** and **LOW** findings without changing them. A merely suspicious passage remains untouched.
4. Treat a whole document as a deletion candidate only when no pointer references it and every section fails at least one evidence test. For each candidate, preview the exact file, state that no references were found, describe the loss, and request a separate explicit yes. A refusal or missing answer leaves that file unchanged; never combine deletion approvals.
5. Reorder within a file by co-locating each concept's definition, rules, and caveats under one heading. Inline material every reader path needs; place branch-specific reference detail behind a direct pointer.
6. Reorder across the tree so the entry document says what the project is and where to start, while detail remains reachable through pointers. Any document with no inbound pointer must be the entry document or an individually reviewed deletion candidate.
7. After each move, deletion, or pointer rewrite, verify every affected Markdown link and repository path resolves. If a pointer breaks, restore the pre-change arrangement for that operation or repair it from verified repository evidence; do not declare success with a dangling pointer.
8. Count findings by class, distinguish applied edits from untouched findings, record each deletion and its explicit approval, and record the pointer-check result.

## Failure and recovery
- **Unbounded or uncertain scope:** make no changes and return `BLOCKED`, naming the unresolved boundary or authorship question.
- **Missing deterministic evidence:** leave the candidate unchanged, downgrade it to MEDIUM or LOW, and include it only in the report.
- **Deletion not separately approved:** do not delete the file; report the candidate and the missing or negative decision.
- **Broken pointer or failed verification:** restore the affected operation when possible and report `BLOCKED` with the unresolved pointer. Preserve unrelated, already verified edits as an explicit partial result.
- **Interrupted mutation:** report exactly which files changed, moved, deleted, or remained pending. Never infer approval, hide an error, or claim the done predicate passed.
- **Non-convergence:** if verified cleanup repeatedly creates new broken references or conflicting ownership, stop, leave the last verified state intact, and return `NON-CONVERGED` with the remaining findings.

## Output
Return the cleaned documentation tree plus a terminal report containing: bounded scope and included file count; counts for overstatement, jargon, outdated, and redundant findings; applied edits versus reported-only findings; every deleted file with its individual yes; affected-pointer check results; and `DONE`, `BLOCKED`, or `NON-CONVERGED`. `DONE` requires all contract checks to pass.

## Provenance

Adapted from the project-owned `purge-slop-docs` skill candidate `current:current-c:current:purge-slop-docs` at `skills/purge-slop-docs/SKILL.md`. No source revision or license identifier was supplied. This version preserves the source's four evidence classes, certainty gate, per-file deletion approval, hierarchy operations, and pointer verification while making the procedure self-contained for ODIN 2.0.
