---
name: conventional-commit
description: 'Use when the user asks to commit changes or draft a commit message. Creates a conventional commit with a clear, scoped, present-tense subject and proper issue references. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Conventional commit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to commit changes or draft a commit message. |
| Authority | Write only a local VCS commit on a non-default branch; recoverable with `git reset --soft HEAD~1` or `git commit --amend` before any push. Never push or force-push. |
| Side effect | Creates one conventional commit; limited to a single coherent, independently reviewable change. |
| Done | A committed change with a clear, scoped, present-tense message and proper issue references. |

## Inputs

- The working-tree change set to commit (staged or to be staged). Required.
- Issue references to link or close. Optional unless the change should close or link an issue.
- Type, scope, and breaking-change status. Optional; derive from the diff when not supplied.

## Procedure

1. Run `git branch --show-current`. If the branch is `main` or `master`, create a feature branch unless the user explicitly requested a direct commit. Re-check the branch and stop if it is still `main` or `master`.
2. Inspect the staged diff. Commit one coherent, independently reviewable change at a time. If the staged set spans multiple concerns, stop and report the concerns; do not commit a mixed set.
3. Choose the type from the allowed set: `feat`, `fix`, `ref`, `perf`, `docs`, `test`, `build`, `ci`, `chore`, `style`, `meta`, `license`, `revert`. Use `ref` for refactoring without behavior changes, `style` for formatting without logic changes, and `meta` for repository metadata.
4. Compose the subject in imperative, present tense; capitalize it, omit the trailing period, and keep it at 70 characters or fewer. Format it as `<type>(<scope>): <subject>`; the scope is optional. Add `!` before the `:` to mark a breaking change.
5. Add a body only when useful: explain what changed and why, including previous behavior or motivation when it helps. Keep every line under 100 characters.
6. Add footers as needed: `Fixes <issue>` to close an issue when merged, `Refs <issue>` to link an issue without closing it, and `BREAKING CHANGE: <impact>` for breaking changes.
7. Never include customer or organization names, user emails, support ticket contents, secrets, or PII. Describe the technical symptom instead.
8. Commit using separate `-m` arguments for paragraphs and footers. Never put literal `\n` sequences in the message or open an interactive editor.

## Failure and recovery
- Default-branch guard: if the branch is `main` or `master` after the attempted switch, stop without committing and report the branch name.
- Mixed concerns: if the staged changes span more than one coherent change, stop and report the concerns rather than committing a mixed set.
- Missing issue reference: if the change should close or link an issue and no reference is supplied, stop and ask; never invent an issue number.
- Rollback: before push the commit is reversible with `git reset --soft HEAD~1` or `git commit --amend`. Never swallow a commit failure or pretend the done predicate holds.

## Output
The created commit hash, the branch name committed on, and the final commit message (subject, body, and footers as applied).

## Provenance

Origin: getsentry/skills. Revision: c2f99a5b04b4cd992ec3022d7c2c3e23e938d241. License: Apache-2.0. Clean-room adaptation preserving the conventional commit-message format, default-branch guard, allowed-type semantics, footer conventions, and the separate-`-m` commit method.
