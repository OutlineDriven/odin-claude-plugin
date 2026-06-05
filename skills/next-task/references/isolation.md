# next-task isolation — git-branchless detached HEAD

Work in detached HEAD. Branches are delivery artifacts created after gates pass. This keeps task work isolated from the user’s current branch and makes branchless event-log recovery the primary undo path.

## Invariants

1. Start implementation from detached HEAD.
2. Claim the task in `.outline/next-task/` before edits.
3. Validate every untrusted task field before using it in a path, ref, branch, or command argument.
4. Commit per concern while detached.
5. Create a branch only at publish/PR time.
6. Never force-push, delete remote branches, or rewrite remote history from this workflow.
7. Recover local mistakes with `git undo` / branchless event log before considering destructive git commands.

## Input validation

Derive:

- `TASK_ID`: tracker number or local queue id.
- `TITLE`: selected task title.
- `SLUG`: lowercase title slug plus id.
- `BASE`: explicit user base, remote default, or fallback.
- `BRANCH`: `next-task/<slug>` or project-conventional prefix.

Rules:

```text
TASK_ID: non-empty; `[A-Za-z0-9._-]+`; GitHub/GitLab numbers should be digits only.
SLUG: `[a-z0-9][a-z0-9-]{0,63}`; no leading/trailing dash after normalization.
BASE: non-empty; not leading `-`; no spaces; no `..`; only `[A-Za-z0-9._/-]`.
BRANCH: same as BASE plus required safe prefix; no `..`, spaces, `@{`, or leading `-`.
PATH: repository-relative or approved worktree path only; no absolute path from tracker text.
```

If validation fails, stop and ask. Do not sanitize into a surprising branch name and continue.

Slug recipe:

```text
lowercase title
replace every non `[a-z0-9]` run with `-`
trim leading/trailing `-`
truncate title slug to 48 chars
append `-<TASK_ID>` when id is available
validate final slug
```

## Base resolution

Preferred order:

1. Explicit `--base <branch-or-ref>` from the user.
2. Remote default branch:

```bash
git symbolic-ref --short refs/remotes/origin/HEAD
```

Strip `origin/` to get `<base>`.
3. `main` when `origin/main` exists.
4. Current `HEAD` only for local-only work and only after user acceptance.

Verify remote base:

```bash
git fetch --prune origin
git rev-parse --verify --quiet origin/<base>^{commit}
```

Record `base` and `baseSha` in `.outline/next-task/flow.json`.

## Dirty-state gate

Before detaching:

```bash
git status --porcelain
```

If non-empty, stop. Recommended choices:

- commit the unrelated work;
- move unrelated work to another worktree;
- use the worktree fallback below;
- cancel.

Do not auto-stash user changes. Hidden stashes make task provenance and rollback ambiguous.

## Primary setup: detached HEAD in current checkout

Use when the current checkout is clean and the user accepts that the active directory will move to the task base.

```bash
git fetch --prune origin
git checkout --detach origin/<base>
```

If remote base is unavailable but local-only was approved:

```bash
git checkout --detach HEAD
```

Then write state:

```json
{
  "version": 1,
  "status": "exploring",
  "phase": "explore",
  "task": { "id": "", "source": "", "title": "" },
  "git": {
    "mode": "detached-head",
    "base": "main",
    "baseSha": "<sha>",
    "startSha": "<sha>",
    "headSha": "<sha>",
    "publishBranch": "next-task/<slug>",
    "path": "."
  },
  "updatedAt": "ISO-8601"
}
```

Claim record:

```json
{
  "version": 1,
  "tasks": [
    {
      "id": "",
      "source": "github|gitlab|markdown|queue",
      "title": "",
      "slug": "",
      "status": "claimed",
      "path": ".",
      "base": "main",
      "baseSha": "",
      "publishBranch": "next-task/<slug>",
      "claimedAt": "ISO-8601",
      "lastActivityAt": "ISO-8601"
    }
  ]
}
```

State is bookkeeping. Git commits are the source of truth.

## Worktree fallback

Use only when the current checkout has user changes, multiple task runs need separate directories, or the user explicitly asks for a physical isolated workspace.

1. Confirm the worktree parent is ignored or outside the repo. Do not create unignored workspace noise.
2. Create detached worktree:

```bash
git fetch --prune origin
git worktree add --detach ../worktrees/<slug> origin/<base>
```

3. Run all later commands with that worktree as the working directory.
4. Use the same `.outline/next-task/flow.json` shape with:

```json
{ "git": { "mode": "worktree-detached-head", "path": "../worktrees/<slug>" } }
```

5. Publish from that detached tip exactly like the primary path.

If `git worktree add` fails, remove only the partial path it created and stop. Do not delete existing worktrees.

## Commit discipline while detached

After each coherent concern:

```bash
git status --porcelain
git add <paths>
git commit -m "<type>: <short task concern>"
```

Commit groups:

- implementation behavior;
- tests;
- docs/config;
- deterministic cleanup gate;
- review fixes.

If a later fix belongs with an earlier commit, prefer branchless stack repair before publishing:

```bash
git undo -i
```

or create a fixup commit and reorder/squash locally with branchless tooling. Do not rewrite after pushing.

Update `flow.json.git.headSha` and `lastActivityAt` after every commit.

Detached HEAD note: `git branch --show-current` is expected to be empty. Use `git rev-parse --short HEAD` and `git status --short --branch` for state.

## Publish branch

Run only after all gates pass and the user selects publish/PR.

```bash
git status --porcelain
git branch <branch> HEAD
git push -u origin <branch>
```

If remote branch exists:

1. Do **not** force-push.
2. If it is not yours, choose a new suffix: `<branch>-2`, `<branch>-<shortsha>`.
3. If it is yours and you need to update it, prefer a new commit on top. If history must be rewritten, stop and ask; this workflow still does not force-push.

Record `publishBranch`, push result, and remote URL in `flow.json`.

## Optional PR

Only after branch push succeeds and the user selected PR:

```bash
gh pr create --base <base> --head <branch> --title "<task title>" --body "<summary and gate evidence>"
```

If `gh` is unauthenticated or permissions are missing, keep the pushed branch and mark the PR step blocked with the exact error and retry command. Branch publication still stands.

## No-force-push rule

Forbidden in this workflow:

```text
git push --force
git push --force-with-lease
git push +<src>:<dst>
git push origin :<branch>
git branch -D <published-branch>
git reset --hard origin/<published-branch>  # as a publish fix
```

Local history repair is allowed before first push. After push, recover with new commits or a new branch unless the user explicitly takes over remote history management outside this workflow.

## Recovery: branchless event log first

Use when a commit, amend, move, split, or accidental checkout went wrong before publish.

1. Inspect current state:

```bash
git status --short --branch
git rev-parse --short HEAD
```

2. Use branchless recovery:

```bash
git undo
git undo -i
```

Interactive undo lets you select the event to reverse. Prefer it to `reset --hard` because it preserves a recoverable event trail.

3. If you lost the stack shape, inspect smartlog if available:

```bash
git smartlog
git sl
```

4. After recovery, update `flow.json`:

```json
{ "git": { "headSha": "observed HEAD", "recoveredWith": "git undo -i" } }
```

5. Rerun the relevant gate or verifier that was in progress.

## Abort and cleanup

Abort is a user decision, not an automatic reaction to one failed gate.

Detached current-checkout abort:

1. Preserve useful commits by branch if the user wants them:

```bash
git branch abandoned/<slug> HEAD
```

2. Return to the prior branch or base only after user choice.
3. Mark task `aborted` or `released` in `.outline/next-task/flow.json`.

Worktree fallback abort:

```bash
git worktree remove ../worktrees/<slug>
git worktree prune
```

Only remove the worktree created for this task. Never delete unrelated worktrees or remote branches.

## Final checklist

Before leaving isolation:

- `flow.json` has task, base, baseSha, headSha, and publishBranch.
- `current.md` contains the selected task verbatim.
- Working state is detached until publish.
- Every commit belongs to one concern.
- No remote action occurred before the final decision.
- No force-push or remote deletion occurred.
- Recovery actions, if any, are recorded.