---
name: cybernetic-loop
description: 'Use when the caller supplies one falsifiable out-of-happy-path invariant and a finite patch budget. Restores it through bounded candidate patches or reverts the run and reports non-convergence. Not for normal feature delivery or universal retries.'
---

# Cybernetic loop

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Use only when the caller names one falsifiable invariant outside the prior happy path, such as reorganization, peer-to-peer behavior, or index recovery, together with one finite patch budget. Do not use this workflow for normal feature delivery or as a universal retry loop. |
| Authority | May apply only budgeted candidate patches within the bounded local working-tree scope recorded before mutation. A pre-run checkpoint must restore that scope byte-for-byte, including any pre-existing state; remote mutation is outside this authority. |
| Side effect | Mutates the working tree only through candidate patches applied after the checkpoint. Keep a candidate only when the full frozen check set shows that at least one failing check now passes and no previously passing check fails; otherwise revert that candidate. On non-convergence, revert every retained candidate to the checkpoint. |
| Done | Return exactly one terminal status: `already-holds` when the full frozen check set passes before mutation; `restored` when all frozen checks pass together in one run within budget; or `non-converged` after restoring the checkpoint and returning the run transcript. |

## Inputs

- Exactly one caller-supplied invariant stated so a check can falsify it. It must describe behavior outside the prior happy path.
- One caller-supplied finite positive-integer patch budget. Each attempted candidate patch consumes one unit whether kept or reverted.
- The repository working tree and its existing executable checks. No candidate patch or new evidence may be supplied as an assumed result.

Use only the literal run concepts `invariant`, `executable check set`, `patch budget`, `candidate patch`, `check result`, `checkpoint`, and `run transcript`; do not reinterpret the procedure through control-theory metaphors.

## Procedure

1. Validate that there is exactly one falsifiable invariant and that the patch budget is a finite positive integer. Reject normal feature work, a happy-path request, a universal retry request, or an invariant whose truth cannot be executed as a check. Done when: exactly one falsifiable invariant and a finite positive-integer budget are validated, or the run is rejected.
2. Derive the smallest working-tree scope that can restore the invariant. Record that scope; any required change outside it is scope widening and must stop the run. Done when: the smallest scope is derived and recorded.
3. Translate the invariant without weakening it into an executable check with explicit pass and fail results. Combine it with the repository's existing executable checks. Freeze and echo the complete check set, exact commands, pass criteria, bounded scope, and patch budget as the run contract; do not add, remove, weaken, or replace a check after this point. Done when: the frozen run contract is echoed with the complete check set, commands, criteria, scope, and budget.
4. Create a checkpoint that can restore every byte in the bounded scope to its pre-run state, including pre-existing edits. If an exact checkpoint cannot be made, stop before mutation as `non-converged` with an unavailable recovery mechanism. Done when: the checkpoint can restore every byte in the bounded scope, or the run stops as `non-converged`.
5. Run the full frozen check set before mutation and record every check result. If all checks pass in this one run, return `already-holds` without changing the working tree. Done when: all check results are recorded, or `already-holds` is returned.
6. While checks fail and budget remains, select one failing result and apply the smallest candidate patch within the bounded scope that could restore it. Spend one budget unit, run the full frozen check set, and record the patch and every result. Done when: one candidate patch is applied, budget is spent, and full check results are recorded.
7. Compare that run with the immediately preceding retained state. Keep the candidate only if at least one previously failing check passes and every previously passing check still passes. Otherwise revert the candidate exactly while retaining the spent budget unit. Done when: the candidate is kept or reverted with the decision and budget recorded.
8. After each full run, return `restored` only if every frozen check passes together. Otherwise stop as `non-converged` if the budget is exhausted, an equivalent failure repeats, check results oscillate between prior states, any frozen check becomes unavailable, or restoration requires scope widening. Done when: `restored` is returned or `non-converged` is declared with a named stop class.
9. For every `non-converged` stop, restore the whole bounded scope to the checkpoint before returning the complete run transcript. If restoration itself fails, report that recovery failure explicitly and do not claim a terminal success status. Done when: the bounded scope is restored to the checkpoint and the run transcript is returned, or recovery failure is reported.

## Failure and recovery
- `invalid-input`: stop before mutation when the invariant is not singular, falsifiable, or outside the prior happy path, or when the patch budget is not a finite positive integer.
- `unavailable-check`: a check that cannot be compiled or executed makes the run `non-converged`; restore the checkpoint if mutation occurred.
- `repeated-equivalent-failure`, `oscillation`, `budget-exhaustion`, and `scope-widening`: stop immediately as `non-converged` and restore the whole run to its checkpoint.
- `candidate-regression`: when a candidate fails to improve at least one failing check or causes any passing check to fail, revert that candidate; the attempt still consumes budget.
- `recovery-failure`: return the failed restoration operation and remaining working-tree delta explicitly. Never report `already-holds`, `restored`, or a clean `non-converged` rollback unless the corresponding state was observed.

No partial retained patch is an output of `non-converged`; its only valid working-tree state is the checkpoint state.

## Output
The frozen run contract and one terminal record: `already-holds` (pre-mutation check results, no patch attempted), `restored` (candidate patches, budget, check results, final passing run), or `non-converged` (stop class, all patches and results, budget consumed, checkpoint-restoration proof).
