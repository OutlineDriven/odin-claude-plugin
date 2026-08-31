---
name: resolving-merge-conflicts
description: 'Resolve an in-progress git merge or rebase conflict: read both intents from their primary sources, resolve every hunk, run the project checks, finish the merge. Use when a merge or rebase has stopped on conflicts and user is committed to finishing it. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Resolving merge conflicts

## Contract

| Field | Bound contract |
|---|---|
| Trigger | merge or rebase has stopped on conflicts and user is committed to finishing it |
| Authority | reversible-local: write only named local artifacts; state the rollback path |
| Side effect | stages resolved files, commits the merge/rebase to completion; no push, no history rewrite, no abort during procedure |
| Done | integration finished with every conflict resolved and project checks passing |

## Inputs

The repository root and the set of conflicting files are supplied by the in-progress git state. `git status` and `git diff --name-only --diff-filter=U` are authoritative for the conflict list.

## Procedure

1. **Read the current state.** Run `read` with the `:conflicts` selector on each conflicting file to enumerate unresolved blocks. If that selector returns nothing for a file that `git diff --name-only --diff-filter=U` reports as conflicting, use ranged `read` calls for that file. Use `difft` when a side-by-side comparison makes either intent clearer.

2. **Find the primary sources.** Read the commit messages, pull requests, and original issues or tickets for both changes. State why each side exists before editing any hunk.

3. **Resolve each hunk.** Preserve both intents when they fit together. When they genuinely conflict, choose the side that matches the integration's stated goal and record the trade-off. Invent no new behaviour.

4. **Run the project checks.** Discover the repository's own commands. Run its type checker, tests, and formatter in that order when they exist. Fix only failures introduced by the integration.

5. **Finish the merge or rebase.** Stage the resolved files and commit the merge. For a rebase, continue until every commit has been replayed and no conflict remains.

## Failure and recovery
- **Unresolvable conflict:** When a hunk cannot be resolved to either side without introducing incorrect behaviour, stop and report the specific hunk and the competing intent. Leave the repository in its conflicted state so the user can decide.
- **Project check failure:** Fix only failures introduced by the integration. If a pre-existing failure blocks progress, stop and report it without suppressing or working around it.
- **Partial-result rule:** If the procedure stops before all hunks are resolved, report every unresolved hunk by file and line range. Do not claim the merge is complete.
- **Rollback (explicit, user-requested only):** If the user asks to abandon the integration after work has started, offer `git merge --abort` (merge) or `git rebase --abort` (rebase) before any resolution is staged. These commands are safe only before the first `git add`. A hard `git reset --hard` discards all resolved hunks and must never be offered as a recovery path; it is the user's own action if they choose it.

## Output
The merge or rebase is complete, `git status` shows no remaining conflicts, and the integration is committed. A per-file report listing each resolved hunk, the chosen resolution, and any unresolved remainder.

## Provenance

Origin: odin-current (`skills/resolving-merge-conflicts/SKILL.md`). License: project-owned. Adaptation: distinct integration-completion contract (vs trial-merge abort). Module: odin-code (local git integration, common tier).
