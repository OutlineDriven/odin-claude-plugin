---
name: keep-why-maintenance
description: 'Use when contradictions, revisit conditions, or duplicates appear in knowledge entries. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Keep why maintenance

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Contradiction found between entries, an entry's Revisit-when condition fires, entries conflict or duplicate, or a topic file grows too large. |
| Authority | Reversible local: writes only named topic files; rollback is version control. No remote mutation. |
| Side effect | Status flips, superseded markers ('> Superseded <date>: see below') instead of deletion, duplicate merge, file split proposal. |
| Done | No silent historical overwrite; superseded content retained with marker; splits proposed rather than unbounded growth; maintenance changes get the same scrutiny as new entries. |

## Inputs

- Topic file (required): the knowledge file containing the entry or entries that triggered maintenance.
- Triggering condition (required): which of the four trigger classes fired: contradiction, revisit-when, duplicate/conflict, or oversized file.
- Entry or entries (required): the specific entry or pair of entries involved.

## Procedure

1. **Scan and classify.** Read the topic file. Identify which trigger condition fired and which entries are involved. If the trigger is ambiguous, stop and request clarification rather than guessing. Done when: one trigger class is identified and the affected entries are named.

2. **Determine authorization tier.** Mechanical status flips (e.g., marking an entry as revisited or flagging a revisit-when condition as fired) require no judgment, so proceed directly. Judgmental rewrites (resolving contradictions, merging duplicates, or rewriting entries) require human approval before committing. Done when: the tier is determined (mechanical or judgmental).

3. **Mechanical status flip.** For status-only changes: update the entry's status field in place. Add a timestamp to the flip. No superseded marker is needed for status transitions. Done when: the status field is updated with a timestamp.

4. **Judgmental rewrite.** For contradiction resolution or duplicate merge:
   a. Copy the superseded entry verbatim below its current position.
   b. Prepend the marker `> Superseded <YYYY-MM-DD>: see below` to the copied block.
   c. Write the new or merged entry below the superseded block with updated reasoning.
   d. Merge duplicates into one entry that preserves the combined reasoning from both originals.
   Done when: the superseded block carries its marker and the new/merged entry is written below it.

5. **Oversized file handling.** If a topic file grows too large, propose a split into logical sub-topics. Name the proposed file boundaries and explain the rationale for each. Do not execute the split; propose it for human approval. Done when: a split proposal with named boundaries and rationale is produced.

6. **Diff review.** After all edits, review the diff. Confirm: (a) no entry was silently overwritten, (b) every superseded block carries the marker with date, (c) no content was deleted without a superseded marker. Done when: the diff confirms no silent overwrite, every superseded block is marked, and no unmarked deletion occurred.

7. **Human approval.** Present the complete diff for approval before committing. Include mechanical flips and judgmental rewrites so the human can review the full change set. Done when: the human approves the complete diff.

## Failure and recovery
- Contradiction unresolvable. If two entries contradict and no resolution is clear, stop. Flag both entries with `> Needs resolution: <brief description>` and present them to the human. Do not pick a side.
- Revisit-when unclear. If a revisit-when condition fires but the required action is ambiguous, stop. Flag the entry and request human guidance.
- Duplicate with divergent reasoning. If two entries duplicate but carry different reasoning that cannot be cleanly merged, present both entries and ask the human to choose the merge strategy.
- Oversized file with no clean split boundary. If no logical sub-topic boundary exists, flag the file as needing human-guided restructuring. Do not force a split.
- Unexpected diff. If the diff contains changes beyond the planned maintenance edits, halt. Present the unexpected changes and request confirmation before proceeding.
- Partial result rule. If any step fails, retain all completed mechanical flips but revert any uncommitted judgmental rewrites. The topic file stays in a consistent state.
- Rollback. All changes are local and VCS-tracked. Revert via version control if the maintenance outcome is rejected.

## Output

Modified topic file with status flips, superseded markers, and merge results applied, plus a maintenance report listing changes made, entries affected, and any split proposals pending human decision, all VCS-recoverable.
