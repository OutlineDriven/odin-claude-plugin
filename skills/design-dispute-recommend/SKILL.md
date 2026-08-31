---
name: design-dispute-recommend
description: 'Use when a design dispute has at least two live interpretations and the user wants alternative worlds. Emit one paragraph at a five-year-old abstraction level ending in one recommendation. Don''t use for tasks that require source or remote-system changes.'
---

# Design dispute recommend

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A design dispute has at least two live interpretations and the user wants alternative worlds. |
| Authority | Read-only: emit chat output only. No file, VCS, credential, design selection, decision record, or downstream mutation. |
| Side effect | One paragraph at a five-year-old abstraction level ending in one recommendation, written to chat. |
| Done | One paragraph recommendation is emitted; no design selection, decision record, or downstream mutation authorization. |

## Inputs

- The design dispute statement, supplied by the user, containing at least two live interpretations. Required.
- No file, repository, card, or external state is read.

## Procedure

1. Confirm the supplied dispute has at least two live interpretations. If fewer than two, stop before emitting anything.
2. Produce the paragraph directly from the dispute. Do not require or read any peer skill, tracked card, or external artifact.
3. Write one paragraph at a five-year-old abstraction level: plain words, no jargon, no framework names.
4. End the paragraph with exactly one recommendation.
5. Do not select the design, record a decision, or authorize any downstream mutation.

## Failure and recovery
- Fewer than two live interpretations: stop and report that the dispute does not meet the two-interpretation threshold. Emit no paragraph.
- Ambiguous or missing dispute statement: stop and ask the user to state the dispute. Do not invent interpretations.
- No single recommendation reachable: stop and report that no one recommendation follows. Do not force a selection.
- Partial-result rule: the output is atomic. Never emit a partial paragraph.
- Non-mutation rule: no file, VCS, credential, or downstream state is touched on any path, including failure paths.

## Output
One paragraph at a five-year-old abstraction level, ending in one recommendation, emitted to chat. No design selection, decision record, or downstream mutation authorization.

## Provenance

Origin: user-curated design-dispute exploration workflow (curated:curated-ideas:curated-055), adapted from the priority-five `possible-worlds` contract. Pinned revision: none (local curated artifact). License: project-owned. Adaptation: renamed from curated-possible-worlds to design-dispute-recommend; emits one paragraph recommendation without explicitly laying out interpretations, distinguishing it from the interpretation-laying-out possible-worlds.
