---
name: from-codebase-perspective
description: 'Use when asked to answer only from the codebase seat: what existing code tolerates or punishes. Not for rebuilding from primitives: use from-first-principle.'
---

# From codebase perspective

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants an answer only from the codebase seat (what existing code tolerates or punishes). |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Returns a codebase-perspective analysis in chat. |
| Done | Returns a codebase-perspective answer without blending. |

## Not for

- Rebuilding a design from primitives: use from-first-principle.
- Blended multi-seat analysis: run each from-*-perspective seat independently and compare after.
- Source or remote mutation: this skill is read-only.

## Inputs

The question or proposal to analyze from the codebase seat. The codebase under analysis must be readable in the working tree; if it is not reachable, stop and report that the seat has no evidence.

## Procedure

1. Confirm the seat is codebase only. State that money, customers, timing, impact, career, breaking, rent-seeking, innovation, stability, moat, human, and skeptic perspectives are out of scope. Done when: the out-of-scope seats are named.
2. Read the existing code, structure, conventions, and constraints that bear on the question. Done when: the relevant code is read and the evidence base is stated.
3. Determine what the existing code tolerates: patterns, shapes, and directions it already accepts without friction. Done when: tolerates patterns are listed with code evidence.
4. Determine what the existing code punishes: patterns, shapes, and directions that fight the current structure, require rework, or break invariants. Done when: punishes patterns are listed with code evidence.
5. Emit the answer strictly from the codebase seat. Do not blend any other perspective; if another seat is relevant, name it as a separate lens to run independently. Done when: a codebase-perspective answer is emitted without blended content.

## Failure and recovery

- Unreachable codebase: stop. Report that the codebase seat has no evidence and emit no analysis.
- Question outside the codebase seat: stop. Name the seat the question belongs to and emit no codebase answer.
- Pressure to blend lenses mid-answer: refuse. The non-blending rule is load-bearing; comparison happens only after independent outputs.
- Partial evidence: emit only the portion grounded in read code and label the rest as unverified. Never present inference as observed code behavior.

## Output

One codebase-perspective analysis in chat: what the existing code tolerates, what it punishes, and the code evidence for each, no decision selected or recorded; comparison with other lenses happens after their independent outputs.
