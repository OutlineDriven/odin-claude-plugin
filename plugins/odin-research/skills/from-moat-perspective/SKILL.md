---
name: from-moat-perspective
description: 'Use when the user wants an answer only from the moat seat: building, keeping, and thickening defensibility. Emits a moat-perspective analysis without blending. Not for rebuilding from primitives — use from-first-principle. Read-only; no source or remote mutation.'
---

# From moat perspective

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants an answer only from the moat seat (building, keeping, thickening defensibility). |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | A moat-perspective analysis emitted to chat; no artifact is written. |
| Done | A moat-perspective answer is emitted without blending other lenses. |

## Not for

- Rebuilding a design from primitives — use from-first-principle.
- Blended multi-seat analysis — run each from-*-perspective seat independently and compare after.
- Source or remote mutation — this skill is read-only.

## Inputs

- The subject or question to analyze (required). Restate it in one line before answering so the seat is unambiguous.
- Any comparison context the user supplies (optional). Absent context means analyze the subject alone from this seat.

## Procedure

1. Restate the subject in one line so the moat seat is unambiguous. Done when: the subject is restated.
2. Answer only from the moat seat: what builds, keeps, or thickens defensibility — switching costs, network effects, scale, data, brand, IP, lock-in, compounding advantage, and erosion risks to each. Done when: every claim ties to a defensibility mechanism or its absence.
3. Do not blend mid-answer. Exclude money-and-timing, codebase-tolerance, impact, career, breaking, rent-seeking, innovation, stability, human-trust, and skeptic reasoning from the body. If another seat is relevant, name it once as a pointer at the end; never fold its logic into the answer. Done when: no other seat's reasoning appears in the body.
4. Keep the output self-contained from this seat: every claim ties to a defensibility mechanism or its absence. Where evidence is thin, state the gap rather than inventing a moat. Done when: thin-evidence gaps are stated, not filled.
5. Stop when the moat-perspective answer is complete. Comparison or synthesis across lenses happens outside this skill, after independent outputs exist. Done when: the answer is complete and no cross-lens synthesis is included.

## Failure and recovery

- Blending failure: the answer folds in another lens's logic. Recovery: restate the step-3 boundary and rewrite the affected passage from the moat seat only.
- Missing subject: no analyzable subject was supplied. Stop and ask for the subject; do not fabricate one or widen to a general essay.
- Thin evidence: a claimed moat has no supporting mechanism. State the gap explicitly; never assert defensibility the subject does not support.
- **No partial artifact is written**; the only output is the chat answer, so a failed pass leaves nothing to roll back.

## Output

A moat-perspective analysis in chat: the defensibility mechanisms at work, where they are absent or eroding, and the moat-seat verdict on the subject — ending with an optional one-line pointer to other seats worth consulting, without blending them.
