---
name: from-innovation-perspective
description: 'Use when a user wants an answer only from the innovation seat of original technique, talent, and culture. The skill emits an innovation-perspective analysis without blending other lenses. Don''t use for tasks that require source or remote-system changes.'
---

# From innovation perspective

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants an answer only from the innovation seat (original technique, talent, culture). |
| Authority | Read-only; no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | A chat-output innovation-perspective analysis; no other lens is blended mid-answer. |
| Done | An innovation-perspective answer is emitted without blending. |

## Inputs

The question, design, or artifact to analyze. The lens is fixed to the innovation seat; no additional inputs are required.

## Procedure

1. Confirm the subject to analyze. If no subject is supplied, ask for one and stop.
2. Answer only from the innovation seat: original technique, talent, and culture.
3. Frame every claim around what is technically original, what talent or skill it depends on, and what cultural or creative conditions enable or block it.
4. Do not blend business, codebase, impact, stability, moat, or any other lens into the answer. Other lenses are compared only after this lens has produced its independent output.
5. If a claim cannot be grounded in the innovation seat, mark it out-of-lens and omit it rather than borrow another seat's reasoning.

## Failure and recovery
- **No subject supplied**: ask for the subject and stop; emit no analysis.
- **Lens drift**: if the answer begins to reason from another seat, discard the drifted passage and re-anchor on original technique, talent, or culture.
- **Unsubstantiated claim**: if a point cannot be grounded in the innovation seat, omit it; do not substitute evidence from another lens.
- No mutation occurs on any failure; the only output is the chat analysis or a request for the missing subject.

## Output
A single innovation-perspective analysis answering the supplied subject from the original-technique, talent, and culture seat only, with no blended lenses.

## Provenance

Origin: `project-owned:user-curated-skill-ideas` (Perspective lenses doctrine and the `from-innovation-perspective` row). Revision: none pinned. License: none recorded; project-owned clean-room adaptation of the user's curated brief. The named-seat, no-blend mechanism and the original-technique/talent/culture scope are preserved from source; the procedure and failure rules are adapted to a self-contained contract.
