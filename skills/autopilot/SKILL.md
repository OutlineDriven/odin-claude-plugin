---
name: autopilot
description: Run a hands-off plan-to-ship pipeline by chaining existing skills. Use when the user says "autopilot", "take this from plan to shipped", "run the whole pipeline", "hands-off ship it", or "do the end-to-end build".
metadata:
  short-description: Hands-off plan→ship pipeline chaining existing skills
---

# Autopilot: hands-off plan→ship pipeline that chains existing skills

`autopilot` runs a build request from plan to shipped without re-prompting at every step. It is a **chain**: each phase invokes an existing ODIN skill via the Skill tool and gates on the result before the next phase begins. It owns sequencing, the phase gates, and the terminal report; nothing else. It writes no code surface of its own; the chained skills do.

## When to Apply

- The user hands an execution-ready task and wants it taken from plan to shipped without step-by-step approval: "autopilot", "ship it end to end", "take it from plan to PR".
- A concrete change is specified, enough for the approved plan to name implementation units. The pipeline executes; it does not discover what to build.

## When NOT to Apply

- **A single execution step against an approved plan** → `work`. autopilot wraps `work` with the rest of the arc; if that arc is unwanted, call `work` directly.

## Inputs and Flags

- `[task]`: the execution-ready request the approved plan covers. Required; an empty or ambiguous task fails the precondition below — the chain does not start.
- `against <ref>`: base-ref override forwarded to the diff-scoped phases (`simplify`, `review`).
- `mode:local`: force local-only (skip push + CI) even when a remote exists.
- `mode:headless`: non-interactive overlay; pass through to each chained skill's headless variant where it has one. No phase prompts the user; a gate that would prompt instead HALTs with the question in the report.

## Precondition: an approved plan exists

The chain begins only when an approved plan exists — one the user approved through Claude Code's built-in plan mode (`ExitPlanMode`), or an equivalent written plan the user has approved. autopilot does not produce that plan and never invents one: "scope unknown" is not autofixable. No approved plan → do not start; return to plan mode, or hand off upstream to `askme` / `strategy` for an execution-ready task.

## The chain

Each row is one phase: the named skill is invoked, not reimplemented. This is the phase map only. The gate that advances each phase, its autofix arm, and the halt action are defined once: in the Validation Gates table below for the in-body summary, and in `references/pipeline-gates.md` for the authoritative pass-criteria, state machine, and halt/report formats.

| # | Phase | Invokes | Note |
|---|-------|---------|------|
| 1 | Execute | `work` | **Orchestrated** caller mode: implementation + local verification only; autopilot owns simplify/review/PR/CI as later phases |
| 2 | Simplify | `simplify` | compress the new diff |
| 3 | Review | `review` | read-only assessment |
| 4 | Apply fixes | `fix` | **conditional**: runs only when G3 fails; it is the review gate's autofix arm, not an unconditional step |
| 5 | Commit + push | `commit-push` | push half skipped local-only |
| 6 | CI | `gh-fix-ci` | skipped local-only |
| 7 | Report | none | always, on success or HALT |

## Support files: read on demand

Don't bulk-load. Read at the step that needs it.

- `references/pipeline-gates.md`: the authoritative source for every gate's exact pass-criteria, the autofix arm per gate, the autofix-then-halt state machine, local-only detection, and the halt-handoff and report formats. The Validation Gates table below is the in-body summary; read the reference when running any gate or deciding a halt.

## Workflow

The sequence and its halt mechanics; exact pass-criteria per gate are in the Validation Gates table and `references/pipeline-gates.md`.

1. **Phase 1: Execute.** Invoke `work` against the approved plan in its **Orchestrated** caller mode — implementation and local verification only, returning a structured summary. It must not run simplify, review, PR, or CI; autopilot owns those as Phases 2, 3, 5, and 6. G1 red → autofix arm `fix` runs **once**, re-check; still red → HALT.
2. **Phase 2: Simplify.** Invoke `simplify` on the new diff. `simplify` self-reverts a behavior regression; an unrecoverable exit (new bloat / mixed commit) is G2 fail → HALT.
3. **Phase 3 (+4): Review-gate.** Invoke `review` (read-only). Only if a critical/high finding exists, invoke `fix` **once** on those findings (Phase 4), then re-review the changed files. Residual critical/high after the one pass is G3 fail → HALT.
4. **Phase 5: Commit + push.** Detect remote via `git remote`. Invoke `commit-push`; local-only → commits only, push half skipped. A push refusal (force/protected) is G5 fail and not autofixable → HALT.
5. **Phase 6: CI.** Skipped local-only. Otherwise invoke `gh-fix-ci`, which watches PR checks and runs its own fix arm **once**; still red is G6 fail → HALT, hand off failing-check logs/URLs.
6. **Phase 7: Report.** Always, on success or at the halt point. Phases run, gates passed/failed, residual handoff, commits/PR, the next operator's action.

## Constitutional Rules (Non-Negotiable)

1. **Chain, never reimplement.** Each phase delegates to its named skill via the Skill tool. autopilot owns sequencing, gates, and the report; nothing else. Inlining a phase's logic is Graft.
2. **Execution-only entry.** The chain starts from an approved plan and never invokes `strategy` or `ideate`. Greenfield discovery is upstream and manual; auto-chaining it to "be helpful" on a vague request is Excess.
3. **Gated sequencing.** A phase begins only after the prior gate passes.
4. **Autofix-then-halt.** On a failing gate, run the bounded autofix arm **once** (`fix` for the verifier and review gates, `gh-fix-ci` for the CI gate), then re-check. Still failing → HALT, hand off residual findings, run the report. Never carry a red gate into the next phase; compounding a bad change across phases is the exact failure this rule prevents.
5. **Local-only when no remote.** Detect via `git remote`; empty (or `mode:local`) → skip the push half and the whole CI phase; still commit and still report.
6. **Baseline wins.** On any conflict with `~/.claude/claude/system-prompt-baseline.md`, the baseline governs.

## Validation Gates

Gate id equals phase number; Phase 4 (`fix`, G3's autofix arm) and Phase 7 (Report) are gateless, so there is no G4 or G7.

| Gate | Pass Criteria | Autofix arm (once) | Blocking |
|------|---------------|--------------------|----------|
| Precondition | an approved plan exists (plan mode / `ExitPlanMode`, or an equivalent approved written plan) | none; "scope unknown" is not autofixable | Yes; do not start, hand off to upstream `askme`/`strategy` |
| G1 Execute | `work`'s Orchestrated pass returns its structured summary and the repo-native verifier is green | `fix` | Yes; HALT on still-red |
| G2 Simplify | clean exit, behavior preserved | `simplify` self-revert | Yes; HALT on new bloat / mixed commit |
| G3 Review | no critical/high finding after one fix pass + re-review | `fix` then re-review | Yes; HALT on residual critical/high |
| G5 Commit/push | atomic commits made; push ok (local-only: commits only) | none | Yes; HALT on push refusal |
| G6 CI | PR checks green | `gh-fix-ci` watch+fix | Yes; HALT on still-red; skipped local-only |
| Report emitted | terminal report produced on success or HALT | none | Yes |

## Anti-patterns

- **Looping an autofix arm until green.** The posture is once-then-halt. A second autofix attempt hides a bad plan and compounds risk; HALT and hand off instead.
- **Carrying a red gate forward** "to fix later". The next phase amplifies the defect over a larger surface.
- **Inventing a remote** to push a local-only repo. No remote → commit and report.

## Operating surface

`work` and `fix` write the working tree; `commit-push` writes commits and the remote; `review` is read-only; `simplify` self-reverts on regression. No writes to undefined or doubly-owned locations.
