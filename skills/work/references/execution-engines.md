# Execution Engines

`/work` runs an implementation-ready unified code plan through one of three engines. The engine is chosen once, after Phase 0 classifies the plan as `artifact_readiness: implementation-ready` plus `execution: code`. The engine decides *how* implementation runs; it never changes who owns the shipping tail.

Engine selection applies only to code execution. Knowledge-work and legacy plans keep the inline/subagent flow in `SKILL.md`.

## Step 1: Probe host capability

An engine is usable only when the host exposes a callable primitive for it. Do not assume one exists from its name.

| Engine | Usable when | Claude Code reality |
|---|---|---|
| **Inline / subagent** | Always. The orchestrator runs units inline or dispatches subagents via the platform's subagent primitive (`Agent`/`Task` in Claude Code, `spawn_agent` in Codex, `subagent` in Pi). | Always callable in-session. Default. |
| **Goal-mode** | The host exposes a callable goal tool a skill can invoke — e.g., Codex `create_goal` (sets **and activates** a persistent objective for the current session). | **No goal tools exposed.** `/goal` is a top-level user command only; a skill cannot invoke it. Emit a copyable `/goal` prompt, or run inline/subagents. |
| **Dynamic-workflow** | The host exposes a callable dynamic-workflow / ultracode-style orchestration primitive that returns structured results and blockers without mid-run user decisions. | **Not callable from inside a skill.** Dynamic workflows start from a user prompt (`ultracode:` or `/effort ultracode`). `/work` can only emit a copyable prompt block. |

Rule of thumb: probe for the callable tool, not the command's existence. If the host exposes a callable goal tool (Codex `create_goal`), goal-mode is a real callable engine. If it exposes only a user-typed `/goal` (Claude Code), goal-mode is prompt-emission only.

**Codex specifically.** Codex exposes goal tools to skills (gated by `features.goals`): `create_goal(objective)` sets **and activates** a persistent objective — the **current session** then works toward it automatically. It is not a background worker and returns no awaitable envelope. `update_goal(status: complete|blocked)` reports terminal status when the objective is genuinely met or repeatedly blocked. The skill calls `create_goal` with the objective content; the working session handles `update_goal` itself. Use `create_goal` only in standalone use, never when `/work` is called by another orchestrator that owns the tail — it would keep the session pursuing the objective instead of returning control.

## Step 2: Pick the engine by plan shape

When more than one engine is callable, choose by the plan's decomposition shape:

| Plan shape | Engine | Why |
|---|---|---|
| Sequential or modest U-ID decomposition; units share files or depend on each other | **Inline / subagent** (default), or a **goal-mode** prompt for sustained focus when callable | The DoD already defines the end condition; ordinary persistence finishes it. |
| Many independent U-IDs with disjoint file ownership; codebase-wide sweep; large migration; adversarial cross-checking | **Dynamic-workflow** when callable; otherwise parallel subagents | Workflow scripts hold branching, loops, and intermediate worker state outside the main context and coordinate many agents. Prefer this over goal-mode for large fan-out. |
| Host exposes no callable goal/workflow primitive (e.g., Claude Code in-session) | **Inline / subagent** | Preserve heading-scan / DoD / U-ID discipline without relying on unavailable host features. |

Recommend exactly one path. Present a non-default engine as an advanced / large-scale option only when the plan shape warrants it — never as an equal coin-flip.

## Step 3: Run the chosen engine

### Inline / subagent (default)

Follow the dispatch strategy in `SKILL.md` Phase 1 Step 4 (inline, serial subagents, or parallel subagents) and the Phase 2 execution loop. `/work` owns task creation, unit sequencing, dispatch, verification, and commits.

### Goal-mode and dynamic-workflow

**With a callable goal tool (Codex `create_goal`):** call `create_goal` with the objective — the content of the copyable prompt below, minus the leading `/goal`. This activates the objective and the **current session** works toward it; there is no separate worker and no envelope to await, so the session continues to its tail. The skill does not call `update_goal`; the working session does that. Use `create_goal` only in standalone use, never when the caller owns the tail.

**No callable goal tool, or dynamic-workflow (Claude Code today):** do **not** attempt to invoke them. Instead:

- **Standalone interactive use:** print a copyable prompt block for the user to paste, then continue inline/subagents if the user does not paste it. Do not stall waiting for a paste.
- **Orchestrated use (another caller owns the tail):** do **not** emit a copyable prompt — a manual paste step strands the caller. Run inline/subagents instead, or return a blocker if the plan genuinely requires an unavailable engine.

Whichever path, the goal/workflow must not open a PR, finalize the session, or bypass the owning workflow's gates.

Copyable goal-mode prompt (standalone — emit verbatim, substituting only the literal plan path). It must be plan-agnostic: identical for any plan except the substituted path. Deletion test before emitting — if the draft names a specific command, file path, U-ID dependency, stop condition, or Definition-of-Done item, it copied from the plan; cut it (the goal reads those from the plan). For PR/shipping, do not hardcode open-a-PR or do-not-open-a-PR; carry the precedence line below — the goal follows the plan's PR/landing strategy if it has one, with repo conventions and user preferences overriding it.

```text
/goal Implement <plan-path> to its Definition of Done.

The plan is the authority — don't read it whole. Scan headings, read the Goal Capsule, then work the units in dependency order, reading each unit plus its cited R/F/AE/KTD as you go. Run the plan's Verification Contract gates and satisfy each unit's test scenarios. Track progress outside the plan file, not in it.

This goal owns implementation and local verification only. Run simplification and code review only when the calling `/work` invocation explicitly asks for them; otherwise leave the quality gates, commit packaging, and shipping tail for `/work` to resume. Surface a genuine blocker — something that changes scope or contradicts the plan — instead of guessing; use your judgment on details the plan leaves open.

Done when the transcript shows: every non-deferrable Per-Unit DoD row has an observed verification result; the Verification Contract's required checks passed or are documented as not applicable; applicable simplification/review gates ran or were explicitly skipped with reason; dead-end or experimental code from approaches that did not pan out has been removed from the diff; and no progress/status was written into the plan file. Before declaring done, re-open the plan and re-check the active units, Verification Contract, and Definition of Done against the diff — context may have been compacted to a summary that dropped detail.
```

Copyable dynamic-workflow prompt (large fan-out — emit verbatim):

```text
ultracode: Execute <plan-path> as an end-to-end dynamic workflow.

Use the plan as authority. Build the workflow around the Implementation Units and Definition of Done. Parallelize only independent U-IDs with disjoint file ownership, keep intermediate agent results inside the workflow, run simplification/review/verification gates inside the workflow tail, and return a final summary with changed files, U-IDs completed, verification results, residual findings, and blockers.
```

Keep emitted prompts under 4,000 characters and always substitute the literal plan path.

## Step 4: Resume the correct tail

After any engine finishes implementation, inspect the diff and continue at the tail that matches the caller. The engine never owns more than implementation + local verification on its own.

| Caller | After implementation, `/work` ... |
|---|---|
| **Standalone** (user invoked `/work` directly, or `/plan` handed off interactively) | Resumes its normal post-implementation tail — Phase 3-4 quality gates, simplification, review, commit, and handoff in `references/shipping-workflow.md`. A goal-mode run does not skip these; verify they ran or were explicitly skipped with reason. |
| **Orchestrated** (called by another skill/agent that owns simplification, review, PR, and CI) | Performs implementation and local verification only, then returns a structured summary to the caller. Does not run simplify/review/PR/CI — the caller owns those. |

Using goal-mode or a dynamic workflow is a way to get better sustained implementation focus, not a way to skip the owning workflow's finish discipline.

## Progress visibility

Tail ownership decides who opens the **final** PR; it does not forbid progress signals during a long run. For multi-hour goals, meaningful commits as units complete and an optional scratch progress artifact at `/tmp/odin/work/<run-id>/progress.json` keep the trajectory observable. Never write progress or status into the plan body — git, commits, and the envelope carry it.
