# Step 2: Git fallback

Only when there is no native tool and Step 0 found no existing isolation.

1. Run from the repo root: `cd "$(git rev-parse --show-toplevel)"`.
2. Choose a meaningful branch name from the work description. Pick a base branch (default: origin's default branch, else `main`).
3. Ensure `.worktrees/` is gitignored before creating anything: `git check-ignore -q .worktrees/` (with trailing slash). If not ignored, add `.worktrees/` to `.gitignore`.
4. Best-effort refresh the base branch: `git fetch origin <from-branch>`. Non-fatal.
5. Create the worktree:
   - New work: `git worktree add -b <branch-name> .worktrees/<branch-name> origin/<from-branch>` (fall back to local `<from-branch>` if origin ref missing).
   - Isolate existing ref: for branch/tag, `git worktree add .worktrees/<slug> <target-ref>`. For PR: `git fetch origin pull/<n>/head:pr-<n>` then `git worktree add .worktrees/pr-<n> pr-<n>`. If the ref is already checked out elsewhere, follow the already-checked-out rule.
6. Switch into it: `cd .worktrees/<branch-name>`.

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

**"Worktree already exists"**: switch to it (`cd .worktrees/<branch>`) or remove it (`git worktree remove .worktrees/<branch>`) before recreating.

**"Cannot remove worktree: it is the current worktree"**: `cd` out first, then remove.
