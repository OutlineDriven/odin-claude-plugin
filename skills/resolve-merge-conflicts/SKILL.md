---
name: resolve-merge-conflicts
description: 'Use when a merge, rebase, cherry-pick, or stash pop stops on conflicts. Read both intents from primary sources, resolve every hunk, verify with scoped checks, and finish the integration. Don''t use for people-mediation conflicts — use culture-conflict-mediation.'
---

# Resolve merge conflicts

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A merge, rebase, cherry-pick, or stash pop stops on conflicts: `git` exits with unmerged paths. |
| Authority | Reversible local writes: edits to conflicted files, `git add` of resolved hunks, committing the integration to completion, scoped validation. No push, no tag, no force-push, no history rewrite. Rollback: `git merge --abort`, `git rebase --abort`, `git cherry-pick --abort`, or `git checkout -- <file>` before staging. |
| Side effect | Edits conflicted files, stages resolutions, regenerates lockfiles with package manager tooling, runs scoped checks, commits the merge/rebase/cherry-pick to completion. |
| Done | No unmerged paths, no conflict markers in any tracked file, scoped checks pass, integration is committed and complete. |

## Refusal

Not for people-mediation or team-interpersonal conflicts — use **culture-conflict-mediation**. Not for remote, credential, publish, deploy, or other irreversible changes.

## Inputs

The repository root and the set of conflicting files are supplied by the in-progress git state. `git status` and `git diff --name-only --diff-filter=U` are authoritative for the conflict list.

Optional context:
- **Ancestor / theirs / yours**: `git show :1:<file>`, `git show :2:<file>`, `git show :3:<file>`.
- **Validation command**: any command the human specifies; otherwise discover the project's own type checker, tests, and formatter.

## Procedure

1. **Detect the conflict state.** Run `git status`. Identify which integration is in progress — merge, rebase, cherry-pick, or stash pop — and enumerate the unmerged paths. If zero unmerged paths, the trigger condition is not met; stop.
   *Done when: the conflict-stop type is named and every unmerged path is listed.*

2. **Gather context for each conflicted file.** Read the three versions — ancestor (`:1:`), theirs (`:2:`), yours (`:3:`) — via `git show`. Use `read` with the `:conflicts` selector to enumerate marker blocks; fall back to ranged `read` calls for files the selector returns empty. Use `difft` for side-by-side comparison when either intent is unclear.
   *Done when: every conflicted file's three versions and conflict-marker blocks have been examined.*

3. **Read the primary sources for both sides.** Read the commit messages, pull requests, and original issues or tickets for both changes. State why each side exists in one sentence before editing any hunk.
   *Done when: each side's intent is stated and recorded.*

4. **Resolve each hunk.** Preserve both intents when they fit together. When they genuinely conflict, choose the side that matches the integration's stated goal and record the trade-off. Invent no new behaviour. Remove all conflict markers from each resolved file.
   *Done when: no conflict markers remain in any tracked file.*

5. **Regenerate lockfiles with tooling.** If a lockfile is among the conflicting files, regenerate it with the project package manager rather than hand-editing.
   *Done when: lockfiles are regenerated, or confirmed not among the conflicted set.*

6. **Stage resolved files.** Run `git add <file>` for each resolved file. Confirm `git status` shows zero unmerged paths.
   *Done when: no unmerged paths remain in `git status`.*

7. **Run scoped checks.** Discover the repository's own commands. Run the type checker, tests, and formatter in that order when they exist. Scope runs to the resolution; fix only failures introduced by the integration. If a pre-existing failure blocks progress, stop and report it without suppressing or working around it.
   *Done when: scoped checks pass, or pre-existing failures are reported without suppression.*

8. **Finish the integration.** Complete the in-progress operation:
   - **Merge**: commit the merge.
   - **Rebase**: `git rebase --continue` until every commit is replayed and no conflict remains.
   - **Cherry-pick**: `git cherry-pick --continue` (or commit, then continue if multiple commits remain).
   - **Stash pop**: the stash is applied after resolution; `git stash drop` if the stash entry was not auto-dropped.
   *Done when: `git status` shows no conflicts and the integration is complete.*

## Failure and recovery

| Failure class | Condition | Recovery |
|---|---|---|
| No conflict present | `git status` reports zero unmerged paths | Stop; trigger condition not met |
| Unresolvable hunk | Both sides are logically incompatible without introducing incorrect behaviour | Leave the file marked, do not stage it, report the hunk and the competing intent |
| Lockfile regeneration fails | Package manager cannot regenerate the lockfile | Do not hand-edit the lockfile; report the failure and leave it unresolved |
| Scoped check failure | A check introduced by the integration fails | Fix only integration-introduced failures; report pre-existing failures without suppression |
| Unresolved marker | Any `<<<<<<<` found after staging | Stop; report the path and line range |

**Partial-result rule:** If fewer than all conflicted files are resolved, the run is incomplete. Do not commit, do not claim success. Report every unresolved hunk by file and line range.

**Rollback (user-requested only):** `git merge --abort`, `git rebase --abort`, `git cherry-pick --abort` restore the pre-conflict VCS state at any point before a commit is made. `git checkout -- <file>` discards a staged-but-uncommitted resolution for a single file. A hard `git reset --hard` is never offered as a recovery path; it is the user's own action if they choose it.

## Output

A per-file report listing each resolved hunk, the chosen resolution, and any unresolved remainder; lockfile regeneration result; scoped-check outcome (pass or named failure); final `git status` summary.

## Provenance

**Origins (three merged skills):**
- `warpdotdev/common-skills` — `.agents/skills/resolve-merge-conflicts/`, revision `f589e224907eda566c13755529f59db563090d14`. License: MIT. Contribution: four conflict-stop types (merge, rebase, cherry-pick, stash pop), three-version context presentation (`:1:`/`:2:`/`:3:`).
- `cursor/plugins` — `cursor-team-kit/skills/fix-merge-conflicts/`, revision `68836ddaf5697224520f1847d90cdb90ca8babaa`. License: MIT. Contribution: lockfile regeneration with tooling, conflict-marker scan, scoped compile/lint/test validation.
- `odin-current` — `skills/resolving-merge-conflicts/SKILL.md`. License: project-owned. Contribution: primary-source intent reading, `difft` side-by-side, finish-the-integration contract (commit and continue rebase), partial-result rule.

**Adaptation:** Clean-room merge of three conflict-resolution skills into one. The three variants' depth knobs — primary-source reading, lockfile regeneration, marker scan, three-version presentation, scoped checks, finish-the-integration — become ordered procedure steps. The two absorbed skills' non-commit stance is subsumed by the finish-the-integration contract; no push, no tag, no force-push, no history rewrite is retained from all three.
