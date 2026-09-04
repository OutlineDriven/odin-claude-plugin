---
name: from-stability-perspective
description: 'Use when the user wants an answer only from the stability seat: preservation of the working machine. Not for rebuilding from primitives: use from-first-principle.'
---

# From stability perspective

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants an answer only from the stability seat (preservation of the working machine). |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | A stability-perspective analysis emitted as chat output only. |
| Done | A stability-perspective answer is emitted without blending other seats. |

## Not for

- Rebuilding a design from primitives: use from-first-principle.
- Blended multi-seat analysis: run each from-*-perspective seat independently and compare after.
- Source or remote mutation: this skill is read-only.

## Inputs

The subject under analysis (a design, change, system, or decision) must be supplied by the user. Outputs from other perspective lenses, if present, are inputs for later comparison only and must not be blended into this answer.

## Procedure

1. Confirm the subject is stated. If it is not, stop and request it; do not invent a subject. Done when: the subject is stated.
2. Adopt only the stability seat: preservation of the working machine. Frame every judgment through what keeps the existing working system intact, reliable, and unbroken. Done when: the stability stance is stated.
3. Analyze the subject strictly from this seat: identify what preserves or endangers the working machine, including regressions, load placed on proven paths, removal of working behavior, fragility introduced, and recovery lost. Done when: preservation and risk findings are listed.
4. Do not blend other seats (business, impact, innovation, moat, breaking, rent-seeking, human, skeptic, codebase, career) into the answer. If another seat's concern surfaces, name it as out-of-seat and leave it for a separate lens run. Done when: no other seat's reasoning appears in the answer.
5. Emit the analysis as chat output, bounded to stability reasoning and the concrete preservation or risk findings. Done when: the analysis is emitted and stands alone.

## Failure and recovery

- Missing subject: stop and request the subject; never fabricate one.
- Seat drift (another perspective blended mid-answer): re-anchor to the stability seat and remove the blended content. If the user wants a blended answer, this skill is the wrong one.
- Non-converged analysis: return the partial stability findings with the unresolved point named. Never claim the done predicate holds when blending occurred.

## Output

A stability-perspective analysis as chat output: preservation and risk findings from the stability seat only, with any out-of-seat concerns flagged for separate lens runs.
