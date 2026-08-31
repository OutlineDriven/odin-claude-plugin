---
name: workflows-driven
description: 'Use when asked to drive decomposable work as a deterministic multi-subagent workflow with phased fan-out and adversarial verification. Also handles audits, migrations, broad research sweeps, or scale one context cannot hold. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Workflows-driven

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The work is an audit, a migration, a broad research or review sweep, or scale that one context cannot hold. |
| Authority | reversible-local: write only named local evidence artifacts; rollback is a no-op because all mutable state is scoped to per-task evidence files owned exclusively by one worker. |
| Side effect | Phased fan-out of subagent tasks under per-task contracts writes evidence files in disjoint scopes; adversarial and consistency critics verify. |
| Done | All workflow phases complete, the parent's shared proof run passes, and circuit breakers were honored. |

## Inputs

Required: the work item. Optional: any existing evidence ledger at the artifact path. The skill does not read conversation memory or another skill's output.

## Procedure

1. Route. If the work is a quick lookup, a single edit, an ordered plan with per-task review gates, or a flat split with no phase structure, do that work inline and stop. Only proceed when the work decomposes into parallel slices, needs independent adversarial checks, or exceeds one context window. Done when: routing decision is made — inline work is done, or the workflow proceeds.
2. Scout. Scout inline until the full work list can be named. List the files, scope the diff, find the call sites. Do not spawn workers while scouting. Done when: full work list is named.
3. Order phases. Order the workflow as phases. A phase is one wave of parallel tasks plus a barrier. Later phases consume earlier phases' evidence. Name each phase explicitly. Done when: phases are ordered and named.
4. Batch context. Carry the shared contract for the whole wave in the batch context: `# Goal` (what the wave accomplishes), `# Constraints` (rules, non-goals, permissions, verification limits), `# Contract` (shared interfaces, output shape, coordination rules). Done when: batch context is composed.
5. Per-task assignments. Each assignment is self-contained: `# Target` (exact files, symbols, or evidence surface; explicit non-goals), `# Change` (what to inspect or modify, step by step, patterns to reuse), `# Acceptance` (observable result and return packet). Workers skip formatters, linters, and project-wide tests; the parent runs shared proof once. Done when: all assignments are composed.
6. Disjoint write scopes. Every writing worker owns its paths exclusively. Shared files (manifests, configs, indexes) are edited only by the parent. If two workers must write one file, re-cut the wave before dispatching. Done when: write scopes are disjoint with no shared-file conflicts.
7. Pointers, not payloads. Workers exchange file paths and artifacts, never pasted blobs. Done when: exchange protocol is established as pointers.
8. Dispatch phase. Run the full wave. Workers execute independently. The parent stays idle until workers return. Done when: wave is dispatched and workers return.
9. Circuit breaker. Give each batch a success threshold. When a batch falls below it, stop the workflow and rediagnose instead of spending the remaining budget on a broken playbook. Done when: success threshold is set and evaluated.
10. Parent proof pass. After each wave, the parent reads returned evidence, resolves contradictions, and runs the shared proof. A wave declared done without the parent's own proof pass is a red flag. Done when: parent proof pass is run and passes, or contradictions are identified.
11. Repeat. Continue to the next phase. Later phases consume earlier phases' evidence. Done when: next phase begins or all phases are complete.
12. Close. When all phases complete and the parent's proof pass passes, the workflow is done. Done when: workflow is closed with all phases complete and proof pass passing.

### Materialize on the host

Detect the host environment and apply the matching fan-out primitive per `references/host-materialization.md` (Claude Code, oh-my-pi, or neither).

## Failure and recovery
| Failure class | Response |
|---|---|
| Worker returns no evidence | Diagnose whether the worker ran at all; if scope was sound, retry once with the same contract. |
| Batch falls below success threshold | Stop the workflow. Rediagnose. Do not continue to the next phase. |
| Two workers collide on one file | Stop the wave. Re-cut the partition so each file is owned by one worker. |
| Parent proof pass fails | Examine the returned evidence. Fix the root cause before the next phase. |
| Coverage cap applied | Declare what was dropped and why before acting on partial evidence. Do not silently cap. |

Partial-result rule: evidence files from successful workers in a failed wave are kept; the workflow does not delete them on failure. Non-mutation rule: the parent does not edit a worker's evidence; it reads and classifies.

## Output
The parent produces a consolidated report per phase: evidence summary, contradictions resolved, proof pass result, and next-phase readiness. The final phase output is the workflow closure report.
