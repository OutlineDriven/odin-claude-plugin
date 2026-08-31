---
name: isolate-work-in-worktree
description: 'Use when a run needs its own branch and checkout to avoid collisions with concurrent work. Creates an isolated worktree, tracks a five-status lifecycle in a manifest, and removes only terminal worktrees. Not for feature-work isolation — use isolate-workspace-gate.'
---

# Isolate work in worktree

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A run needs its own branch and checkout so concurrent work cannot collide. |
| Authority | vcs-reversible-destructive. Destructive operations touch only VCS-recoverable state — git branches and git-registered worktrees. Show the exact branch-and-path set before any removal and treat git as the recovery path. Never pass `--force` to `git worktree remove`. The manifest, mutex, and worktree files under the gitignored `.loop-worktrees/` are local bookkeeping, not deliverables. |
| Side effect | Creates branch `loop/<runId>` plus worktree `.loop-worktrees/<runId>`, transitions its manifest status (active, rejected, escalated, merged, stale) via atomic manifest writes, and removes only terminal-status worktrees without `--force`; git refusals are surfaced instead of forced. |
| Done | Every worktree is registered in the manifest with a legal status, cleanup never sweeps an active worktree, and no removal used `--force`. |

## Inputs

- `runId` (required): unique identifier for the run, used verbatim as a path segment and branch suffix; it must be a single path segment (no `/`, not `.` or `..`).
- `pattern` (required at create): short label of the work pattern, kept on the manifest entry for audit.
- Base branch (optional, default `main`) and repo root (optional, default cwd; must be inside a git repository).
- Status for mark (required): exactly one of `active`, `rejected`, `escalated`, `merged`, `stale`.
- Cleanup set (optional): status CSV, default `rejected,escalated`, plus an age cutoff in the form `<n>` + `s|m|h|d` (for example `24h`).

## Procedure

1. Bind the root. Run `git rev-parse --is-inside-work-tree`; on failure stop without mutating. All state lives under `.loop-worktrees/`: the manifest at `.loop-worktrees/manifest.json` shaped exactly `{"version":1,"worktrees":[]}`, and the mutex at `.loop-worktrees/.manifest.mutex`. If the manifest exists in any other shape, stop — never rewrite a manifest that was not validated. Add `.loop-worktrees/` to `.gitignore` so worktree contents never enter the index.
2. Serialize manifest mutations with the mutex. Before each read-modify-write, create `.loop-worktrees/.manifest.mutex` with exclusive create; if it exists and its mtime is older than 30 seconds, remove it and retry; otherwise retry after a short backoff until a 30-second deadline, then fail naming the mutex path. Delete the mutex when the mutation ends, success or failure. Pure reads take no mutex.
3. Create. Refuse a `runId` that is not a single path segment. Under the mutex, read the manifest: if an entry with the same id has status `active`, refuse and name its existing path. Otherwise run `git worktree add -b loop/<runId> .loop-worktrees/<runId> <base>`, which creates the branch and checks it out in one step. Replace any prior entry with the same id and append `{"id":<runId>,"path":".loop-worktrees/<runId>","branch":"loop/<runId>","baseBranch":<base>,"pattern":<pattern>,"createdAt":<ISO-8601 UTC>,"status":"active"}`. Write the manifest atomically: write a temp file in the same directory, then rename it over `manifest.json`.
4. Mark outcomes; never delete entries to record them. Under the mutex: reject any status outside the five-value set; find the entry by id or fail naming the id; set its status; write the manifest atomically as in step 3. Marking preserves the audit trail; removal happens only in cleanup.
5. Clean up terminal worktrees. Under the mutex: select entries whose status is in the requested set — default `rejected` and `escalated`; `active` is never selected, so mark a finished run terminal first — and, when a cutoff is given, whose `createdAt` is older than now minus the cutoff. For each selected entry run `git worktree remove .loop-worktrees/<id>` without `--force`; a git refusal, typically uncommitted or untracked files, is recorded as skipped with its reason and the entry stays in the manifest. Rewrite the manifest without the removed ids, atomically.
6. Reconcile manifest and disk. List git worktrees with `git worktree list --porcelain` and compare paths under `.loop-worktrees/` against the manifest. Worktrees registered with git but missing from the manifest are orphans: report them, and remove one only on explicit instruction, still without `--force`. Drop manifest entries whose directory no longer exists with an atomic manifest write. Treat a missing path as absent, not an error, since `rm -rf`, a crash mid-cleanup, or a container wipe can leave git listing a prunable entry.

## Failure and recovery
- Not a git repository: stop before any mutation.
- Manifest in an unexpected shape: stop without rewriting; report the corrupt manifest as the blocked result.
- Mutex deadline (30 s): fail naming `.loop-worktrees/.manifest.mutex`; if no other process is running, a mutex older than 30 seconds is cleared by the stale rule on the next attempt.
- `runId` already active: create refuses; reuse the existing worktree or pick a new id — never double-create.
- Git refuses `git worktree add -b` because `loop/<runId>` already exists: surface the refusal, then use a new id or explicitly delete the leftover branch from a prior attempt with the same id.
- Unrecognized status: mark refuses before touching the manifest.
- Manifest write fails after `git worktree add` succeeded: roll back to the pre-call state with `git worktree remove .loop-worktrees/<runId>` then `git branch -D loop/<runId>` (the branch points at the base, so nothing unique is lost), then rethrow; if the worktree removal is refused, report the path as an orphan for reconciliation instead of forcing it.
- `cleanup` removes nothing on a freshly marked entry: the age cutoff is working; this is expected, not a silent failure.
- Partial-result rule: every manifest write is tmp-then-rename inside the mutex, so readers never see a torn file, and every worktree on disk is either registered or rolled back.
- Blocked result: report the removed, skipped, and orphan lists exactly as they are and stop; claim done only when the Done predicate holds.

## Output
- Create: the registered entry — report the worktree path, branch, and base branch.
- Mark: the entry id and its new status.
- Cleanup: `removed <path> (<status>)` and `skipped <path>: <git reason>` lines with counts.
- Reconcile: orphan paths and dropped entry ids.
- Reads: manifest rows `<status> <id> <branch> (<pattern>)`.
- Terminal classification: done only when every worktree is manifest-registered with a legal status, no active worktree was swept, and no removal used `--force`.
