---
name: autopilot
description: 'Supervise an approved delivery plan by delegating implementation to work and finalization to review-and-ship.'
disable-model-invocation: true
---

# Autopilot

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A human explicitly invokes `/autopilot` with a feature description and an approved execution plan. |
| Authority | The invocation authorizes the described campaign. Preview the exact target and consequence before credentials, paid actions, data-at-rest changes, publication, deployment, remote bulk mutation, or irreversible deletion. Continue only when the invocation covers that consequence. Pass authorized push and PR targets to `review-and-ship`; do not publish directly. |
| Operation | Supervise one delivery chain: delegate implementation, gate its result, delegate simplification and review, then delegate finalization. |
| Done | Return `DONE` only after the requested close-out state is observed. Otherwise return `BLOCKED` with a resumable handoff. |

## Inputs

Required: feature description, approved plan, repository, acceptance criteria, and close-out condition.

Optional: scope limits; assigned executor; target branch, remote, and PR destination; required checks; shipping instructions. Derive an omitted value only when repository evidence gives one safe, unique answer.

## Procedure

1. Parse the plan, scope, assignments, acceptance criteria, repository, required proof, shipping destination, and close-out condition. Reject contradictions and unavailable assigned executors.
2. Confirm that the human approved the plan. If not, stop before implementation and route to planning.
3. Inspect enough repository evidence to bind the plan to exact artifacts, behavior, verification, and remote targets. Keep the campaign inside the approved scope.
4. Preview each risky consequence. Stop when authority is absent or the target is ambiguous.
5. Delegate the bounded plan to `work` in **Orchestrated** mode. Include acceptance criteria, constraints, repository evidence, required verifier, and the required structured return. `work` owns implementation and local verification; autopilot does not reproduce those steps. Apply the gate state machine in `references/pipeline-gates.md`: a failing work verifier gets one `fix` pass and one recheck; a second failure halts the chain.
6. Delegate simplification to `simplify` on the completed diff. Gate: `simplify` exits `0`, `11`, or `12` with behavior preserved. Halt on exit `14` (new bloat) or `15` (mixed-concern).
7. Delegate review to `review` on the in-scope change. If critical or high findings remain, delegate one `fix` pass and re-review the changed files. Halt on residual critical or high findings.
8. Delegate finalization to `review-and-ship`. Pass the reviewed diff, explicit delegated shipping authority, branch, remote, PR destination, required checks, and shipping instructions. The finalizer owns checks, commits, publication classification, push, and PR creation or update; autopilot performs none of them.
9. Observe authorized close-out. Route any supported in-scope fix back through `work` in Orchestrated mode, repeat affected gates, and invoke `review-and-ship` for each authorized update. Do not merge, deploy, or publish elsewhere without matching authority.
10. Return the terminal classification and include the finalizer report. The gate and handoff formats in `references/pipeline-gates.md` are binding.

## Failure and recovery

Stop on a missing approved plan, contradictory input, unavailable executor, ambiguous target, absent authority, failed gate, non-converging review, rejected remote mutation, or incomplete close-out. Preserve successful in-scope work and observed remote state. Recover only mutations made by this run, using reversible repository or hosting operations; never discard unrelated work.

Return `BLOCKED` with the failed stage, exact reason, autofix result, partial artifacts, remote mutations, proof state, recovery state, and the single concrete requirement to resume. Never claim rollback, publication, or close-out without observing it.

## Output

Exactly one terminal result:

- `DONE`: delivered behavior, changed artifacts, verification evidence, branch and PR, the complete `review-and-ship` report, and observed close-out state.
- `BLOCKED`: failed stage, reason, partial result, remote state, proof and recovery status, and the next required action.
