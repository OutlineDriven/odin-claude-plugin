---
name: idea-sparkbox
description: 'Use when the user asks to park ideas or inspiration for later. Not for code, backlog, or divergence-class cards, or remote, credential, publish, deploy, or irreversible changes.'
---

# Idea sparkbox

Park ideas and inspiration in short project cards. Organize them in a later pass, never this one.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user wants to keep short project cards for ideas or inspiration, to organize later. |
| Authority | Reversible local: writes only files under `<project>/idea-sparkbox/`; rollback is deleting those files. No remote mutation. |
| Side effect | New card files under `idea-sparkbox/` only; nothing else in the project is modified or deleted. |
| Done | Every accepted item exists as a short card file under `idea-sparkbox/` inside the project tree, stored as tracked project knowledge awaiting later organization. |

## Inputs

- Capture material: ideas (concepts or approaches worth parking for later) and inspiration (things that sparked thinking but are not yet concrete ideas), from the current session or named by the user. Any subset qualifies; an empty set is valid.
- Project root: the current project by default; it must be supplied when the cards belong to a different project.

## Procedure

1. **Collect candidates.** Sweep the current exchange for two classes: ideas (concepts or approaches worth parking for later) and inspiration (things that sparked thinking but are not yet concrete ideas). Only items actually present in the session or named by the user qualify; never invent a card to fill an empty class. Reject code snippets, backlog items, and divergence-class material (possible worlds, weighed options, opinions, doubts, assumptions); those belong elsewhere. Done when: every idea or inspiration item present in the session or named by the user is collected, and rejected material is set aside with a stated reason.

2. **Bound each card.** Store one item per card in a few lines at most: class, one-line statement, who it is from (`human` or `agent`), capture date. Drop material that needs more than a few lines from this pass and say so. Done when: every collected item is bounded to a few lines or dropped with a stated reason.

3. **Check for an existing card.** If `idea-sparkbox/` already holds a card with the same class and statement, skip the write and cite the existing file instead. Done when: every collected item is checked against existing cards and duplicates are skipped with citations.

4. **Write the cards.** Create `<project>/idea-sparkbox/` if missing. Name each file `YYYY-MM-DD-<class>-<short-kebab-title>.md`, using exactly one class word per card: `idea` or `inspiration`. Card content:

   ```markdown
   # <Class>: <one-line title>
   - Statement: <one to three lines>
   - From: human | agent
   - Captured: YYYY-MM-DD
   - Status: unorganized
   ```
   Done when: every non-duplicate card is written to `<project>/idea-sparkbox/` with the correct filename and content shape.

5. **Stop at capture.** Do not organize, merge, rank, resolve, or delete any card, and do not mark a card decided or active. Run no VCS commands; the files join project tracking through the project's normal flow. Done when: no organization, merge, rank, resolution, deletion, or VCS command is performed.

6. **Report** per Output. Done when: the report is produced per the Output contract.

## Failure and recovery
- Not a project directory. If the working directory or supplied root is not a project, cards stored there would not be project knowledge. Write nothing and report why.
- Unwritable target. If `idea-sparkbox/` cannot be created or a card cannot be written, stop the pass. Cards already written remain; each card is independently valid. Report exactly which landed and which failed. Rollback: delete the card files this pass added; revert them via the project's version control if already committed.
- Untraceable item. Drop and report an item that cannot be traced to the session or a user statement. Never store it as invented content.
- Rejected class. Report any code, backlog, or divergence-class material that was rejected, with the reason. Never store it as a card.
- Nothing qualifies. Report zero cards stored. Do not write placeholder cards to make the done predicate look satisfied.

## Output

A report listing, per class, each card file written with its one-line statement; duplicates skipped, citing the existing card's path; dropped items with their reasons; rejected material with its reasons; and the final card count. Zero cards is a valid terminal outcome and is reported as zero.
