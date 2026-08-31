---
name: ci-sweeper
description: 'Use when a recurring or requested sweep monitors CI failures over a bounded attempt window and returns each root cause reproduced or classified non-actionable with any minimal verified patch as a proposal. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# CI sweeper

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A recurring or requested sweep monitors CI failures over a bounded attempt window. |
| Authority | Reversible local writes only: observe CI checks, propose or implement one minimal isolated repair in a worktree, and run the verifier. Never push, merge, publish, deploy, or mutate credentials. |
| Side effect | One minimal isolated repair in a worktree plus one independent verifier run; hands off on flake, ambiguity, budget exhaustion, or circuit-breaker trip. |
| Done | Root cause reproduced or classified non-actionable; any patch is minimal, independently verified, and returned as a proposal; retries stop at the configured cap without symptom patching. |

## Inputs

- CI run identifier or failing check name to sweep.
- Repository checkout path and the base commit the CI run used.
- Verifier command: the test or check command that independently confirms the repair.
- Attempt cap: maximum repair retries for this sweep.
- Optional: flake-detection window and circuit-breaker threshold (repeated non-convergence or repeated flakes that stop the sweep).

## Procedure

1. On each tick, fetch the current set of failing CI checks for the target run and record the attempt number against the configured cap.
2. If the attempt cap is reached, stop and hand off; do not start a new repair.
3. Pick one failing check and reproduce the failure locally in an isolated worktree created from the base commit the CI run used.
4. Classify the failure: reproduce the root cause, or classify it non-actionable (flake, environment, upstream). If the failure is a flake or the cause is ambiguous, hand off and do not patch.
5. If a root cause is reproducible, implement one minimal isolated repair in the worktree: the smallest change that fixes the reproduced cause and nothing else.
6. Run the verifier in the worktree independently of the repair; confirm the failing check passes and no other check regresses.
7. If the verifier fails or regresses, do not widen the patch; increment the attempt counter and either retry within budget or hand off.
8. Return the verified patch as a proposal (diff or branch) with the reproduced root cause and verifier evidence. Do not push, merge, or publish.
9. If the circuit breaker trips (repeated non-convergence, repeated flakes, or budget exhaustion), stop the sweep and hand off with the accumulated evidence.

## Failure and recovery
- Flake: the failure does not reproduce locally. Classify non-actionable, hand off, and do not patch.
- Ambiguity: the root cause cannot be isolated to one minimal change. Hand off with evidence and do not patch.
- Budget exhaustion: the attempt cap is reached or the verifier time budget is exceeded. Stop, hand off, and do not start a new repair.
- Breaker trip: repeated non-convergence or repeated flakes. Stop the sweep and hand off.
- Partial result: a worktree repair is never merged. A partial patch is returned as a proposal with its verification state, never as a completed fix.
- Non-mutation: no push, merge, publish, credential change, or main-branch mutation. The worktree is the only writable surface and may be discarded.
- Blocked result: when any failure class above fires, return the terminal classification, the attempt count, and the accumulated evidence; do not swallow the error or claim the done predicate holds.

## Output
- A terminal classification per swept check: reproduced root cause, non-actionable (flake, environment, or upstream), or blocked (budget, breaker, or ambiguity).
- For a reproduced root cause: a minimal verified patch returned as a proposal with verifier evidence and the attempt count.
- For blocked or non-actionable: a handoff record with the accumulated evidence and the stopping reason.

## Provenance

- Origin: cobusgreyling/loop-engineering (patterns/ci-sweeper.md, patterns/registry.yaml, tools/loop-action/action.yml, stories/ci-sweeper-symptom-patching-and-circuit-breaker.md, stories/why-we-killed-ci-sweeper.md).
- Revision: d03dcb92cc1e0efb59789a2557131c6ad5897ccc.
- License: MIT.
- Adaptation: clean-room adaptation to the ODIN reversible-local contract; no third-party expression copied.
