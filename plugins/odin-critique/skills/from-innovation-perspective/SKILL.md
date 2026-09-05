---
name: from-innovation-perspective
description: 'Use when the user wants an answer only from the innovation seat. Not for rebuilding from primitives: use from-first-principle. Read-only. No source or remote mutation.'
---

# From innovation perspective

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants an answer only from the innovation seat (original technique, talent, culture). |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | A chat-output innovation-perspective analysis; no other lens is blended mid-answer. |
| Done | An innovation-perspective answer is emitted without blending. |

## Not for

- Rebuilding a design from primitives: use from-first-principle.
- Blended multi-seat analysis: run each from-*-perspective seat independently and compare after.
- Source or remote mutation: this skill is read-only.

## Inputs

The question, design, or artifact to analyze. The lens is fixed to the innovation seat; no additional inputs are required.

## Procedure

1. Confirm the subject to analyze. If no subject is supplied, ask for one and stop. Done when: the subject is stated.
2. Answer only from the innovation seat: original technique, talent, and culture. Done when: every claim ties to technique, talent, or culture.
3. Frame every claim around what is technically original, what talent or skill it depends on, and what cultural or creative conditions enable or block it. Done when: each claim names its technique-talent-culture basis.
4. Do not blend other perspectives (breaking, business, codebase, impact, career, rent-seeking, stability, moat, human, skeptic) into the answer. Other lenses are compared only after this lens has produced its independent output. Done when: no other lens appears in the answer body.
5. If a claim cannot be grounded in the innovation seat, mark it out-of-lens and omit it rather than borrow another seat's reasoning. Done when: ungrounded claims are omitted, not borrowed.

## Failure and recovery

- Missing subject: ask for the subject and stop; emit no analysis.
- Lens drift: if the answer begins to reason from another seat, discard the drifted passage and re-anchor on original technique, talent, or culture.
- Unsubstantiated claim: if a point cannot be grounded in the innovation seat, omit it; do not substitute evidence from another lens.
- Non-mutation: no mutation occurs on any failure; the only output is the chat analysis or a request for the missing subject.

## Output

A single innovation-perspective analysis answering the supplied subject from the original-technique, talent, and culture seat only, no blended lenses.
