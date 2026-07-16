   **Parallel Safety Check**: before dispatching a batch:

   1. Map files to units from each candidate unit's `Files:` section (Create/Modify/Test paths).
   2. **File overlap is necessary but not sufficient.** Also serialize units that contend on shared types/APIs/interfaces, DB migrations, generated artifacts, lockfiles, snapshots, shared config/schema, or environment singletons (one dev server/port, shared database, browser sessions, package installs, MCP rate limits).
   3. **No contention:** dispatch the batch in parallel.
   4. **Contention with harness-native isolation:** parallel is recoverable but not automatically safe: overlapping edits still need a real merge. Serialize contending units by default; run parallel-isolated only when the expected merge is trivial. Log predicted overlap.
   5. **Contention without isolation (shared workspace):** serialize. In a shared directory only the last writer survives.
   6. **Cap concurrency** at ~3-5 workers even when more units are independent.
   7. **Abort criteria:** if a batch produces broad unplanned edits, out-of-scope test failures, or repeated conflicts, stop parallelizing and finish the rest serially.

   **After a parallel batch**: the orchestrator integrates; never trust the handoff summary alone:
   1. Wait for every worker to finish.
   2. **Inspect the actual tree, not reported paths.** Determine what each worker really changed (`git status`/diff).
   3. **Detect real collisions**: 2+ workers that actually modified the same file. In a shared workspace only the last writer survived: commit the non-colliding work first, then re-run the colliding units serially. With harness-native isolation the collision surfaces as a merge conflict at integration.
   4. **Review, test, and commit each unit in dependency order.** Stage only that unit's files, commit with a message derived from its Goal, run relevant tests, and fix before the next.
   5. Update the task list.
   6. **Release the workers**: close/clean up each worker handle so it stops holding a concurrency slot or leaving orphans.
   7. Dispatch the next dependency layer.
