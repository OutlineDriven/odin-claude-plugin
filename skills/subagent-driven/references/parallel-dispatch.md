# Parallel Dispatch

Tasks with no shared files and no ordering dependency can run as concurrent
workers. Document the independence argument before you do. Two tasks touching
one file are not independent. Respect the platform's active-subagent limit, queue
overflow, and treat spawn errors as backpressure (slow down, don't drop the task).

The per-task gate does not relax under parallelism; this is what separates the
skill from `parallel-launch`'s single end-of-run review. Every result is audited
on its own before it reaches the shared branch; concurrency only overlaps the
*implement* step, never the gate.

Git state is not parallel-safe in a single checkout, and this skill's audit runs
against committed ranges (`review-package BASE HEAD`), so the commit must exist
before the audit. Keep that ordering consistent under parallelism: give each
worker its own worktree (`git clone --shared` / the worktree skill) where it
commits in isolation, audit each worktree's `BASE..HEAD` independently, and
integrate into the main checkout only after that worker's audit clears.
Serialize the integration so one result lands at a time. Never let two workers
commit into one shared index or HEAD. No parallel primitive → run the same tasks
sequentially.

# Red Flags

- **Two workers editing one file concurrently.** Concurrent edits corrupt each other's diffs. Sequence shared-file tasks or give each a worktree.
