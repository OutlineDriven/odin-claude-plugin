# Git-branchless Command + Revset Reference

Inventory of every command, key flag, and revset selector used by this skill.
Baseline version: `git-branchless 0.9.0`. Features marked `[v0.11.0+]` are on
`main` but not yet in a tagged release as of this writing — confirm with
`git branchless --version` before relying on them.

Wiki source of truth: <https://github.com/arxanas/git-branchless/wiki>

---

## Section 1: Init / setup

| Command | Purpose | Notes |
|---------|---------|-------|
| `git branchless init` | Install hooks, set `advice.detachedHead false`, detect main branch. Idempotent. | Run once per repo. Required for any branchless command to function. |
| `git branchless init --uninstall` | Remove hooks for this repo. | Per-repo only; `cargo uninstall git-branchless` removes the binary. |
| `git branchless wrap -- <git-cmd>` | Group a Git command inside a single branchless transaction. | Useful for shell aliasing: `alias git='git-branchless wrap --'`. Improves `git undo` granularity. |
| `git branchless install-man-pages <path>` | Install man pages to a chosen directory. | Optional. |
| `git branchless repair` | Reconcile event log with on-disk Git state. | Run if smartlog shows phantom commits or refs. |

Detection signal — confirm branchless is initialized for the current repo:

```
test -d "$(git rev-parse --git-common-dir)/branchless" && git config --get branchless.core.mainBranch
```

`git rev-parse --git-common-dir` resolves to the main repo's git dir, which
correctly handles linked worktrees (where `.git` is a file pointing at the
common dir, not a directory itself). If both checks succeed, branchless is
active. If either fails, the skill yields to plain git.

---

## Section 2: Visualize / navigate

### `git sl` / `git smartlog [<revset>]`

Tree view of in-progress work. Renders draft commits, hidden ancestors, and branch tips.

| Glyph | Meaning |
|-------|---------|
| `◇` | Public commit (on main branch ancestry). |
| `◯` | Draft commit. |
| `✕` | Hidden commit. |

- Default revset: `((draft() | branches() | @) % main()) | branches() | @`
- Override: `git config branchless.smartlog.defaultRevset '<revset>'`
- Metadata config: `branchless.commitMetadata.{branches,differentialRevision,relativeTime}` (all default `true`).

### `git query <revset> [-r] [--branches]`

Programmatic revset evaluation.

- `-r` / `--raw` — emit one hash per line (topologically sorted, ancestors first). Use this for scripting.
- `--branches` — return branches attached to matched commits instead of commits.

### `git next [N]` / `git prev [N]`

Move HEAD forward / backward in the stack.

- `[N]` — number of commits to skip.
- `-i` / `--interactive` — choose between ambiguous targets.
- `-o` / `--oldest`, `-n` / `--newest` — disambiguate without prompting.
- `-a` / `--all` — jump to first/last commit in the stack.
- `-b` / `--branch` — navigate by branches instead of commits.

### `git switch -i [query]` / `git sw -i [query]`

Interactive commit selector (Skim-powered) for checking out arbitrary commits in the smartlog.

- `-i` is required (since v0.7.0); seed with optional substring.

---

## Section 3: Commit / edit

### `git record [OPTIONS]`

Replacement for `git add` + `git commit`. Captures unstaged changes by default.

- `-m, --message <msg>` — commit message (CLI).
- `-i, --interactive` — TUI for hunk selection.
- `-c, --create <name>` — create + checkout new branch and commit to it.
- `-d, --detach` — start a new stack on a detached HEAD.
- `-I, --insert` — insert commit between current HEAD and its children (rebases descendants).
- `--fixup <commit>` — record a `fixup!`-style commit pointing at `<commit>`.

### `git amend [--reparent]`

Amend HEAD's contents and auto-restack descendants. **Does not edit the message** — use `git reword` for that.

- `--reparent` (v0.7.0+) — amend without rebasing children; children keep their original tree state.

### `git reword [<commit>...] [-m <msg>]`

Edit commit messages without checking out.

- `git reword` (no args) — edit HEAD's message.
- `git reword <revset>` — edit one or many commits; supports `stack()` for batch.
- `-m '<msg>'` — replace message non-interactively.

---

## Section 4: Rebase / move

### `git move`

In-memory rebase of a subtree. The replacement for `git rebase -i` for stack edits.

| Flag | Meaning |
|------|---------|
| `-s <revset>` / `--source` | Move these commits + descendants. Mutually exclusive with `-b` / `-x`. Repeatable. |
| `-b <revset>` / `--base` | Move descendants of base. Default: `-b HEAD`. |
| `-x <revset>` / `--exact` | Move exactly these commits; reorganize unmoved descendants to nearest unmoved ancestor. Repeatable. |
| `-d <revset>` / `--dest` | Destination commit. Required. |
| `-I, --insert` | Insert moved commits between dest and its existing children. |
| `-F, --fixup` | Squash moved commits into destination. |
| `--in-memory` | Force in-memory rebase (no working-copy touch). Default for most cases. |
| `--on-disk` | Force on-disk rebase. Required for merge commits and some hook scenarios. |
| `-m, --merge` | Resolve merge conflicts interactively instead of aborting. |
| `--no-deduplicate-commits` | Do not skip commits whose contents already exist on the destination. |
| `-f, --force-rewrite` (alias `fr`) | Allow rewriting public commits. The flag name is `--force-rewrite`, not `--force`. |

Examples:

```
git move -s HEAD -d main -F            # Squash HEAD into main as fixup
git move -b 'stack()' -d origin/main   # Rebase entire stack onto updated main
git move -x abc123 -d HEAD~ -I         # Move one commit and insert before children
git move -d main --on-disk -m          # On-disk move with conflict resolution
```

Restriction: cannot create cycles (move a commit atop its own descendant).

### `git restack [<commit>...]`

Repair abandoned commits — descendants of rewritten parents that were never re-parented. In-memory by default.

- Default revset: `draft()` (all draft commits; no-op if nothing is abandoned).
- `--merge` — prompt for conflict resolution.
- Config: `branchless.restack.warnAbandoned` (default `true`); `branchless.restack.preserveTimestamps` (default `false`).

### `git split <commit> [--detach | --discard | --before]`  `[v0.11.0+]`

Extract changes from a commit interactively; auto-rebase descendants.

| Mode | Result |
|------|--------|
| (default) "insert after" | `A → B → C` becomes `A → B' → b → C`. Extracted hunks become a child. |
| `--detach` | `A → B → C` becomes `A → B' → C` and a sibling `B' → b`. |
| `--discard` | Extracted hunks are dropped. |
| `--before` | Extracted hunks become a parent: `A → b → B' → C`. |

Pre-`v0.11.0` workaround: `git move --in-memory` + `git reset --soft` + re-record.

### `git hide <revset>` / `git unhide <revset>`

Soft-delete commits from smartlog. Event log is preserved; `git undo` and `git unhide` recover them.

- `-r` / `--recursive` — apply to subtree.
- v0.9.0 default: `git hide` also deletes branches pointing at the hidden commit. Use `--no-delete-branches` to keep the branches.

---

## Section 5: Collaborate

### `git sync [<revset>]`

Rebase all local stacks onto the main branch via speculative in-memory merges. The canonical "stay current with main" command.

- `--pull` — fetch from remote first (mirrors `git pull`).
- `--merge` — resolve conflicts interactively for stacks that would otherwise be skipped.
- Behavior: stacks with conflicts are silently skipped unless `--merge` is passed; check the summary for skip lines.
- Without a revset, syncs all draft commits.

### `git submit [<revset>] [OPTIONS]`

Push a stack of branches to a remote forge.

- Default behavior: **force-pushes** all branches in the current stack that already exist on the remote. This rewrites remote history.
- `-c, --create` — push branches that do not yet exist on the remote. The branch must already exist locally (`git branch <name> <commit>`).
- `--forge phabricator` — Phabricator integration (well tested).
- `--forge github` — GitHub integration. **Marked experimental in v0.9.0**; landing/reordering a stack may lose PR ancestry. Prefer manual branch + push for GitHub today.
- `--dry-run`, `--jobs N` — preview / parallelism.

**Safety caveat — force-push:** `git submit` rewrites the remote history of every existing branch in the stack. Use only on branches no other collaborator is actively building on. On repos with branch protection that denies force-push, `git submit` will fail; in that case create the branch locally and use plain `git push` for non-shared work, or open a PR with normal commits and skip `git submit` entirely. Never combine `git submit` with `--no-verify` or with branches that are someone else's review checkout.

---

## Section 6: Test runner

### `git test run [<revset>] [OPTIONS]`

Run a shell command on each commit in a revset. The revset is the **positional**
argument (default: `"stack() | @"`); flags configure execution. Results are
cached by `(command, tree-id)`.

- `-x, --exec '<cmd>'` — command to run. (`-x` here is short for `--exec`, not a revset selector.)
- `-c, --command <name>` — pre-aliased command from config (`branchless.test.alias.<name>`).
- `-S, --search linear|reverse|binary` — search strategy when looking for the first failing commit.
- `-b, --bisect` — shorthand for `--search binary`.
- `-j, --jobs N` — parallel execution (`0` = autodetect).
- `-s, --strategy working-copy|worktree` — execution environment.
- `--no-cache` — skip cached results.
- `-i, --interactive`, `-v, --verbose`, `-vv` — manual / verbose modes.

Environment available to the command:

- `BRANCHLESS_TEST_COMMIT` — hash of the commit being tested.
- `BRANCHLESS_TEST_COMMAND` — the command string itself.

### `git test fix --exec '<cmd>'`

Run a formatter / linter and amend each commit with the result. v0.7.0+.

### `git test show -c '<cmd>' <revset>` / `git test clean <revset>`

Display or evict cached test outcomes.

---

## Section 7: Recovery (forward references)

Full treatment lives in `references/recovery.md`. Quick reference:

- `git undo` / `git undo -i` — revert any operation tracked by the event log.
- `git snapshot create` / `git snapshot restore` — working-copy snapshots.
- `git bug-report` — collect repo state for filing issues.

---

## Section 8: Revset language

Revsets are commit selectors. Names resolve via `git rev-parse` (so `.` is HEAD, branch names work, etc.). Used by `git sl`, `git query`, `git move`, `git sync`, `git hide`, `git submit`, `git test run`, and others.

### Built-in functions

| Function | Result |
|----------|--------|
| `all()` | All visible commits. |
| `none()` | Empty set. |
| `ancestors(x)` / `:x` / `::x` | x and all its ancestors. |
| `descendants(x)` / `x:` / `x::` | x and all its descendants. |
| `parents(x)`, `children(x)` | Immediate parents / children. |
| `roots(x)`, `heads(x)` | Boundary commits within x. |
| `branches([pattern])` | Commits with branches matching `pattern`. |
| `draft()` | Unpublished (non-main-ancestor) commits. |
| `public()` | Commits on the main branch ancestry. |
| `stack([x])` | Draft commits in the stack containing x (default: HEAD). |
| `main()` | The main-branch tip. |
| `merges()` | Merge commits. |
| `current(x)` | Latest version of any rewritten commits in x. |
| `siblings(x)` | Siblings of x. |
| `message(p)`, `paths.changed(p)`, `author.name(p)`, `author.email(p)`, `author.date(p)` | Filter by metadata. |
| `tests.passed([cmd])`, `tests.failed([cmd])`, `tests.fixable([cmd])` | Filter by `git test` results. |

### Operators

- Set: `\|` / `or` / `+` (union), `&` / `and` (intersection), `-` (difference), `%` (only — ancestors of left excluding ancestors of right).
- Range: `:`, `::` (Mercurial-style).

### Pattern types (for `branches()`, `message()`, `paths.changed()` etc.)

- `substring:foo` (default), `exact:foo`, `glob:foo/*`, `regex:foo.*`.
- Date-aware filters: `before:<date>`, `after:<date>` (absolute or relative).

### Aliases

Custom revsets via git config:

```
git config branchless.revsets.alias.grandChildren 'children(children($1))'
```

Then: `git query 'grandChildren(HEAD)'`.

### Practical examples

```
git sl 'stack()'                                     # Just my current stack
git query 'stack() & paths.changed(src/auth.rs)'     # Auth commits in stack
git move -x 'stack() & message("WIP")' -d HEAD~      # Pull WIP commits aside
git test run --exec 'cargo test' 'stack()'           # Test every commit
git submit 'draft() & branches()'                    # Push every named draft branch
```

---

## Section 9: Configuration

Frequently used keys. Set with `git config <key> <value>`.

| Key | Default | Effect |
|-----|---------|--------|
| `branchless.core.mainBranch` | (auto-detected) | Name of the main branch. |
| `branchless.smartlog.defaultRevset` | `((draft() \| branches() \| @) % main()) \| branches() \| @` | Revset used when `git sl` is called without args. |
| `branchless.commitMetadata.branches` | `true` | Show branch names in smartlog. |
| `branchless.commitMetadata.differentialRevision` | `true` | Show Phabricator `D12345` revision tags. |
| `branchless.commitMetadata.relativeTime` | `true` | Show `1d ago`-style timestamps. |
| `branchless.restack.preserveTimestamps` | `false` | Keep authored timestamps when restacking. |
| `branchless.restack.warnAbandoned` | `true` | Warn when a rewrite leaves abandoned descendants. |
| `branchless.undo.createSnapshots` | `true` | Auto-snapshot the working copy before destructive ops. |
| `branchless.navigation.autoSwitchBranches` | `false` | Auto-checkout the branch when switching to a commit with one. |
| `branchless.next.interactive` | `false` | `git next` always prompts for ambiguous targets. |

### Hooks installed by `git branchless init`

`post-applypatch`, `post-checkout`, `post-commit`, `post-merge`, `post-rewrite`, `pre-auto-gc`, `reference-transaction`. Inspect via `eza .git/hooks` if curious.

---

## Section 10: Cited wiki URLs

- Concepts: <https://github.com/arxanas/git-branchless/wiki/Concepts>
- Revsets: <https://github.com/arxanas/git-branchless/wiki/Reference:-Revsets>
- Configuration: <https://github.com/arxanas/git-branchless/wiki/Configuration>
- `git smartlog`: <https://github.com/arxanas/git-branchless/wiki/Command:-git-smartlog>
- `git move`: <https://github.com/arxanas/git-branchless/wiki/Command:-git-move>
- `git restack`: <https://github.com/arxanas/git-branchless/wiki/Command:-git-restack>
- `git sync`: <https://github.com/arxanas/git-branchless/wiki/Command:-git-sync>
- `git submit`: <https://github.com/arxanas/git-branchless/wiki/Command:-git-submit>
- `git split`: <https://github.com/arxanas/git-branchless/wiki/Command:-git-split>
- `git test`: <https://github.com/arxanas/git-branchless/wiki/Command:-git-test>
- `git undo`: <https://github.com/arxanas/git-branchless/wiki/Command:-git-undo>
- `git hide` / `git unhide`: <https://github.com/arxanas/git-branchless/wiki/Command:-git-hide,-git-unhide>
