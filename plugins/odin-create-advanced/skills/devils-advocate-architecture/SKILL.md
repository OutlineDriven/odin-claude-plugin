---
name: devils-advocate-architecture
description: 'Use when a user wants the agent to propose architecture and the human to attack it until the shape survives. Record the surviving architecture shape as a decision. Don''t use for tasks that require source or remote-system changes.'
---

# Devil's advocate architecture

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants the agent to propose architecture and the human to attack it until the shape survives. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. The agent proposes; the human attacks. |
| Side effect | Chat output only: an architecture proposal, the human attack transcript, and the surviving shape. |
| Done | Architecture shape survives human attack and is recorded. |

## Inputs

The problem or system to be architected, supplied by the human. Optional: constraints, scale, existing components, and non-goals. A human attacker must be present; the skill does not converge without one.

## Procedure

1. Restate the problem, constraints, and non-goals the human supplied. Confirm scope before proposing. **Done when:** scope is restated and confirmed by the human.

2. Propose one architecture shape: components, boundaries, data flow, and the single load-bearing decision that makes it cohere. State the failure mode each component rejects. **Done when:** the shape names components, boundaries, data flow, the load-bearing decision, and per-component rejected failure modes.

3. Invite the human to attack the shape. Do not defend reflexively; treat each attack as a load-bearing test. **Done when:** the human has been invited to attack and at least one attack is on the table or the human declines.

4. For each attack that lands, revise the shape to close that failure mode, or concede and mark the component unresolved. **Done when:** every landed attack is closed or conceded with its component marked.

5. Repeat proposal and attack rounds until the human raises no attack that breaks the shape, or the human ends the session. **Done when:** the human raises no breaking attack or ends the session.

6. Record the surviving shape: components, boundaries, the attacks it survived, the attacks it conceded, and the open risks. **Done when:** the surviving shape is recorded with survived attacks, conceded attacks, and open risks.

## Failure and recovery
- No human attack: the surviving-shape predicate is unmet. Stop and report that no attack was applied; do not claim survival.
- Unrepairable break: if a shape breaks under attack and cannot be closed within scope, record the broken component and the breaking attack as an open risk. Do not claim survival.
- Scope drift: if attacks widen beyond the stated problem, restate the boundary and ask whether to expand scope explicitly. Never silently widen.
- Non-mutation: nothing is written or changed, so no rollback is needed.

## Output
A recorded architecture decision as chat output: the surviving shape (components, boundaries, data flow, load-bearing decision), the attacks it survived, the conceded open risks, and the round count, ordered restate → propose → invite-attack → revise → repeat → record.
