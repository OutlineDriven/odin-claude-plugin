---
name: writing-beats
description: 'Use when a grounded piece needs user-selected beat-by-beat assembly. Assembles only user-selected beats into the target piece, re-reading original sources before writing. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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
| Grounding ledger | Yes | A file that names the target piece and lists available beat files with their content. |
| Beat file | Yes | A source file containing one grounded beat. |
| Selection | Yes | Human selects which numbered beats to include and in what order. |
| Target piece path | Yes | The file to which selected beats are appended. |

## Procedure

1. Read the grounding ledger.
2. Parse the ledger to identify the target piece path and the list of available beat files.
3. For each beat file named in the ledger, read its content and present it to the human as a numbered item. Present only; do not filter or summarize.
4. Ask the human to select which numbered beats to include and the order. Reject any selection referencing a number not in the list.
5. Re-read each selected beat from its source file immediately before writing it.
6. Open the target piece path in append mode and write each re-read selected beat in the human-specified order, one after another, with no added content, no rephrasing, and no connecting text between beats.
7. Close the target piece path.
8. Read the target piece path and confirm that it contains only the selected beats and no other content.

## Failure and recovery
| Failure | Response |
|---|---|
| Ledger unreadable | Stop. Report the failure. Do not write the target piece. |
| Beat file unreadable | Skip that beat. Warn the human. Continue with remaining beats. |
| Write fails | Rollback: delete the target piece file. Report failure and selected beats that were not written. |
| Confirmation fails | Report discrepancy. Ask the human to resolve before ending. |

Partial-result rule: if the write partially succeeds before failing, rollback deletes the entire target piece file. The done predicate does not hold until rollback is confirmed or the file is absent.

## Output
The path of the assembled piece file and the count of beats selected. If no beats were selected, the target piece path is created as an empty file.

## Provenance

Origin: `mattpocock/skills` at revision `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76`.
License: MIT — Copyright (c) 2026 Matt Pocock. Permission notice retained in `licenses/NOTICE`.
Adaptation: Clean-room rewrite for ODIN `odin-create-advanced` module. Beat assembly procedure adapted; original mechanism (user selects beats from a ledger-listed pile and writes to a target file) preserved. Trigger, authority, side effect, and done predicate restated for ODIN contract.
