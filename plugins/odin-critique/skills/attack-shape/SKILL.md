---
name: attack-shape
description: 'Use when the user wants adversarial stress-testing of a proposed architecture, structure, or shape. Not for tasks that require source or remote-system changes.'
---

# Attack shape

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants adversarial stress-testing of an architecture, structure, or shape. Either the agent attacks and the human defends, or the agent proposes and the human attacks. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. The agent emits chat output only. |
| Side effect | An attack or proposal transcript in chat, plus the surviving or broken shape recorded in chat. |
| Done | The shape has been attacked from both directions, the human has defended or attacked, and the surviving shape (or non-converged record) is recorded. |

## Inputs

The proposed architecture, structure, or shape to test. The human must supply it as text, a diagram description, or a reference to an artifact already in context. Without it the skill stops.

Optional: named attack axes the human wants prioritized (coupling, abstraction depth, failure modes, scalability, ownership boundaries).

Optional: a scope limit naming what is out of bounds for the attack.

Optional: constraints, scale, existing components, and non-goals for a proposal round.

A human participant must be present; the skill does not converge without one.

## Procedure

1. Restate the target shape from the supplied input and confirm scope with the human before attacking or proposing. Do not test material outside the stated scope. Done when: the shape is restated and scope is confirmed.

2. Determine the direction. If the human supplied a shape to attack, the agent attacks and the human defends. If the human asked the agent to propose, the agent proposes and the human attacks. Done when: the direction is set and the first move is made.

3. Enumerate the attack axes relevant to the shape: coupling between parts, abstraction depth versus leakage, failure and recovery paths, scalability and growth pressure, ownership and boundary clarity, plus any named axes the human supplied. Done when: all relevant axes are enumerated.

4. Mount the first move. In attack mode: for each axis, state the specific structural weakness, the condition under which it fails, and the evidence. Each attack must be falsifiable by the human's defense. In propose mode: propose one architecture shape with components, boundaries, data flow, and the single load-bearing decision that makes it cohere, plus the failure mode each component rejects. Done when: each attack states weakness, failure condition, and evidence, or the proposal names components, boundaries, data flow, the load-bearing decision, and per-component rejected failure modes.

5. Present the moves and invite the human to respond. Wait for the human's defense or attack before judging survival on any axis. Done when: the human is invited and the agent waits.

6. For each response, classify the outcome: rebutted (the shape survives that axis), landed (the shape must change on that axis), or deferred (insufficient information to judge). Done when: each axis is classified.

7. When an attack lands or a human attack breaks a proposal, propose the minimal shape change that resolves the weakness and re-test the changed portion once. Done when: a minimal shape change is proposed and re-tested once.

8. Repeat steps 3 through 7 until every axis is either rebutted or resolved, or the human ends the session. Done when: every axis is rebutted or resolved, or the human ends the session.

9. Record the surviving shape: the final structure, the attacks it survived with their rebuttals, the changes made, and any deferred or non-converged axes with their open questions. Done when: the final structure, survived attacks, changes, and deferred axes are recorded.

## Failure and recovery

No target shape supplied and no proposal requested. Stop and ask the human for the shape and scope. Do not invent a shape to attack or propose.

Attack not falsifiable on an axis. Classify that axis as deferred with the open question. Do not claim it survived.

Human response absent or non-substantive for a landed attack. Mark the axis as unresolved. Do not declare the shape surviving on that axis.

Scope widening. If the human introduces new material mid-session, restate the new scope and confirm before continuing. Never silently expand the attack surface.

Non-convergence. If the same axis oscillates without resolution across two re-tests, record it as non-converged with the conflicting positions rather than forcing a verdict.

No mutation. This skill writes nothing to disk or VCS. Recovery is to restate the surviving or non-converged shape in chat.

## Output

A surviving-shape record in chat containing the final structure, the list of attacks it survived with their rebuttals, the changes made during the session, and any deferred or non-converged axes with their open questions. If the shape did not survive, output the non-converged record naming the unresolved axes.
