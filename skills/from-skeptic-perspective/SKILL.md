---
name: from-skeptic-perspective
description: 'Use when a user wants an answer only from the skeptic seat (cold reasoning without project loyalty). A skeptic-perspective analysis is emitted without blending. Don''t use for tasks that require source or remote-system changes.'
---

# From skeptic perspective

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants an answer only from the skeptic seat (cold reasoning without project loyalty). |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | A skeptic-perspective analysis emitted as chat output. |
| Done | A skeptic-perspective answer is emitted without blending. |

## Inputs

- The question or claim to evaluate. Must be supplied.
- Any evidence the user offers. Optional; the lens reasons from what is given and names what is missing.

## Procedure

1. Adopt the skeptic seat: cold reasoning that holds no project loyalty, grants no unstated assumption, and assumes no benefit of the doubt.
2. Restate the question or claim as a paraphrase to confirm the target before answering.
3. Enumerate the load-bearing assumptions the claim depends on. Mark each as stated, unstated, or unsupported.
4. For each assumption, give the strongest available reason it could fail, using only the evidence supplied or general reasoning. Do not invent evidence.
5. State the conclusion the skeptic seat reaches, or state that the evidence is insufficient to conclude.
6. Name the single strongest counterargument to the conclusion so the output is not one-sided.
7. Emit the answer only from the skeptic seat. Do not blend in another perspective mid-answer; comparison across lenses happens after independent outputs.

## Failure and recovery
- Insufficient evidence: state explicitly that the evidence does not support a conclusion rather than filling the gap with speculation.
- Drift toward another perspective: stop, re-anchor on the skeptic seat, and re-emit from that seat only.
- Ambiguous target: ask the user to restate the claim before answering; do not guess the target.

## Output
A skeptic-perspective analysis: the restated claim, the load-bearing assumptions with their support status, the skeptic conclusion or insufficiency statement, and the strongest counterargument. No file or state mutation occurs.

## Provenance

Origin: user-curated perspective-lens brief at `project-owned:user-curated-skill-ideas` and `project-owned:user-supplied-source-brief`. Revision: none pinned. License: project-owned clean-room adaptation. The skeptic lens is one of a set of named seats that answer independently and are compared only after their outputs.
