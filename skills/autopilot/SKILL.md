---
name: autopilot
description: 'Use when a human invokes /autopilot to deliver a feature from plan through shipped PR. Don''t use for tasks outside the described feature or without explicit invocation.'
disable-model-invocation: true
---

# Autopilot

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A human explicitly invokes `/autopilot` with a feature description and may assign planning or implementation to a named model or harness. |
| Authority | Treat the invocation as authority to execute the stated delivery campaign, including delegated work and remote publication; before using credentials, incurring cost, changing data at rest, publishing, deploying, mutating remote state in bulk, or irreversibly deleting anything, preview the exact target and consequence, and stop if the invocation does not authorize them. |
| Side effect | Plan, implement, simplify, review, test, and ship only the described feature; delegated PR babysitting may push commits or open and maintain its PR without pausing between authorized stages. |
| Done | Emit `DONE` only after implementation, review findings, required checks, publication, and PR close-out are complete; otherwise stop with `BLOCKED` and the reason. |

## Inputs

Required: the feature description, the repository or workspace containing the work, and an explicit `/autopilot` invocation from the human.

Optional: acceptance criteria; scope limits; target branch, remote, and PR destination; required checks; shipping instructions; and a named model or harness for planning or implementation. When an optional value is absent, derive it only from repository evidence and the feature description; if a safe, unique target cannot be established, stop blocked rather than guess.

## Procedure

1. Parse the feature description, acceptance criteria, assignments, scope limits, repository, branch, remote, PR destination, required checks, and shipping instructions. Reject contradictory instructions or an unavailable assigned executor.
2. Inspect the relevant repository evidence and establish the exact files, behavior, validation, remote target, and close-out conditions in scope. Do not widen the campaign beyond the requested feature.
3. Before any credential use, paid action, data-at-rest change, publication, deployment, remote bulk mutation, or irreversible deletion, present the exact target and consequence. Continue only when that action is covered by the explicit invocation and supplied shipping instructions; otherwise emit `BLOCKED` before performing it.
4. Produce an executable plan that maps each acceptance criterion to implementation work and proof. If planning was assigned, send the bounded feature, evidence, constraints, and required return shape to that executor, then validate its result against the same scope.
5. Implement the plan in dependency order. If implementation was assigned, delegate only the bounded work and require the executor to return changed artifacts, observed results, and unresolved failures; inspect those results before integration.
6. Simplify the completed implementation without changing its required behavior: remove redundant code and obsolete paths introduced or exposed by the change, while retaining every acceptance criterion.
7. Review the full in-scope change for correctness, security, maintainability, scope compliance, and missing acceptance criteria. Apply supported findings and repeat simplification and review when a fix materially changes the reviewed behavior. Stop blocked on contradictory findings, repeated equivalent failure, or evidence that resolution requires scope widening.
8. Run the repository checks and direct scenarios required to prove the changed behavior. Record the exact commands or scenarios and their observed results; never infer a pass from unrun or unavailable checks.
9. Ship only after the implementation and required proof pass. Push the authorized commits and open or update the PR at the previewed destination, then delegate PR babysitting with the exact repository, branch, PR, acceptance criteria, and authority boundary.
10. Babysit the PR through authorized close-out: monitor checks and review feedback, apply supported in-scope fixes, rerun affected proof, and push updates. Do not merge, deploy, publish elsewhere, or perform another remote mutation unless the invocation and shipping instructions authorize that consequence.
11. Emit `DONE` only when the requested shipping state and PR close-out conditions are observed. Include the resulting branch or PR, delivered behavior, and verification evidence.

## Failure and recovery
Classify invalid or contradictory input, unavailable assigned execution, ambiguous mutation target, missing authority, implementation failure, failed or unavailable proof, non-converging review, rejected remote mutation, and incomplete PR close-out as blocking failures.

Before remote mutation, leave remote state unchanged on failure. After a partial local or remote result, preserve successful in-scope work, report every observed state transition, and use repository version history or the hosting service's reversible operations to recover only changes made by this run; never discard unrelated work or claim rollback without observing it.

Return `BLOCKED` with the failed stage, exact reason, completed artifacts and remote actions, failed or unavailable checks, recovery state, and the smallest concrete requirement for continuation. Never emit `DONE` for a partial result, swallowed error, guessed target, or unverified close-out.

## Output
Return exactly one terminal classification:

- `DONE` — delivered behavior, changed artifacts, verification commands or scenarios with observed results, branch and PR destination, delegated babysitting outcome, and observed close-out state.
- `BLOCKED` — failed stage, reason, partial results, remote mutations already made, proof status, recovery status, and the concrete requirement to resume.

## Provenance

Clean-room adaptation of the end-to-end delivery and delegated PR-operation mechanisms from EveryInc's `compound-engineering-plugin`, path `skills/lfg/SKILL.md`, pinned at revision `a1f601f17137f648be439965f8fdd9123303de5d`. Source license: MIT, Copyright (c) 2025 Every; attribution is preserved in the project provenance ledger, and no third-party expression is copied here.
