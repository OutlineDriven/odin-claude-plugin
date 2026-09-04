---
name: interactive-drop-selector
description: 'Use when the user explicitly asks to choose which issues or pull requests to close interactively. Don''t use for closing items without per-item selection and explicit approval.'
disable-model-invocation: true
---

# Interactive drop selector

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user explicitly asks to choose which issues or pull requests to close interactively. |
| Authority | Remote: closes approved issues or pull requests in the named tracker scope; requires explicit human invocation. Do not close any item until the user has selected exact targets and explicitly approved the final preview. |
| Side effect | Close only the approved issues or pull requests in the named tracker scope; do not mutate unselected items or any other remote state. |
| Done | Every approved target is confirmed closed remotely, and every failure or skipped target is reported without claiming success for it. |

## Inputs

The user must supply or unambiguously identify the repository or tracker scope. Obtain the candidate items from a user-supplied list or a read-only tracker query within that scope. Optional filters may limit the candidate set. A closing comment or reason is optional and must be supplied or approved by the user before it is posted; do not invent one. Existing authenticated read and mutation access must be available, but never request, create, replace, or expose credentials as part of this workflow.

## Procedure

1. Confirm that the request is an explicit human invocation and resolve the tracker scope, candidate source, and any filters. Stop as `blocked` if the scope is ambiguous or authenticated access is unavailable.
2. Read the candidate items and validate each item's stable identifier, type, title, current state, and tracker scope. Exclude already-closed items from selectable targets and identify them separately.
3. Present a numbered selection table containing each open candidate's stable identifier, type, title, and current state. Accept only selections that resolve uniquely to entries in this bounded table; reject unknown, duplicate, malformed, or out-of-scope selections.
4. Show a final preview of the exact selected identifiers, the repository or tracker scope, the consequence that each will be closed, and any comment that will be posted. Make no remote mutation yet.
5. Ask for explicit approval of that exact preview. A selection alone is not approval. If the user declines, changes the selection, or does not clearly approve, return `cancelled` without mutation or regenerate the preview and seek approval again.
6. Immediately before each close operation, re-read the target and confirm its stable identifier, scope, and open state still match the approved preview. If it changed, skip it and report a conflict; never widen or substitute the target set.
7. Close each still-valid approved target using the tracker's normal close operation, applying only the approved comment when one exists. Record the remote result for each target. Do not stop reporting after a partial failure, but do not retry an uncertain result until a read confirms whether the close occurred.
8. Re-read every approved target and classify it as `confirmed-closed`, `failed`, or `conflict`. The done predicate holds only when all approved targets are `confirmed-closed`.

## Failure and recovery
- `blocked`: Return this when scope, candidate identity, credentials, permissions, or required tracker access is unavailable; make no close operations.
- `cancelled`: Return this when explicit approval is absent or withdrawn; make no close operations.
- `conflict`: Skip a target whose scope, identity, or state changed after approval. Require a new bounded preview and explicit approval before any later attempt.
- `partial`: If some approved targets close and others fail, preserve the confirmed remote results and report every target separately. Do not claim rollback, because closing is an external mutation; offer reopening only when the tracker supports it and only after separate explicit human approval.
- `unknown-result`: When a mutation response is interrupted or ambiguous, read the remote item before retrying. Classify the observed state; if it cannot be read, report the uncertainty and do not issue a duplicate mutation.

Never swallow tracker errors or report the done predicate while any approved target is failed, conflicted, or unverified.

## Output
Return the tracker scope, the approved target set, and one terminal status per target with its stable identifier and observed remote state. Return overall `confirmed` only when all approved targets are verified closed; otherwise return `blocked`, `cancelled`, `partial`, or `unknown-result` with the exact reason and any remote mutations already confirmed.
