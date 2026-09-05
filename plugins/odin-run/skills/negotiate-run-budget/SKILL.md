---
name: negotiate-run-budget
description: 'Use when a high-priority run reaches at least 90% of its budget and requests an extension. Never self-grants. Not for low-priority runs: let those exhaust silently.'
---

# Negotiate run budget

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A high-priority run reaches at least 90% of its budget and requests an extension. |
| Authority | Human-gated: asks the human budget owner for one bounded extension before continuing; every other write is reversible local, with version control as the rollback. |
| Side effect | One extension request output to the user; on decline the run enters WAITING_FOR_BUDGET report-only; never self-grants. |
| Done | Either one bounded extension is granted and recorded, or the run is report-only in WAITING_FOR_BUDGET; there is no silent continuation. |

## Inputs

Required:
- `run_id`: the identifier of the run requesting an extension.
- `budget_used_pct`: current budget consumption as a percentage (must be >= 90).
- `extension_request`: the absolute or percentage amount being requested.

Optional:
- `priority`: priority tier of the run, if present.

## Procedure

1. **Validate trigger conditions.** Confirm `budget_used_pct` >= 90. Confirm `extension_request` is a positive, bounded quantity (a percentage or absolute value, not unlimited or open-ended). If either condition is unmet, stop and issue no request. Done when: both conditions are confirmed or the run stops without issuing a request.
2. **Compose the extension request.** State `run_id`, current `budget_used_pct`, and requested `extension_request`. State the consequence: if granted, the run continues with the new budget ceiling; if declined, the run enters WAITING_FOR_BUDGET and does not continue silently. Do not add a second request, a deadline ultimatum, or an auto-escalation path. Done when: the request is composed with exactly the required fields and no escalation path.
3. **Await the human decision.** On grant: record the extension in the run state and allow continuation. On decline: record the decline and set the run to WAITING_FOR_BUDGET; do not continue the run. Done when: the decision is recorded and the run is either continuing with the new ceiling or stopped in WAITING_FOR_BUDGET.

## Failure and recovery

| Failure class | Result |
|---|---|
| Budget_used_pct < 90 | Stop. No request issued. |
| Unbounded extension_request | Stop. Do not request an unlimited extension. |
| User grants with no bounded amount recorded | Treated as decline. Run enters WAITING_FOR_BUDGET. |
| Request already issued for this run | Stop. Only one extension request per run is permitted. |

No rollback of a recorded decision. No silent continuation after decline.

## Output

On grant: run state updated with one bounded extension recorded; run continues. On decline: run marked WAITING_FOR_BUDGET in report-only mode; run does not continue. On invalid inputs or repeated request: no state change; no output beyond a brief internal stop notice.
