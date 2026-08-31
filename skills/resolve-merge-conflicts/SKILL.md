---
name: resolve-merge-conflicts
description: 'Use when a merge, rebase, cherry-pick, or stash pop stops on conflicts, inspect each conflicted file, apply human-authored resolutions, stage the resolutions, and confirm clean VCS state with targeted validation. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Resolve merge conflicts

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A merge, rebase, cherry-pick, or stash pop stops on conflicts: `git` exits with unmerged paths. |
| Authority | Reversible local writes: edits to conflicted files, `git add` of resolved hunks, optional targeted validation. Rollback path: `git merge --abort` before any commit. |
| Side effect | Edits conflicted files, stages resolutions, runs targeted validation. |
| Done | No unmerged paths, no conflict markers, targeted validation passes. |

## Inputs

Required:
- **Conflicted files**: listed by `git status` in the "Unmerged paths" state.

Optional:
- **Ancestor / theirs / yours**: accessible via `git show :1:<file>`, `git show :2:<file>`, `git show :3:<file>`.
- **Conflict markers**: `<<<<<<<`, `=======`, `>>>>>>>` delimit the three versions in each conflicted file.
- **Validation command**: any command the human specifies; defaults to `git diff --cached`.

## Procedure

1. **Detect conflict state.** Run `git status`. If no unmerged paths are reported, the trigger condition is not met. Stop.
2. **Enumerate conflicted files.** Parse the "Unmerged paths" section of `git status`. Collect the file list.
3. **For each conflicted file, present the three versions.**
   - Ancestor (stage 1): `git show :1:<file>`
   - Theirs  (stage 2): `git show :2:<file>`
   - Yours  (stage 3): `git show :3:<file>`
   - Show the current working-tree state with conflict markers present.
4. **Accept a human-authored resolution for each file.** Read the resolved content from the working tree after the human edits it.
5. **Stage the resolved file.** Run `git add <file>` to mark the conflict as resolved.
6. **Repeat steps 3–5 for every conflicted file.**
7. **Verify clean state.** Run `git status` and confirm zero unmerged paths and zero conflict markers in any file under version control.
8. **Run targeted validation.** Execute the human-specified validation command, or `git diff --cached` if none was given. If validation fails, report the failure and stop; do not commit.
9. **Confirm end state.** Report: number of files resolved, staging result, and validation outcome.

## Failure and recovery
| Failure class | Condition | Recovery |
|---|---|---|
| No conflict present | `git status` reports zero unmerged paths | Stop; trigger condition not met |
| File write failed | Edit to a conflicted file fails | Stop; do not stage; report failure |
| Validation failure | Validation command exits non-zero | Do not commit; report failure |
| Unresolved marker | Any `<<<<<<<` found after staging | Stop; report path |

**Partial-result rule:** If fewer than all conflicted files are resolved, the run is incomplete. Do not produce a commit or claim success. The human decides whether to abort the merge or continue resolving.

**Rollback:** `git merge --abort` restores the pre-conflict VCS state at any point before a commit is made.

## Output
A structured report:
- Resolved file list
- Staged file list
- Validation output or failure message
- Final `git status` summary

No artifact is committed. The human controls whether and when to complete the merge.

## Provenance

**Origin:** `warpdotdev/common-skills` — `.agents/skills/resolve-merge-conflicts/`
**Pinned revision:** `f589e224907eda566c13755529f59db563090d14`
**License:** MIT — "Copyright (c) 2026 Denver Technologies, Inc. Permissive: adaptation and redistribution permitted provided the copyright notice and permission notice are retained in copies or substantial portions. No copyleft obligations; mechanisms may be rewritten in ODIN style with attribution in the module provenance ledger."
**Adaptation:** Clean-room rewrite. The extraction support (conflict-context presentation) is incorporated as inline steps 3–5. The original `extract_conflict_context.py` script is not carried over. Attribution recorded in the module provenance ledger.
