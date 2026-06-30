---
name: atomic-commit-and-push
description: Atomically commit current changes and publish them to the remote. Use when the user says "commit and push", "ship these changes", "atomic commit and push", or "publish my work".
---
# Atomic Commit and Push

## Phase 1 — Atomic commit
Review staged + unstaged changes. Group by mechanism/file boundary.
Create one commit per logical change. Run repo-native type-checker and linter before each commit.
Do NOT bundle unrelated changes.

## Phase 2 — Publish
Prefer `git submit` when git-branchless is installed and the forge is supported.
Fallback: pick a descriptive branch name, then `git push origin HEAD:refs/heads/<branch>`.
Set upstream only when the user explicitly wants tracking.
Never `--force` or `--force-with-lease` without explicit user authorization.
Never push directly to protected branches (e.g., `main`, `master`, `release/*`).
