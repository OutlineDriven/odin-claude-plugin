# ADR format

Write one architecture decision record per qualifying decision to `docs/decisions/`, named `NNNN-kebab-case-title.md` with a zero-padded sequence number. Each record contains:

- `# NNNN. <Title>`: a short title naming the decision.
- `## Status`: `proposed`, `accepted`, or `superseded by NNNN`.
- `## Context`: the forces at play and the problem that forced a decision now.
- `## Decision`: the choice made, stated affirmatively and unambiguously.
- `## Alternatives considered`: each rejected alternative with the specific reason it lost.
- `## Consequences`: what becomes easier, harder, or impossible because of the decision.

Before writing, confirm the ADR triple: the decision is hard to reverse, surprising without context, and carries a real trade-off. If any leg fails, skip the ADR; record the terminology change if one is present, but a non-qualifying decision is not itself a terminology entry.
