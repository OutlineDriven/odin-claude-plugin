---
name: atomic-issues-prs
description: 'Use when the user says "atomic PRs" or requests one issue or PR per logical change. Don''t use for single-change pushes or uncommitted change-sets.'
disable-model-invocation: true
---

# Atomic issues and PRs

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says "atomic PRs" or requests one issue/PR per logical change. |
| Authority | Remote: creates branches, commits, issues, and pull requests on a remote GitHub repository; requires explicit human invocation. Preview the target repo and consequence before creating them. |
| Side effect | Creates branches, commits, issues, and pull requests on a remote GitHub repository. Never force-pushes or pushes to protected branches without explicit user authorization. |
| Done | One issue or PR per logical change on the correct base/head, links appended, URLs reported. |

## Inputs

Required: a working tree containing the change-set to publish and a `gh`-authenticated GitHub account.
Optional: per-unit routing overrides (issue+PR vs PR-only) stated by the user; dependency order among units.

## Procedure

1. Run `gh auth status`. If unauthenticated, stop and ask the user to run `gh auth login`.
2. Resolve the canonical (upstream) slug before any permission check. Read remotes with `git remote -v`; pick the contribution target as `upstream` if present, else `origin`. Detect a fork relationship with `gh repo view <slug> --json nameWithOwner,parent,defaultBranchRef`; a non-null `parent` means the canonical slug is `parent.nameWithOwner`. If there is no clear single upstream (no `upstream` remote and ≥2 plausible non-origin candidates, or `gh`'s detected `parent` disagrees with the `upstream` remote) or `origin` has genuinely diverged from upstream (no common merge-base, or `origin` was re-created/renamed/renewed), prompt the user for the target repo. Plain fork-behind, where `origin` is merely behind `upstream` with a shared merge-base, is not ambiguity and must never prompt.
3. Query permission on the canonical slug: `gh repo view <canonical-slug> --json viewerPermission`. `viewerPermission` ∈ {ADMIN, MAINTAIN, WRITE} ⇒ direct mode; otherwise ⇒ fork mode. Record the canonical default base branch from `defaultBranchRef`.
4. Group working-tree changes into atomic units by mechanism/file boundary: one concern per unit. Never bundle unrelated changes. Commit the whole set into N atomic commits first, running the repo-native type-checker and linter before each commit. Each unit becomes one self-contained commit, which allows per-unit branches to be created by cherry-picking. Never re-stage a dirty tree, which would let later units swallow earlier diffs. Present the unit→commit list to the user, then proceed.
5. Route each unit by whether it changes observable behavior: behavior-affecting → Issue + linked PR, because a tracking issue gives the change a changelog/discussion anchor; mechanical → PR-only, because a self-explanatory change needs no separate tracking. Honor an explicit per-unit override if the user states one; otherwise route silently.
6. Resolve the push URL once, by URL not remote name, to avoid undefined targets and remote-name collisions. Direct mode: push URL = `https://github.com/<canonical-slug>`. Fork mode: fork owner = `gh api user --jq .login`; fork slug = `<login>/<repo>`. If `origin` already points to a prior personal fork whose owner ≠ canonical owner and ≠ the authenticated login, print a non-blocking warning noting the account mismatch; do not stop the run. If the fork does not exist, create it with `gh repo fork <canonical-slug> --clone=false` and note the fork slug in the output. Push URL = `https://github.com/<fork-slug>`.
7. For each unit, in dependency order:
   1. Create the branch and cherry-pick the unit commit. Independent unit: `git branch <branch> <canonical-default-base>` then `git cherry-pick <unit-commit>`; PR bases on `<default>`. Dependent unit in direct mode: parent-ref = the prerequisite unit's already-pushed branch; PR bases on that branch (a stacked PR); cherry-pick only this unit's commit so no prerequisite is lost. Dependent unit in fork mode: cross-fork stacking cannot be expressed (a fork PR's base must be a branch in the canonical repo), so flatten onto `<canonical-default-base>` and prefix the PR body with a warning line naming the prerequisite unit and noting the dependency was flattened; the compromise is never silent.
   2. `git push <push-url> <branch>:refs/heads/<branch>` (same form both modes; only the URL differs).
   3. `gh pr create --repo <canonical-slug> --body-file <tmp>`. Direct mode: `--base <parent-ref> --head <branch>`; fork mode: `--base <default> --head <fork-owner>:<branch>`; capture PR `#M`.
   4. If the unit routed to Issue + linked PR: `gh issue create --repo <canonical-slug> --title "<summary>" --body-file <tmp>` with a body that references PR `#M`; capture `#N`.
   5. Amend the PR body by appending `Closes #N` to the PR's existing body. Reuse the body-file from step 3 (append the line and rewrite the file) or fetch the current body first with `gh pr view <M> --json body`; then write it with `gh pr edit <M> --repo <canonical-slug> --body-file <amended-tmp>`. `gh pr edit --body-file` replaces the whole body, so never write a bare `Closes #N` as the entirety of it.
   6. Emit the issue/PR URLs; move to the next unit.
8. For PR-only routed units (no issue filed in step 4), skip the issue-create and body-amend steps entirely; no dangling `Closes`. Done when: every logical unit has the correct issue/PR routing, base and head, links, and reported URLs.

## Failure and recovery
- Unauthenticated: stop before any mutation; ask the user to run `gh auth login`. No partial result.
- Ambiguous upstream: stop and ask the user for the target repo; do not guess. No mutation performed.
- Insufficient permission with no fork path: stop; report the canonical slug and the missing permission. No push or object created.
- Push rejected: report the rejection and the branch/URL; do not force-push. Leave prior successfully published units in place.
- Partial publish failure mid-loop: already-published units remain; report each unit's status (published URL or failed) so the user can retry the failed units. Never swallow the error or pretend the done predicate holds.
- Non-converged: if any unit could not be published, the terminal result names the failed units and the reason; the run is not done.

## Output
A run report listing, per unit: the routing (Issue+PR or PR-only), the branch, the push URL, the PR number and URL, and (when filed) the issue number and URL. Classify the run as done only when one issue or PR per logical change exists on the correct base/head, links are appended, and URLs are reported.
