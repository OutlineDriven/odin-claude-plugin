---
name: implement
description: 'Use when a settled ticket or spec needs implementation. Produce code, behavioural tests at agreed seams, and commits that satisfy the contract without reopening or redesigning the plan. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Implement

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A settled ticket or spec needs implementation. |
| Authority | Reversible-local: write only code files, test files, and version-control commits inside the working repository. Rollback via VCS revert. |
| Side effect | Code, behavioural tests at agreed seams, and commits. |
| Done | Contract implemented, checks and fresh review clear, work committed. |

## Inputs

1. **Settled plan or ticket** (required): a spec, ticket, or plan that is approved and not under active redesign. Must name the contract to implement and the seams where behavioural tests apply.
2. **Repository checkout** (required): a clean or near-clean working tree with the project's check commands available.

## Procedure

1. Read the settled plan or ticket end to end. Extract the contract: what behaviour is promised, what inputs and outputs define it, and which seams the plan names for behavioural tests.
2. If the plan is ambiguous, contradictory, or missing a named seam, stop and report the gap. Do not infer scope or redesign the plan.
3. Implement the contract in code. Follow existing project conventions for file placement, naming, and style. Reuse existing patterns rather than introducing new ones.
4. At each seam named in the plan, write behavioural tests that verify the contract from the caller's perspective. Tests must fail on a plausible bug in the implementation, not merely restate the source.
5. Run the project's check suite (type checks, linters, tests). If any check fails, fix the implementation — never suppress the check or widen scope to unrelated code.
6. If a fresh review of the diff reveals the implementation reopens a settled decision, overreaches the contract, or leaves a seam untested, fix the gap before committing.
7. Commit the implementation with a message that names the contract satisfied and the seams tested.

## Failure and recovery
| Failure class | Response |
|---|---|
| Plan is ambiguous or contradictory | Stop. Report the specific gap. Do not guess or redesign. |
| Check suite fails | Fix the implementation. Do not suppress checks or skip failing tests. |
| Implementation reopens a settled plan decision | Revert the overreach. Implement only what the plan names. |
| A named seam has no behavioural test | Add the test before committing. Do not defer. |
| Scope widens beyond the plan | Revert the unrelated changes. Commit only the contracted work. |

Partial results are not committed. If the procedure cannot reach the done predicate, report the blocker and leave the working tree unchanged or revert partial edits via VCS.

## Output
- Code files implementing the contract.
- Behavioural test files at each seam named in the plan.
- One or more commits whose messages name the contract satisfied.
- A report if the procedure stopped before the done predicate, naming the exact blocker.

## Provenance

Adapted from mattpocock/skills `skills/engineering/implement/SKILL.md` at revision `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76`. Licensed MIT, Copyright (c) 2026 Matt Pocock. Permission notice retained in `licenses/NOTICE`. Clean-room adaptation into odin-code module scope: settled-plan implementation with behavioural tests at agreed seams; never reopens or redesigns the plan.
