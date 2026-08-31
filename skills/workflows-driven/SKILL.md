---
name: workflows-driven
description: 'Use when asked to drive decomposable work as a deterministic multi-subagent workflow: phased fan-out under per-task contracts with adversarial verification. Use for audits, migrations, broad research or review sweeps, work needing independent cross-checks before committing, or scale one context cannot hold. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Workflows-driven

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The work is an audit, a migration, a broad research or review sweep, or scale that one context cannot hold. |
| Authority | reversible-local: write only named local evidence artifacts; rollback is no-op because all mutable state is scoped to per-task evidence files owned exclusively by one worker. |
| Side effect | Phased fan-out of subagent tasks under per-task contracts writes evidence files in disjoint scopes; adversarial and consistency critics verify. |
| Done | All workflow phases complete, the parent's shared proof run passes, and circuit breakers were honored. |

## Inputs

Required: the work item. Optional: any existing evidence ledger at the artifact path. The skill does not read conversation memory or another skill's output.

## Procedure

1. **Route.** If the work is a quick lookup, a single edit, an ordered plan with per-task review gates, or a flat split with no phase structure, do that work inline and stop. Only proceed when the work decomposes into parallel slices, needs independent adversarial checks, or exceeds one context window.

2. **Scout.** Scout inline until the full work list can be named. List the files, scope the diff, find the call sites. Do not spawn workers while scouting.

3. **Order phases.** Order the workflow as phases. A phase is one wave of parallel tasks plus a barrier. Later phases consume earlier phases' evidence. Name each phase explicitly.

4. **Batch context.** Carry the shared contract for the whole wave in the batch context:
   - `# Goal`: what the wave accomplishes.
   - `# Constraints`: rules, non-goals, permissions, verification limits.
   - `# Contract`: shared interfaces, output shape, coordination rules.

5. **Per-task assignments.** Each assignment is self-contained:
   - `# Target`: exact files, symbols, or evidence surface; explicit non-goals.
   - `# Change`: what to inspect or modify, step by step, patterns to reuse.
   - `# Acceptance`: observable result and return packet. Workers skip formatters, linters, and project-wide tests; the parent runs shared proof once.

6. **Disjoint write scopes.** Every writing worker owns its paths exclusively. Shared files (manifests, configs, indexes) are edited only by the parent. If two workers must write one file, re-cut the wave before dispatching.

7. **Pointers, not payloads.** Workers exchange file paths and artifacts, never pasted blobs.

8. **Dispatch phase.** Run the full wave. Workers execute independently. The parent stays idle until workers return.

9. **Circuit breaker.** Give each batch a success threshold. When a batch falls below it, stop the workflow and rediagnose instead of spending the remaining budget on a broken playbook.

10. **Parent proof pass.** After each wave, the parent reads returned evidence, resolves contradictions, and runs the shared proof. A wave declared done without the parent's own proof pass is a red flag.

11. **Repeat.** Continue to the next phase. Later phases consume earlier phases' evidence.

12. **Close.** When all phases complete and the parent's proof pass passes, the workflow is done.

### Materialize on the host

Detect the host environment and apply the matching fan-out primitive:

- **Claude Code** (Dynamic Workflows: a `/workflows` directory exists, plugins ship workflows as `.js` files): build and run the workflow for the task at hand. Save to `.claude/workflows/` only when the workflow recurs. Default ephemeral.
- **oh-my-pi** (an `eval` tool with `agent()`, `parallel()`, and `pipeline()` helpers): author the orchestration as eval code. A wave runs inline and synchronously inside the call; chain one eval call per phase.
- **Neither**: run the same contract inline as sequential waves of subagent calls with the same batch context and assignments; parent owns closure.

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

## Provenance

Origin: current-odin-skill-tree. Adaptation: the host-materialization paragraph was inlined from `skills/workflows-driven/references/claude-code.md` and `skills/workflows-driven/references/omp.md` (support paths not carried; content inlined per the authoring contract self-containment requirement). Module audited and moved from odin-run to odin-run-advanced per skill-foundry roster editorial ruling. No third-party expression copied.
