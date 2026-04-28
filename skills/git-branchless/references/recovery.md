# Recovery, Undo, and Safety Semantics

The recovery story is what makes branchless safe to use aggressively. Most
"history mistakes" reachable via plain Git are reversible here — provided
you reach for the right command.

Wiki source of truth: <https://github.com/arxanas/git-branchless/wiki>

---

## Section 1: Event log

Branchless tracks every reference-changing operation in a per-repository
event log stored under `.git/branchless/`. Each entry records the entire
repo state delta, not just a single ref move.

| Mechanism | What it tracks | Recovery surface |
|-----------|----------------|------------------|
| `git reflog` | One ref at a time (HEAD, branches). Lost when a branch is deleted. | Single-ref walk only. |
| `.git/branchless/` event log | Whole-repo state per transaction. Survives branch deletion. | `git undo`, `git unhide`, smartlog history. |

The event log is **local to the repository** — clones do not transfer it.
A fresh clone has no undo history for old commits.

Hidden commits are eligible for Git GC after the standard expiry, even
when tracked in the event log. Visible (non-hidden) commits are pinned
against GC by branchless's `pre-auto-gc` hook.

Source: <https://github.com/arxanas/git-branchless/wiki/Concepts>,
<https://github.com/arxanas/git-branchless/wiki/Advanced-topic:-garbage-collection>

---

## Section 2: `git undo`

| Form | Behavior |
|------|----------|
| `git undo` | Undo the most recent transaction after a confirmation prompt. |
| `git undo -i` / `--interactive` | Browse repo states with arrow keys; press Enter to restore. |
| `git undo -y` / `--yes` | Skip the confirmation. |

What `git undo` reverts:

- Commits, amends, rebases, merges.
- Reference-transactions: branch creates, deletes, moves.
- Hides and unhides.
- Switches and checkouts.

What `git undo` cannot revert:

- The middle of an in-progress merge — `git merge --abort` first, then undo.
- Untracked files that were never tracked and never snapshotted.
- Operations that happened in a different repository (the event log is local).

Snapshot interaction: `branchless.undo.createSnapshots` (default `true`)
captures the working copy and index before destructive ops, so an undo
can restore uncommitted edits. Disable only with reason.

Source: <https://github.com/arxanas/git-branchless/wiki/Command:-git-undo>

---

## Section 3: `git restack` and abandoned commits

An **abandoned commit** is a draft commit whose parent has been rewritten
(via `git amend`, `git reword`, or `git move`) without being moved onto
the new parent. The smartlog renders abandoned subtrees under a grayed-out
hidden (`✕`) marker.

`git restack` rebases all abandoned commits onto their rewritten parents.

| Form | Behavior |
|------|----------|
| `git restack` | Restack every abandoned commit (default revset: `draft()`). |
| `git restack <commit>` | Restack only the children of the named hidden commit. |
| `git restack --merge` | Resolve conflicts interactively instead of aborting. |

Most rewrite commands (`git amend`, `git reword`, `git move`, `git split`)
auto-restack their immediate descendants in-memory. `git restack` is the
manual fallback when:

- A rewrite happened on disk and aborted partway (conflicts, hooks).
- An older `git commit --amend` was used (which does not auto-restack).
- The smartlog warning suggested it explicitly.

Config: `branchless.restack.warnAbandoned` (default `true`) toggles the
warning; `branchless.restack.preserveTimestamps` (default `false`) keeps
authored timestamps when restacking.

Source: <https://github.com/arxanas/git-branchless/wiki/Command:-git-restack>

---

## Section 4: Speculative-merge semantics

`git sync` and `git move` (without `--merge`) probe for merge conflicts
**in-memory** before touching the working copy. When a conflict is found,
the operation:

1. Skips that subtree silently.
2. Continues with other subtrees that did not conflict.
3. Reports skipped subtrees in the summary line.

This is the subtle failure mode: a "successful" `git sync` may have skipped
half your stacks. **Always read the summary.** Re-run with `--merge` (or
`git move ... --merge`) to resolve interactively.

```
git sync --pull
# Look for: "Skipped commits: X conflict, Y conflict ..."
git sync --pull --merge      # or target one stack: git move -b 'stack()' -d origin/main --merge
```

Source: <https://github.com/arxanas/git-branchless/wiki/Command:-git-sync>

---

## Section 5: `git hide` / `git unhide`

Soft-delete commits without losing the event log. The opposite of
`git reset --hard` for "I want this to go away":

```
git hide <commit>                       # single
git hide -r <root>                      # subtree
git hide -r --no-delete-branches <root> # keep branch refs (v0.9.0 default deletes them)
```

Reverse:

```
git unhide <commit>     # restore from hidden state
git undo                # undo the entire hide transaction (alternative)
```

Hidden commits are subject to GC after the standard expiry. To keep one
indefinitely without showing it in smartlog, point a branch at it.

Source: <https://github.com/arxanas/git-branchless/wiki/Command:-git-hide,-git-unhide>

---

## Section 6: Working-copy snapshots

```
git snapshot create     # capture current working copy + index as a hidden commit
git snapshot restore    # restore from the most recent snapshot (interactive selection)
```

Branchless takes snapshots automatically before destructive ops when
`branchless.undo.createSnapshots=true` (default). Take one manually before
any operation outside the branchless command set whose effects you are
unsure about — it is cheap insurance.

---

## Section 7: `git bug-report`

```
git bug-report
```

Collects repo metadata, branchless config, recent event log entries, and
relevant Git version info into a paste-ready report. Use it when filing
issues against arxanas/git-branchless. Inspect before pasting — the
report can include local branch names and commit messages. It does not
include diffs or file contents by default.

---

## Section 8: Garbage-collection guarantees

Branchless installs a `pre-auto-gc` hook that prevents Git from collecting
**visible** commits even when no branch points at them. Hidden commits
remain subject to standard `gc.reflogExpire` policy.

Implications:

- A draft commit you have not branched is safe — it is visible in the
  smartlog and pinned by the hook.
- A commit you `git hide`-d will eventually GC; recover via `git undo` or
  `git unhide` before the expiry window passes.
- Cloning loses the event log; the new clone has only the latest commit
  graph reachable from refs.

Source: <https://github.com/arxanas/git-branchless/wiki/Advanced-topic:-garbage-collection>

---

## Section 9: Anti-pattern → recovery mapping

When the reflexive plain-Git command fits one of these shapes, reach for
the branchless equivalent instead.

| Reflexive plain-Git | Why it loses information | Branchless equivalent |
|---------------------|--------------------------|-----------------------|
| `git reset --hard <SHA>` against committed history | Discards commits without recording the state transition. | `git undo -i` — pick the prior state. |
| `git rebase --abort` mid-conflict, then redo | Loses the partial progress; often re-hits the same conflict. | Resolve in-place with `git move -m` (the `-m` flag is `--merge`), or restart with `git move -b HEAD -d <dest> -m`. The `-b HEAD` is the implicit default; making it explicit avoids surprises when other operations have shifted HEAD. |
| `git push --force` to fix history mistakes | Mixes "fix the mistake" with "publish" — easy to clobber other peoples' work. | `git undo` first to confirm clean local state, then plain `git push` (or `git submit` for forge-aware stacks). |
| `git branch -D feature` to discard work | Loses the ref and the reachability cue; the work is still in the event log but you have to walk `git undo -i` to find it. | `git hide -r <tip>` keeps the work explicitly recoverable via `git unhide`. |
| `git checkout .` / `git restore .` to wipe edits | Cannot be undone if no snapshot exists. | `git snapshot create` first; recover via `git snapshot restore` or `git undo`. |
| `git stash drop` after stashing too eagerly | Stash is unrecoverable past expiry. | Commit on a detached HEAD (the work is in the smartlog) and `git hide` if you want it out of the way. |
| `git commit --amend` on a buried commit | Abandons descendants silently in plain Git. | `git amend` (branchless command) auto-restacks descendants. |

---

## Section 10: Triage checklist when something has gone wrong

1. **Don't run anything destructive yet.** Stop and inspect.
2. `git sl` — look at the current smartlog. Is the work visible? Hidden? Abandoned?
3. `git undo -i` — browse recent repo states. Most "I lost X" recovers here.
4. If `git sl` shows abandoned subtrees (`✕` ancestors), run `git restack`.
5. If a `git sync` or `git move` reported skipped stacks, re-run with `--merge`.
6. If the smartlog is missing a commit you know existed, check `git reflog` —
   the event log can lag if the operation crashed.
7. Last resort: `git bug-report` and file an issue with the output.

Never combine recovery with `--force` or `--no-verify`. Recovery is about
re-establishing a known-good state, not bulldozing through.
