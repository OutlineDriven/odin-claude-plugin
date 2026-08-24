---
name: commit
description: Use when the user asks to commit/save staged or unstaged changes with a repo-appropriate, value-communicating message.
---

# Git Commit

Create a single, well-crafted git commit from the current working tree changes.

## Context

**On platforms other than Claude Code**, run the Context fallback below. **In Claude Code**, the five labeled sections below contain pre-populated data -- use them directly, do not re-run these commands.

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

## Workflow

### Step 1: Gather context

Use the context above. The remote default branch returns something like `origin/main`; strip the `origin/` prefix. If it returned `DEFAULT_BRANCH_UNRESOLVED` or bare `HEAD`, try `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'`. If both fail, fall back to `main`.

If git status shows a clean working tree (no staged, modified, or untracked files), report nothing to commit and stop.

If the current branch is empty, the repo is in detached HEAD state. A branch is required to attach this work; ask whether to create a feature branch. Use the platform's blocking question tool: `AskUserQuestion` in Claude Code (`ToolSearch` with `select:AskUserQuestion` first if unloaded), `request_user_input` in Codex, `ask_question` in Antigravity (`agy`), `ask_user` in Pi (`pi-ask-user` extension). Fall back to chat only when no blocking tool exists or the call errors, not for an unloaded schema. Never skip the question silently.

- If yes, derive the name from the change content, create it with `git checkout -b <branch-name>`, then re-run `git branch --show-current` and use that as the current branch for the rest of the workflow.
- If no, continue with the detached HEAD commit.

### Step 2: Determine commit message convention

Priority order: (1) repo conventions in already-loaded project instructions (AGENTS.md, CLAUDE.md, etc. -- do not re-read them, they loaded at session start); (2) else, a clear pattern in the 10 recent commits from Step 1 (conventional commits, ticket prefixes, emoji); (3) else, conventional commits: `type(scope): description`, type one of `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`, `style`, `build`.

When using conventional commits, pick the most precise type. Where `fix:` and `feat:` both fit, default to `fix:` -- remedying broken or missing behavior is `fix:` even via added code; reserve `feat:` for capabilities the user couldn't previously do. The user may override.

### Step 3: Consider logical commits

One concern per commit, where a concern is one reason the tree changed. Two changes belong in the same commit only when reverting one without the other leaves the tree broken. That revert test replaces "when the separation is obvious" and "two or three is the sweet spot", both of which decide nothing.

- Split by mechanism, not by file. Where one file carries two mechanisms, the file is not the unit. Lift the outright ban on hunk-splitting: write the filtered patch out of `git diff -- <file>`, keep only the hunks for one mechanism, and stage it with `git apply --cached <patch>` — `unverified - confirm first` on the first real split, since this headless form was not executed this session and `git add -p` needs a TTY the agent lacks.
- A lint, format, or whitespace sweep is its own commit, never folded into a behavior change.
- Order commits so each one leaves the tree building. A commit that only builds together with its successor is not atomic, so merge the two or re-cut the split.
- Run the repo-native verification gate per commit group before staging that group (Step 4 keeps that gate and the `git add -A` prohibition).

### Step 4: Stage and commit

If the current branch is `main`, `master`, or the resolved default branch, automatically create a feature branch first: derive the name from the change content, `git checkout -b <branch-name>`, confirm with `git branch --show-current`, and use it for the rest of the workflow. Do not ask -- committing on the default branch is not an option here.

Write the commit message:
- **Subject**: concise, imperative, *why* not *what*, per Step 2's convention.
- **Body** (when needed): blank line, then motivation/trade-offs a future reader would need; omit for obvious single-purpose changes.

Run the repo's native verification gate (type-checker and/or linter, whichever it defines) once per commit group before staging that group. A failing group isn't ready to commit. Skip silently if neither is configured.

Stage and commit each group in a single call. Prefer naming files over `git add -A`/`git add .`, which can sweep in sensitive files (.env, credentials) or unrelated changes. Use a heredoc to preserve formatting:

```bash
git add file1 file2 file3 && git commit -m "$(cat <<'EOF'
type(scope): subject line here

Optional body explaining why this change was made,
not just what changed.
EOF
)"
```

### Step 5: Confirm

Run `git status` after the commit to verify success. Report the commit hash(es) and subject line(s).
