---
name: writing-beats
description: 'Use when a grounded piece needs user-selected beat-by-beat assembly. Writes only human-selected verbatim beats to a target file in the chosen order. Not for unstructured capture — use writing-fragments; not for paragraph shaping — use writing-shape.'
---

# Writing beats

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A grounded piece needs user-selected beat-by-beat assembly. |
| Authority | Reversible local write. Rollback path: delete the target piece file if partial write fails. No remote mutation. |
| Side effect | Selected beats appended to the target piece after re-reading each from its source file. No other content written. |
| Done | Only the selected grounded beats form the piece; no unselected content present. |

## Inputs

| Input | Required | Description |
|---|---|---|
| Grounding ledger | Yes | A file that names a target piece and lists available beat files with their content. |
| Beat file | Yes | A source file containing one grounded beat. |
| Selection | Yes | Human selects which numbered beats to include and in what order. |
| Target piece path | Yes | The file to which selected beats are appended. Takes precedence over the ledger's target when they differ. |

## Procedure

1. Read the grounding ledger.
2. Parse the ledger to identify the target piece path and the list of available beat files. If the ledger's target piece path differs from the explicit Target piece path input, stop and ask the human which target to use before any write. The explicit input takes precedence.
3. For each beat file named in the ledger, read its content and present it to the human as a numbered item. Present only; do not filter or summarize.
4. Ask the human to select which numbered beats to include and the order. Reject any selection referencing a number not in the list.
5. Re-read each selected beat from its source file immediately before writing it.
6. Verify the target piece path is absent or empty. If it exists with content, stop and ask the human before writing. Open the target piece path in append mode and write each re-read selected beat in the human-specified order, one after another, with no added content, no rephrasing, and no connecting text between beats.
7. Close the target piece path.
8. Read the target piece path and confirm that it contains only the selected beats and no other content.

## Failure and recovery

| Failure | Response |
|---|---|
| Ledger unreadable | Stop. Report the failure. Do not write the target piece. |
| Target path conflict | The explicit Target piece path input and the ledger name different targets. Stop and ask the human before any write. |
| Target not empty | The target piece path exists with content. Stop and ask the human before writing. |
| Beat file unreadable | Skip that beat. Warn the human. Continue with remaining beats. |
| Write fails | Rollback: delete the target piece file. Report failure and selected beats that were not written. |
| Confirmation fails | Report discrepancy. Ask the human to resolve before ending. |

Partial-result rule: if the write partially succeeds before failing, rollback deletes the entire target piece file. The done predicate does not hold until rollback is confirmed or the file is absent. With the target-ownership precondition, rollback only ever removes run-created content.

## Output

The assembled piece file path and the count of beats selected; if no beats were selected, the target piece path is created as an empty file.
