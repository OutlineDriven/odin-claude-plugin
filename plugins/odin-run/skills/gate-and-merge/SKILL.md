---
name: gate-and-merge
description: 'Use when a set of open PRs needs landing together: gate, fix minor findings, merge parent-first. Not for single-PR review feedback — use resolve-pr-feedback. Not for gate-only evaluation without merge — use gate-proposed-change. Human-only.'
disable-model-invocation: true
---

# Gate and merge

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A set of open PRs needs landing together; the user says "land these PRs", "merge the stack", "clear the PR queue", or names a merge train. |
| Authority | Human-only. The human authorizes the queue once before the first merge and authorizes every push to a branch they do not own. Preview the target and consequence before any remote bulk mutation. |
| Side effect | PR review comments for blocking findings, minor follow-up commits pushed to PR head branches, and stack merges on GitHub. No merge on a pending or pre-fix head. |
| Done | Every PR merged, held-with-gate-comment, or fixed-then-merged; one line per PR; no merge on a pending or pre-fix oid. |

## Not for

- Single-PR review feedback resolution — use resolve-pr-feedback.
- Gate-only evaluation without merge — use gate-proposed-change.
- Review-only passes — this skill lands PRs, it does not just review them.

## Inputs

- The set of open PRs to land, supplied by the user as numbers, a stack, or "the queue". Required.
- One yes from the user before the first merge. Required.
- Per-push authorization from the user for any branch the user does not own. Required when applicable.
- A gate override, if any, must name both the gate and the PR; a blanket skip is refused.

## Procedure

Run one serial loop: gate a PR, act on its findings, merge it, move to the next. Serial because every merge changes the base the next PR is gated against.

1. List every open PR with this exact field list. Never add `statusCheckRollup` here — at `--limit 60` the bulk call plus `statusCheckRollup` returns `HTTP 502: 502 Bad Gateway` while the same call without it returns 21 KB and exits 0:

```
gh pr list --state open --limit 100 --json number,title,url,headRefName,baseRefName,headRefOid,isDraft,mergeable,mergeStateStatus,reviewDecision,maintainerCanModify
```

Done when: every open PR is listed with the exact field set.

2. Build the stack order. A PR whose `baseRefName` equals another open PR's `headRefName` is that PR's child; everything else is a root. Order topologically, parents first, roots by ascending number. Print the order as a tree and take one yes before the first merge. After a parent merges GitHub retargets its children, so re-read the child's `baseRefName` at its turn rather than trusting the graph drawn at the start. Done when: the stack order is printed as a tree and the human says yes.

3. For each PR in order, run the gate ladder below and apply the single severity table. Do not build a mechanical prefilter plus a separate QA pass: a draft flag and an unhandled nil are both findings, differing only in what produced them. Done when: every PR is merged, held, or fixed-then-merged.

| Severity | Decidable definition | Action |
|---|---|---|
| `blocking` | The PR cannot merge, or merging ships a wrong result reachable on a plausible input. | One PR review carrying every blocking finding, via `gh pr review <n> --comment --body-file -`. Hold the PR, continue the queue. |
| `minor` | A defect with no reachable behavioral impact, or a convention violation, whose fix touches only files the PR already changed and adds no new behavior. | Fix on the PR head branch as one follow-up commit, push, re-gate, merge. |
| `none` | No finding. | Merge. |

The `minor` bound is mechanical: `gh pr diff <n> --name-only` is the allowlist, and a fix needing a file outside that set is `blocking` by definition. Use `--comment` rather than `--request-changes`, because a comment records the findings without seizing the approval state.

### Gate 1: mergeability

- `isDraft: true` is blocking with no comment, because a draft is not asking.
- `mergeable: "CONFLICTING"` is blocking and takes the conflict path.
- `mergeable: "UNKNOWN"` means GitHub is still computing: re-read once, then blocking.
- `reviewDecision: "CHANGES_REQUESTED"` is blocking, because a human already blocked it and the ladder does not overrule a human.

Never gate on `mergeStateStatus`. `cli/cli` PR 14252 reported `mergeStateStatus: "BLOCKED"` with `mergeable: "MERGEABLE"`, every `statusCheckRollup` conclusion `SUCCESS`, and `reviewDecision: "REVIEW_REQUIRED"`. The field folds branch protection into the same value as a real defect, so gating on `BLOCKED` holds every PR in a review-required repo.

Conflict path: resolve on the PR head branch, never inside the merge. Merge the base into the PR branch and resolve the conflict there; a resolution buried in a merge commit is a change nobody reviewed. Check `git config --get merge.mergiraf.driver`; where set, the global `merge.mergiraf.driver` handles supported languages through gitattributes. Where unset, resolve the file triple by hand with `mergiraf merge <base> <left> <right> -o <out> -p <path>`. Push, then re-gate.

### Gate 2: checks

Per PR, because the bulk rollup 502 forces it:

```
gh pr view <n> --json number,headRefOid,statusCheckRollup
```

A `CheckRun` entry carries `conclusion` and a legacy status context carries `state`, so read `conclusion` and fall back to `state`. Any value outside `SUCCESS`, `SKIPPED`, `NEUTRAL` is blocking, and the finding names the check and its `detailsUrl`. Diagnose the red check outside this queue; do not debug CI inside the queue. An entry whose `status` is not `COMPLETED` is still running: `gh pr checks <n> --watch --fail-fast`, then re-read. A queue that merges on a pending check merges red.

### Gate 3: scope

```
gh pr diff <n> --name-only
```

A file set spanning unrelated subsystems under a title naming one concern is blocking as mixed concerns, because that mixing is what makes the revert impossible later. A lockfile or generated path alongside source is blocking; a PR that is only that is one concern and passes.

### Gate 4: diff QA

```
gh pr diff <n>
```

Read the whole diff once. A finding names a reachable input or state that produces the wrong result, with `file:line`. A line that is merely unlovely is not a finding. Six classes, ordered by what actually breaks:

1. Wrong on a plausible input: an unhandled empty, missing, or boundary value on a path the change introduces.
2. Trust boundary: untrusted input reaching a sink unvalidated, or a credential in the diff.
3. Resource and error path: an acquired resource with no release on the failure path, a swallowed error, or a partial write with no rollback.
4. Concurrency: shared state written without the lock its neighbours take, or an await between a read and its dependent write.
5. Contract drift: a changed signature, error string, config key, or wire field with a caller left behind. This class must search rather than read: `grep` the old name tree-wide, and a surviving caller is blocking.
6. Convention: the diff introduces a second way to do what the repo already does one way.

Classes 1 to 5 are blocking when the wrong result is reachable. Class 6, and a cosmetic instance of 1 to 5, are minor when the fix stays inside the PR file set.

### Gate 5: test debt

A behavior change with no test that fails without it is minor where the repo has a suite the change fits, and blocking where the change touches a trust boundary or data at rest. Never demand a test for plumbing.

### Minor-fix loop

1. Check out the PR into an isolated worktree. Edit, make one commit whose subject names the gate that caught it, push.
2. `maintainerCanModify: false` on a cross-repo PR makes the push impossible, so the fix becomes a comment carrying the patch. Same finding, different delivery, one path.
3. The push moves `headRefOid` and restarts CI, so re-run Gate 2 against the new head before merging. Merging on the pre-fix oid merges unverified code.
4. `gh pr merge <n> --merge --match-head-commit <current headRefOid>`. The flag is the race guard, refusing if the head moved again under a concurrent push.

## Failure and recovery

- `blocking` finding: post one PR review via `gh pr review <n> --comment --body-file -` carrying every blocking finding, hold the PR, continue the queue. Do not merge.
- **`mergeable: "UNKNOWN"`**: re-read once; still unknown is blocking.
- Pending check: `gh pr checks <n> --watch --fail-fast`, then re-read; never merge on a non-`COMPLETED` status.
- Conflict: resolve on the PR head branch, push, re-gate; never bury a resolution in the merge commit.
- Push refused by `maintainerCanModify: false`: deliver the fix as a comment carrying the patch; do not attempt a second push flow.
- Race on merge: `--match-head-commit` refuses if the head moved; re-read `headRefOid` and re-merge.
- Gate override: requires the user to name the gate and the PR; a blanket skip is refused.
- Partial result: the queue is serial and per-PR independent; a held or failed PR does not block later PRs unless a later PR's base is the held PR's head. In that case stop and report the stack stall.
- Never swallow an error or pretend the done predicate holds.

## Output

One line per PR: `merged`, `held with <gate> and <comment URL>`, or `fixed-then-merged with <follow-up SHA>` — no merge on a pending or pre-fix oid.
