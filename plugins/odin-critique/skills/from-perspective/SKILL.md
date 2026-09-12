---
name: from-perspective
description: 'Use when an answer is wanted from one named seat only: breaking, business, career, codebase, human, impact, innovation, moat, rent-seeking, skeptic, or stability. Not for multi-lens synthesis: use prism. Not for rebuilding from primitives: use from-first-principle.'
---

# From perspective

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants an answer only from one named seat: breaking, business, career, codebase, human, impact, innovation, moat, rent-seeking, skeptic, or stability. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | A single-seat-perspective analysis emitted as chat output; no other surface is touched. |
| Done | A seat-perspective answer is emitted from the named seat only, without blending any other seat. |

## Inputs

- The subject to analyze: a question, claim, decision, design, change, system, or artifact (required). If it is absent, stop and ask; never invent a subject.
- `seat`: required, one of the closed list: breaking, business, career, codebase, human, impact, innovation, moat, rent-seeking, skeptic, stability. If the request names a seat outside this list, stop and report which seat was requested; never substitute another.
- Seat-conditioned concerns, supplied with the seat and consumed by the shared procedure:

| Seat | Analyze the subject as |
|---|---|
| breaking | Stakeholders, dependencies, accounting, and compatibility under destructive pressure. Optional input: the specific destructive pressure to apply (cost, removal, dependency failure, stakeholder withdrawal); if none is named, apply the full seat by default. |
| business | Money (revenue, cost, margin, funding), customers (who pays, who is served, demand, churn), and timing (market window, sequencing, deadlines). |
| career | Effects on human trajectories: career growth, skill acquisition, role transitions, professional risk, and human capital. |
| codebase | What the existing code tolerates or punishes. Evidence comes from reading the actual code in a reachable working tree. |
| human | What a person can love, trust, and tolerate: lived experience, attention cost, fatigue, trust erosion, tolerable friction, and what a person would keep or abandon. |
| impact | Who and what actually moves, traced against what merely appears to move or is assumed to move. |
| innovation | Original technique, talent, and culture: what is technically original, what talent or skill it depends on, and what cultural or creative conditions enable or block it. |
| moat | What builds, keeps, or thickens defensibility: switching costs, network effects, scale, data, brand, IP, lock-in, compounding advantage, and erosion risks to each. |
| rent-seeking | Extraction without building: who captures value without creating it, where rents accrue, and what barriers protect them. |
| skeptic | The claim's load-bearing assumptions, each marked stated, unstated, or unsupported, stressed for how each could fail. |
| stability | Preservation of the working machine: regressions, load placed on proven paths, removal of working behavior, fragility introduced, and recovery lost. |

## Procedure

1. Take the subject and the named `seat`. Restate the subject in one line so the seat is unambiguous; for the skeptic seat, restate the claim as a paraphrase and confirm the target before answering. Done when: the subject and seat are stated and unambiguous.
2. Adopt only the named seat and analyze the subject exclusively through that seat's concern set from the inputs table. Every claim in the answer must tie to a concern of that seat. Done when: the analysis is framed entirely through the named seat's concerns.
3. Ground every claim in the evidence that seat admits: for the codebase seat, read the actual code and list tolerates and punishes findings with code evidence; for the impact seat, mark unverified impact as inference; for the skeptic seat, give the strongest available failure reason for each assumption, reach a conclusion or an insufficiency statement, and name the single strongest counterargument so the output is not one-sided; for every seat, state thin-evidence gaps rather than filling them, and omit a claim that cannot be grounded in this seat rather than borrowing another seat's reasoning. Done when: every claim is grounded or its gap is stated.
4. Do not blend any other seat into the answer. If another seat is relevant, name it once as a separate lens to run independently, at most a one-line pointer at the end, never as content in the body. Comparison across seats happens only after each has produced its own independent output, outside this skill. Done when: no other seat's reasoning appears in the answer body.
5. Emit the analysis as chat output, standing alone, with no recommendation and no cross-seat synthesis. If the named seat yields no independent answer for this subject (a question with no career dimension, nothing that actually moves, an innovation claim that cannot be grounded), state that explicitly rather than forcing an answer or borrowing another seat. Done when: the analysis is emitted, or the no-independent-answer statement is emitted.

## Failure and recovery

- Blending drift: any sentence that argues from a seat other than the named one invalidates the answer. Discard the blended content, re-anchor on the named seat's concerns, and re-emit from that seat only.
- Wrong-seat request: if the request names a seat outside the closed list, stop and report the requested seat; never substitute.
- Missing or ambiguous subject: stop and ask for the subject or a restatement of the claim; never fabricate one or widen into a general essay.
- Unreachable codebase (codebase seat): stop. Report that the codebase seat has no evidence and emit no analysis.
- Partial evidence: emit only the portion grounded in that seat's admissible evidence, label the rest as unverified, and name the unresolved point; never present inference as observed fact.
- No dimension: if the seat yields no independent answer, return that explicit statement rather than inventing an angle or substituting another lens.
- Non-mutation: this skill never mutates anything, so no rollback is needed; a failed pass leaves only chat output or a request for the missing input.

## Output

One chat-only analysis answering the subject from the named seat's concern set alone, other relevant seats named at most as separate lenses to run independently, with no blending, no recommendation, and no cross-seat synthesis.
