---
name: parallel-launch
description: 'Use when work splits into independent sub-tasks or cross-domain research. Not for durable scope ownership with per-scope review: use partition-scopes-to-subagents.'
---

# Parallel launch

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The request has multiple independent sub-tasks, cross-domain research, or parallelizable work. |
| Authority | Reversible local: writes only local targets explicitly named in the request or agent assignments; rollback is the captured prior state or exact undo operation. No remote mutation. |
| Side effect | Execute concurrent subagents and report composed output in chat. This orchestration creates no durable file of its own; delegated local changes remain confined to their named targets. |
| Done | Return composed output after completeness, consistency, accuracy, and scope review passes, or return each usable partial result with the exact gap and a targeted follow-up when an agent or review fails. |

## Inputs

Required: the request, its acceptance criteria, and enough source context for each sub-task to be executed without shared agent memory. For implementation, the request must name every local target that agents may change. Optional: output format, domain-specific agent choices, and ordering constraints.

## Procedure

1. Split the request by independent concern. A concern is independent only when it shares no mutable target and has no ordering dependency with another concern. Do not split work merely to increase agent count; if fewer than two concerns are independent, execute the request directly. Done when: the request is split into independent concerns or executed directly.
2. Put dependent concerns into later batches whose prerequisites are explicit. Before any mutation, list each batch's named local targets and capture the prior content or an exact undo operation for each target. Done when: dependent concerns are batched with prerequisites and prior states captured.
3. Give each concern to one task-specific agent with the complete context it needs, a bounded objective, named writable targets, acceptance criteria, and a concrete result format. Agents must not rely on memory or output from another concurrent agent. Done when: each concern has a self-contained agent brief.
4. Launch every concern in the current independent batch together in one concurrent dispatch. Wait for the batch to finish before dispatching work that depends on it. Done when: the batch is dispatched concurrently and dependent work is held.
5. Compose completed results. Merge non-conflicting outputs; reconcile overlaps against the request and report any unresolved trade-off rather than choosing without evidence. Done when: non-conflicting outputs are merged and overlaps are reconciled or reported.
6. Dispatch an independent reviewer with the original request, acceptance criteria, and composed result. Require it to check that every concern is covered, outputs do not contradict one another, claims are supported, and nothing exceeds scope; for implementation, also check specification compliance and code quality. Done when: the reviewer checks coverage, consistency, claims, and scope.
7. Return the composition only when review passes. If an agent or review fails, preserve usable results and return the exact gap plus one targeted follow-up that would close it; do not widen scope or invent missing evidence. Done when: the composition is returned on review pass, or the gap and follow-up are returned on failure.

## Failure and recovery
- Invalid partition: Shared mutable targets or hidden ordering make a batch unsafe. Do not launch that batch; repartition it into sequential work, or return `blocked` with the conflicting targets or dependency.
- Agent failure or incomplete result: Keep independently usable results unchanged and return `blocked` with the failed concern, observed error, missing acceptance criterion, and targeted follow-up.
- Conflicting results: Reconcile only from supplied evidence. If evidence cannot resolve the conflict, return `non-converged` with both positions, the unresolved fact, and the targeted check needed.
- Review failure: Do not present the composition as complete. Return `non-converged` with failed review criteria, usable partial results, and a targeted follow-up.
- Unauthorized or partial mutation: Stop further dispatch. Restore every changed local target from its captured prior content or exact undo operation, then report restoration status and any target that could not be restored. Never conceal an error or claim the done predicate holds.

## Output
One reviewed composition mapping each concern to its result with review passage recorded, or, on failure, usable partial results, terminal classification (`blocked` or `non-converged`), exact gap, observed error or conflict, restoration status, and one targeted follow-up.
