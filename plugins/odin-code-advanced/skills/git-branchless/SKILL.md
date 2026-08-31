---
name: git-branchless
description: 'Use when asked for multi-commit stack edits, rebases, fixups, or stacked-PR publishing with branchless git idioms and a publish gate. Not for plain-git workflows in repos without branchless; the skill stays inert there. Human-only.'
disable-model-invocation: true
---

# git-branchless

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Multi-commit work, stack edits, rebases, fixups, stacked-PR publishing, or mention of branchless, smartlog, git move, or git undo. |
| Authority | Human-only. Preview the target and consequence before publishing, remote bulk mutation, or any irreversible history change. Never `rebase -i`, `reset --hard`, or force flags. |
| Side effect | Local git-branchless commits, moves, and restacks; publish paths submit or push remote stack state. Silently inert when branchless is absent. |
| Done | Branchless idioms applied per the decision rubric with a publish gate, or an explicit not-initialized inert line. |

## Not for

- Plain-git workflows in repos without branchless; the skill stays inert and yields to plain git.
- Interactive rebase (`rebase -i`), `reset --hard`, or force flags; never use these.
- Suggesting `git branchless init` unless the user explicitly asks how to enable.

## Inputs

- A git repository (required).
- branchless initialization state (detected by the pre-flight gate, not supplied).
- The target commits or stack tip (required for edits and restacks).
- The publish target (required only for publish; main versus feature is decided by the publish gate).

## Procedure

1. Run the pre-flight gate to confirm branchless is initialized for the current repository, resolving the git-common-dir so linked worktrees are handled:

   ```
   test -d "$(git rev-parse --git-common-dir)/branchless" && git config --get branchless.core.mainBranch
   ```

   - Both checks succeed: skill is active. Acknowledge with one line: `git-branchless active: main=<value>`.
   - Either check fails: skill is silently inert. Emit one line: `git-branchless not initialized; skill inactive`. Yield to plain git. Do not suggest `git branchless init` unless the user explicitly asks how to enable. Stop.

   Done when: branchless initialization is confirmed or the inert line is emitted.

2. Classify the requested work into one operation class and apply its Always rule. Plain-git commands are fine when they fall outside the class.

   | Class | Always | Never |
   |---|---|---|
   | Stack edits (reorder, fixup, squash, split) | `git move`, `git move -F`, `git reword`, `git split`. | `git rebase -i` to drive stack edits. |
   | Base updates (rebase a stack onto fresh main) | `git sync --pull` (or `git move -b 'stack()' -d origin/main`). Read the skip summary. | `git pull --rebase` against a stack. |
   | Undoing committed history | `git undo -i`. | `git reset --hard <SHA>` against any commit already made. |
   | Discarding local work in progress | `git hide -r <tip>` (recoverable). | `git branch -D` or `git reset --hard` purely to wipe. |
   | Branch creation for ephemeral work | Detached HEAD until publish; commit immediately, branch later. | `git checkout -b feature/X` before the first commit exists. |
   | Publishing (feature stacks) | Name the tip, then `git submit -c @` (first publish) or `git submit @` (update). Stock `git push -u origin <feature>` only if submit is denied. | `git submit` targeting `main`/`master`/`release/*`. Writing `--force` / `--force-with-lease` in recipes. |
   | Publishing (gated main) | Only when the user requested main or HEAD is already on local `main`/`master`: `git sync --pull`, prove `@` descends from `origin/main`, then stock `git push -u origin main`. Detached: FF-only attach to local main first. | `git submit` for main. Blind `git switch -C main` / `git branch -f main`. Any force flag. |

   Legitimate plain-git edge cases that are not blocked: `git reset --soft HEAD~` against staging when nothing is committed yet; `git rebase --onto` for a one-off non-interactive upstream sync in a repo where branchless is not initialized (the skill is inert there anyway); `git checkout -b` when the work is genuinely about to be pushed.

   Done when: the work is classified into one operation class and the Always rule is applied.

3. Use the decision rubric to pick the concrete command sequence for the goal:

   | Goal | Command sequence |
   |---|---|
   | Insert a fixup mid-stack | `git commit --fixup <target>` then `git move -s HEAD -d <target> --fixup` |
   | Reorder commits | `git move -s <src> -d <dest>` |
   | Squash two commits | `git move -s <child> -d <parent> --fixup` |
   | Split a commit | `git split <commit>` |
   | Rebase stack onto main | `git sync --pull` |
   | Find first failing commit | `git test run --search binary --exec '<cmd>' 'stack()'` |
   | Recover lost work | `git undo -i` |
   | Discard a local experiment | `git hide -r <tip>` |
   | Publish feature stack | `git branch <name> @` then `git submit -c @` (update: `git submit @`) |
   | Land on main (gated) | `git sync --pull` + ancestor of `origin/main` + stock `git push -u origin main` |
   | Post-merge hygiene | `git sync --pull` then `git hide -r <merged-tips>`; optional `git gc` |

   Done when: the concrete command sequence is selected and executed.

4. Before any publish, run the publish gate:
   - Path M (main): only when the user requested main or HEAD is already on local `main`/`master`. Run `git sync --pull`, prove `@` descends from `origin/main`, then stock `git push -u origin main`. Never `git submit` for main. Never any force flag. If detached, FF-only attach to local main first.
   - Path F (feature): `git branch <name> @` then `git submit -c @` (first publish) or `git submit @` (update). Fall back to stock `git push -u origin <feature>` only if submit is denied. Never target `main`/`master`/`release/*`. Never write `--force` / `--force-with-lease`.
   Done when: the publish gate is run and the correct path is taken.

5. After `git amend`, `git reword`, `git move`, or `git split`, descendants are auto-restacked in-memory. Run `git restack` manually only when the smartlog warns about abandoned subtrees (`✕` ancestors). Done when: restack is handled and no abandoned subtrees remain.

6. After a land/merge, run `git sync --pull` then `git hide -r <merged-tips>`; optionally `git gc`. Done when: post-merge hygiene is complete.

7. Read the skip summary line after every `git sync` and `git move`. Speculative-merge skips are silent unless the line is read. Done when: the skip summary is read after every sync and move.

## Failure and recovery

- Not initialized: emit the inert line, make no mutation, yield to plain git. Do not suggest `git branchless init` unless asked.
- Version-gated flag rejected: fall back to the closest documented alternative and tell the user which feature was unavailable. Do not invent an unverified flag.
- **`git submit --forge github` unsuitable for general use** (upstream arxanas/git-branchless#1184): stack reordering can lose PR ancestry. Prefer the default forge `branch` with `git submit -c @` / `git submit @` for feature stacks; never submit main. Stock `git push -u` is the gated-main path and the submit-denied fallback.
- Event log is per-repository and per-clone: `git undo` cannot reach state from a different clone or machine. State this when recovery is requested across clones.
- Speculative-merge skips during  and :c` and `git move`**: silent unless the summary line is read. If a skip is missed, re-run and read the summary before assuming success.
- Never swallow an error or pretend the done predicate holds. If a command fails, report the exact failure and stop rather than widening scope.

## Output

Applied branchless command sequence and resulting smartlog state; or a publish result (feature stack submitted, or main pushed after the ancestry check); or the explicit inert line `git-branchless not initialized; skill inactive`.
