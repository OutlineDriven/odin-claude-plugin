---
name: devils-advocate-architecture
description: 'Use when a user wants the agent to propose architecture and the human to attack it until the shape survives. The surviving architecture shape is recorded as a decision. Don''t use for tasks that require source or remote-system changes.'
---

# Devils advocate architecture

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

1. Restate the problem, constraints, and non-goals the human supplied. Confirm scope before proposing.
2. Propose one architecture shape: components, boundaries, data flow, and the single load-bearing decision that makes it cohere. State the failure mode each component rejects.
3. Invite the human to attack the shape. Do not defend reflexively; treat each attack as a load-bearing test.
4. For each attack that lands, revise the shape to close that failure mode, or concede and mark the component unresolved.
5. Repeat proposal and attack rounds until the human raises no attack that breaks the shape, or the human ends the session.
6. Record the surviving shape: components, boundaries, the attacks it survived, the attacks it conceded, and the open risks.

## Failure and recovery
- No human attack: the surviving-shape predicate is unmet. Stop and report that no attack was applied; do not claim survival.
- Unrepairable break: if a shape breaks under attack and cannot be closed within scope, record the broken component and the breaking attack as an open risk. Do not claim survival.
- Scope drift: if attacks widen beyond the stated problem, restate the boundary and ask whether to expand scope explicitly. Never silently widen.
- Non-mutation: nothing is written or changed, so rollback is trivial.

## Output
A recorded architecture decision delivered as chat output: the surviving shape (components, boundaries, data flow, load-bearing decision), the attacks it survived, the conceded open risks, and the round count.

## Provenance

Origin: project-owned:user-curated-skill-ideas (curated-037), supplemented by project-owned:user-supplied-source-brief. No pinned revision or third-party license; project-owned clean-room adaptation of a user-curated architecture design ritual. Adaptation: normalized the "agent proposes, human attacks until the shape survives" ritual into a bounded read-only contract with explicit failure and recovery.
