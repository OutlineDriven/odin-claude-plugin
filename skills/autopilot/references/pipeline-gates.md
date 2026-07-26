# Autopilot — pipeline gates and the autofix-then-halt state machine

Authoritative source for every phase gate, its autofix arm, and the halt behavior. `SKILL.md` carries the summary; this file carries the exact criteria and the machine. On any conflict, this file governs the mechanics and `~/.claude/claude/system-prompt-baseline.md` governs doctrine.

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
ADVANCE:       P := next phase in {1..7}, skipping phases disabled by local-only; goto RUN(P)
HALT(P):       stop the chain; collect residual findings from P; jump to Phase 7 (Report) with halt=P
```

Invariants the machine enforces:

- **Once.** `AUTOFIX(P)` fires at most one time per phase. A failing `RECHECK` always routes to `HALT`, never back to `AUTOFIX`. Looping an arm to green hides a bad plan and compounds risk across a growing surface.
- **No red advance.** `ADVANCE` is reachable only from a passing `CHECK`/`RECHECK`. A red gate never enters the next phase.
- **Report is terminal and unconditional.** Both the success tail (after Phase 6/ADVANCE past the last enabled phase) and every `HALT(P)` route to Phase 7.

## Precondition — before Phase 1

The chain begins only when an approved plan exists: one the user approved through Claude Code's built-in plan mode (`ExitPlanMode`), or an equivalent written plan the user has approved. autopilot never produces it — "scope unknown" is not autofixable and has no arm. Fails → do not start; HALT before Phase 1 and hand off to upstream `askme` / `strategy`, where the user must supply an execution-ready task.

## Per-phase gate definitions

Gate id equals phase number — there is one numbering system, not two. Phase 4 (`fix`) is G3's autofix arm and Phase 7 (Report) is terminal; both are gateless, so **there is no G4 and no G7**. The absence is the signal that those phases are not independently gated.

| Gate | Phase / skill | Pass criteria (exact) | Autofix arm A(P) | On RECHECK still-fail |
|------|---------------|-----------------------|------------------|-----------------------|
| G1 | Phase 1 Execute / `work` (Orchestrated) | `work` runs in its Orchestrated caller mode — implementation and local verification only, returning a structured summary; the plan's steps are implemented and the repo-native verifier (build / type-check / test, as the repo defines) exits clean. It must not run simplify/review/PR/CI; autopilot owns those. | `fix` once, in findings/verifier-failure mode, on the failing verifier output | HALT → hand off the verifier failure and the diff so far |
| G2 | Phase 2 Simplify / `simplify` | `simplify` exits `0`, `11` (empty diff), or `12` (false-positive-only); behavior preserved. | none distinct — `simplify` self-reverts a behavior regression (its exit `13`) internally | HALT on exit `14` (new bloat) or `15` (mixed-concern commit) — these need a human re-plan |
| G3 | Phase 3 Review / `review` (autofix = Phase 4 `fix`) | After at most one `fix` pass and a re-review of the changed files, no critical or high finding remains. | `fix` once on the review's critical/high findings, then re-review changed files only | HALT → hand off residual critical/high findings |
| G5 | Phase 5 Commit + push / `commit-push` | Atomic commits created (one concern each). Remote present → push succeeded. Local-only → commits only, push not attempted. | none — a force/protected-branch refusal is a deliberate safety stop, not a defect to patch | HALT → hand off the push refusal and the unpushed commits |
| G6 | Phase 6 CI / `gh-fix-ci` | PR checks green. | `gh-fix-ci` runs its own watch + fix arm once | HALT → hand off failing-check logs (GitHub Actions) and external-check URLs |

Phase 4 (`fix`) and Phase 7 (Report) have no gate; Report always runs.

## Local-only detection

Run `git remote`. Empty output → local-only; also forced by `mode:local`.

Local-only effect:
- **Phase 5 (G5)** — `commit-push` makes the atomic commits and skips the push half. No remote is invented.
- **Phase 6 (G6)** — skipped entirely. `ADVANCE` jumps Phase 5 → Phase 7 (Report).
- Phase 7 still runs and the report states `mode: local-only` with the unpushed commit list.

## Halt handoff format

On `HALT(P)`, Phase 7 emits a handoff so the next operator resumes without re-deriving state:

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
phases:        1 Execute ✓  2 Simplify ✓  3 Review ✓  4 Fix <ran once | skipped, G3 clean>  5 Commit+push <✓ | local-only>  6 CI <✓ | skipped>
gates:         <G1 G2 G3 G5 G6 pass/fail, with the autofix arm noted where it fired>
commits:       <sha + subject per commit>
remote:        <pushed branch / PR url | local-only, not pushed>
outcome:       <shipped | HALT at Phase P — see handoff above>
```
