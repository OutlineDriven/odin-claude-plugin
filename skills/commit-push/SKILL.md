---
name: commit-push
description: Use when asked to ship/publish commits without opening a PR.
---

# Git commit and push


**Asking the user:** use the platform's blocking question tool -- `AskUserQuestion` in Claude Code (`ToolSearch` with `select:AskUserQuestion` first if unloaded), `request_user_input` in Codex, `ask_question` in Antigravity (`agy`), `ask_user` in Pi (`pi-ask-user` extension). Fall back to chat only when no blocking tool exists or the call errors, not for an unloaded schema. Never skip the question silently.

## Context

**On platforms other than Claude Code**, run the Context fallback below. **In Claude Code**, the labeled sections contain pre-populated data. Use them directly.

**Git status:**
!`git status`

**Working tree diff:**
!`git diff HEAD`

**Current branch:**
!`git branch --show-current`

**Recent commits:**
!`git log --oneline -10`

**Remote default branch:**
!`git rev-parse --abbrev-ref origin/HEAD 2>/dev/null || echo 'DEFAULT_BRANCH_UNRESOLVED'`

### Context fallback

```bash
printf '=== STATUS ===\n'; git status; printf '\n=== DIFF ===\n'; git diff HEAD; printf '\n=== BRANCH ===\n'; git branch --show-current; printf '\n=== LOG ===\n'; git log --oneline -10; printf '\n=== DEFAULT_BRANCH ===\n'; git rev-parse --abbrev-ref origin/HEAD 2>/dev/null || echo 'DEFAULT_BRANCH_UNRESOLVED'
```

---

## Step 1: Resolve branch state

The remote default branch returns something like `origin/main`; strip the `origin/` prefix. If it returned `DEFAULT_BRANCH_UNRESOLVED` or bare `HEAD`, try `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'`. If both fail, fall back to `main`.

- **Detached HEAD:** ask whether to create a feature branch (derive name from change content if yes). If no, stop.
- **On default branch with work** (uncommitted, unpushed, or no upstream): auto-create a feature branch (pushing default directly isn't supported), derive name from change content, continue at Step 3. Don't ask -- committing on default isn't an option here.
- **On default branch, no work:** report nothing to do and stop.
- **Feature branch:** continue.

## Step 2: Determine conventions

Match repo style for commit messages (project instructions in context > recent commits > conventional commits default). With conventional commits, default to `fix:` over `feat:` when ambiguous -- code added to remedy broken/missing behavior is `fix:`; `feat:` is for capabilities the user couldn't previously do. User may override.

## Step 3: Commit

When branching off the default, base the new branch on an up-to-date default tip -- a stale or diverged local default silently forks the feature branch from old history.

The atomicity gate is `commit`, and this skill adds only the push. Read the concern grouping, revert test, mechanism split, sweep rule, and build-order rule there.

## Step 4: Detect remote and push

Run `git remote` to list configured remotes.

- **No `origin` remote** (empty output, or other remotes present but none named `origin`): do not push, and do not add/invent/guess a remote. Report "local-only, no remote -- commits only" (or "no `origin` remote configured" if other remotes exist) and stop -- skip the push attempt entirely rather than attempting and failing.
- **`origin` present** -- push:

```bash
git push -u origin HEAD
```

Never `--force`/`--force-with-lease` without explicit user authorization; never push directly to protected branches (`main`, `master`, `release/*`) without explicit user authorization.

If the working tree is clean and all commits are already pushed, this step is a no-op.
