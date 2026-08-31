---
name: principle-make-operations-idempotent
description: 'Use when asked to design retryable commands and loops. Produces operations whose repeated execution converges to the same state as a single execution. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Principle: make operations idempotent

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Design retryable commands and loops. |
| Authority | Reversible local: write only named local artifacts; every mutation has an explicit rollback path. |
| Side effect | Adds idempotent semantics to the target operation or command sequence. |
| Done | Retries converge after partial runs — re-executing the operation from any intermediate state reaches the same terminal state as a single clean execution. |

## Inputs

1. **Operation definition** (required): the command, function, loop, or script whose execution semantics must be made idempotent.
2. **Target state** (required): the concrete end state the operation must reach regardless of how many times it runs.
3. **Current state snapshot** (optional): the pre-existing state before the operation runs, used to detect already-applied changes and skip redundant work.

## Procedure

1. **Bound scope.** Identify every side effect the operation performs: file writes, database mutations, network calls, state transitions, external process invocations. List them explicitly. Do not widen scope beyond the declared operation.
2. **Classify each side effect.** For each side effect, determine whether it is naturally idempotent (setting a key to a value), conditionally idempotent (insert-if-absent), or non-idempotent (append, increment, send-and-forget). Stop and report if a side effect cannot be made idempotent without changing the operation contract.
3. **Design the idempotent form.** For each side effect:
   - Naturally idempotent: leave unchanged.
   - Conditionally idempotent: add a precondition check — read current state, compare to target, skip if already applied.
   - Non-idempotent: replace with an idempotent equivalent — use upsert instead of insert, set-union instead of append, compare-and-swap instead of increment. If no equivalent exists, wrap in a guard that records completion and short-circuits on re-entry.
4. **Add convergence guards.** For each guarded side effect, ensure the guard reads state at execution time (not cached), so concurrent or interleaved retries see the true current state.
5. **Define rollback path.** For every write operation, specify the exact reversal: delete the file, revert the row, undo the state transition. The rollback must itself be idempotent.
6. **Verify convergence.** Confirm that executing the operation zero, one, two, or N times from any reachable intermediate state produces the same terminal state. If convergence fails, return to step 3 and redesign the failing side effect.

## Failure and recovery
| Failure class | Behavior |
|---|---|
| Non-idempotent side effect detected | Report the specific side effect and its classification. Do not proceed to convergence verification until every side effect has an idempotent form or is explicitly excluded with rationale. |
| External state prevents convergence | Report the external dependency and the state divergence. Do not suppress the check or widen scope to accommodate it. |
| Rollback itself is not idempotent | Redesign the rollback before declaring the operation idempotent. |
| Partial application on interruption | On re-entry, the convergence guard must detect the partial state and complete or skip as appropriate. Never leave a half-applied mutation without a guard that handles it on retry. |

Partial-result rule: if some side effects are idempotent and others are not, report the non-idempotent subset. Do not declare the operation idempotent until all side effects converge.

## Output
A set of idempotent operations with:
- Each side effect classified and guarded.
- Convergence verified across zero-to-N executions.
- Every write paired with an idempotent rollback path.
- A report of any side effects that could not be made idempotent, with rationale.

## Provenance

Origin: cursor/plugins, pstack/skills/principle-make-operations-idempotent/SKILL.md. Pinned revision: 68836ddaf5697224520f1847d90cdb90ca8babaa. License: MIT (pstack/LICENSE blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25; authored by Lauren Tan / poteto). Adaptation: clean-room rewrite preserving the reconciliation and convergent-cleanup mechanism from the source principle.
