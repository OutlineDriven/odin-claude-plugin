---
name: git-workflow-and-versioning
description: 'Use when the user asks for release, version bump, changelog, or branch workflow beyond a single commit. Don''t use for single commits or for publishing to a package registry.'
disable-model-invocation: true
---

# Git workflow and versioning

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks for release, version bump, changelog, or branch workflow beyond a single commit. |
| Authority | Human-only. Require explicit human invocation. Preview the exact target and consequence before any commit, tag, changelog edit, push, protected-branch action, or force-push; require explicit consent for protected branches and force-pushes. |
| Side effect | Git commits, tags, and changelog edits; protected branches and force-pushes only with explicit consent. |
| Done | History expresses logical change-sets, tags and changelog match shipped contract changes, and no unauthorized protected-branch action occurred. |

## Inputs

Required: the change-set to release or version (working-tree state, staged changes, or committed history since the last tag); the target version bump type or an explicit version string; the branch to operate on.

Optional: changelog path, remote name, tag message, prerelease suffix.

## Procedure

1. Confirm the request names a release, version bump, changelog update, or branch workflow beyond a single commit. If it is a single commit, stop and defer to the caller.
2. Inspect the working tree and recent history with `git status`, `git log` since the last tag, and the current branch. Identify the logical change-sets to express.
3. Group changes into atomic commits so each commit is one logical change-set. Stage and commit each group with a message that states the change, not the diff.
4. Derive the version bump from the change-sets (major for breaking contract changes, minor for additive, patch for fixes), or use the explicit version the user supplied.
5. Update the changelog so each new entry matches a shipped contract change; date and version the new section.
6. Preview the exact commits, tag, and changelog diff to the user before any tag, push, or protected-branch action.
7. Create the version tag only after explicit human confirmation. Use an annotated tag carrying the version message.
8. For any push, protected-branch target, or force-push, state the target and consequence and require explicit consent before executing. Never force-push or push to a protected branch without it.
9. After mutation, verify `git log`, `git tag`, and the changelog reflect the intended state and confirm no unauthorized protected-branch action occurred.

## Failure and recovery
- Ambiguous change-set grouping: stop and ask the user to confirm the grouping before committing.
- Version bump conflict (user-supplied version disagrees with the derived bump): use the user-supplied version; record the disagreement in the changelog only if asked.
- Protected-branch or force-push requested without explicit consent: do not execute; report the blocked target and the consent required.
- Tag or changelog section already exists for the target version: stop and report the collision; do not overwrite without explicit consent.
- Partial result: if any step after the first commit fails, leave completed commits in place, report which steps remain, and do not push or tag until the full sequence is confirmed.
- Non-converged: report the exact blocked step, the current history state, and the remaining actions. Never claim the done predicate holds while commits, tags, and changelog are inconsistent.

## Output
A history of atomic commits, an annotated version tag, and a changelog section matching the shipped contract changes, plus a report listing the commits, the tag, the changelog diff, and confirmation that no unauthorized protected-branch action occurred; or a blocked or non-converged result naming the failing step.

## Provenance

Origin: addyosmani/agent-skills, paths skills/git-workflow-and-versioning/SKILL.md and commands/ship.toml. Pinned revision: d2c37ef6225dd8726cdd369a8030307f48592d26. License: MIT, Copyright (c) 2025 Addy Osmani; the copyright notice and MIT permission text are retained in derived distributions. Adaptation: rewritten as ODIN consent-gated release and versioning discipline; source mechanisms preserved are atomic-commit grouping, version-bump derivation from contract changes, changelog-to-contract matching, and consent-gated protected-branch and force-push actions.
