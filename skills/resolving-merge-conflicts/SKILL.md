---
name: resolving-merge-conflicts
description: 'Resolve an in-progress git merge or rebase conflict: read both intents from their primary sources, resolve every hunk, run the project checks, finish the merge. Use when a merge or rebase has stopped on conflicts.'
---

# Resolving merge conflicts

Use this skill when the user has committed to finishing an in-progress merge or rebase. Trial-merge skills may abort uncertain integration attempts. This skill owns the chosen integration, so preserve the work and resolve every conflict.

1. **See the current state.** Read the history. Run `read` with the `:conflicts` selector on each conflicting file to enumerate unresolved blocks. If that selector returns nothing for a known conflict, use `git diff --name-only --diff-filter=U` for the file list, then ranged `read` calls for each file. Use `difft` when a side-by-side comparison makes either intent clearer.

2. **Find the primary sources.** Read the commit messages, pull requests, and original issues or tickets for both changes. State why each side exists before editing the hunk.

3. **Resolve each hunk.** Preserve both intents when they fit together. When they conflict, choose the side that matches the merge's stated goal and record the trade-off. Invent no new behaviour. Finish the integration; never use `git merge --abort` or `git rebase --abort` in this workflow.

4. **Run the project checks.** Discover the repository's own commands. Run its type checker, tests, and formatter in that order when they exist. Fix only failures introduced by the integration.

5. **Finish the merge or rebase.** Stage the resolved files and commit the merge. For a rebase, continue until every commit has been replayed and no conflict remains.
