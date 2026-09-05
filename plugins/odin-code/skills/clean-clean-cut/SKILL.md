---
name: clean-clean-cut
description: 'Use when asked to run /clean-clean-cut to cut accumulated records and residue. Not for untracked or non-VCS changes, or branch/worktree cleanup: use git-cleanup.'
disable-model-invocation: true
---

# Clean clean cut

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User runs /clean-clean-cut to cut accumulated records and residue under an explicit destructive gate. |
| Authority | Reversible local: deletes only VCS-tracked targets inside an enumerated set (show the exact set before cutting); rollback is version control. No remote mutation. No history rewrite, data migration, credential change, or deletion of untracked or critical data. |
| Side effect | Remove accumulated records, residue, and dependent code elements within the enumerated target set. |
| Done | Purge checklist is confirmed and the enumerated targets are removed; the cut is recoverable through VCS. |

## Inputs

- An enumerated target set: the records, residue, and dependent code elements to cut. Each member must be VCS-tracked.
- A purge checklist: the explicit PRE conditions, the INVARIANT that must hold during the cut, and the POST conditions that prove the enumerated set is gone.
- Human approval bound to the enumerated target set. Approval must name the exact set; approval of a wider or narrower set does not authorize the cut.

## Procedure

1. Enumerate the target set. List every record, residue file, and dependent code element to cut, and state a removal order for the set (leaf-to-root by dependency, or reverse-enumeration order). Reject any member that is not VCS-tracked; an untracked target is out of scope. Done when: every member of the target set is listed, the removal order is stated, and each member is confirmed VCS-tracked by git ls-files or equivalent; untracked members are rejected and named.
2. Confirm the PRE conditions: the target set is complete, each member is VCS-tracked, and no member outside the enumerated set is touched. Done when: the target set is confirmed complete, every member is VCS-tracked, and no member outside the enumerated set is identified for touching.
3. Publish the purge checklist to the human: the enumerated set, the INVARIANT (only enumerated members change, nothing else), and the POST conditions (each enumerated member is absent and the stated check set passes). Done when: the purge checklist is displayed to the human showing the enumerated set, the INVARIANT, and the POST conditions, and the human confirms receipt before proceeding.
4. Wait for human approval that names the exact enumerated set. Do not cut on approval of a different set, on silence, or on model self-authorization. Done when: the human approves cutting the exact enumerated set by naming it, and no approval is accepted for a different set, silence, or model self-authorization.
5. Cut the enumerated set only. Remove each member in the order stated in step 1. Do not widen the set, follow dependent chains beyond the enumeration, or preserve history by reflex. Done when: every enumerated member is removed in the stated order, and no file outside the enumerated set was touched (confirmed by git status or equivalent).
6. Verify the POST conditions: every enumerated member is absent and the stated check set passes. Done when: every enumerated member is absent from the working tree, and the stated check set passes with its expected results.
7. Confirm the cut is recoverable through VCS: the removed members exist in version control history. Done when: each removed member is confirmed present in VCS history by git log or equivalent, proving the cut is recoverable.

## Failure and recovery
- Untracked target: stop before cutting. Report the member, state that it is not VCS-tracked, and require the human to either track it or remove it from the set. Do not delete untracked files.
- Approval-set mismatch: stop. The approval names a different set than the enumeration. Re-publish the enumerated set and require approval that matches it exactly.
- POST condition failure: stop. Report which enumerated member remains or which check failed. Do not declare done. VCS-tracked deletions recover through version control; no in-place rollback is required.
- Scope drift: stop if any change would touch a member outside the enumerated set. Report the drift and require a new enumeration and approval.
- Non-converged result: the enumerated set is not fully removed or the check set does not pass. Return the partial state, the failing condition, and the VCS recovery path. Never claim done when a target remains.

## Output
A cut report: the enumerated target set as approved, the members removed, the POST-condition results, and the VCS recovery reference for each removed member. Terminal classification is `cut` when every enumerated member is gone and the check set passes, or `blocked` when a failure class stopped the cut.
