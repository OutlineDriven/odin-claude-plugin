---
name: enforce-workflow-constraints
description: 'Use when any bounded workflow starts or reaches an action, path, proposal, or merge boundary. Loads constraints before the first action, re-evaluates them at every boundary, and refuses rather than default-allow on an unreadable constraint set. Don''t use for tasks that require source or remote-system changes.'
---

# Enforce workflow constraints

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Any bounded workflow starts, or reaches an action, path, proposal, or merge boundary |
| Authority | Read-only; no file, VCS, credential, paid, published, deployed, or remote mutation. Permits, narrows, or refuses the pending action in chat output and records the refusal reason; never proceeds on an unread constraint set |
| Side effect | Chat output only; permits, narrows, or refuses the pending action and records the refusal reason. Never mutates files, state, or remote targets |
| Done | Constraints were loaded before the first action and re-evaluated at every boundary; an unreadable constraint set produced refusal, not default-allow |

## Inputs

- The constraint set bounding the workflow (must be supplied or locatable before the first action; if unreadable, missing, or ambiguous to the point of being unenforceable, the workflow is refused).
- The pending action, path, proposal, or merge at each boundary (must be supplied at evaluation time).
- Optional: the prior verdict sequence for continuity across boundaries within the same workflow.

## Procedure

1. Before the first action of any bounded workflow, load the constraint set that bounds it. If the constraint set is unreadable, missing, or ambiguous to the point of being unenforceable, refuse the workflow and record the refusal reason. Do not default-allow.
2. At every action boundary, re-evaluate the loaded constraints against the pending action. Permit the action if it satisfies every constraint; narrow it to a compliant form if a narrower action would satisfy them; refuse it and record the refusal reason if no compliant form exists.
3. At every path boundary, re-evaluate the constraints against the chosen execution path. Permit, narrow, or refuse as in step 2.
4. At every proposal boundary, re-evaluate the constraints against the proposed change. Permit, narrow, or refuse as in step 2.
5. At every merge boundary, re-evaluate the constraints against the merge target and content. Permit, narrow, or refuse as in step 2.
6. Record every refusal with its reason in chat output. If the constraint set may have changed since the last load, reload it before re-evaluating; never proceed on a stale or unread constraint set.

## Failure and recovery
- Unreadable constraint set: refuse the pending action or workflow start, record the reason, and do not default-allow. Recovery requires a readable constraint set loaded before any further action.
- Constraint violation: refuse the action, record the violated constraint, and narrow to a compliant form only if one exists without widening scope.
- Stale constraint set: reload the constraint set before re-evaluating; never proceed on a set that may have changed since the last load.
- Partial result: no partial permit is issued. An action is permitted only when every constraint is satisfied; otherwise it is refused or narrowed.
- Non-convergence: if no narrowing satisfies the constraints, the terminal result is refusal with the reason recorded. The done predicate does not hold for a refused action.

## Output
A chat-output verdict for each evaluated boundary: permit, narrow (with the narrowed form stated), or refuse (with the recorded reason). The verdict sequence proves that constraints were loaded before the first action and re-evaluated at every action, path, proposal, and merge boundary, and that an unreadable constraint set produced refusal rather than default-allow.

## Provenance

Origin: cobusgreyling/loop-engineering. Revision: d03dcb92cc1e0efb59789a2557131c6ad5897ccc. License: MIT. Adapted as a clean-room self-contained procedure preserving the fail-safe constraint-loading and boundary re-evaluation mechanism; no third-party expression copied.
