---
name: cross-critique
description: 'Use when independent proposals on a contested decision need cross-critique before choosing, reusing the original authors. Not for parallel multi-stance investigation: use council.'
---

# Cross critique

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Multiple independent proposals on a contested decision exist (round-one proposals are on the table). |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. The synthesis is conversational output. |
| Side effect | Read-only second round reusing existing subagents; no repo mutation. |
| Done | Synthesis notes convergence, strongest objections, and surviving option. |

## Inputs

- N independent proposals from a prior round (must be supplied). Round one must have been independent (authors did not see each other's work) or the diversity that makes round two valuable is lost.
- The contested decision question and its decision criteria (must be supplied).
- Access to the same subagents that produced round one (required, to reuse their investigation context).
- Optional: neutral authorship labels (Proposal A, B, C) for anonymized circulation.

## Procedure

1. Verify the prerequisite: at least two genuinely divergent proposals exist from an independent first round. If the proposals already strongly agree, or the question has an objective answer verifiable directly, stop. A second round adds latency and tokens without resolving real disagreement. Done when: divergence and independence are confirmed, or the round is stopped with the reason reported.
2. Assemble each proposal's core recommendation and reasoning (not full transcripts). Label them neutrally (Proposal A, B, C) and anonymize authorship where practical to reduce bandwagon bias toward whichever author sounds most confident. Done when: each proposal is assembled with neutral labels and anonymized authorship.
3. Reuse the same subagents from round one rather than spawning fresh ones, so each retains its investigation context. Send each author only the other proposals (not its own). Done when: each round-one subagent is reused and receives only the other proposals.
4. Ask each author to assess every alternative:
   - Its pros: what it gets right and where it is stronger than the author's own approach.
   - Its cons: risks, edge cases, hidden costs, and wrong assumptions.
   - Whether the alternatives change the author's recommendation, and why or why not.
   - A final ranking with confidence.

   Insist on both pros and cons for each alternative. A critique that credits a rival's strengths is more useful than a reflexive defense of the author's own proposal. Done when: each author returns pros, cons, recommendation-change assessment, and ranking for every alternative.
5. If a critique is thin or unsupported, send a focused follow-up to that same author rather than discarding it. Done when: every thin critique is followed up or marked non-convergent after a second attempt.
6. Synthesize directly by weighing evidence quality, not vote count. Lead with the recommendation, then:
   - Note where authors converged after seeing each other's work. Round-two convergence is a strong signal.
   - Surface the most incisive cons raised against each option.
   - Explain why the recommended option best survives critique against the decision criteria.
   - Record remaining disagreement, confidence, and material unknowns.
   Done when: the synthesis states the recommendation, convergence, strongest cons, survival rationale, and remaining disagreement with confidence and unknowns.
7. Keep the critique round read-only; do not mutate the repo, files, or remote state. Done when: no repo, file, or remote mutation occurs.

## Failure and recovery
- No divergence or objective answer: stop before circulating. Report that the proposals already agree or the question is directly verifiable, so a second round would add cost without value.
- Missing prerequisite: fewer than two independent proposals, or round one was not independent (authors saw each other's work). Do not proceed; report the missing independence and require a fresh independent first round.
- Thin or unsupported critique: do not discard the author's perspective. Send a focused follow-up to the same author. If the follow-up still yields no substantive critique, mark that author's contribution as non-convergent and proceed with the remaining critiques, noting the gap in the synthesis.
- Subagent unavailable: if a round-one subagent cannot be reused, spawn a replacement seeded with that proposal's context and flag the reduced fidelity in the synthesis.
- Never present the done predicate as holding when convergence was not reached or objections remain unresolved; record remaining disagreement, confidence, and unknowns explicitly.

## Output
A conversational synthesis containing: the recommendation; where authors converged or changed their minds after seeing alternatives; the strongest objection raised and whether it is decisive; why the recommended option survives critique against the decision criteria; and remaining risks, unknowns, and confidence. No repo mutation.
