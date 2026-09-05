# Git fallback

Use this fallback only when no native tool exists and the current checkout is not already isolated.

1. Run from the repo root: `cd "$(git rev-parse --show-toplevel)"`. Done when: the working directory is the repo root.
2. Choose a meaningful branch name from the work description. Pick a base branch (default: origin's default branch, else `main`). Done when: a branch name and base branch are selected.
3. Ensure `.worktrees/` is gitignored before creating anything: `git check-ignore -q .worktrees/` (with trailing slash). If not ignored, add `.worktrees/` to `.gitignore`. Done when: `.worktrees/` is gitignored.
4. Best-effort refresh the base branch: `git fetch origin <from-branch>`. Treat failure as non-fatal. Done when: the fetch attempted or skipped.
5. Create the worktree:
   - New work: `git worktree add -b <branch-name> .worktrees/<branch-name> origin/<from-branch>` (fall back to local `<from-branch>` if the origin ref is missing).
   - Isolate existing ref: for branch/tag, `git worktree add .worktrees/<slug> <target-ref>`. For PR: `git fetch origin pull/<n>/head:pr-<n>` then `git worktree add .worktrees/pr-<n> pr-<n>`. If the ref is already checked out elsewhere, follow the already-checked-out rule.
   Done when: the worktree directory exists under `.worktrees/` with the target ref checked out.
6. Switch into it: `cd .worktrees/<branch-name>`. Done when: the working directory is the new worktree.

If `git worktree add` fails with a sandbox or permission error, report the failure and ask the user for a blocking decision (work in current checkout vs stop). Only work in the current checkout on explicit confirmation.

# Other worktree operations

Use git directly:

```bash
git worktree list
git worktree remove .worktrees/<branch>
cd .worktrees/<branch>
cd "$(git rev-parse --show-toplevel)"
```

# Troubleshooting

If git reports "Worktree already exists", switch to it (`cd .worktrees/<branch>`) or remove it (`git worktree remove .worktrees/<branch>`) before recreating.

If git reports "Cannot remove worktree: it is the current worktree", `cd` out first, then remove.
