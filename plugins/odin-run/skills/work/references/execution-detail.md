# Execution detail

Branch-specific reference for `work`. Contains the Phase 0 input triage rules, execution engine selection, test coverage checklist, and merge conflict handling.

## Phase 0: input triage

### Plan document (input resolves to an existing file)

1. Read frontmatter (YAML) or visible header (HTML) for `artifact_readiness` before reading the body.
2. Classify `artifact_readiness`:
   - `requirements-only` → stop. Tell the user the plan states requirements only and needs an implementation-ready plan before execution.
   - `implementation-ready` plus `execution: code` → continue to Phase 1.
   - Any other readiness value or non-code/unclassified execution mode → stop and ask the user for an implementation-ready code plan.
   - `execution: knowledge-work` → stop and route to the knowledge-work carve-out.
   - Progress-like values (`active`, `in_progress`, `completed`, `done`) are invalid readiness values. Stop and ask for plan repair.
3. If `execution: knowledge-work` is present, stop and route to the knowledge-work carve-out.
4. Otherwise (legacy plan, field absent, or `execution: code`) → continue to Phase 1.

### Blank invocation

1. Glob `docs/plans/*.md` and `docs/plans/*.html`.
2. Inspect metadata for the newest candidates and auto-select only when the newest matching artifact is `implementation-ready` plus `execution: code` or a legacy code plan.
3. Stop instead of silently executing a requirements-only, knowledge-work, approach-plan, or unclassified artifact. Ask for an explicit path or an implementation-ready plan.
4. If a requirements-only candidate has a same-basename file in the other format that is `implementation-ready`, the requirements-only copy is stale: select the implementation-ready sibling.

### Bare prompt (input does not resolve to an existing file)

1. Scan the work area: identify files likely to change.
2. Find existing test files for those areas (Test Discovery).
3. Note local patterns and conventions.
4. Assess complexity:
   - Trivial (1–2 files, no behavioral change): proceed to Phase 1 step 2, then implement directly with no task list and no execution loop. Apply Test Discovery if behavior-bearing code is touched.
   - Small / Medium (clear scope, under ~10 files): build a task list from discovery. Proceed to Phase 1 step 2.
   - Large (cross-cutting, 10+ files, touches auth/payments/migrations): inform the user this would benefit from a planning pass in plan mode. Honor their choice. If proceeding, build a task list and continue.

## Execution engine selection

| Engine | Availability signal |
|---|---|
| Parallel subagents | Harness supports `Agent` with `isolation: "worktree"` and `run_in_background: true` |
| Serial subagents | Harness supports subagent dispatch |
| Inline | Fallback when no subagent mechanism available |

Prefer subagents for structured multi-unit plans. Parallelize independent units only after confirming harness isolation capability. Never nest worktrees.

Dispatch each worker with: the plan path, a bounded unit packet (Goal Capsule, Definition of Done, unit section, Verification Contract entries, referenced R/F/AE/KTD excerpts), the unit's Goal, Files, Approach, Execution note, Patterns, Test scenarios, Verification, and resolved deferred questions. Instruct workers to check Test Scenario Completeness before writing tests.

Dispatch constraints:
- Omit `mode` parameter so user permission settings apply. Do not pass `mode: "auto"`.
- In shared workspace: workers must not `git add`, commit, or run the full test suite concurrently.
- In worktree-isolated branches: workers may stage inside their own branch; orchestrator owns merging in dependency order and runs authoritative tests. Workers never commit; the orchestrator never commits. Staging is for isolation only.

After each serial unit: review the diff against unit scope and `Files:`, run relevant tests, fix before dispatching next, update task list. Do not commit.

## Test Scenario Completeness

Before writing tests for a feature-bearing unit, verify coverage:

| Category | When | How to derive if missing |
|---|---|---|
| Happy path | Always | Unit's Goal and Approach for core input/output pairs |
| Edge cases | Unit has meaningful boundaries | Boundary values, empty/nil inputs, concurrent access |
| Error/failure paths | Unit has failure modes | Invalid inputs, permission/auth denials, downstream failures |
| Integration | Unit crosses layers | Cross-layer chain exercised without mocks |

## Merge conflicts

Handle merge conflicts immediately. Do not commit to resolve them; fix the conflict in the working tree and leave the result for the finalizer.

## System-Wide Test Check

Before marking a task done, run:

- What fires when this runs? (trace two levels out from callbacks, middleware, observers, event handlers)
- Do tests exercise the real chain? (write at least one integration test using real objects, no mocks for interacting layers)
- Can failure leave orphaned state? (trace failure path, test cleanup or idempotency)
- What other interfaces expose this? (grep for method/behavior in related classes)
- Do error strategies align across layers? (list specific error classes at each layer)

Skip for leaf-node changes with no callbacks, no state persistence, no parallel interfaces.
