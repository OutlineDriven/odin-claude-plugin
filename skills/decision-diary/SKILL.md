---
name: decision-diary
description: 'Use when a user wants to record why one world won over the others. The decision and its rationale are recorded in the decision diary. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Decision diary

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to record why one world won over the others. |
| Authority | Reversible local write: append one decision-diary entry to the agreed diary location; no file outside that diary is created or modified. |
| Side effect | A decision-diary entry documenting why one world won. |
| Done | The decision and its rationale are recorded in the decision diary. |

## Inputs

Winning decision: the world or option that won. Required.
Considered worlds: every option that was on the field, including the winner. Required.
Rationale: why the winning world won and why each rejected world lost. Required.
Decision-diary location: the local file path where the entry is appended. Required; if no location is established, the user must supply it.
Optional inputs: date, surrounding context, human opinions, agent doubts, and obvious assumptions that shaped the choice.

## Procedure

1. Confirm the winning decision and the full set of considered worlds from the user. Do not infer a winner or invent options that were not on the field. Done when: the winning decision and all considered worlds are confirmed from the user.
2. Capture why the winning world won, using the user's terms. Done when: the winning rationale is recorded in the user's own terms.
3. Capture, for each rejected world, the reason it lost. Done when: every rejected world has a loss reason recorded.
4. Record any human opinions, agent doubts, and obvious assumptions the user names as load-bearing for the choice. Omit this section when the user names none; do not fabricate doubts or assumptions. Done when: named opinions, doubts, and assumptions are recorded, or the section is omitted because the user named none.
5. Compose one diary entry containing the winning decision, the considered worlds, the winning rationale, the per-rejected-world loss reasons, and any named opinions, doubts, or assumptions. Done when: the entry contains all five elements.
6. Append the entry to the decision-diary file at the agreed location. Create the file only if the user confirms it does not yet exist and names this path as its home. Done when: the entry is appended to the diary file at the agreed location.
7. Read the entry back from the diary and confirm it is persisted and readable. Done when: the entry is read back and confirmed persisted and readable.

## Failure and recovery
Missing rationale: if the user cannot state why the winning world won, stop and ask for it. Do not invent or paraphrase a rationale the user did not supply.
Missing diary location: if no decision-diary path is established and the user does not supply one, stop. Do not write to an arbitrary or guessed file.
Partial write: if the entry cannot be written in full, no partial entry is committed. The diary file is left unchanged.
Blocked result: return the missing input and the unfinished entry text. Never report done when no complete, readable entry is persisted in the diary.

## Output
One appended decision-diary entry at the agreed location, containing in order: winning decision, considered worlds, winning rationale, per-rejected-world loss reasons, named opinions or doubts.
