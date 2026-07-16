---
name: subagent-driven
description: Execute a multi-task plan. Use when the user says "execute with subagents", or hands you an ordered multi-task plan to run.
metadata:
  short-description: Per-task implementer→reviewer loop with an audit gate between tasks
---

# Subagent-Driven Development

## Three principles

1. **One task, one fresh implementer, isolated context.** You construct exactly what each worker needs; it never inherits your session, the plan file, or prior workers' history — that keeps it focused and keeps your context free for coordination.
2. **The audit is the completion gate, not the verifier.** A green verifier proves the worker's own check ran; a fresh reviewer auditing the diff against the brief proves the change is correct and in scope. A task is done only when both hold.
3. **Files carry state, not your context.** Briefs, reports, and diffs pass as files a fresh subagent reads; progress lives in a durable ledger that survives compaction; the ship is atomic commits, never a squash.

Execute a plan as a chain of delegated subagents. Each task gets a fresh
implementer with a self-contained brief; a fresh reviewer audits the result
before the next task starts; a broad whole-branch review closes the run.

**Continuous execution.** Do not check in between tasks. Run every task in the
plan without stopping. Stop only for: a BLOCKED status you cannot resolve, an
ambiguity that genuinely blocks progress, or all tasks complete. "Should I
continue?" prompts waste the user's time. They asked you to execute the plan.

**Narration.** Between tool calls, at most one short line. The ledger and tool
results carry the record.

## When to Use

Work decomposes into ordered tasks with clean boundaries and you want each
delegated, audited, and committed before the next starts: a written plan, a
checklist, "execute this with subagents."

## Pre-Flight Plan Review

Before Task 1, scan the plan once for self-conflicts: tasks that contradict
each other or the Global Constraints, or anything the plan mandates that
standard review practice would flag as a defect (a test asserting nothing,
verbatim duplication of a logic block). Batch every finding into one question
to the user (each beside the plan text that mandates it, asking which
  governs) before execution, not one interrupt per discovery. Clean scan →
proceed silently.

## The Process

For each task, in order:

1. **Decompose.** Split into tasks with explicit boundaries: which files each
   touches, what it depends on, what "done" means. One concern per task. Two
   tasks editing the same file are not independent; sequence or merge them.
2. **Brief.** Run `scripts/task-brief PLAN_FILE N`. It extracts the task's
   full text to a uniquely named file and prints the path. The brief is the
   single source of requirements; the dispatch only frames it.
3. **Dispatch one fresh implementer.** Spawn a fresh subagent with
   `implementer-prompt.md` filled in. Fresh per task: no carried context,
   no resumed worker. Let the agent select the appropriate specialized
   subagent for the task. Record the BASE commit (current HEAD) before dispatching.
   You need it for the review package.
4. **Worker implements, tests, commits, self-reviews.** The worker makes the
   change, runs the verification command from its brief, commits one concern,
   self-reviews, writes its full report to the report file, and returns a
   short status (see Handling Implementer Status below).
5. **Build the review package.** Run `scripts/review-package BASE HEAD`. It
   writes one file (commit list, stat summary, full diff with context) that
   never enters your context, and reports that file's path. Use the BASE you
   recorded. Never `HEAD~1`, which silently drops all but the last commit of a
   multi-commit task.
6. **Audit before proceeding.** Dispatch a fresh reviewer with
   `task-reviewer-prompt.md`, handing it the brief path, the report path, the
   diff-package path, and the verbatim Global Constraints. Let the agent select
   the appropriate specialized subagent for the review. The audit checks
   spec compliance (does what the brief asked, nothing more, nothing less) and
   code quality (clean separation, no dangling references, follows existing
   patterns). Worker output is trusted after this audit, not before.
7. **Gate.** Audit clean and verifier green → mark the task complete in the
   ledger, move to the next. Audit finds a Critical/Important issue → dispatch
   a fix worker with the complete findings list, then re-review. Do not start
   the next task on an unaudited or suspect result. If the audit cannot be
   cleared, abort the chain rather than build on it.

## Dispatch Brief

Each brief is self-contained. The worker reads only what the brief points to.
Pass file *paths*, not contents; keep static material under ~50 lines inline,
point to everything larger.

- **Goal**: one sentence: what this task changes and why.
- **Files**: the paths to edit, as paths. Name files the worker must NOT touch.
- **Constraints**: patterns to follow, interfaces to preserve, what is out of scope.
- **Verification**: the exact command that proves the task works (test,
  typecheck, build, lint). The worker runs it before reporting done.
- **Commit**: one concern, one commit, conventional prefix

A dispatch describes one task, not the session's history. Never paste
accumulated prior-task summaries ("state after Tasks 1-3") into later
dispatches. A fresh subagent needs its task, the interfaces it touches, and
the global constraints. Nothing else.

## Parallel Dispatch

Parallel-dispatch mechanics — the independence proof, per-worker worktree
isolation, and integration ordering — live in
`references/parallel-dispatch.md`. Read it when a batch of tasks has no
shared files and no ordering dependency and you are about to dispatch more
than one worker concurrently.

## Model Selection

Use the least capable model that fits the role, but turn count beats token
price, and the cheapest models often take 2-3× the turns on multi-step work.

- Touches 1-2 files with a complete spec → cheap model. When the brief contains
  the complete code to write, it is transcription plus testing, the cheapest tier.
- Multiple files with integration concerns → standard model. Mid-tier is the
  floor for reviewers and for implementers working from prose.
- Design judgment or broad codebase understanding → most capable model. The
  final whole-branch review is one of these. Run it on the most capable
  available model, not the session default.
- Reviewers: same judgment, scaled to the diff's size, complexity, and risk. A
  small mechanical diff does not need the most capable model; a subtle
  concurrency change does.

**Always specify the model explicitly when dispatching.** An omitted model
inherits your session's, usually the most expensive, and silently defeats this.

## Handling Implementer Status

Workers report one of four. Handle each:

- **DONE**: build the review package and dispatch the reviewer.
- **DONE_WITH_CONCERNS**: completed but flagged doubts. Read them first. If
  they touch correctness or scope, resolve before review; if they are
  observations ("this file is getting large"), note and proceed.
- **NEEDS_CONTEXT**: missing information. Supply it and re-dispatch.
- **BLOCKED**: cannot complete. Diagnose: context problem → add context,
  re-dispatch same model; needs more reasoning → re-dispatch a more capable
  model; too large → split it; plan is wrong → escalate to the user.

Never ignore an escalation, and never force the same model to retry unchanged.
If the worker said it is stuck, something must change before the retry.

## Handling Reviewer Items

The reviewer may report **Cannot verify from diff** items: requirements
living in unchanged code or spanning tasks. They do not block the rest of the
review, but you resolve each one yourself before marking the task complete: you
hold the cross-task context the reviewer lacks. A confirmed gap is a failed spec
review; return to the implementer, then re-review.

## Constructing Reviewer Prompts

The loop's gate is the local `task-reviewer-prompt.md` dispatched to a fresh
subagent. Let the agent select the appropriate specialized subagent for the review.
There is no hard dependency on any external named agent.
The gate stays honest only if you don't pre-cook it:

- **Don't pre-judge findings.** Never tell a reviewer to ignore or not flag an
  issue, and never pre-rate severity ("treat it as Minor at most"). If your
  prompt contains "do not flag," "don't treat X as a defect," "at most Minor,"
  or "the plan chose", stop. You are pre-judging to spare yourself a review
  loop. Let the reviewer raise it; adjudicate in the loop.
- **Copy binding constraints verbatim.** The Global Constraints block is the
  reviewer's attention lens: exact values, exact formats, stated relationships
  ("same layout as X", "matches Y"). The template already carries the process
  rules (YAGNI, test hygiene); this block is what THIS spec demands.
- **One task per dispatch.** No pasted session history.
- **Don't re-run the implementer's tests for the reviewer**: the report carries
  the test evidence; the reviewer runs a focused test only on a named doubt.
- **Plan-mandated findings are the user's call.** A finding that conflicts with
  what the plan's text requires: present the finding and the plan text, ask
  which governs. Do not dismiss it because the plan mandates it, and do not
  dispatch a fix that contradicts the plan without asking.
- **Fix dispatches carry the implementer contract**: the fixer re-runs the
  tests covering its change and reports the command and output. Name the
  covering test files; a one-line fix does not need the whole suite. Confirm the
  fix report has the covering tests, the command, and the output before re-review.
- **One fixer for the final review's findings**: dispatch ONE fix worker with
  the complete list, not one fixer per finding. Per-finding fixers each rebuild
  context and re-run suites.

## File Handoffs

The brief, the report, and the diff package are files, not context you carry.
`scripts/task-brief` and `scripts/review-package` exist so the controller never
holds a full diff or a full plan section in its own context:

- **Hand the reviewer its diff as a file** (`scripts/review-package BASE HEAD`).
  The diff never enters your context; the reviewer sees commits, stat, and full
  diff in one Read.
- **Hand the implementer its brief as a file** (`scripts/task-brief PLAN N`):
  introduce it as "read this first. It is your requirements, with the exact
  values to use verbatim."
- **Hand the reviewer the report as a file**: the implementer's own account of
  what it built and tested, read alongside the diff, never trusted on its own.

## Durable Progress

Conversation memory does not survive compaction. Controllers that lost their
place have re-dispatched entire completed task sequences, the single most
expensive failure. Track progress in a ledger file, not only in todos.

- At skill start, check for a ledger:
  `cat "$(git rev-parse --show-toplevel)/.outline/sdd/progress.md"`. Tasks marked
  complete there are DONE. Do not re-dispatch; resume at the first incomplete task.
- When a review comes back clean, append one line:
  `Task N: complete (commits <base7>..<head7>, review clean)`.
- The ledger is your recovery map: the commits it names exist in git even when
  your context no longer remembers creating them. After compaction, trust the
  ledger and `git log` over recollection.
- `git clean -fdx` destroys the ledger (git-ignored scratch); if that happens,
  recover from `git log`.

The workspace (`scripts/sd-workspace` → `.outline/sdd`) holds briefs, reports,
review packages, and the ledger. It self-ignores, so it never shows in
`git status` and never gets committed.

## Tree-Clean Recovery

Recovery from a worker that died mid-task and left a dirty tree lives in
`references/recovery.md`. Read it when a dispatched worker crashes or is
killed before completing its task.

## Final Whole-Branch Review and Ship

After all tasks land:

1. Build the branch package: `scripts/review-package MERGE_BASE HEAD` where
   `MERGE_BASE = git merge-base main HEAD`. Hand the printed path to a final
   reviewer on the most capable model. Point it at the Minor findings the ledger
   accumulated so it can triage what must be fixed before merge.
2. Final-review findings → ONE fix worker with the complete list, then re-review.
3. **Ship via ODIN's atomic path, not a single squash.** Sort the work into
   atomic commits in detached HEAD. Publish with git-branchless `submit`, or run
   `commit-push`. Do not invent a branch-finishing or code-review-request flow
   outside this path.

## Example Workflow

A condensed run through two tasks: one clean pass, one fix-and-re-review.

```
[Read plan.md once; create todos for every task; check the ledger — empty,
 starting fresh]

Task 1: rate limiter

[Run scripts/task-brief plan.md 1 → task-1-brief.md]
[Dispatch implementer, model: standard — brief path, report path,
 scene-setting context]

Implementer: "Brief doesn't say what happens past the limit — 429 or drop
  silently?"
Controller: "429 with a Retry-After header, per the API constraints section."
Implementer: [implements, tests, self-reviews, commits]
  DONE — 6/6 tests passing. Committed a1b2c3d.

[Run scripts/review-package BASE HEAD → task-1-diff.md]
[Dispatch reviewer, model: standard — brief, report, diff paths, global
 constraints]

Reviewer: Spec Compliance ✅. Code Quality ✅. Task quality: Approved.

[Append to ledger: "Task 1: complete (commits a1b2c3d..a1b2c3d, review
 clean)"]
[Mark Task 1 done in todos; move to Task 2]

Task 2: batch import progress

[Run scripts/task-brief plan.md 2 → task-2-brief.md]
[Dispatch implementer, model: standard]

Implementer: [no questions; implements, tests, self-reviews, commits]
  DONE — 8/8 tests passing. Committed d4e5f6a.

[Run scripts/review-package BASE HEAD → task-2-diff.md]
[Dispatch reviewer]

Reviewer: Spec Compliance ❌ Issues found:
  - Missing: "report progress every 100 items" (spec requirement)
  - Extra: unrequested --json flag on the import command
  Code Quality ❌ Important: magic number 100 hardcoded at importer.go:84.
  Task quality: Needs fixes.

[Dispatch ONE fix worker with the complete findings list]
Fixer: removed --json flag, added progress reporting, extracted the
  PROGRESS_INTERVAL constant, re-ran the covering tests (8/8 passing).
  Committed 7a8b9c0.

[Re-run scripts/review-package BASE HEAD; dispatch reviewer again]
Reviewer: Spec Compliance ✅. Code Quality ✅. Task quality: Approved.

[Append to ledger: "Task 2: complete (commits d4e5f6a..7a8b9c0, review
 clean)"]

[All tasks land]
[Run scripts/review-package MERGE_BASE HEAD; dispatch final reviewer on the
 most capable model]
Final reviewer: all requirements met, Minor findings triaged, ready to ship.

[Ship via the ODIN atomic path — atomic commits, not a squash]
```

## Red Flags

Parallel-dispatch pitfalls (two workers editing one file, corrupting each
other's diffs) live in `references/parallel-dispatch.md`. Read it before
dispatching more than one worker concurrently.
