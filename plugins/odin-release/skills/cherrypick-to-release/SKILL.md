---
name: cherrypick-to-release
description: 'Use when the user asks to cherry-pick, backport, or apply a hotfix to a release branch. Not for merging feature branches or cutting new release branches.'
disable-model-invocation: true
---

# Cherrypick to release

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to cherry-pick, backport, or apply a hotfix to a release branch, providing a PR number, commit SHA, or issue reference. |
| Authority | Remote: creates cherrypick branches, pushes them, opens one PR per channel, and assigns the on-call reviewer; requires explicit human invocation. Preview the target release channel(s), the commit(s) to apply, and the PR/assignment consequence before creating branches, pushing, or opening PRs. |
| Side effect | Creates one cherrypick branch per release channel, cherry-picks and pushes the commit(s), opens one PR per channel, and assigns the on-call reviewer. No force-push, no deletion, no merge. |
| Done | A correctly titled PR with the on-call reviewer assigned exists for every requested release channel; conflicts stop for user resolution. |

## Inputs

- A PR number, commit SHA, or issue reference identifying the change to apply. Required.
- The release channel(s) to target, as release branch names. Required; at least one.
- The on-call reviewer to assign. Required.
- Optional: an explicit branch-name prefix or commit subset when the reference resolves to more than one commit.

## Procedure

1. Resolve the supplied reference to the exact commit SHA(s) to apply. If a PR number or issue reference yields more than one commit, confirm the subset with the user before proceeding. **Done when:** the exact commit SHA(s) are resolved or the user confirms the subset.
2. For each requested release channel, confirm its base release branch exists and is current, then fetch and check it out. **Done when:** every requested release branch is checked out and current, or the missing one is named.
3. Preview the operation to the human: the channel(s), the commit SHA(s), the branch names that will be created, the push, the PR titles, and the on-call reviewer assignment. Proceed only after explicit human confirmation. **Done when:** the human confirms the operation, or the run stops for lack of confirmation.
4. For each release channel, create a cherrypick branch off that channel's base branch and cherry-pick each resolved commit in source order. **Done when:** each commit is cherry-picked onto its cherrypick branch, or a conflict stops that channel.
5. If a cherry-pick conflicts, stop that channel immediately; do not resolve, force, or skip it. Leave the working tree in the conflicted state and report it for user resolution. **Done when:** the conflicted channel is stopped with files and base branch named.
6. Push each non-conflicted cherrypick branch to the remote. **Done when:** each non-conflicted branch is pushed, or the remote error is reported and the branch left intact.
7. Open one PR per non-conflicted channel against that channel's base branch, titled to identify the cherry-pick and the source reference, and assign the on-call reviewer. **Done when:** one PR is opened and assigned per non-conflicted channel.
8. Report the set of opened PRs and the set of channels stopped on conflict. **Done when:** every requested channel is reported as opened-with-PR or stopped-on-conflict.

## Failure and recovery
- Conflict on cherry-pick: stop that channel with the conflicted files and base branch named; do not commit, push, or open a PR for it. The user resolves the conflict and re-invokes.
- Missing or ambiguous reference: stop and request the exact commit SHA(s); do not guess.
- Missing release branch or on-call reviewer: stop and request the missing input; do not invent a branch or reviewer.
- Push or PR-open failure: leave the local cherrypick branch intact, report the remote error, and stop; do not retry silently or force-push.
- Partial result: branches already pushed and PRs already opened remain; stopped channels are reported, not silently dropped. The done predicate holds only for channels that reached an opened, assigned PR.

## Output
A report listing, per requested release channel, the cherrypick branch, the PR URL and title with the on-call reviewer assigned, or the conflict that stopped that channel; terminal classification `done` when every requested channel has an opened, correctly titled, reviewer-assigned PR, otherwise `blocked` with the stopped channels named.
