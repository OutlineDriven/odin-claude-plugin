---
name: guillotine
description: 'Use when asked to cut accumulated records and residue under an explicit destructive gate with version-control recovery. Don''t use for untracked targets, changes without a version-control rollback, or git branch/worktree cleanup — use git-cleanup.'
disable-model-invocation: true
---

# Guillotine

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to cut accumulated records and residue under an explicit destructive gate. |
| Authority | Delete only VCS-tracked targets inside an enumerated set; show the exact set before cutting; use version control as recovery. |
| Side effect | Remove accumulated records, residue, and dependent code elements within the enumerated target set. |
| Done | Purge checklist is confirmed and the enumerated targets are removed; the cut is recoverable through VCS. |

## Inputs

- An enumerated target set: the records, residue, and dependent code elements to cut. Each member must be VCS-tracked.
- A purge checklist: the explicit PRE conditions, the INVARIANT that must hold during the cut, and the POST conditions that prove the enumerated set is gone.
- Human approval bound to the enumerated target set. Approval must name the exact set; approval of a wider or narrower set does not authorize the cut.

## Procedure

1. Enumerate the target set. List every record, residue file, and dependent code element to cut. Reject any member that is not VCS-tracked; an untracked target is out of scope. Done when: the stated action, evidence, and guard all hold.
2. Confirm the PRE conditions: the target set is complete, each member is VCS-tracked, and no member outside the enumerated set is touched. Done when: the stated action, evidence, and guard all hold.
3. Publish the purge checklist to the human: the enumerated set, the INVARIANT (only enumerated members change, nothing else), and the POST conditions (each enumerated member is absent and the stated check set passes). Done when: the stated action, evidence, and guard all hold.
4. Wait for human approval that names the exact enumerated set. Do not cut on approval of a different set, on silence, or on model self-authorization. Done when: the stated action, evidence, and guard all hold.
5. Cut the enumerated set only. Remove each member in the stated order. Do not widen the set, follow dependent chains beyond the enumeration, or preserve history by reflex. Done when: the stated action, evidence, and guard all hold.
6. Verify the POST conditions: every enumerated member is absent and the stated check set passes. Done when: the stated action, evidence, and guard all hold.
7. Confirm the cut is recoverable through VCS: the removed members exist in version control history. Done when: the stated action, evidence, and guard all hold.

## Failure and recovery
- Untracked target: stop before cutting. Report the member, state that it is not VCS-tracked, and require the human to either track it or remove it from the set. Do not delete untracked files.
- Approval-set mismatch: stop. The approval names a different set than the enumeration. Re-publish the enumerated set and require approval that matches it exactly.
- POST condition failure: stop. Report which enumerated member remains or which check failed. Do not declare done. VCS-tracked deletions recover through version control; no in-place rollback is required.
- Scope drift: stop if any change would touch a member outside the enumerated set. Report the drift and require a new enumeration and approval.
- Non-converged result: the enumerated set is not fully removed or the check set does not pass. Return the partial state, the failing condition, and the VCS recovery path. Never claim done when a target remains.

## Output
A cut report: the enumerated target set as approved, the members removed, the POST-condition results, and the VCS recovery reference for each removed member. Terminal classification is `cut` when every enumerated member is gone and the check set passes, or `blocked` when a failure class stopped the cut.

## Provenance

Origin: user-curated skill idea `guillotine` from `project-owned:user-curated-skill-ideas` ("cut accumulated records and residue under an explicit destructive gate; do not preserve history by reflex"). Revision: none pinned. License: none; project-owned clean-room adaptation. The destructive-gate, PRE/INVARIANT/POST checklist, and approval-bound enumerated-set mechanism are adapted from the user brief; no third-party expression is copied.
