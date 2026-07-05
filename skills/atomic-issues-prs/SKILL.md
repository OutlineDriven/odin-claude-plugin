---
name: atomic-issues-prs
description: Publish a change-set as atomic GitHub issues or PRs. Use when the user says "open a PR per change", "atomic PRs", "individual PR for each change", or wants separate PRs/issues.
metadata:
  short-description: Atomic one-PR-per-change publisher with fork fallback
---

# Atomic Issues and PRs

Publish a change-set as atomic GitHub objects: one issue/PR per logical change, never bundled.
The layer above `commit-push`. It opens the PRs (and optionally issues) that skill never touches.

## Phase 0 - Preflight & canonical-repo resolution

Run `gh auth status`. If unauthenticated, stop and ask the user to run `gh auth login`.

Resolve the canonical (upstream) slug **explicitly before any permission check**. `gh repo view`'s
default inspects the *current* repo, which is the fork in a fork clone.

- Read remotes: `git remote -v`. Pick the contribution target: `upstream` if present, else `origin`.
- Detect a fork relationship: `gh repo view <slug> --json nameWithOwner,parent,defaultBranchRef`.
  A non-null `parent` means `<slug>` is itself a fork, so the canonical slug is `parent.nameWithOwner`.
- **Ambiguity → ask.** Prompt the user for the target repo only when there is no clear single
  upstream (no `upstream` remote and ≥2 plausible non-origin candidates, or `gh`'s detected
  `parent` disagrees with the `upstream` remote) **or** `origin` has genuinely diverged from
  upstream (no common merge-base, or `origin` was re-created/renamed/renewed). Plain fork-behind,
  where `origin` is merely behind `upstream` with a shared merge-base, is not ambiguity and must never
  prompt.
- Query permission on the canonical slug: `gh repo view <canonical-slug> --json viewerPermission`.
  `viewerPermission` ∈ {ADMIN, MAINTAIN, WRITE} ⇒ **direct mode**; otherwise ⇒ **fork mode**.
- Record the canonical default base branch from `defaultBranchRef`.

## Phase 1 - Decompose & commit atomically

Group working-tree changes into atomic units by mechanism/file boundary: one concern per unit.
Never bundle unrelated changes.

Commit the **whole** set into N atomic commits first, running the repo-native type-checker and linter
before each commit. This is the patch-isolation mechanism: each unit becomes one self-contained commit,
so per-unit branches come from **cherry-pick**. Never re-stage a dirty tree, which would let
later units swallow earlier diffs. Present the unit→commit list to the user for visibility, then proceed
immediately. Do not wait for a go-ahead.

## Phase 2 - Route objects per unit

Auto-route each unit by its commit type prefix (`<type>: ...`). Do not ask interactively:

- **`feat` / `fix` / `perf` / `revert`** → **Issue + linked PR** for behavior-affecting changes; a tracking issue
  gives it a changelog/discussion anchor. The PR files first; the issue body then references the PR
  `#number`; once the issue exists, the PR body is amended with `Closes #N` (see Phase 4).
- **`docs` / `style` / `refactor` / `test` / `chore` / `build` / `ci`** → **PR-only** for mechanical,
  self-explanatory changes; no separate tracking needed.

Honor an explicit per-unit override if the user states one; otherwise route silently.

## Phase 3 - Resolve push URL (once)

Push by **URL**, never by remote name. This avoids undefined targets (a canonical slug from `parent`
has no local remote) and remote-name collisions / local-config mutation. With `gh` authenticated, the
git credential helper authorizes HTTPS pushes.

- **Direct mode**: push URL = `https://github.com/<canonical-slug>`.
- **Fork mode**: fork owner = authenticated login (`gh api user --jq .login`); fork slug = `<login>/<repo>`.
  If `origin` already points to a prior personal fork of the canonical repo (its owner ≠ canonical owner)
  and that owner ≠ the authenticated login, print a non-blocking warning noting the account mismatch.
  Don't stop the run over it; legitimate cases exist (team forks, renamed accounts, shared machines).
  If the fork does not exist, create it (`gh repo fork <canonical-slug> --clone=false`) automatically,
  noting the fork slug in the run's output. Push URL = `https://github.com/<fork-slug>`.

## Phase 4 - Per-unit publish loop

Default contract: **units are independent**. Each branches off the canonical base and merges alone.
Determine dependency order in Phase 1; if no unit depends on another, every PR bases on `<default>`.
For each unit, in dependency order:

1. `git branch <branch> <parent-ref>` then `git cherry-pick <unit-commit>` onto it.
   - **Independent unit**: `<parent-ref>` = `<canonical-default-base>`; PR bases on `<default>`.
   - **Dependent unit (direct mode only)**: `<parent-ref>` = the prerequisite unit's already-pushed
     branch; PR bases on that branch (a stacked PR). Cherry-pick only this unit's commit. The
     prerequisite is already present via the parent branch, so no prerequisite is lost.
   - **Dependent unit in fork mode**: cross-fork stacking can't be expressed (a fork PR's base must be a
     branch in the canonical repo, not the fork). Flatten it onto `<canonical-default-base>` instead of
     the prerequisite branch, and prefix the PR body with a warning line naming the prerequisite unit and
     noting the dependency was flattened. No blocking ask, but the compromise is never silent.
2. `git push <push-url> <branch>:refs/heads/<branch>` (same form both modes; only the URL differs).
3. `gh pr create --repo <canonical-slug> --body-file <tmp>`. Direct mode: `--base <parent-ref> --head
   <branch>`; fork mode: `--base <default> --head <fork-owner>:<branch>` → capture PR `#M`.
4. If this unit routed to Issue + linked PR (Phase 2): `gh issue create --repo <canonical-slug> --title
   "<summary>" --body-file <tmp>` with a body that references PR `#M` → capture `#N`.
5. Amend the PR body: append `Closes #N` to the PR's **existing** body. Reuse the body-file already
   written for step 3 (append the line, re-write) or fetch the current body first (`gh pr view <M>
   --json body`). Then write it with `gh pr edit <M> --repo <canonical-slug> --body-file <amended-tmp>`.
   `gh pr edit --body-file` replaces the whole body, so never write a bare `Closes #N` as the entirety
   of it.
6. Emit the issue/PR URLs; move to the next unit.

For PR-only routed units (no issue filed in step 4), skip steps 4-5 entirely. No dangling `Closes`.

## Constraints (hard)

- Never `--force` or `--force-with-lease` without explicit user authorization.
- Never push directly to protected branches (`main`, `master`, `release/*`). Branches only.
- One GitHub object per logical change; bundling is refused.
