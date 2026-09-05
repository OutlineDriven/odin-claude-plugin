---
name: artifact-arena
description: 'Use when asked to run /artifact-arena to generate and judge competing artifact implementations. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Artifact arena

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User runs /artifact-arena to generate and judge competing artifact implementations. |
| Authority | Reversible local: writes only local candidate worktrees and the synthesis artifact; rollback is discarding candidate worktrees and deleting the synthesis note. No remote mutation. |
| Side effect | Spawns isolated candidate workers, each writing to its own local path. No remote, credential, VCS, or published mutation. |
| Done | One verified synthesis with provenance and rejection reasons. |

## Inputs

- Task prompt (required): the artifact each candidate must produce, stated as a single contract.
- Candidate count N (required): how many parallel candidates to spawn. Minimum 2.
- Model pool (optional): models for candidates and the cross-judge. When absent, use available models, preferring a different family for the cross-judge than the parent.
- Shared grounding (optional): a path to context every candidate reads before producing.

## Procedure

1. **Frame.** State the artifact each candidate produces. Derive a rubric of 3-6 concrete gradeable criteria; each criterion names an observable behavior, not a vague quality. The rubric is the picker's tool; candidates see only the task prompt, not the rubric. Assign each candidate its own output path (a git worktree where possible, otherwise a unique local directory). N candidates sharing one path is shared mutable state and corrupts results. Done when: rubric of 3-6 criteria is derived and each candidate has its own output path.

2. **Fan out.** Spawn all N candidate workers in one batch, each receiving the task prompt, the shared grounding path if supplied, its own output path, and instructions to produce both the artifact and a short rationale naming the alternatives it considered and what it rejected. The rationale is mandatory; without it, grafting in step 5 is unreliable. If a candidate produces no output, proceed with N-1 and record the dropout. Done when: all N candidates are spawned and each produces an artifact with rationale or is recorded as a dropout.

3. **Cross-judge.** After all candidates complete, spawn one read-only judge worker on a model from a different family than the parent's when possible. The judge sees the rubric and the candidates by path label, scores each criterion per candidate, and recommends a base with rationale. Spawn the judge only after candidates finish; spawning while candidates write means it sees partial output. Done when: the judge scores each criterion per candidate and recommends a base.

4. **Pick a base.** Read every candidate end to end before picking. Score each candidate against the rubric criterion by criterion, not on overall feel. Compare the scores with the cross-judge. Agreement confirms the pick; disagreement means the rubric was ambiguous or one scorer is biased; read both rationales and resolve before proceeding. Pick the base a future maintainer can extend most easily without breaking invariants; prefer the cleaner boundary or smaller surface area when tied. Done when: a base is picked by rubric score, confirmed or resolved against the cross-judge.

5. **Graft.** Walk each losing candidate once more and identify what is worth porting into the base, usually one or two things per candidate. Fold each graft in by hand, re-deriving it from first principles so the result stays coherent under one mental model. Do not paste mechanically. Record what was grafted, from which candidate, and what was rejected and why. When N candidates converge on the same shape, note the convergence and ship the consensus shape with no graft. When candidates wildly diverge, the task was under-specified; reframe and re-run from step 1 rather than averaging the divergence. Done when: each losing candidate is walked once, grafts are folded in by hand, and rejections are recorded.

6. **Verify.** Run the same verification the artifact would face outside the artifact arena. If verification surfaces a problem the artifact arena did not catch, either the frame was wrong (reframe and re-run from step 1) or one candidate caught it and the graft was missed (return to step 5). Do not paper over the failure. Done when: the synthesis passes the same verification it would face outside the artifact arena.

## Failure and recovery
- Candidate dropout: proceed with surviving candidates; record which dropped and why. If fewer than two candidates produce output, the artifact arena cannot judge; report blocked with the dropout reasons.
- Cross-judge disagreement with parent: read both rationales, resolve the ambiguity or bias, and re-score. If the rubric itself is ambiguous, reframe and re-run from step 1.
- Divergent candidates: the task prompt was under-specified. Reframe and re-run rather than averaging incompatible shapes.
- Verification failure on synthesis: return to step 5 if a candidate already caught the issue, or reframe and re-run from step 1 if the frame was wrong. Never claim the done predicate holds while verification fails.
- Partial-result rule: never ship a synthesis that has not passed verification. Roll back by discarding all candidate worktrees and the synthesis note; no VCS, remote, or published state was mutated.

## Output
One synthesized artifact at the chosen base path. One synthesis note alongside it naming: the base candidate, each graft with its source candidate, each rejection with its reason, any dropouts, the cross-judge verdict, and the verification result.
