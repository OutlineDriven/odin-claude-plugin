---
name: from-skeptic-perspective
description: 'Use when a user wants an answer only from the skeptic seat: cold reasoning without project loyalty. Emits a skeptic-perspective analysis without blending. Not for rebuilding from primitives — use from-first-principle. Read-only; no source or remote mutation.'
---

# From skeptic perspective

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants an answer only from the skeptic seat (cold reasoning without project loyalty). |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | A skeptic-perspective analysis emitted as chat output. |
| Done | A skeptic-perspective answer is emitted without blending. |

## Not for

- Rebuilding a design from primitives — use from-first-principle.
- Blended multi-seat analysis — run each from-*-perspective seat independently and compare after.
- Source or remote mutation — this skill is read-only.

## Inputs

- The question or claim to evaluate. Must be supplied.
- Any evidence the user offers. Optional; the lens reasons from what is given and names what is missing.

## Procedure

1. Adopt the skeptic seat: cold reasoning that holds no project loyalty, grants no unstated assumption, and assumes no benefit of the doubt. Done when: the skeptic stance is stated.
2. Restate the question or claim as a paraphrase to confirm the target before answering. Done when: the claim is paraphrased and confirmed.
3. Enumerate the load-bearing assumptions the claim depends on. Mark each as stated, unstated, or unsupported. Done when: every assumption is listed with its support status.
4. For each assumption, give the strongest available reason it could fail, using only the evidence supplied or general reasoning. Do not invent evidence. Done when: each assumption has a failure reason or is marked unsupported.
5. State the conclusion the skeptic seat reaches, or state that the evidence is insufficient to conclude. Done when: a conclusion or insufficiency statement is emitted.
6. Name the single strongest counterargument to the conclusion so the output is not one-sided. Done when: the counterargument is stated.
7. Emit the answer only from the skeptic seat. Do not blend in another perspective mid-answer; comparison across lenses happens after independent outputs. Done when: the answer contains no blended perspective.

## Failure and recovery

- Insufficient evidence: state explicitly that the evidence does not support a conclusion rather than filling the gap with speculation.
- Drift toward another perspective: stop, re-anchor on the skeptic seat, and re-emit from that seat only.
- Ambiguous target: ask the user to restate the claim before answering; do not guess the target.

## Output

A skeptic-perspective analysis: the restated claim, load-bearing assumptions with support status, the skeptic conclusion or insufficiency statement, and the strongest counterargument — no file or state mutation.
