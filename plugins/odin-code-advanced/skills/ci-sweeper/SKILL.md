---
name: ci-sweeper
description: 'Use when a requested sweep monitors CI failures over a bounded attempt window. Returns each root cause reproduced or classified non-actionable with any minimal verified patch as a proposal. Not for classifying one failure without patching — use classify-ci-failure.'
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

1. On each tick, fetch the current set of failing CI checks for the target run and record the attempt number against the configured cap. **Done when:** the failing checks are fetched and the attempt number is recorded.
2. If the attempt cap is reached, stop and hand off; do not start a new repair. **Done when:** the sweep stops at the cap with a handoff, or the cap is not yet reached.
3. Pick one failing check and reproduce the failure locally in an isolated worktree created from the base commit the CI run used. **Done when:** the failure is reproduced locally or confirmed non-reproducible.
4. Classify the failure: reproduce the root cause, or classify it non-actionable (flake, environment, upstream). If the failure is a flake or the cause is ambiguous, hand off and do not patch. **Done when:** the failure is classified as root cause or non-actionable, or handed off.
5. If a root cause is reproducible, implement one minimal isolated repair in the worktree: the smallest change that fixes the reproduced cause and nothing else. **Done when:** the minimal repair is implemented in the worktree.
6. Run the verifier in the worktree independently of the repair; confirm the failing check passes and no other check regresses. **Done when:** the verifier confirms the fix and no regression, or the verifier failure is recorded.
7. If the verifier fails or regresses, do not widen the patch; increment the attempt counter and either retry within budget or hand off. **Done when:** the attempt counter is incremented and the retry-or-handoff decision is made.
8. Return the verified patch as a proposal (diff or branch) with the reproduced root cause and verifier evidence. Do not push, merge, or publish. **Done when:** the verified patch is returned as a proposal with evidence.
9. If the circuit breaker trips (repeated non-convergence, repeated flakes, or budget exhaustion), stop the sweep and hand off with the accumulated evidence. **Done when:** the sweep stops with a handoff and accumulated evidence.

## Failure and recovery
- Flake: the failure does not reproduce locally. Classify non-actionable, hand off, and do not patch.
- Ambiguity: the root cause cannot be isolated to one minimal change. Hand off with evidence and do not patch.
- Budget exhaustion: the attempt cap is reached. Stop, hand off, and do not start a new repair.
- Breaker trip: repeated non-convergence or repeated flakes. Stop the sweep and hand off.
- Partial result: a worktree repair is never merged. A partial patch is returned as a proposal with its verification state, never as a completed fix.
- Non-mutation: no push, merge, publish, credential change, or main-branch mutation. The worktree is the only writable surface and may be discarded.
- Blocked result: when any failure class above fires, return the terminal classification, the attempt count, and the accumulated evidence; do not swallow the error or claim the done predicate holds.

## Output
A terminal classification per swept check (reproduced root cause, non-actionable, or blocked) with, for a reproduced root cause, a minimal verified patch returned as a proposal with verifier evidence and the attempt count; for blocked or non-actionable, a handoff record with the accumulated evidence and the stopping reason.
