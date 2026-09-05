# Autopilot: pipeline gates and the autofix-then-halt state machine

This file is the authoritative source for every phase gate, its autofix arm, and halt behavior. `SKILL.md` summarizes the process; this file defines the exact criteria and state machine. On any conflict, this file governs the mechanics and `~/.claude/claude/system-prompt-baseline.md` governs doctrine.

## The autofix-then-halt state machine

One generic transition runs every phase. `P` is the current phase, `G(P)` its gate, `A(P)` its autofix arm (may be none).

```
RUN(P):        invoke the phase's skill
CHECK(P):      evaluate G(P)
                 pass            -> ADVANCE
                 fail, A(P) none -> HALT(P)
                 fail, A(P) set  -> AUTOFIX(P)      [only if not already attempted this phase]
AUTOFIX(P):    invoke A(P) exactly ONCE; then RECHECK(P)
RECHECK(P):    evaluate G(P)
                 pass            -> ADVANCE
                 fail            -> HALT(P)          [never a second AUTOFIX]
ADVANCE:       P := next phase in {1..6}, skipping phases disabled by local-only; goto RUN(P)
HALT(P):       stop the chain; collect residual findings from P; jump to Phase 6 (Report) with halt=P
```

Invariants the machine enforces:

- **Once.** `AUTOFIX(P)` fires at most one time per phase. A failing `RECHECK` always routes to `HALT`, never back to `AUTOFIX`. Looping an arm to green hides a bad plan and compounds risk across a growing surface.
- **No red advance.** `ADVANCE` is reachable only from a passing `CHECK`/`RECHECK`. A red gate never enters the next phase.
- **Report is terminal and unconditional.** Both the success tail (after Phase 5/ADVANCE past the last enabled phase) and every `HALT(P)` route to Phase 6.

## Precondition: before Phase 1

The chain begins only when an approved plan exists: one the user approved through Claude Code's built-in plan mode (`ExitPlanMode`), or an equivalent written plan the user has approved. autopilot never produces it; "scope unknown" is not autofixable and has no arm. Fails → do not start; HALT before Phase 1 and hand off to upstream `askme` / `strategy`, where the user must supply an execution-ready task.

## Per-phase gate definitions

Gate id equals phase number; there is one numbering system, not two. Phase 4 (`strike-the-root`) is G3's autofix arm and Phase 6 (Report) is terminal; both are gateless, so **there is no G4 and no G6**. The absence is the signal that those phases are not independently gated.

| Gate | Phase / skill | Pass criteria (exact) | Autofix arm A(P) | On RECHECK still-fail |
|------|---------------|-----------------------|------------------|-----------------------|
| G1 | Phase 1 Execute / `work` (Orchestrated) | `work` runs in its Orchestrated caller mode, implementation and local verification only, returning a structured summary; the plan's steps are implemented and the repo-native verifier (build / type-check / test, as the repo defines) exits clean. It must not run simplify/review/PR/CI; autopilot owns those. | `strike-the-root` once, in findings/verifier-failure mode, on the failing verifier output | HALT → hand off the verifier failure and the diff so far |
| G2 | Phase 2 Simplify / `simplify` | `simplify` exits `0`, `11` (empty diff), or `12` (false-positive-only); behavior preserved. | none distinct, `simplify` self-reverts a behavior regression (its exit `13`) internally | HALT on exit `14` (new bloat) or `15` (mixed-concern commit): these need a human re-plan |
| G3 | Phase 3 Review / `review` (autofix = Phase 4 `strike-the-root`) | After at most one `strike-the-root` pass and a re-review of the changed files, no critical or high finding remains. | `strike-the-root` once on the review's critical/high findings, then re-review changed files only | HALT → hand off residual critical/high findings |
| G5 | Phase 5 Finalize / `review-and-ship` | `review-and-ship` report returned: checks green and PR created/updated (full mode), or commits made and push skipped (local-only). The report carries review findings, check results, publication classification, and PR URL or local-only status. | none; a finalizer refusal (push refused, checks blocked) is a deliberate safety stop, not a defect to patch | HALT → hand off the finalizer's blocked report and the unpushed commits |

Phase 4 (`strike-the-root`) and Phase 6 (Report) have no gate; Report always runs.

## Local-only detection

Run `git remote`. Empty output → local-only; also forced by `mode:local`.

Local-only effect:
- **Phase 5 (G5)**: `review-and-ship` runs the local check suite, makes atomic commits, and skips push and PR creation. No remote is invented. The report states `mode: local-only` with the unpushed commit list.
- Phase 6 (Report) still runs and the report states `mode: local-only` with the unpushed commit list.

## Halt handoff format

On `HALT(P)`, Phase 6 emits a handoff so the next operator resumes without re-deriving state:

```
HALT at <Phase P — gate G?>
reason:        <one line — what the gate measured and why it stayed red>
autofix tried: <A(P) name + outcome | none — not autofixable>
residual:      <the findings / verifier output / refusal that remain>
state:         <commits made (sha + subject), pushed? PR url?, working-tree dirty?>
next:          <the single action that unblocks — e.g. "return to plan mode for a narrower approved plan", "resolve test X", "authorize push to <branch>">
```

## Report format (success or halt)

```
autopilot report
mode:          <full | local-only> [+ headless]
task:          <one line>
phases:        1 Execute ✓  2 Simplify ✓  3 Review ✓  4 Strike-the-root <ran once | skipped, G3 clean>  5 Finalize <✓ | local-only>
gates:         <G1 G2 G3 G5 pass/fail, with the autofix arm noted where it fired>
commits:       <sha + subject per commit>
remote:        <pushed branch / PR url | local-only, not pushed>
outcome:       <shipped | HALT at Phase P — see handoff above>
```
