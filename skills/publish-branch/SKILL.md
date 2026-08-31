---
name: publish-branch
description: 'Use when asked to commit and push to the currently checked-out branch, including the default branch. Don''t use for creating branches, opening PRs, force pushes, or pushing any branch other than the current one.'
disable-model-invocation: true
---

# Commit and push the current branch

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to commit and push to the branch currently checked out, including the default branch. |
| Authority | Human-only. Invoking on the checked-out branch (including `main`/`master`) is explicit authorization to push to that branch. Preview the push target and consequence before publishing. |
| Side effect | Creates local commits and pushes them to `origin/<current-branch>`. No branch creation, no branch switch, no force push, no PR. |
| Done | Current branch is committed and pushed, or detached/diverged/no-origin state is reported without unsafe recovery. |

## Inputs

- Working-tree status (`git status`) and diff against HEAD (`git diff HEAD`): required, gathered by the skill.
- Current branch (`git branch --show-current`): required, gathered by the skill; empty output means detached HEAD.
- Recent commit history (`git log --oneline -10`): required, gathered by the skill.
- Push-target divergence: required, gathered by the skill with `git rev-list --left-right --count origin/$(git branch --show-current)...HEAD 2>/dev/null || echo 'NO_REMOTE_BRANCH'` (left count = commits only on origin, right count = commits only on HEAD); `NO_REMOTE_BRANCH` means the branch has no counterpart on origin yet.
- Configured remotes (`git remote`): required, gathered by the skill.
- A commit message supplied by the user: optional; when absent it is derived from the diff and the repo conventions.

## Procedure

1. **Resolve branch state.** Run `git branch --show-current`. Done when: the stated outcome holds.
   - Detached HEAD (empty output): there is no branch ref to push. Report that this skill pushes only the checked-out branch and stop. Never create or switch a branch.
   - Any named branch: continue. The default branch is not special: invocation is consent to push from the current HEAD.

2. **Check for work** against the gathered status and divergence counts. Done when: the stated outcome holds.
   - Clean tree AND right-side count `0`: report "nothing to commit, already up to date" and stop.
   - Clean tree but commits ahead of the push target, or `NO_REMOTE_BRANCH`: skip to step 6.
   - Dirty tree: continue to step 3.
   - The push target is always `origin/<current-branch>`, regardless of any differently-configured upstream, because step 6 pushes there. `NO_REMOTE_BRANCH` also fires in detached HEAD, where the branch expansion is empty; the detached-HEAD bullet in step 1 runs first and stops, so keep these branches in this order.

3. **Determine commit message conventions.** Match repo style in this priority: project instructions in context > recent commits > seven-rule style (capitalized imperative subject, 50 chars target and 72 hard, no trailing period; blank line; body wrapped at 72 explaining what and why, not how; footers `Closes #N`, `See also: #N`, `BREAKING CHANGE: <what broke>`). In a repo that uses conventional commits, default to `fix:` over `feat:` when ambiguous: code added to remedy broken or missing behavior is `fix:`; `feat:` is for capabilities the user could not previously do. The user may override. Done when: the stated outcome holds.

4. **Group the changes into logical commits.** One concern per commit, where a concern is one reason the tree changed. Two changes belong in the same commit only when reverting one without the other leaves the tree broken (the revert test). Split by mechanism, not by file: where one file carries two mechanisms, write the filtered patch out of `git diff -- <file>`, keep only the hunks for one mechanism, and stage it with `git apply --cached <patch>`: the first real split is unverified and must be confirmed with the user before it is applied, because this headless form was not executed this session and `git add -p` needs a TTY the agent lacks. A lint, format, or whitespace sweep is its own commit, never folded into a behavior change. Order commits so each one leaves the tree building; a commit that only builds together with its successor is not atomic, so merge the two or re-cut the split. Done when: the stated outcome holds.

5. **Commit each group.** Run the repo-native verification gate (type-checker and/or linter, whichever the repo defines) once per commit group before staging that group; a failing group is not ready to commit; skip silently if neither is configured. Stage and commit each group in a single call, naming files explicitly: never `git add -A` or `git add .`, which can sweep in sensitive files (`.env`, credentials) or unrelated changes. After committing, run `git status` to verify success and record the commit hash(es) and subject line(s) for the final report. Use a heredoc to preserve message formatting: Done when: the stated outcome holds.

```bash
git add file1 file2 file3 && git commit -m "$(cat <<'EOF'
Add first-class subject line here

Optional body explaining why this change was made,
not just what changed.
EOF
)"
```

6. **Detect remote and push.** Run `git remote`. Done when: the stated outcome holds.
   - No `origin` remote (empty output, or other remotes present but none named `origin`): do not push, and do not add, invent, or guess a remote. Report "local-only, no remote — commits only" (or "no `origin` remote configured" if other remotes exist) and stop.
   - `origin` present: push with one unconditional form, always targeting `origin` even if the branch's configured upstream points elsewhere, setting upstream if missing:
     ```bash
     git push -u origin HEAD
     ```

## Failure and recovery
- **Detached HEAD:** No branch ref exists to push. Stop; report the state. Do not create a branch.
- **Verification gate failure for a group:** that group is not staged or committed. Groups already committed remain; the blocked result names the failed group and the gate output.
- **Unconfirmed or failed hunk split:** leave that group uncommitted and report it; never fall back to `git add -A` or `git add .` to force it through.
- **No `origin` remote:** Stop without pushing. Never add, invent, or guess a remote.
- **Push rejected (diverged remote branch):** Report the rejection with divergence counts from `git rev-list --left-right --count origin/<current-branch>...HEAD`. Leave resolution to the user. Never `--force`, `--force-with-lease`, or any force variant without explicit user authorization.
- **Partial result:** Groups already committed are real commits and remain; the blocked result names the uncommitted groups. If the commit succeeds but the push fails, the local commits remain; report both the committed state and the push failure; do not undo the commit.
- **Non-convergence:** A rejected push is reported as-is; this skill does not retry, rebase, or merge to resolve divergence. Never swallow a git error or claim done when `git status` does not confirm the commits.

## Output
The current branch carries one commit per logical concern, each proven by `git status` and reported with its hash and subject line, pushed to `origin/<current-branch>`; or a terminal state is reported: detached HEAD, nothing to do, no origin remote, or push rejected with divergence counts.

## Provenance

Origin: ODIN 1.x `commit-push-current` skill (`skills/commit-push-current/SKILL.md`). Revision: unpinned (current). License: project-owned. Adaptation: restated to the ODIN 2.0 contract format with the complete atomic-commit mechanism inlined (concern grouping, revert test, mechanism split via filtered patch and `git apply --cached` with first-split confirmation, sweep and build-order rules, native verification gate, named-file staging over `git add -A`, heredoc message preservation, post-commit status and hash proof), cross-skill pointers removed, and the human-only invocation gate and push-to-origin contract added.
