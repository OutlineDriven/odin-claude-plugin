---
name: watch-and-repair-pr
description: 'Use when a human explicitly invokes a watcher cycle for an open pull request that must be watched until mergeable or blocked. Classifies the PR and addresses bounded review findings on its own branch. Don''t use for merge, force-push, or work outside the invoked cycle.'
disable-model-invocation: true
---

# PR review triage

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A human explicitly invokes a watcher cycle for an open pull request that must be watched until it is mergeable or blocked. |
| Authority | Human-only for remote mutation: preview the exact pull request, candidate branch, proposed commits or status report, and remote consequence before using credentials or changing the remote; proceed only within the invoked cycle. |
| Side effect | May publish a status report and push commits that address bounded review findings only to the candidate pull request's own branch; never merge or force-push. |
| Done | The cycle has re-read checks, review threads, conflicts, and branch protection, then classified the pull request as mergeable, blocked-with-owner, or handed-off. |

## Inputs

Required: the open pull request, its repository and candidate branch, access to its complete current checks, review threads, conflict state, and branch-protection state, plus the human's explicit invocation for this cycle. To push a fix or publish a report, also require valid credentials and an exact preview of the remote target and consequence. Optional: a human-supplied bound on findings to address; without one, do not mutate and return a classification from the review tape.

## Procedure

1. Confirm the pull request is open, identify its own candidate branch, record the human-authorized scope for this cycle, and reject any target that would require another branch, a merge, or a force-push. Done when: PR is confirmed open, candidate branch is identified, and scope is recorded with invalid targets rejected.
2. Re-read the full current review tape in the same cycle: all checks, every review thread including resolved threads needed for context, conflict state, and applicable branch-protection requirements. Do not rely on a prior cycle's snapshot. Done when: complete review tape is read in this cycle.
3. Classify each obstacle as an actionable review finding, an external wait, a conflict, a protection requirement, or a decision requiring another owner. Bound actionable work to findings supported by the current tape and within the invoked scope; do not widen scope or invent evidence. Done when: every obstacle is classified and actionable work is bounded.
4. Before any remote mutation, present the exact pull request and branch, the proposed status report or commits, and the consequence of publishing or pushing. Do not use credentials or mutate the remote unless the human has explicitly authorized that preview. Done when: preview is presented and human authorization is confirmed or withheld.
5. For authorized actionable findings, change only what each finding requires, verify the affected observable behavior with the narrowest applicable check, and push the resulting commits only to the candidate pull request's own branch. Never merge and never force-push. Done when: commits are pushed to the candidate branch with verification evidence, or the step has stopped on verification or push failure.
6. After any push or newly observed review activity, start a fresh cycle by re-reading the complete review tape rather than carrying forward a partial view. Done when: fresh cycle is started with a complete re-read.
7. End the cycle with exactly one terminal classification: `mergeable` when all required checks and protection conditions pass, no blocking thread or conflict remains, and no required owner action is outstanding; `blocked-with-owner` when a named obstacle and responsible owner remain; or `handed-off` when responsibility has been explicitly transferred with the current tape and remaining actions identified. Done when: one terminal classification is emitted.

## Failure and recovery
- Incomplete or stale tape: do not mutate or claim mergeability; return `blocked-with-owner` naming the unavailable evidence and its owner.
- Invalid target or authority: if the candidate branch cannot be identified, the proposed action exceeds the bounded findings, or the remote preview lacks explicit human authorization, make no remote change and return `blocked-with-owner` naming the required human decision.
- Verification or push failure: stop, preserve the verified local result without claiming it is remote, and return `blocked-with-owner` with the failed check or push, the unchanged remote state if known, and the owner able to recover. Never retry by force-pushing.
- Conflict, protection, or external wait: do not bypass it; name the exact blocker and responsible owner in `blocked-with-owner`, or use `handed-off` only after explicit transfer.
- Partial result: report completed observations and any successfully published commit identifiers separately from unperformed work; never represent a partial tape or partial push as satisfying the done predicate.

## Output
One cycle report containing the pull request and candidate branch, the review-tape snapshot read in that cycle, bounded findings and their dispositions, verification evidence for each pushed fix, any published commit or report identifiers, remaining blockers with owners, and exactly one terminal classification: `mergeable`, `blocked-with-owner`, or `handed-off`.
