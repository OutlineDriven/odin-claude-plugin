---
name: magicbox
description: 'Use when the user asks to keep or park possible worlds, options, opinions, doubts, or assumptions for later. Stores one short project card per qualifying item under magicbox/ without organizing it. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Magicbox

Capture divergence in short project cards. Organize them in a later pass, never this one.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user wants to keep short project cards for possible worlds, considered options, human opinions, agent doubts, and obvious assumptions, to organize later. |
| Authority | Reversible-local: create files only under `<project>/magicbox/`. No VCS commands, no writes outside `magicbox/`, no remote, paid, published, or deployed mutation. |
| Side effect | New card files under `magicbox/` only; nothing else in the project is modified or deleted. |
| Done | Every accepted item exists as a short card file under `magicbox/` inside the project tree, stored as tracked project knowledge awaiting later organization. |

## Inputs

- Capture material: statements from the current session or named by the user — possible worlds (alternatives still standing), considered options (alternatives already weighed), human opinions (the user's stated judgments), agent doubts (this agent's reservations or uncertainties), obvious assumptions (taken-for-granted premises worth a later look). Any subset qualifies; an empty set is valid.
- Project root: the current project by default; it must be supplied when the cards belong to a different project.

## Procedure

1. **Collect candidates.** Sweep the current exchange for the five classes: possible worlds (alternatives still standing), considered options (alternatives already weighed), human opinions (the user's stated judgments), agent doubts (this agent's reservations or uncertainties), obvious assumptions (taken-for-granted premises worth a later look). Only items actually present in the session or named by the user qualify; never invent a card to fill an empty class. Done when: every item present in the session or named by the user is collected across the five classes.

2. **Bound each card.** Store one item per card in a few lines at most: class, one-line statement, who it is from (`human` or `agent`), capture date. Drop material that needs more than a few lines from this pass and say so. Done when: every collected item is bounded to a few lines or dropped with a stated reason.

3. **Check for an existing card.** If `magicbox/` already holds a card with the same class and statement, skip the write and cite the existing file instead. Done when: every collected item is checked against existing cards and duplicates are skipped with citations.

4. **Write the cards.** Create `<project>/magicbox/` if missing. Name each file `YYYY-MM-DD-<class>-<short-kebab-title>.md`, using exactly one class word per card: `possible-world`, `considered-option`, `human-opinion`, `agent-doubt`, `obvious-assumption`. Card content:

   ```markdown
   # <Class>: <one-line title>
   - Statement: <one to three lines>
   - From: human | agent
   - Captured: YYYY-MM-DD
   - Status: unorganized
   ```
   Done when: every non-duplicate card is written to `<project>/magicbox/` with the correct filename and content shape.

5. **Stop at capture.** Do not organize, merge, rank, resolve, or delete any card, and do not mark a card decided or active. Run no VCS commands; the files join project tracking through the project's normal flow. Done when: no organization, merge, rank, resolution, deletion, or VCS command is performed.

6. **Report** per Output. Done when: the report is produced per the Output contract.

## Failure and recovery
- **Not a project directory.** If the working directory or supplied root is not a project, cards stored there would not be project knowledge. Write nothing and report why.
- **Unwritable target.** If `magicbox/` cannot be created or a card cannot be written, stop the pass. Cards already written remain; each card is independently valid. Report exactly which landed and which failed. Rollback: delete the card files this pass added; revert them via the project's version control if already committed.
- **Untraceable item.** Drop and report an item that cannot be traced to the session or a user statement. Never store it as invented content.
- **Nothing qualifies.** Report zero cards stored. Do not write placeholder cards to make the done predicate look satisfied.

## Output

A report listing, per class, each card file written with its one-line statement; duplicates skipped, citing the existing card's path; dropped items with their reasons; and the final card count. Zero cards is a valid terminal outcome and is reported as zero.

## Provenance

Origin: user-curated brief `project-owned:user-curated-skill-ideas`, candidate `curated:curated-ideas:curated-054`, supplementing the user's raw Korean source `project-owned:user-supplied-source-brief`. No upstream revision pin; no third-party license — project-owned curated material. Adaptation: the one-line curated idea was expanded into this bounded capture procedure; the five card classes, the short-card shape, capture-now/organize-later deferral, tracked-project-knowledge storage, and human/agent attribution carry over from the brief.
