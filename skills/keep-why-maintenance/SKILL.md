---
name: keep-why-maintenance
description: 'Use when contradictions, revisit conditions, or duplicates appear in knowledge entries, resolve them by flipping statuses, marking superseded content, merging duplicates, or proposing file splits. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Keep why maintenance

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Contradiction found between entries, an entry's Revisit-when condition fires, entries conflict or duplicate, or a topic file grows too large. |
| Authority | Reversible-local: write only named topic files; every edit is VCS-recoverable. |
| Side effect | Status flips, superseded markers ('> Superseded <date>: see below') instead of deletion, duplicate merge, file split proposal. |
| Done | No silent historical overwrite; superseded content retained with marker; splits proposed rather than unbounded growth; maintenance changes get the same scrutiny as new entries. |

## Inputs

- **Topic file** (required): the knowledge file containing the entry or entries that triggered maintenance.
- **Triggering condition** (required): which of the four trigger classes fired — contradiction, revisit-when, duplicate/conflict, or oversized file.
- **Entry or entries** (required): the specific entry or pair of entries involved.

## Procedure

1. **Scan and classify.** Read the topic file. Identify which trigger condition fired and which entries are involved. If the trigger is ambiguous, stop and request clarification rather than guessing.

2. **Determine authorization tier.** Mechanical status flips (e.g., marking an entry as revisited, flagging a revisit-when condition as fired) require no judgment — proceed directly. Judgmental rewrites (resolving contradictions, merging duplicates, rewriting entries) require human approval before committing.

3. **Mechanical status flip.** For status-only changes: update the entry's status field in place. Add a timestamp to the flip. No superseded marker is needed for status transitions.

4. **Judgmental rewrite.** For contradiction resolution or duplicate merge:
   a. Copy the superseded entry verbatim below its current position.
   b. Prepend the marker `> Superseded <YYYY-MM-DD>: see below` to the copied block.
   c. Write the new or merged entry below the superseded block with updated reasoning.
   d. For duplicates: merge into one entry that preserves the combined reasoning from both originals.

5. **Oversized file handling.** If a topic file grows too large, propose a split into logical sub-topics. Name the proposed file boundaries and the rationale for each split. Do not execute the split — propose it for human approval.

6. **Diff review.** After all edits, review the diff. Confirm: (a) no entry was silently overwritten, (b) every superseded block carries the marker with date, (c) no content was deleted without a superseded marker.

7. **Human approval.** Present the complete diff for approval before committing. Mechanical flips and judgmental rewrites both appear in the diff; the human reviews the full change set.

## Failure and recovery
- **Contradiction unresolvable.** If two entries contradict and no resolution is clear, stop. Flag both entries with `> Needs resolution: <brief description>` and present to the human. Do not pick a side.
- **Revisit-when unclear.** If a revisit-when condition fires but the required action is ambiguous, stop. Flag the entry and request human guidance.
- **Duplicate with divergent reasoning.** If two entries duplicate but carry different reasoning that cannot be cleanly merged, present both entries and ask the human to choose the merge strategy.
- **Oversized file with no clean split boundary.** If no logical sub-topic boundary exists, flag the file as needing human-guided restructuring. Do not force a split.
- **Unexpected diff.** If the diff contains changes beyond the planned maintenance edits, halt. Present the unexpected changes and request confirmation before proceeding.
- **Partial result rule.** If any step fails, retain all completed mechanical flips but revert any uncommitted judgmental rewrites. The topic file stays in a consistent state.
- **Rollback.** All changes are local and VCS-tracked. Revert via version control if the maintenance outcome is rejected.

## Output
- Modified topic file with status flips, superseded markers, and merge results applied.
- Maintenance report: list of changes made, entries affected, and any split proposals pending human decision.
- All changes are VCS-recoverable.

## Provenance

- Origin: https://github.com/oliver-zehentleitner/keep-the-why
- Pinned revision: c01597a506efa24652d7ecb9e18b6a8ccc97b175
- License: MIT — Copyright (c) 2026 Oliver Zehentleitner. Retain the copyright notice and this permission notice in all copies or substantial portions of the Software.
- Adaptation: Clean-room adaptation into ODIN 2.0 skill format. The two-tier authorization mechanism (mechanical status flip vs gated judgmental rewrite) and the non-deletion principle (superseded markers instead of removal) are preserved from the source. No third-party expression copied.
