---
name: attack-shape
description: 'Use when a user invokes the agent to attack a proposed architecture, structure, or shape while the human defends it. Records the shape that survives both the attack and the defense. Don''t use for tasks that require source or remote-system changes.'
---

# Attack shape

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants the agent to attack architecture, structure, or shape while the human defends. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. The agent emits chat output only. |
| Side effect | An attack report and defense transcript in chat, plus the surviving shape recorded in chat. |
| Done | The agent has attacked the shape, the human has defended it, and the surviving shape is recorded. |

## Inputs

The proposed architecture, structure, or shape to attack. The human must supply it as text, a diagram description, or a reference to an artifact already in context. Without it the skill stops.

Optional: named attack axes the human wants prioritized, for example coupling, abstraction depth, failure modes, scalability, or ownership boundaries.

Optional: a scope limit naming what is out of bounds for the attack.

## Procedure

1. Restate the target shape from the supplied input and confirm scope with the human before attacking. Do not attack material outside the stated scope. Done when: the shape is restated and scope is confirmed.
2. Enumerate the attack axes relevant to the shape: coupling between parts, abstraction depth versus leakage, failure and recovery paths, scalability and growth pressure, ownership and boundary clarity, plus any named axes the human supplied. Done when: all relevant axes are enumerated.
3. For each axis, mount one concrete attack: state the specific structural weakness, the condition under which it fails, and the evidence or reasoning. Each attack must be falsifiable by the human's defense. Done when: each attack states a specific weakness, failure condition, and evidence.
4. Present the attacks as a numbered list and invite the human to defend. Wait for the human's defense before judging survival on any axis. Done when: the human is invited to defend and the agent waits.
5. For each defended attack, classify the outcome: rebutted (the shape survives that axis), landed (the shape must change on that axis), or deferred (insufficient information to judge). Done when: each attack is classified as rebutted, landed, or deferred.
6. When an attack lands, propose the minimal shape change that resolves the weakness and re-attack the changed portion once. Done when: a minimal shape change is proposed and re-attacked once.
7. Repeat steps 3 through 6 until every axis is either rebutted or resolved, or the human ends the session. Done when: every axis is rebutted or resolved, or the human ends the session.
8. Record the surviving shape: the final structure, the attacks it survived with their rebuttals, the changes made, and any deferred axes with their open questions. Done when: the final structure, survived attacks, changes, and deferred axes are recorded.

## Failure and recovery
No target shape supplied. Stop and ask the human for the shape and scope. Do not invent a shape to attack.

Attack not falsifiable on an axis. Classify that axis as deferred with the open question. Do not claim it survived.

Human defense absent or non-substantive for a landed attack. Mark the axis as unresolved. Do not declare the shape surviving on that axis.

Scope widening. If the human introduces new material mid-attack, restate the new scope and confirm before continuing. Never silently expand the attack surface.

Non-convergence. If the same axis oscillates without resolution across two re-attacks, record it as non-converged with the conflicting positions rather than forcing a verdict.

No mutation. This skill writes nothing to disk or VCS. Recovery is to restate the surviving or non-converged shape in chat.

## Output
A surviving-shape record in chat containing the final structure, the list of attacks it survived with their rebuttals, the changes made during the session, and any deferred or non-converged axes with their open questions. If the shape did not survive, output the non-converged record naming the unresolved axes.
