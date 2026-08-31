---
name: cross-lens-converge
description: 'Use when one reviewer is not enough because the failure modes are heterogeneous, or a claim looks strong to its author and needs cross-lens pressure before it ships. Returns a convergence picture showing which lenses agreed, which disagreed, and the single resolving question that lets a reader act without re-running the analysis. Don''t use for tasks that require source or remote-system changes.'
---

# Cross lens converge

## Contract

| Field | Bound contract |
|---|---|
| Trigger | One reviewer isn't enough because the failure modes are heterogeneous, or a claim looks strong to its author and needs cross-lens pressure before it ships |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation |
| Side effect | None (read-only analysis); returns a convergence picture and the single resolving question |
| Done | The result reads as a picture not a checklist: a reader sees which lenses agreed, which disagreed, and the one question that matters, and can act on it without re-running the analysis |

## Inputs

The claim or artifact under pressure must be supplied. The set of candidate failure modes may be supplied or derived from the artifact; when supplied, it is the trusted input and is not re-derived.

## Procedure

1. Receive the artifact and the candidate failure modes. If the failure modes are not supplied, enumerate them from the artifact.
2. Collapse any two candidate failure modes that share the same failure mode into one lens. Assign exactly one lens per genuinely distinct failure mode that remains.
3. Give each lens exactly one load-bearing reason it would reject or weaken the claim. A lens with no load-bearing reason is dropped before running, not coerced into agreement.
4. Run every lens independently against the artifact. Record, per lens, its verdict as one of agrees, disagrees, or cannot-decide, and the single reason that drives that verdict.
5. Do not average, merge, or majority-count the verdicts. Disagreement is the product; preserve which lenses agreed and which disagreed.
6. From the disagreed and cannot-decide lenses, identify the one question whose answer would resolve the most lens disagreements. If no single question resolves more than one, name the question that resolves the highest-stakes disagreement. If every lens agrees, the resolving question is none.
7. Return the convergence picture: per-lens verdict and load-bearing reason, the agreed set, the disagreed set, and the single resolving question.

## Failure and recovery
- Duplicate failure modes: merge the lenses before running. Never run two lenses over the same failure mode and present their agreement as independent confirmation.
- No disagreement: return the picture with the resolving question set to none; do not manufacture disagreement to look thorough.
- A lens cannot decide: record cannot-decide with its reason. Do not coerce it into agrees or disagrees.
- A lens does not complete: return the partial picture obtained, name the lens that did not complete, and mark its verdict cannot-decide. This skill reads only; on any error it returns the partial picture and never edits the artifact or any file.

## Output
A convergence picture: each lens's verdict and its one load-bearing reason, the agreed set, the disagreed set, and the single resolving question. Read-only; no state transition.

## Provenance

Origin https://github.com/LilMGenius/paperthin, revision 3bca079a51bcfff5dafb53d1d7f9f523d66ee317, file skills/mesh/prism/SKILL.md, MIT. Clean-room adaptation: the source's own term prism is reserved, so this skill exposes the multi-lens mechanism as cross-lens-converge, with one lens per genuinely distinct failure mode, one load-bearing reason per lens, disagreement as the product never averaged, and a convergence picture plus the single resolving question as output. No third-party expression is copied.
