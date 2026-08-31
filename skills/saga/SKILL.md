---
name: saga
description: 'Use when a user runs saga or asks to autonomously build a sizable feature. Produces a spec tree, delegates to worker subagents in isolated worktrees, validates at each milestone, and gates user acceptance before VCS commit. Not for executing a given plan — use subagent-driven.'
---

# Saga

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User runs saga or asks to autonomously build a sizable feature. |
| Authority | Orchestrator writes specs to disk, delegates to workers via run_agents, and validates each task to its criteria before integration and user acceptance gate. All local writes happen in git worktrees (VCS-reversible). Milestone-level validation gates progression. User acceptance is the terminal gate before any VCS commit. |
| Side effect | Creates a saga directory outside the repo and spawns workers in isolated git worktrees. |
| Done | All tasks meet validation, milestones pass, user accepts. |

## Inputs

- Feature request (user-provided prompt or description).
- Target repository path.
- Saga directory is confirmed with user before creation.
- Reference materials (saga-spec-template, validation-strategies, continuing-a-saga) are embedded in this skill and read before drafting specs or resuming.

## Procedure

### Phase 1 — planning (orchestrator + user)

1. **Intake.** Restate the request as a one-paragraph problem statement and the rough shape of the feature. Identify major unknowns. Pick a saga directory name under `~/.sagas/` from a feature slug plus timestamp (e.g. `~/.sagas/dark-mode-20260609-0028/`). Confirm the path with the user before creating anything.

2. **Discover environment.** By inspecting the repo first, determine:
   - Program type (web app, native GUI, TUI, CLI/library, backend service).
   - Whether computer use is available (local, remote only, or not available).
   - Test runner, build, lint, and typecheck commands — confirm they run.
   - How the program is launched for manual or interactive verification.
   Record findings in `SAGA.md` under the environment section.

3. **Close ambiguity.** Iterate with the user via `ask_user_question` (with concrete options, recommended_option_index set) until behavior, scope boundaries, edge cases, data shapes, error handling, non-goals, and the acceptance bar are unambiguous. Batch up to 4 related questions per call.

4. **Write saga exit criteria.** Before decomposing, define the concrete, checkable conditions that mean the feature is complete and correct. These are the Phase 3 contract.

5. **Decompose into milestones and tasks.** Break work into milestones (ordered by dependency, independently meaningful) and tasks (scoped for one worker in one focused effort). For each task, specify its scope, owned files/surfaces, dependencies, validation criteria, and validation method. Use the templates in the Reference files section below. Write the spec tree: milestone index and exit criteria in `SAGA.md`, milestone detail in `MILESTONE.md`, task detail in each task spec.

6. **Get approval.** Present the full spec tree to the user via `ask_user_question`. Do not begin Phase 2 until approved.

### Phase 2 — implementation (worker fleet)

1. **Launch workers.** Use `run_agents` to delegate tasks. The orchestrator never implements feature code. Immediately record each worker's agent/run ID, task, branch, and worktree in `PROGRESS.md`.

2. **Isolate local workers.** Give each worker its own git worktree and branch following the convention `saga/<saga-name>/m<M>t<T>-<task-slug>`. Create with:
   ```
   git worktree add ../saga-<saga-name>-m<M>t<T> -b saga/<saga-name>/m<M>t<T>-<task-slug> <base>
   ```
   Workers must never share a checkout.

3. **Per-worker contract.** Instruct each worker to: implement only its assigned task; self-validate against the task's criteria using the prescribed method (computer use, interactive CLI, or tests) in a fix→validate loop; create a durable handoff (commit to the task branch for local workers; pushed branch, draft PR, or patch for remote workers); remove the worktree only after the durable handoff exists (`git worktree remove <path> --force`); report branch name, commit hash, changed files, validation evidence, and pass/blocked status.

4. **Collect and act on reports.** Update `PROGRESS.md` with per-task status and evidence. Handle blocked tasks: re-delegate with retained context, adjust the task spec, or escalate to the user via `ask_user_question` with options — only if the blocker is a genuine spec gap or external decision.

5. **Integrate each milestone.** Merge the milestone's branches into an integration branch, resolve conflicts, run milestone-level validation, and remove any worktrees left behind before proceeding.

6. **Maintain state.** Update `PROGRESS.md` continuously. Re-read specs and `PROGRESS.md` from disk rather than holding state in context.

### Phase 3 — final validation

1. **Run exit criteria.** Execute all saga-level exit criteria using the strongest available method. Summarize evidence against each criterion.

2. **Present completion report.** What was built, how each exit criterion was validated, exact steps for manual verification.

3. **Loop user for acceptance.** Present via `ask_user_question` (accept or report specific issues). If issues are reported, capture them as new tasks, run a focused Phase 2 mini-loop, and re-present. Repeat until the user accepts. Only then is the saga complete.

### Continuing a saga

When asked to continue, resume, or pick up a saga:

1. **Locate.** Find the saga directory under `~/.sagas/`. If ambiguous, ask the user via `ask_user_question`.
2. **Rebuild orientation.** Read `SAGA.md` (problem, environment, exit criteria, phase, milestone index) and `PROGRESS.md` (phase, current milestone, task statuses, worker run IDs, open questions, recent log). Open only the spec for the milestone about to be acted on.
3. **Reconcile.** Verify git state for done/in-progress tasks: check whether branches and worktrees exist, whether they have been merged. Spot-check validation evidence for done tasks. Update `PROGRESS.md` to match reality.
4. **Resume.** From the reconciled state, resume Phase 2 at the current milestone or Phase 3 if all milestones are integrated. Follow the Phase 2/3 procedure above.
5. **Keep the contract.** Do not silently re-scope. If the spec is wrong, update the relevant spec file and note it in `PROGRESS.md` under Decisions & Deviations; escalate to the user if agreed behavior or exit criteria change.

## Failure and recovery
- **Spec gap:** ambiguity unresolved in Phase 1 blocks delegation. Escalate to user via `ask_user_question` with options; do not proceed until resolved.
- **Worker blocked:** collect the report, update `PROGRESS.md`, re-delegate with retained context or adjust the task spec; escalate to user if the blocker is not resolvable from the spec.
- **Milestone validation failure:** revert to pre-integration state (branches and commits are preserved in git history); re-delegate affected tasks.
- **Phase 3 rejection:** capture reported issues as new tasks; run a focused Phase 2 mini-loop; re-present.
- **Unachievable validation:** if a criterion cannot be checked with available tools, update the spec and note the finding; escalate to the user.
- **Partial-result rule:** never remove a worktree while validated or useful partial work is still inside it.
- **Non-rollback rule:** once a durable handoff exists (commit pushed, draft PR opened, patch returned), the work is preserved regardless of subsequent failures.
- **Non-converged result:** if a task cannot be completed despite re-delegation and spec adjustment, record the blocker in `PROGRESS.md` and escalate to the user. Do not silently declare done.

## Output
A completed feature meeting all saga exit criteria. A completion report listing what was built, how each criterion was validated, and exact steps for manual verification. Terminal state is user acceptance.

## Provenance

Origin: https://github.com/warpdotdev/common-skills, revision f589e224907eda566c13755529f59db563090d14.
License: MIT — Copyright (c) 2026 Denver Technologies, Inc. Adaptation permitted provided the copyright notice and permission notice are retained. No copyleft obligations.
Adaptation: spec-tree-driven autonomous build workflow and validation strategies rewritten clean-room in ODIN style; saga-spec-template, validation-strategies, and continuing-a-saga embedded as in-skill reference material under the Reference files section below. The vendored third-party JS bundle (~1.1 MB) from the original source is not carried over.

### Reference files

### references/saga-spec-template.md

```markdown
# Saga directory & spec templates

A saga is a tree of spec files plus a progress log, stored in its own directory outside the repo so it survives across orchestrator sessions and can be resumed. Each level carries its own validation criteria.

### Directory layout

~
~/.sagas/<saga-name>/
├── SAGA.md                      # overview, environment, saga-level exit criteria, milestone index
├── PROGRESS.md                  # live, continuously-updated execution log and current state
└── milestones/
    ├── 01-<slug>/
    │   ├── MILESTONE.md          # milestone spec + milestone-level validation criteria
    │   └── tasks/
    │       ├── 01-<slug>.md      # task spec + task-level validation criteria
    │       └── 02-<slug>.md
    └── 02-<slug>/
        ├── MILESTONE.md
        └── tasks/ ...

- `<saga-name>` must be unique and stable — a feature slug plus a timestamp, e.g. dark-mode-20260609-0028.
- Number milestone/task directories and files (01-, 02-, …) so order is obvious and dependency references are stable. Refer to tasks as M<milestone>.<task> (e.g. 1.2).
- Keep SAGA.md small; push detail down into MILESTONE.md and task specs.

### SAGA.md template

# Saga: <feature name>
- Saga directory: ~/.sagas/<saga-name>
- Repo: <path> @ <base branch>
- Status: planning | in-progress | final-validation | complete

### Problem statement
<1–2 paragraphs: what we are building and why.>

### Scope & non-goals
- In scope: <bullets>
- Out of scope / non-goals: <bullets>
- Decisions delegated to agent discretion: <only those the user explicitly allowed; otherwise "none">

### Environment & capabilities
- Program type: <web app | native GUI | TUI | CLI/library | backend service | ...>
- Run/launch command: <how to start it for manual/interactive verification>
- Test command(s): <unit / integration runner commands, confirmed working>
- Build / lint / typecheck command(s): <commands>
- Computer use available: <yes (local) | yes (remote only) | no>
- Default validation method for this saga: <derived from the above; see validation-strategies reference>

### Saga exit criteria
<Concrete, checkable conditions that mean the entire feature is done and correct.>
1. <criterion>
2. <criterion>

### Milestone index
<Ordered list with one line each + dependency notes.>
1. 01-<slug> — <one line>; depends on: none
2. 02-<slug> — <one line>; depends on: 01-<slug>

### MILESTONE.md template

# Milestone <n>: <name>
- Saga: <saga-name>
- Depends on: <milestone ids, or "none">

### Goal
<What this milestone delivers and why it sits here in the order.>

### Milestone validation criteria
<Checkable conditions that mean the whole milestone is done and integrates correctly.>
1. <criterion>
2. <criterion>

### Tasks
<Index of this milestone's task specs + intra-milestone dependencies.>
- 01-<slug> — <one line>; depends on: none
- 02-<slug> — <one line>; depends on: 01-<slug>

### Task spec template (tasks/NN-<slug>.md)

# Task <m>.<n>: <name>
- Milestone: <m>
- Depends on: <task ids, or "none">

### Scope
<What this single worker does; small enough for one focused effort.>

### Owned files/surfaces
<Paths/modules this task may touch. Two parallel tasks must not own the same files.>

### Interfaces produced/consumed
<Exact API, schema, or function signatures other tasks rely on, if any.>

### Validation method
<computer use | interactive CLI | unit tests | integration tests | combination>

### Validation criteria (the contract)
<Explicit, checkable. Satisfying all of these should leave little-to-no possibility the task was done incorrectly.>
1. <criterion>
2. <criterion>

### Evidence required
<What the worker must return to prove completion: named test output, screenshots, CLI transcript, sample command output, etc.>

### PROGRESS.md template

# Saga progress: <feature name>
- Saga directory: ~/.sagas/<saga-name>
- Repo: <path> @ <base branch>
- Phase: 2 (implementation) | 3 (final validation)
- Current milestone: <n>

### Task status
<One line per task: status, branch, evidence pointer.
Branch naming convention: saga/<saga-name>/m<M>t<T>-<task-slug>>
- 1.1 <name>: done — branch saga/<saga-name>/m1t1-<slug>, commit <hash>, evidence: <pointer>
- 1.2 <name>: in progress — worker <name>, worker_run_id <agent/run id>, branch saga/<saga-name>/m1t2-<slug>, worktree ../saga-<saga-name>-m1t2
- 1.3 <name>: blocked — <reason / decision needed>
- 2.1 <name>: pending

### Integration notes
<Per milestone: merge order, conflicts resolved, milestone-level validation results.>

### Decisions & deviations
<Any spec changes made mid-flight and why; keep the specs updated too.>

### Open questions for user
<Only if a blocker truly requires escalation.>

### Log
<Reverse-chronological short entries: timestamp — what happened.>
- 2026-06-09T00:40Z — Milestone 1 integrated; all milestone criteria pass.

### Rules

- Saga exit criteria / milestone criteria / task criteria form nested contracts. Each must be checkable by a concrete method.
- Milestones are ordered by dependency and independently meaningful. Tasks within a milestone should be as independent (parallelizable) as the feature allows.
- Tasks must be sized for a single worker in one focused effort. If a task needs multiple distinct deliverables or spans many unrelated files, split it.
- Owned files/surfaces prevent collisions between parallel workers.
- Keep PROGRESS.md and the specs in sync with reality; they are the only state a resuming orchestrator has.
```

### references/validation-strategies.md

```markdown
# Validation strategies

Validation makes a saga autonomous. When each task has precise criteria checked by an appropriate method, workers can self-verify and the orchestrator can assess their reports.

### 1. Discover what validation is feasible

Before defining any criteria (Phase 1), establish:
- The program type (web app, native GUI, TUI, CLI/library, backend service).
- Whether computer use (browser/GUI automation) is available to the orchestrator or to remote workers.
- The test toolchain: test runner, integration harness, build, lint, typecheck — and confirm the commands actually run.
- How the program is launched for manual or interactive verification.
Record these in SAGA.md. Criteria that cannot be checked cannot serve as validation.

### 2. Choose a validation method

Pick the strongest method the task and environment support. Tests are the baseline regardless — prefer to add automated tests for everything that can be tested.

Priority order:
1. **Computer use — for GUI and web UI behavior.** Drive the running app and inspect the result (screenshots, asserted on-screen state). If computer use is only available remotely, route that validation through a remote worker with computer use enabled and have it return screenshots or evidence as a durable artifact.
2. **Interactive CLI subagent — for TUIs and interactive terminal programs.** Drive the program in an interactive session: send input, observe rendered output, assert expected states.
3. **Unit & integration tests — otherwise, or when the above are unavailable.** Write and run tests that assert the task's criteria. This is also the fallback when computer use or interactivity is not available.

A task may combine methods. State the method(s) explicitly in the task.

### 3. Write concrete validation criteria

The bar: when the criteria are satisfied, there should be little or no possibility the task was completed incorrectly.

- **Make each criterion checkable, not aspirational.** "Login works" is not a criterion. "Submitting valid credentials redirects to /dashboard and shows the user's name; invalid credentials show an inline error and do not navigate" is.
- **Name the observable signal.** Tie each criterion to a concrete signal: a passing test name, an HTTP status + body, an on-screen element/text, a CLI exit code + output, a file's contents.
- **Cover the unhappy paths.** Specify error handling, empty/edge inputs, and boundaries — not just the happy path.
- **Pin down interfaces.** If the task produces an API, schema, or function signature other tasks depend on, state the exact shape.
- **State what must NOT change.** Include "existing X still passes / behaves as before" as an explicit criterion where regressions are a risk.
- **Require evidence.** Each task must specify what the worker returns to prove completion: test output, screenshots, an interactive transcript, sample command output. No evidence, no pass.

If a task's criteria cannot be expressed this concretely, the task is under-specified: split it, add detail, or resolve the ambiguity with the user via ask_user_question with options.

### 4. Self-validation loop

Each worker treats its criteria as a checklist:
1. Implement the task.
2. Run the prescribed validation method and check every criterion.
3. If any fail, fix and re-validate. Repeat until all pass or genuinely blocked.
4. Return the evidence and a clear pass/blocked status.

The orchestrator trusts a "pass" only when the returned evidence actually demonstrates the criteria. At milestone boundaries, re-run validation across the integrated result, since independently-passing tasks can still conflict once merged.
```

### references/continuing-a-saga.md

```markdown
# Continuing a saga

Use this when asked to continue, resume, or pick up a saga — typically a fresh orchestrator with no memory of the earlier session.

### 1. Locate the saga directory

Find the saga under ~/.sagas/. If the user named it or gave a path, use that. Otherwise ls ~/.sagas/ and, if ambiguous, ask the user which one (via ask_user_question listing the candidates). The directory name is the saga's stable identity.

### 2. Rebuild orientation

Read, in this order, and stop once the next action is known:
1. SAGA.md — problem statement, environment/capabilities, saga exit criteria, milestone index, and Status.
2. PROGRESS.md — Phase, Current milestone, per-task status, worker run IDs for any in-progress tasks, integration notes, open questions, and the recent log.
Do not bulk-read every MILESTONE.md and task spec. Open only the spec(s) for the milestone about to be acted on.

### 3. Reconcile the log against reality

PROGRESS.md can be stale if the previous session was interrupted. Before trusting it, verify the actual state for anything not clearly settled:
- Check git: do the branches/worktrees referenced for done/in-progress tasks exist? Were they merged? Enumerate saga branches with git branch --list '*saga/<saga-name>/*'.
- For tasks marked done, spot-check the evidence still holds — re-run the task's validation if there is any doubt that it landed.
- For tasks marked in progress, use the recorded worker_run_id to decide whether the prior worker is still reachable. If there is no addressable run ID, or the agent is no longer reachable, treat the task as not started and re-delegate from its spec.
Update PROGRESS.md to match reality before proceeding, noting the reconciliation in the log.

### 4. Determine the next action and resume

From the reconciled state:
- If milestones remain, resume the Phase 2 orchestration loop at the current milestone.
- If all milestones are integrated and validated, move to Phase 3: check the saga exit criteria and ask the user for manual acceptance.
- If a blocker or open question recorded in PROGRESS.md needs the user, resolve it first via ask_user_question with options.

### 5. Keep the contract intact

Remain bound by the same specs and validation criteria as the original orchestrator. Do not silently re-scope. If resuming reveals the spec is wrong or a task's criteria are unachievable, update the relevant spec file (and note it under Decisions & deviations in PROGRESS.md), and escalate to the user if it changes agreed behavior or the saga exit criteria.

### Quick checklist

- [ ] Found and confirmed the saga directory.
- [ ] Read SAGA.md + PROGRESS.md; know phase, current milestone, and next action.
- [ ] Reconciled branches/worktrees/evidence with git; fixed PROGRESS.md.
- [ ] Resumed the correct phase loop from SKILL.md.
- [ ] Kept specs and PROGRESS.md current as work proceeds.
```
