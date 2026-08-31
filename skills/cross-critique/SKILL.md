---
name: cross-critique
description: 'Use when asked to circulate each subagent''s independent proposal to the other authors for structured pros and cons when multiple proposals on a contested decision are on the table, then synthesize a recommendation that notes convergence, strongest objections, and the surviving option. Don''t use for tasks that require source or remote-system changes.'
---

# Cross critique

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Multiple independent proposals on a contested decision exist (round-one proposals are on the table). |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation; the synthesis is conversational output. |
| Side effect | Read-only second round reusing existing subagents; no repo mutation. |
| Done | Synthesis notes convergence, strongest objections, and surviving option. |

## Inputs

- N independent proposals from a prior round (must be supplied). Round one must have been independent (authors did not see each other's work) or the diversity that makes round two valuable is lost.
- The contested decision question and its decision criteria (must be supplied).
- Access to the same subagents that produced round one (required, to reuse their investigation context).
- Optional: neutral authorship labels (Proposal A, B, C) for anonymized circulation.

## Procedure

1. Verify the prerequisite: at least two genuinely divergent proposals exist from an independent first round. If the proposals already strongly agree, or the question has an objective answer verifiable directly, stop. A second round adds latency and tokens without resolving real disagreement.
2. Assemble each proposal's core recommendation and reasoning (not full transcripts). Label them neutrally (Proposal A, B, C) and anonymize authorship where practical to reduce bandwagon bias toward whichever author sounds most confident.
3. Reuse the same subagents from round one rather than spawning fresh ones, so each retains its investigation context. Send each author only the other proposals (not its own).
4. Ask each author for, per alternative: its pros (what it gets right, where it is stronger than my approach) and its cons (risks, edge cases, hidden costs, wrong assumptions); whether seeing the alternatives would revise its own recommendation and why or why not; and a final ranking with confidence. Insist on both pros and cons for each alternative: an honest critique that credits a rival's strengths is more useful than a reflexive defense of one's own proposal.
5. If a critique is thin or unsupported, send a focused follow-up to that same author rather than discarding it.
6. Synthesize directly, comparing critiques by evidence quality, not vote count. Lead with the recommendation; note where authors converged after seeing each other's work (convergence in round two is a strong signal); surface the most incisive cons raised against each option; explain why the recommended option survives critique best against the decision criteria; call out remaining disagreement, confidence, and material unknowns.
7. Keep the critique round read-only; do not mutate the repo, files, or remote state unless the underlying task explicitly requires changes.

## Failure and recovery
- No divergence or objective answer: stop before circulating. Report that the proposals already agree or the question is directly verifiable, so a second round would add cost without value.
- Missing prerequisite: fewer than two independent proposals, or round one was not independent (authors saw each other's work). Do not proceed; report the missing independence and require a fresh independent first round.
- Thin or unsupported critique: do not discard the author's perspective. Send a focused follow-up to the same author. If the follow-up still yields no substantive critique, mark that author's contribution as non-convergent and proceed with the remaining critiques, noting the gap in the synthesis.
- Subagent unavailable: if a round-one subagent cannot be reused, spawn a replacement seeded with that proposal's context and flag the reduced fidelity in the synthesis.
- Never present the done predicate as holding when convergence was not reached or objections remain unresolved; record remaining disagreement, confidence, and unknowns explicitly.

## Output
A conversational synthesis containing: the recommendation; where authors converged or changed their minds after seeing alternatives; the strongest objection raised and whether it is decisive; why the recommended option survives critique against the decision criteria; and remaining risks, unknowns, and confidence. No repo mutation.

## Provenance

- Origin: github.com/warpdotdev/common-skills, path .agents/skills/cross-critique/SKILL.md, revision f589e224907eda566c13755529f59db563090d14.
- License: MIT (Copyright (c) 2026 Denver Technologies, Inc.). Permissive adaptation and redistribution; no copyleft obligations.
- Adaptation: clean-room rewrite in ODIN style. The adversarial cross-examination mechanism — reuse round-one subagents, circulate each proposal only to the other authors, demand structured pros and cons plus a revision/ranking, synthesize by evidence quality — is preserved. Motivational prose, peer-skill pointers, and the final-answer template were cut to semantic minimum.
