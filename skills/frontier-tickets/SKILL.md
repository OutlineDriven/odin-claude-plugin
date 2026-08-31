---
name: frontier-tickets
description: 'Use when a settled plan or spec needs tracer-bullet decomposition into blocker-declared tickets. Don''t use for unresolved plans or single-ticket creation.'
disable-model-invocation: true
---

# Frontier tickets

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A settled plan or spec needs tracer-bullet decomposition. |
| Authority | Human-only. Preview the target and consequence to the human before publishing tracker tickets, writing remote bulk tickets, or creating local ticket files. Do not mutate until the human confirms. |
| Side effect | Tracker tickets or local ticket files. Mutation is bounded to the tickets derived from the supplied plan and to the source plan's Delivery section. |
| Done | Every ticket declares blockers and the executable frontier is visible. |

## Inputs

- A settled plan or spec to decompose. Must be supplied.
- Tracker target: a GitHub repository for issues, or a local directory path for ticket files. Optional; if omitted, ask the human which target to use before any mutation.

## Procedure

1. Read the supplied plan or spec. Confirm it is settled. If open decisions or unresolved questions remain, stop and return blocked with the list of unresolved items.
2. Identify the executable frontier: the smallest set of tickets whose blockers are all external to this decomposition (no not-yet-created ticket blocks them).
3. Decompose the plan into tracer-bullet tickets. Each ticket declares the tickets that block it, so the dependency graph is explicit and the unblocked frontier is derivable from the tickets alone.
4. Preview the target and consequence to the human: the tracker target, the exact ticket count, and a one-line summary of what each ticket will write. Do not create, publish, or write anything until the human confirms.
5. On confirmation, publish the tickets: create tracker issues via the tracker API, or write local ticket files to the supplied directory. Capture each ticket's URL or file path as it is created.
6. Write the captured issue URLs or file paths back into the source plan's Delivery section so the plan records where each ticket lives.
7. Verify the done predicate: every created ticket declares its blockers, and the executable frontier (the unblocked tickets) is visible from the ticket set.

## Failure and recovery
- Open decisions in plan: do not mutate. Return blocked with the unresolved decisions.
- Human declines the preview: no mutation occurs. Return not-started with the previewed ticket set.
- Tracker API failure mid-bulk: stop creating further tickets. Record the tickets already created with their URLs. Do not retry blindly. Return partial with the created-ticket list and the remaining unbuilt tickets.
- Cyclic blocker graph (no ticket is unblocked): return non-converged with the cycle, so the human can break the cycle in the plan before retrying.
- Never swallow an API or write error, and never report the done predicate as satisfied when tickets are missing or blockers are undeclared.

## Output
A set of published tracker tickets or local ticket files, each declaring its blockers. The source plan's Delivery section updated with the ticket URLs or file paths. The executable frontier identified as the unblocked ticket set.

## Provenance

Adapted from mattpocock/skills, `skills/engineering/to-tickets`, pinned revision `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76`, MIT license, Copyright (c) 2026 Matt Pocock. Clean-room adaptation: the tracer-bullet decomposition, blocker-declaration, and Delivery-section write-back mechanism are retained; expression is rewritten. The copyright and permission notice is retained in `licenses/NOTICE` per the license obligation.
