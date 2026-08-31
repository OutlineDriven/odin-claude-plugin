# Fix root causes — procedure

The diagnosis procedure behind the anchor. For the guarded repair loop with retry budgets, use `strike-the-root`; this file governs finding and removing the cause.

1. Restate the defect as expected vs actual in one sentence. A request for new behavior is a feature change, not a defect — stop.
2. Reproduce before any edit: build the smallest failing command, test, or scripted step. A fix for a failure you never observed cannot be verified. Done when: the reproduction fails now.
3. Bound scope: state the suspected root cause and the files it touches, before mutating.
4. Trace the why-chain: ask why the failure happens, then verify each answer against the source. Continue until the chain reaches a decision in this project's source that can be changed, not another symptom. Stuck → instrument (logging or assertions at the divergence point), rerun the reproduction, read the actual error. Done when: the chain terminates at a changeable decision.
5. Reject symptom fixes: a nil/null check to stop a crash, a swallowed or broadened catch, a disabled assertion or test. A guard is legal only where the why-chain proves the guarded state invalid, at the boundary where that state enters. Paragraph test: if the change needs a long justification comment explaining why it does not address the real cause, the code is wrong — return to step 4.
6. Fix the pattern, not the instance: search the project for the shape the why-chain identified (call sites, copies, near-identical guards) and fix every instance. Done when: a re-search for the shape returns none.
7. Intermittent or post-restart failures → suspect state before code: code does not change between runs, state does. Check stale persistent state first (config, caches, lock files, serialized state). If clearing a state file restores normal behavior, the fix is source-side validation or handling of that state, not a manual clearing step.
8. Verify: the reproduction now passes, the targeted checks covering the touched code pass, the shape search is clean, and every diagnostic added in step 4 is removed.

## Failure classes

- Unreproducible: make no source change. Record the exact reproduction attempts and the evidence that would decide the why-chain; classify blocked. Never claim done without a passing reproduction.
- Why-chain exits the project (dependency, platform, environment, data): report the chain and the external cause; do not patch around it. Blocked unless the project owns the decision.
- Attempted fix fails verification: revert that attempt entirely, including its instrumentation; return to the why-chain. Never stack a new fix on a failed one.
- Repeated-shape instance unfixable (generated, vendored, owned elsewhere): done does not hold. Report the instances left, the reason, and the state — root cause fixed, shape removal incomplete.
- Never swallow an error to end the run; never report done while the reproduction fails or any instance of the shape remains.
