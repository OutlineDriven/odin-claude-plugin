# Git-branchless Recipes + Decision Rubric

Concrete command sequences for the workflows enforced by this skill. Each
recipe is verbatim — copy-paste, then adapt the placeholders. All examples
target `git-branchless 0.9.0` unless tagged `[v0.11.0+]`.

Wiki source of truth: <https://github.com/arxanas/git-branchless/wiki>

---

## Recipe 1: Start fresh work from main (detached HEAD)

```
git fetch origin
git switch --detach origin/main
# Edit files, then commit immediately. No branch yet.
git commit -m "feat: first checkpoint"
```

Why detached: branchless tracks the commit in the smartlog with no branch
overhead. The branch is created later only when the work is ready to publish.

If `branchless.undo.createSnapshots=true` (default), the working copy is
snapshotted before the switch, so `git undo` can recover it.

---

## Recipe 2: Insert a fixup mid-stack

You realize commit B (three commits down) needs a one-line correction.

```
# 1. Make the change at HEAD as a marked fixup commit.
git commit --fixup <hash-of-B>

# 2. Squash it into B in-memory.
git move -s HEAD -d <hash-of-B> --fixup
```

Descendants of B are auto-restacked. No interactive rebase needed. Faster
alternative when you don't know which commit to target: install `git-absorb`
and run `git absorb` — it heuristically routes hunks to ancestors.

---

## Recipe 3: Reorder two commits in a stack

```
# Move src and its descendants onto dest, leaving the rest.
git move -s <hash-of-src> -d <hash-of-dest>
```

In-memory by default. If conflicts surface, add `--merge` to resolve them
interactively, or `--on-disk` if you also need a working-copy checkout.

---

## Recipe 4: Split a too-large commit

`[v0.11.0+]`:

```
git split <hash-of-large-commit>
# Interactively select hunks; result becomes a child commit by default.
# Use --before to make extracted hunks the parent, --detach for siblings.
```

Pre-`v0.11.0` workaround:

```
git switch --detach <hash-of-large-commit>
git reset --soft HEAD~        # ← legitimate use: pre-commit, no committed history at risk
# Re-stage hunks selectively with `git add -p`, then record two commits.
git move -b <hash-of-large-commit> -d HEAD --in-memory
```

Note: `git reset --soft` is fine here because nothing has been committed yet
at this stage. The skill bans `git reset --hard` against committed history,
not `--soft` against staging.

---

## Recipe 5: Rebase entire stack onto updated main

Canonical:

```
git sync --pull
```

Fetches `origin/main`, then rebases every local stack in-memory. Stacks with
conflicts are skipped — read the summary line for any `skipped` entries.

To resolve skipped stacks:

```
git sync --pull --merge        # interactive resolution for all conflicts
# or, target one stack:
git move -b 'stack()' -d origin/main --merge
```

---

## Recipe 6: Recover from a bad operation

```
git undo -i
```

Browse repo states with arrow keys; press Enter to restore. Recovers
botched rebases, deleted branches, hidden commits, and amended commits.

What `git undo` cannot recover:

- Untracked files that were never committed and never snapshotted.
- The middle of an in-progress merge conflict — abort the merge first.

If `branchless.undo.createSnapshots=false` was set, working-copy state is
not preserved. Verify the config before relying on undo for uncommitted work.

---

## Recipe 7: Hide experimental commits

```
git hide <hash>             # single commit
git hide -r <root>          # subtree
```

In v0.9.0, branches pointing at the hidden commit are deleted by default.
Override:

```
git hide -r --no-delete-branches <root>
```

Reverse with `git unhide` (or `git undo` to roll back the whole hide
transaction).

Anti-pattern this replaces: `git branch -D` to discard work, or
`git reset --hard` to wipe local history. Both lose the event log.

---

## Recipe 8: Test every commit in a stack

The revset is a positional argument to `git test run`, not a flag.

```
git test run --exec 'cargo test' 'stack()'
```

Find the first failing commit fast:

```
git test run --exec 'cargo test' --search binary 'stack()'
```

Parallelize over CPUs:

```
git test run --exec 'cargo test' --jobs 0 'stack()'
```

Inspect cached results:

```
git test show -c 'cargo test' 'stack()'
```

Environment available to the command: `BRANCHLESS_TEST_COMMIT`,
`BRANCHLESS_TEST_COMMAND`.

---

## Recipe 9: Publish a stack

### Path A — manual branch + push (works on GitHub, no force-push)

```
git switch --detach <hash-of-tip>
git switch -c feature/my-stack
git push -u origin feature/my-stack
# Open PR via gh or web UI.
```

### Path B — `git submit` (Phabricator, or non-protected GitHub)

Pre-create the branch locally, then submit:

```
git branch feature/my-stack <hash-of-tip>
git config remote.pushDefault origin
git submit -c --forge phabricator
```

Notes:

- `git submit` **force-pushes** existing branches. On protected branches
  the push is denied; fall back to Path A.
- GitHub forge integration is experimental in v0.9.0; reordering a stack
  loses PR ancestry. Path A is safer for GitHub today.

---

## Recipe 10: Edit an old commit's contents (three approaches)

The wiki documents three patterns; pick by trade-off.

### Approach A — direct amend + restack

```
git switch --detach <hash-of-target>
# Edit files.
git amend
# Descendants auto-restack in-memory.
```

Cheapest. Children are temporarily abandoned during `amend`; `git amend`
reparents them automatically. Build artifacts may be invalidated.

### Approach B — fixup-then-squash

```
git switch --detach <hash-of-tip>
# Make the fix at the top of the stack.
git commit --fixup <hash-of-target>
git move -s HEAD -d <hash-of-target> --fixup
```

Lets you test the fix at HEAD before committing it into the older commit.
Two operations instead of one.

### Approach C — commute upward

```
git switch --detach <hash-of-tip>
git commit -m "tentative fix"
# Move the new commit immediately after its target, then convert to fixup:
git move -s HEAD -d <hash-after-target> --insert
git move -s <hash-of-tentative> -d <hash-of-target> --fixup
```

Preserves the working-copy state of intermediate commits — useful when
build artifacts are expensive and you want to keep the upper part of the
stack stable.

---

## Decision rubric

| Goal | Command sequence | Notes |
|------|------------------|-------|
| Add a fix to a buried commit | Recipe 2 (`git commit --fixup` + `git move --fixup`) | One operation. |
| Rename a function across N commits | `git reword <revset> -m '...'` for messages; `git amend` per-commit for content | Auto-restacks each time. |
| Reorder two commits | `git move -s <src> -d <dest>` | In-memory; add `--merge` if conflicts. |
| Squash two commits | `git move -s <child> -d <parent> --fixup` | No interactive editor needed. |
| Split one commit into two | Recipe 4 (`git split` `[v0.11.0+]` or workaround) | |
| Sync stack onto updated main | Recipe 5 (`git sync --pull`) | Read the skip summary. |
| Recover lost or wrong work | Recipe 6 (`git undo -i`) | Replaces reflog spelunking. |
| Discard a local-only experiment | Recipe 7 (`git hide -r`) | Soft delete; reversible. |
| Find which commit broke tests | `git test run --search binary --exec '<cmd>' 'stack()'` | Bisect via revset. |
| Publish stack as PRs | Recipe 9 Path A or B | Path A for protected branches. |
| Edit an old commit's contents | Recipe 10 (A, B, or C by trade-off) | A is default; C preserves intermediate trees. |
| Reflexive `git reset --hard <SHA>` urge against committed history | `git undo -i` instead | Event log preserves recoverability. |
| Reflexive `git rebase -i main` urge for stack edits | `git move`, `git move --fixup`, `git reword`, `git split` | Decompose by intent. |

---

## Source citations

- Divergent-development workflow: <https://github.com/arxanas/git-branchless/wiki/Workflow:-divergent-development>
- Editing old commits: <https://github.com/arxanas/git-branchless/wiki/Workflow:-Editing-an-old-commit's-contents>
- `git split` modes: <https://github.com/arxanas/git-branchless/wiki/Command:-git-split>
- `git submit` flags + caveats: <https://github.com/arxanas/git-branchless/wiki/Command:-git-submit>
- `git test` runner: <https://github.com/arxanas/git-branchless/wiki/Command:-git-test>
