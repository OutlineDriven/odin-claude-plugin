---
name: from-human-perspective
description: 'Use when a user wants an answer only from the human seat: what a person can love, trust, and tolerate. Not for rebuilding from primitives: use from-first-principle.'
---

# From human perspective

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants an answer only from the human seat (what a person can love, trust, and tolerate). |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Returns a human-perspective analysis in chat; no other surface is touched. |
| Done | Returns a human-perspective answer without blending. |

## Not for

- Rebuilding a design from primitives: use from-first-principle.
- Blended multi-seat analysis: run each from-*-perspective seat independently and compare after.
- Source or remote mutation: this skill is read-only.

## Inputs

- The question or artifact under analysis (required).
- Optional: named constraints the human seat should weigh, such as what a person can love, trust, or tolerate.

## Procedure

1. Take the question or artifact as the only input. Confirm the human seat is the requested perspective; if the request names a different seat, stop and report which seat was requested. Done when: the seat is confirmed as human.
2. Answer strictly from what a person can love, trust, and tolerate: lived experience, attention cost, fatigue, trust erosion, tolerable friction, and what a person would keep or abandon. Done when: the answer is grounded in human-seat concerns.
3. Do not blend other seats (money, codebase, impact, stability, moat, and the rest) into this answer. If another seat is relevant, name it as a separate lens to run later, never as part of this output. Done when: no other seat's reasoning appears in the answer body.
4. Keep the output independent so it can be compared against other lens outputs after the fact; do not pre-merge them. Done when: the answer stands alone without cross-seat synthesis.
5. Stop when the human-seat answer is complete. Do not widen scope, invent evidence, or import methodology from another perspective. Done when: the answer is complete and scope is unchanged.

## Failure and recovery

- Wrong-seat request: if the user asked for a different perspective, stop and report the requested seat; do not substitute the human seat.
- Blending drift: if the draft starts importing another seat's concerns, discard the blended portion and re-answer from the human seat only.
- Insufficient input: if the question or artifact is missing, stop and request it; do not fabricate a human-perspective read.
- Non-convergence: if no human-seat answer can be formed from the given input, return that explicitly rather than emitting a blended or generic answer.
- No mutation: nothing is written, committed, paid, published, deployed, or remotely changed; recovery is to re-issue the chat answer.

## Output

A single human-perspective analysis answering the input from the human seat only, with any other relevant seats named as separate lenses to run later, no blending.
