# Idempotent operations — procedure

The side-effect classification and convergence proof behind the anchor.

1. Bound scope: list every side effect the operation performs (file writes, database mutations, network calls, state transitions, external process invocations). Do not widen beyond the declared operation.
2. Classify each side effect:
   - Naturally idempotent (set a key to a value) → leave unchanged.
   - Conditionally idempotent (insert-if-absent) → add a precondition check: read current state, compare to target, skip if already applied.
   - Not idempotent (append, increment, send-and-forget) → replace with an idempotent equivalent: upsert not insert, set-union not append, compare-and-swap not increment. No equivalent → wrap in a completion guard that records done and short-circuits on re-entry.
3. Guards read state at execution time, never from cache, so concurrent or interleaved retries see the true current state. Done when: a re-entry after interruption detects the partial state and completes or skips.
4. Define a rollback path for every write; the rollback must itself be idempotent.
5. Convergence proof: executing the operation zero, one, two, or N times from any reachable intermediate state produces the same terminal state. Done when: convergence holds from an interrupted mid-state.

## Failure classes

- Side effect with no idempotent form and no exclusion rationale: stop before convergence verification. Report the side effect and its classification.
- External dependency diverges state: report the dependency and the divergence; do not suppress the check or widen scope to accommodate it.
- Rollback not idempotent: redesign the rollback before declaring the operation idempotent.
- Partial idempotency: report the non-idempotent subset; the operation is not declared idempotent until all side effects converge.
