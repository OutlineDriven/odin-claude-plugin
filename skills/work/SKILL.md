---
name: work
description: 'Use when implementing from a plan or spec path, or a clear build request. Drives end-to-end execution from input triage through shipping. Don''t use for open-ended debugging (use debug), exploration, or read-only research.'
disable-model-invocation: true
---

# Work execution

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Implementation starts from a plan or spec path or a clear build request (not an open-ended bug). |
| Authority | Write only named local artifacts; rollback path is git. |
| Side effect | Implements plan units, lands commits, runs system-wide test checks, and executes the shipping tail (review plus residual-work gate). |
| Done | All plan units are implemented and verified, the shipping tail has run, and the work is shipped or handed off with residuals named. |

## Inputs

- `$ARGUMENTS`: plan path, spec path, or bare work description. Blank to auto-detect the newest implementation-ready code plan in `docs/plans/`. Non-empty string is treated as a path only when it resolves to an existing readable file.
- Plan document (path input resolves to file): read metadata before body.
- Bare prompt (no file resolves): scan work area, assess complexity, route.

## Procedure

### Phase 0: input triage

**Plan document** (input resolves to an existing file):

1. Read frontmatter (YAML) or visible header (HTML) for `artifact_readiness` before reading the body.
2. Classify `artifact_readiness`:
   - `requirements-only` → stop. Tell the user the plan states requirements only and needs an implementation-ready plan before execution. Work it up in plan mode or enrich the artifact, then re-invoke.
   - `implementation-ready` plus `execution: code` → continue to Phase 1.
   - Any other readiness value or non-code/unclassified execution mode → stop and ask the user for an implementation-ready code plan. Do not auto-execute as code.
   - `execution: knowledge-work` → stop and route to the knowledge-work carve-out.
   - Progress-like values (`active`, `in_progress`, `completed`, `done`) are invalid readiness values. Stop and ask for plan repair.
3. If `execution: knowledge-work` is present, stop and route to the knowledge-work carve-out.
4. Otherwise (legacy plan, field absent, or `execution: code`) → continue to Phase 1.

**Blank invocation:**

1. Glob `docs/plans/*.md` and `docs/plans/*.html`.
2. Inspect metadata for the newest candidates and auto-select only when the newest matching artifact is `implementation-ready` plus `execution: code` or a legacy code plan.
3. Stop instead of silently executing a requirements-only, knowledge-work, approach-plan, or unclassified artifact. Ask for an explicit path or an implementation-ready plan.
4. If a requirements-only candidate has a same-basename file in the other format (`<basename>.md` / `<basename>.html`) that is `implementation-ready`, the requirements-only copy is stale: select the implementation-ready sibling instead of stopping.

**Bare prompt** (input does not resolve to an existing file):

1. Scan the work area: identify files likely to change.
2. Find existing test files for those areas (Test Discovery).
3. Note local patterns and conventions.
4. Assess complexity:
   - **Trivial** (1–2 files, no behavioral change): proceed to Phase 1 step 2, then implement directly with no task list and no execution loop. Apply Test Discovery if behavior-bearing code is touched.
   - **Small / Medium** (clear scope, under ~10 files): build a task list from discovery. Proceed to Phase 1 step 2.
   - **Large** (cross-cutting, 10+ files, touches auth/payments/migrations): inform the user this would benefit from a planning pass in plan mode. Honor their choice. If proceeding, build a task list and continue.

### Phase 1: quick start

**Step 1 — Read plan and clarify** (skip if arriving from Phase 0 with a bare prompt):

1. Do not read the whole plan first. Build a section map, then read: metadata, `Goal Capsule`, `Verification Contract`, `Definition of Done`, the `Implementation Units` heading list, and only the active U-ID section plus referenced R/F/AE/KTD excerpts.
2. Scan headings: Markdown via `rg -n '^#{1,3} ' <plan>`; HTML via `<h1>` through `<h3>` with anchor ids.
3. Match stable section names / unit IDs, ignoring wrapper tags.
4. Treat the plan as a decision artifact, not an execution script.
5. Note `Execution note` on each unit (execution posture).
6. Note `Deferred to Implementation` / `Implementation-Time Unknowns` before starting.
7. Note `Scope Boundaries` (explicit non-goals); refer back if implementation drifts.
8. If anything is unclear, ask clarifying questions now. Do not edit the plan body during execution.

**Step 2 — Setup environment:**

```bash
current_branch=$(git branch --show-current)
default_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
if [ -z "$default_branch" ]; then
  default_branch=$(git rev-parse --verify origin/main >/dev/null 2>&1 && echo "main" || echo "master")
fi
```

- **On a feature branch** (not default): if branch name is opaque, suggest `git branch -m <meaningful-name>` derived from the plan title. Ask: continue on current branch, create new branch, or use worktree.
- **On default branch**: offer Option A (new branch), Option B (worktree), or Option C (explicit human permission to commit to default).

**Step 3 — Create task list** (skip if Phase 0 routed as Trivial):

1. Derive tasks from implementation units, dependencies, files, test targets, and verification criteria.
2. Preserve U-IDs as prefixes in task subjects (e.g., "U3: Add parser coverage").
3. Carry each unit's `Execution note` into the task when present.
4. Read each unit's `Patterns to follow` before implementing.
5. Use each unit's `Verification` field as the primary done signal.
6. Do not expect the plan to contain exact shell commands or micro-step TDD instructions.
7. Include dependencies between tasks. Prioritize. Include testing and quality-check tasks.

**Step 4 — Choose execution engine and strategy:**

Probe the harness for engine availability:

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
- In worktree-isolated branches: workers may stage and commit inside their own branch; orchestrator owns merging in dependency order and runs authoritative tests.

After each serial unit: review the diff against unit scope and `Files:`, run relevant tests, fix before dispatching next, update task list, commit.

### Phase 2: execute

**Task execution loop** — for each task in priority order:

1. Mark task in-progress.
2. Read referenced files from the plan or Phase 0.
3. If unit work is already present and matches plan intent, verify match, mark complete, move on.
4. Look for similar patterns in codebase.
5. Find existing test files for implementation files being changed (Test Discovery).
6. Implement following existing conventions.
7. Honor `Execution note`: for test-first units write the failing test before implementation; for characterization-first units capture existing behavior before changing; for units without an Execution note proceed pragmatically.
8. Add, update, or remove tests to match changes.
9. Run System-Wide Test Check before marking done:
   - What fires when this runs? (trace two levels out from callbacks, middleware, observers, event handlers)
   - Do tests exercise the real chain? (write at least one integration test using real objects, no mocks for interacting layers)
   - Can failure leave orphaned state? (trace failure path, test cleanup or idempotency)
   - What other interfaces expose this? (grep for method/behavior in related classes)
   - Do error strategies align across layers? (list specific error classes at each layer)
   Skip for leaf-node changes with no callbacks, no state persistence, no parallel interfaces.
10. Mark task completed.
11. Evaluate for incremental commit.

**Test Scenario Completeness** — before writing tests for a feature-bearing unit, verify coverage:

| Category | When | How to derive if missing |
|---|---|---|
| Happy path | Always | Unit's Goal and Approach for core input/output pairs |
| Edge cases | Unit has meaningful boundaries | Boundary values, empty/nil inputs, concurrent access |
| Error/failure paths | Unit has failure modes | Invalid inputs, permission/auth denials, downstream failures |
| Integration | Unit crosses layers | Cross-layer chain exercised without mocks |

**Incremental commits:**

| Commit when | Do not commit when |
|---|---|
| Logical unit complete | Small part of a larger unit |
| Tests pass + meaningful progress | Tests failing |
| About to switch contexts | Purely scaffolding with no behavior |
| About to attempt risky/uncertain changes | Would need a "WIP" message |

```bash
git add <files related to this logical unit>
git commit -m "feat(scope): description of this unit"
```
Handle merge conflicts immediately.

**Test continuously:** run relevant tests after each behavior-bearing change. Fix failures immediately. Add new tests for new behavior.

**Simplify opportunistically:** at phase boundaries or when the diff reaches 30 lines, reread the changed units and remove dead branches, repeated logic, tiny one-use wrappers, and special cases that the general path can absorb. Preserve observable behavior and rerun the changed-path checks. Do not run this pass after every small unit.

**Track progress:** update task tracker as tasks complete. Note blockers using plan IDs (U-IDs, R/F/AE IDs); do not invent IDs the plan does not supply. For long-running work, write progress to `/tmp/odin/work/<run-id>/progress.json` so state survives context compaction.

### Phase 3–4: quality check and shipping tail

When all Phase 2 tasks are complete:

1. Run a fresh diff review sized to the change. Check correctness, security boundaries, error paths, concurrency, resource ownership, changed-contract tests, and every affected caller. Skip only for a purely mechanical diff such as formatting, dependency metadata, lint-only output, or generated files.
2. Keep the review read-only. Record each finding with severity, file and line, failure scenario, and concrete correction; apply fixes only after the finding set is complete. Handle residuals through the Residual Work Gate.
3. Apply review findings: fix every actionable comment. For contested findings citing a project doc as mandating a change, resolve with evidence. For declined findings, record the reason.
4. After all findings are resolved or declined: ship the work.
5. If residuals remain after the review cycle: name each residual explicitly, report it, and yield.

## Failure and recovery
| Failure | Rule |
|---|---|
| Requirements-only plan | Stop. Request implementation-ready plan. |
| Invalid readiness value | Stop. Request plan repair. |
| Non-code/unclassified mode | Stop. Request explicit human decision. |
| Blank invocation, no implementation-ready plan | Stop. Ask for explicit path. |
| Large work, user declines planning pass | Proceed with task list and execution. |
| Harness isolation unavailable for parallel | Fall back to serial subagents or inline. |
| Contending units in shared workspace | Fall back to serial. |
| Serial unit review diff out of scope | Fix before next unit. |
| Review finding contested with doc evidence | Resolve with evidence; record declined finding with reason. |
| Non-converged after review cycle | Ship what passes. Name residuals explicitly. Yield terminal report. |

Partial-result rule: ship what is implemented and verified. Never claim done when tests fail or review findings are unresolved.

## Output
- Shipped code: all plan units implemented, verified tests pass, commits landed, shipping tail run.
- Terminal yield with residuals named when work cannot be completed.

## Provenance

Origin: current-odin-skill-tree. License: project-owned. Adapted from skills/work/SKILL.md (current:current-d:current:work) and skills/executing-plans/SKILL.md (source:source-superpowers:superpowers-013, MIT Jesse Vincent 2025, copied_allowed: true). Clean-room adaptation: procedure and contract restructured per SKILL.md literal contract; execution-engine selection and parallel-dispatch safety-check preserved inline from source.
