---
name: autoplan
description: 'Use when the user runs /autoplan on a plan or idea. Runs CEO, design, DX, and engineering review phases over the idea, amends the plan, and aggregates implementation tasks behind a final human approval gate. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Autoplan

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs `/autoplan` on a plan or idea. |
| Authority | Reversible local write: write only the amended plan, task JSONL ledger, and TODO updates; recover by discarding those local artifacts. |
| Side effect | Writes the amended plan, task JSONL ledger, and TODO updates. |
| Done | The final approval gate presents an amended plan and aggregated implementation tasks. |

## Inputs

Required: a plan or idea to develop, supplied as a file path or inline text.

Optional: an existing task JSONL ledger to extend. If absent, create one.

## Procedure

1. Read the supplied plan or idea. If it is a path, read the file; if inline text, use it directly. Stop if no plan or idea is supplied. Done when: the plan or idea is read or the absence is reported.
2. Run the CEO review phase: evaluate the idea for strategic fit, audience, and the one outcome that matters; record decisions in a six-principle decision register (clarity, leverage, audience, risk, sequencing, reversibility). Done when: the CEO review decisions are recorded in the six-principle register.
3. Run the design review phase: evaluate the proposed shape, surface, and information hierarchy against the decision register; record decisions. Done when: the design review decisions are recorded against the decision register.
4. Run the DX review phase: evaluate the developer experience, onboarding path, and friction points against the decision register; record decisions. Done when: the DX review decisions are recorded against the decision register.
5. Run the engineering review phase: evaluate the implementation approach, dependencies, and risk against the decision register; record decisions. Done when: the engineering review decisions are recorded against the decision register.
6. Amend the plan with the consolidated decisions from all four phases. Done when: the plan is amended with consolidated decisions.
7. Aggregate implementation tasks from the four phases into a task JSONL ledger, one task per line with a stable ID, description, and the phase that produced it. Done when: the task JSONL ledger is written with one task per line.
8. Update TODOs to reflect the aggregated tasks. Done when: TODOs reflect the aggregated tasks.
9. Present the amended plan and aggregated tasks at a final approval gate. Stop and wait for the human decision; do not proceed to execution. Done when: the approval gate is presented and the skill stops for the human decision.

## Failure and recovery
- Missing input: stop before any write; report that no plan or idea was supplied.
- A review phase cannot reach a decision: record the open question in the decision register, continue the remaining phases, and surface the open question at the approval gate.
- Ledger write fails: discard the partial ledger; do not present a done state; report the blocked result with the phase reached.
- Rollback: all effects are local artifacts (amended plan, task JSONL ledger, TODO updates); discard them to recover the pre-run state.
- Non-converged: if the approval gate is not reached, the result is blocked, not done; never claim the done predicate holds.

## Output
An amended plan, a task JSONL ledger of aggregated implementation tasks, updated TODOs, and a final approval gate presenting both the amended plan and the aggregated tasks for the human decision.

## Provenance

Origin: https://github.com/garrytan/gstack, revision 07b59e396c6be5a86619a43151cb9ed62a15ae69. License: MIT, Copyright (c) 2026 Garry Tan. Adapted clean-room from the autoplan multi-phase review pipeline (CEO, design, DX, engineering phases, six-principle decision register, aggregated task ledger); expressive prose re-derived, not copied.
