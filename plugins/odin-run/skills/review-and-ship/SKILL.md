---
name: review-and-ship
description: 'Use when a human directly requests review and publication of an existing diff, or work passes the explicit signal authority: delegated. Reviews the diff, fixes release-blocking findings, verifies with native checks, packages atomic commits, and opens or updates a pull request. Not for merging pull requests, force pushes, history rewrites, or deployment.'
disable-model-invocation: true
---

# Review and ship

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A human directly requests review and publication, or `work` passes the explicit signal `authority: delegated`. |
| Authority | Direct or explicitly delegated shipping authority. A route name or surrounding context never implies delegation. Preview any credential, paid, data-at-rest, remote bulk, or irreversible consequence not already covered by that authority. |
| Side effect | Repairs the reviewed diff, creates local commits, pushes one branch without force, and opens or updates one pull request. |
| Done | No release-blocking finding remains, native checks pass, every intended commit is on the remote branch, and a confirmed pull-request URL is returned. |

## Inputs

- `$AUTHORITY`: `direct` or `delegated`. Default to `direct` only on direct human invocation.
- The existing staged, unstaged, untracked, or already-committed diff.
- The repository's loaded Git, review, verification, and pull-request conventions.
- The publication remote, base branch, and head branch, resolved from repository state unless the caller supplied them.

## Procedure

1. Establish authority. Reject a delegated run without the literal `authority: delegated` signal. Resolve the remote, base, head, and current HEAD. If HEAD is detached, attach it to a new publication branch named from the change. Do not change branches when that would discard or hide work.
2. Inspect the complete publication range and working tree. Include staged, unstaged, untracked, and ahead-of-remote commits. Exclude unrelated or sensitive files before review; never stage with a catch-all path.
3. Review every changed file against behavior, security boundaries, repository rules, and scope. Repair actionable critical and high findings inside the requested change. Re-review each repaired region. Stop when a finding needs a product decision, destructive act, or scope increase that authority does not cover.
4. Run the repository-native checks for every touched language and changed behavior. Fix source failures and repeat the affected check. Do not weaken, skip, or replace a configured gate to obtain green output.
5. Package the working-tree diff into atomic commits. Split by reason for change, not by file count. Stage exact paths or exact hunks, apply the repository's message convention, and leave each commit buildable. Do not amend or rewrite existing history unless the human explicitly requested that separate operation.
6. Fetch the publication remote. Classify the head as new, ahead-only, behind-only, or diverged against its remote branch. List the exact commits and checks that will publish. A behind-only or diverged branch blocks ordinary publication; never answer it with a force flag, reset, rebase, or branch deletion.
7. Proceed under the authority established in Step 1; do not ask for the same confirmation twice. Push the head branch with an ordinary fast-forward push. No `--force`, `-f`, `--force-with-lease`, or `+refspec` is permitted.
8. Query for an existing pull request on the head branch. Update its title and body when one exists; otherwise create one against the resolved base. Preserve command errors: a no-pull-request result permits creation, while authentication, permission, network, or validation errors block publication.
9. Read the pull request back from the host. Confirm its URL, base, head, state, and published commit tip. Return the final report only when those values match the intended publication.

## Failure and recovery

| Failure | Action |
|---|---|
| Missing delegated authority | Stop before review or mutation and name the missing signal. |
| Release-blocking finding cannot be repaired in scope | Keep the reviewed diff and return the finding, evidence, and required decision. Do not publish. |
| Native check fails | Keep the failure output and affected paths. Do not commit or publish the failing group. |
| Branch is behind or diverged | Return the classification and exact counts. Do not rewrite history or force push. |
| Commit packaging partially succeeds | Preserve created commits and list the remaining unstaged groups. Do not publish a partial change set. |
| Push or pull-request operation fails | Preserve the exact remote error, branch, and pushed commit state. Never retry with broader authority. |
| Host response lacks a confirmed pull-request URL or tip | Return `BLOCKED` with the remote and branch. Do not claim publication complete. |

## Output

Return, in order: review findings and repairs; native check results; commit hashes and subjects; publication classification; push result; pull-request URL, base, head, state, and confirmed tip. Mark every section `PASS` or `BLOCKED`.
