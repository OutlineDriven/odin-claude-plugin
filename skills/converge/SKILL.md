---
name: converge
description: 'Use when the user wants to collapse an open decision field to one decision and record its rationale locally. Not for multi-lens pressure testing — use cross-lens-converge. Not for remote or irreversible changes.'
---

# Converge

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to collapse the decision field to a decision. |
| Authority | Reversible local write — write only the named local decision record; delete or revert that record file to roll back. No code, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | A recorded decision and rationale in one local artifact; the open field is marked collapsed. |
| Done | The decision field is collapsed to one decision with recorded rationale. |

## Inputs

Required inputs are the open decision field (the set of considered options, recorded human opinions, agent doubts, and obvious assumptions) and the human's chosen option. The decision record path is optional; default to a project-local decision file.

## Procedure

1. Read the open decision field and enumerate every considered option, recorded human opinion, agent doubt, and obvious assumption. If no field exists, stop — there is nothing to collapse. Done when: every option, opinion, doubt, and assumption in the field is enumerated, or the absence of a field is reported.
2. Ask the human to select one option from the field. Do not select on the human's behalf. Done when: the human has selected one option from the field.
3. State the rationale that distinguishes the chosen option from each rejected option: why it won and why each other did not. Done when: a distinguishing rationale is stated for the chosen option against every rejected option.
4. Write the chosen option and its distinguishing rationale to the named local decision record. Mark the field collapsed. Done when: exactly one decision is recorded with rationale and the field is marked collapsed.

## Failure and recovery
- Empty field: no options to collapse — stop and report "no decision field to collapse"; do not invent options.
- No human selection: the human did not choose — stop and report "awaiting human selection"; do not pick a default.
- Ambiguous rationale: the rationale holds equally for a rejected option — ask the human to sharpen it before recording; do not record a non-distinguishing rationale.
- Partial-result rule: a partially written record is not a decision — revert the record file to its prior state and report the block.
- Rollback: delete or revert the local decision record file; no other artifact is touched.

## Output
A local decision record containing the chosen option and its distinguishing rationale, with the field marked collapsed.
