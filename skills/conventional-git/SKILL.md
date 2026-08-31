---
name: conventional-git
description: 'Use when a user asks to create branches/worktrees, make commits, or automate changelog generation. History is parseable and auto-generates changelogs, SemVer bumps, and issue closes. Not for commit-message-only drafting — use conventional-commit.'
---

# Conventional git

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to create branches/worktrees, make commits, or automate changelog generation. |
| Authority | Reversible local writes: branch refs, commit objects, and worktree directories under the local repository. Roll back by deleting the unpushed branch, resetting the ref, or `git worktree remove`. |
| Side effect | Writes commits, branches, and worktree directories in the local repository only. |
| Done | History is parseable and auto-generates changelogs, SemVer bumps, and issue closes. |

## Inputs

- The type of work (feature, fix, docs, refactor, etc.): required to choose the commit type.
- An issue or tracker number, when one exists: optional; prefixed into the branch name and referenced in the commit footer.
- The target platform (GitHub or GitLab): required only when closing issues cross-repo or cross-project.

## Procedure

1. Name the branch `<type>/[issue-]<description>`: lowercase, hyphens only, no special characters except `/`. Prefix the issue number when one exists (`feat/42-user-authentication`). Keep the description under 50 characters. Match the type to the work. Never include `worktree` in a branch name: worktrees are a local checkout mechanism that must not leak into the remote. Done when: the branch name is lowercase, hyphen-separated, typed, under 50 chars, and contains no `worktree`.

2. When creating a worktree, run `git worktree list` first and reuse an existing worktree if it already covers the same branch. Place worktrees under `.claude/worktrees/` and name the directory by replacing the branch `/` separator with `-` (`git worktree add .claude/worktrees/feat-user-authentication feat/user-authentication`). Keep each worktree scoped to a single branch. Remove the worktree once its branch is merged (`git worktree remove …` then `git worktree prune`). Done when: a single worktree exists for the branch under `.claude/worktrees/`, or an existing one is reused.

3. Write the commit subject as `<type>[optional scope]: <description>`. Use the type table to pick the type and its SemVer effect: `feat` (MINOR), `fix` (PATCH), `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert` (none). Keep the subject ≤ 72 characters, imperative mood, no capital letter, no trailing period. Separate any body with a blank line. Done when: the subject is ≤72 chars, imperative, lowercase, no trailing period, and typed with its SemVer effect.

4. Mark breaking changes with `!` after the type/scope or with a `BREAKING CHANGE:` footer so changelog tools detect the MAJOR bump; body-only descriptions are invisible to them. For `revert`, keep the `This reverts commit <hash>.` line that `git revert` generates. Never add a Claude signature, AI agent attribution, or `Co-authored-by` trailer for Claude or any AI agent. Done when: breaking changes are marked with `!` or a `BREAKING CHANGE:` footer, and no AI attribution trailer is present.

5. Close issues from the commit footer (preferred, it keeps the subject clean) using a case-insensitive keyword (`close(s/d)`, `fix(es/d)`, `resolve(s/d)`) followed by the reference. On GitHub: `Closes #42`, `Closes owner/repo#99`, or `Closes #42, closes #43`; triggers on merge to the default branch. On GitLab: `Resolves #101`, `Closes group/project#42`, or `Closes #101, closes #102`; triggers on merge to the default branch. Pair the keyword with the commit type (`fix:` closing a bug, `feat:` closing a feature). Done when: every issue to close is referenced in the footer with a platform-correct keyword.

6. When squash-merging a PR/MR, set the PR/MR title to conventional-commits format before squashing: the title becomes the single commit message and non-conforming titles break changelog generation silently. Done when: the PR/MR title is in conventional-commits format before the squash.

## Failure and recovery
- Non-conforming branch or commit name: do not create or amend it. Correct the name in place (rename the branch with `git branch -m`, or rewrite the unpushed commit) and re-check against the format before proceeding.
- Breaking change stated only in the body: add `!` or a `BREAKING CHANGE:` footer; do not rely on body text.
- Issue reference placed in the subject line: move it to the footer and re-verify the keyword and reference syntax for the target platform.
- Worktree already exists for the branch: reuse it; do not create a second worktree for the same branch.
- Stale worktree after merge: remove it with `git worktree remove` and `git worktree prune`; do not leave it for later.
- Any mutation that has already been pushed: stop and surface the pushed ref rather than force-rewriting shared history.

## Output
A local repository whose branch names, worktree directories, and commit messages follow Conventional Commits v1.0.0, so tooling can auto-generate changelogs, enforce SemVer bumps, and close referenced issues on merge to the default branch.

## Provenance

Origin: samber/cc-skills, revision f9953962e135235137628ea92d06ea085688031f, MIT. Clean-room adaptation of the conventional-git skill — Conventional Commits v1.0.0 branch, worktree, and commit conventions restated as an executable procedure.
