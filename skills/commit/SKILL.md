---
name: commit
description: 'Use when a user asks to commit or save staged or unstaged changes. Each logical concern is committed with a value-communicating message and the resulting hashes and subjects are reported. Not for rewriting existing commit messages — use commit-economy.'
---

# Git commit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to commit or save staged or unstaged changes. |
| Authority | Reversible local writes only: stage selected local files, create a local feature branch, and create local commits. Never push, publish, or mutate a remote. |
| Side effect | Local working tree, local index, local branch refs, and local commit objects. Rollback: `git reset --hard <prior-HEAD>` discards new commits; `git branch -D <created-branch>` removes a branch this skill created. |
| Done | Each logical concern is committed with a value-communicating message; `git status` confirms success; commit hashes and subjects are reported. |

## Inputs

- Current working tree state (`git status`, `git diff HEAD`): required, gathered by the skill.
- Current branch and recent commit history (`git branch --show-current`, `git log --oneline -10`): required, gathered by the skill.
- Resolved remote default branch (`git rev-parse --abbrev-ref origin/HEAD`): optional; falls back to `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'`, then to `main`.
- Repo commit-message convention in already-loaded project instructions: optional; used directly without re-reading.
- User decision on creating a feature branch in detached HEAD state: required only when the repo is in detached HEAD.

## Procedure

1. Gather context: run `git status`, `git diff HEAD`, `git branch --show-current`, `git log --oneline -10`, and `git rev-parse --abbrev-ref origin/HEAD 2>/dev/null || echo DEFAULT_BRANCH_UNRESOLVED`. Strip the `origin/` prefix from the default branch. If it returned `DEFAULT_BRANCH_UNRESOLVED` or bare `HEAD`, try `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'`; if that also fails, use `main`. Done when: working tree state, branch, recent history, and default branch are known.
2. If `git status` shows a clean working tree (no staged, modified, or untracked files), report nothing to commit and stop. Done when: the working tree is confirmed clean and the skill stops, or changes are confirmed present.
3. If the current branch is empty, the repo is in detached HEAD. Ask whether to create a feature branch using the platform blocking question tool (`AskUserQuestion` in Claude Code, `request_user_input` in Codex, `ask_question` in Antigravity, `ask_user` in Pi); fall back to chat only when no blocking tool exists or the call errors, never for an unloaded schema. If yes, derive a name from the change content, run `git checkout -b <branch-name>`, re-run `git branch --show-current`, and use it for the rest of the workflow. If no, continue with the detached HEAD commit. Done when: the branch decision is made and the branch is confirmed.
4. Determine the commit message convention in priority order: (1) repo conventions in already-loaded project instructions, used directly; (2) a clear pattern in the recent commits from Step 1 (conventional commits, ticket prefixes, emoji); (3) the seven-rule style: capitalized imperative subject, 50 chars target and 72 hard, no trailing period, blank line, body wrapped at 72 explaining what and why, never how. If source (1) or (2) uses conventional commits, pick the most precise type. Where `fix:` and `feat:` both fit, default to `fix:` (remedying broken or missing behavior is `fix:` even via added code; reserve `feat:` for capabilities the user could not previously do). The user may override. Done when: a convention is selected and stated.
5. Determine logical commits. One concern per commit, where a concern is one reason the tree changed. Put two changes in the same commit only when reverting one without the other leaves the tree broken. Split by mechanism, not by file. When one file carries two mechanisms, write the filtered patch out of `git diff -- <file>`, keep only the hunks for one mechanism, and stage it with `git apply --cached <patch>` (confirm this headless form on the first real split, since `git add -p` needs a TTY the agent lacks). A lint, format, or whitespace sweep is its own commit, never folded into a behavior change. Order commits so each leaves the tree building. A commit that only builds with its successor is not atomic, so merge the two or re-cut the split. Done when: commit groups are defined, each atomic and ordered to build independently.
6. If the current branch is `main`, `master`, or the resolved default branch, automatically create a feature branch first: derive the name from the change content, run `git checkout -b <branch-name>`, confirm with `git branch --show-current`, and use it for the rest of the workflow. Do not ask; committing on the default branch is not an option here. Done when: a feature branch is created and confirmed, or the current branch is already a feature branch.
7. For each commit group, run the repo-native verification gate (type-checker and/or linter, whichever it defines) before staging that group. A failing group is not ready to commit. Skip silently if neither is configured. Done when: each group passes its gate or the failing group is named and skipped.
8. Stage and commit each group in a single call. Prefer naming files over `git add -A` or `git add .`, which can sweep in sensitive files (`.env`, credentials) or unrelated changes. Write the subject concise, imperative, *why* not *what*, per Step 4's convention; add a body only when a future reader would need motivation or trade-offs. Use a heredoc to preserve formatting:

```bash
git add file1 file2 file3 && git commit -m "$(cat <<'EOF'
Add first-class subject line here

Optional body explaining the change and why it was needed.
EOF
)"
```

Done when: each group is staged and committed with a value-communicating message.
9. Run `git status` after the commit to verify success. Report the commit hash(es) and subject line(s). Done when: `git status` confirms success and hashes and subjects are reported.

## Failure and recovery
- Clean working tree: report nothing to commit and stop; no mutation occurs.
- Detached HEAD with no branch decision: stop and report that a branch is required to attach the work; no commit is created.
- Verification gate failure for a group: that group is not ready to commit; do not stage or commit it. Already-committed groups remain; uncommitted groups are left unstaged. Report which group failed and the gate output.
- Sensitive or unrelated file detected during staging: exclude it by naming files explicitly; never use `git add -A` or `git add .`.
- Partial result rule: groups already committed are real commits and remain; the blocked result names the uncommitted groups and the failure reason. Rollback for a created feature branch is `git branch -D <branch-name>`; rollback for new commits is `git reset --hard <prior-HEAD>`.
- Never swallow a git error or report the done predicate when `git status` does not confirm success.

## Output
Local commits (one per concern, each with a value-communicating message) on a local branch, plus a report of hash(es), subject line(s), and confirming `git status`.

## Provenance

Origin: odin-1.x current skill `skills/commit/SKILL.md`. Revision: unpinned (current). License: project-owned. Adaptation: restated to the ODIN 2.0 contract format with the concern-atomic local-commit mechanism, feature-branch-only-on-default rule, verification-gate-per-group rule, and never-push boundary preserved.
