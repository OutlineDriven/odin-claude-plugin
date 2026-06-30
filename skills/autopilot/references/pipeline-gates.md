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
ADVANCE:       P := next phase in {1..8}, skipping phases disabled by local-only; goto RUN(P)
HALT(P):       stop the chain; collect residual findings from P; jump to Phase 8 (Report) with halt=P
```

Invariants the machine enforces:

- **Once.** `AUTOFIX(P)` fires at most one time per phase. A failing `RECHECK` always routes to `HALT`, never back to `AUTOFIX`. Looping an arm to green hides a bad plan and compounds risk across a growing surface.
- **No red advance.** `ADVANCE` is reachable only from a passing `CHECK`/`RECHECK`. A red gate never enters the next phase.
- **Report is terminal and unconditional.** Both the success tail (after Phase 7/ADVANCE past the last enabled phase) and every `HALT(P)` route to Phase 8.

## Per-phase gate definitions

Gate id equals phase number — there is one numbering system, not two. Phase 5 (`fix`) is G4's autofix arm and Phase 8 (Report) is terminal; both are gateless, so **there is no G5 and no G8**. The absence is the signal that those phases are not independently gated.

| Gate | Phase / skill | Pass criteria (exact) | Autofix arm A(P) | On RECHECK still-fail |
|------|---------------|-----------------------|------------------|-----------------------|
| G1 | Phase 1 Plan / `plan` | A plan exists with concrete implementation units and an enumerated critical-files list; the task was not too ambiguous to plan. | none — "scope unknown" is not autofixable | HALT → hand off to upstream `askme` / `strategy`; the user must supply an execution-ready task |
| G2 | Phase 2 Execute / `proceed` | The plan's steps are implemented and the repo-native verifier (build / type-check / test, as the repo defines) exits clean. | `fix` once, in findings/verifier-failure mode, on the failing verifier output | HALT → hand off the verifier failure and the diff so far |
| G3 | Phase 3 Simplify / `simplify` | `simplify` exits `0`, `11` (empty diff), or `12` (false-positive-only); behavior preserved. | none distinct — `simplify` self-reverts a behavior regression (its exit `13`) internally | HALT on exit `14` (new rejection ground) or `15` (mixed-concern commit) — these need a human re-plan |
| G4 | Phase 4 Review / `review` (autofix = Phase 5 `fix`) | After at most one `fix` pass and a re-review of the changed files, no critical or high finding remains. | `fix` once on the review's critical/high findings, then re-review changed files only | HALT → hand off residual critical/high findings |
| G6 | Phase 6 Commit + push / `commit-push` | Atomic commits created (one concern each). Remote present → push succeeded. Local-only → commits only, push not attempted. | none — a force/protected-branch refusal is a deliberate safety stop, not a defect to patch | HALT → hand off the push refusal and the unpushed commits |
| G7 | Phase 7 CI / `gh-fix-ci` | PR checks green. | `gh-fix-ci` runs its own watch + fix arm once | HALT → hand off failing-check logs (GitHub Actions) and external-check URLs |

Phase 5 (`fix`) and Phase 8 (Report) have no gate; Report always runs.

## Local-only detection

Run `git remote`. Empty output → local-only; also forced by `mode:local`.

Local-only effect:
- **Phase 6 (G6)** — `commit-push` makes the atomic commits and skips the push half. No remote is invented.
- **Phase 7 (G7)** — skipped entirely. `ADVANCE` jumps Phase 6 → Phase 8 (Report).
- Phase 8 still runs and the report states `mode: local-only` with the unpushed commit list.

## Halt handoff format

On `HALT(P)`, Phase 8 emits a handoff so the next operator resumes without re-deriving state:

```
HALT at <Phase P — gate G?>
reason:        <one line — what the gate measured and why it stayed red>
autofix tried: <A(P) name + outcome | none — not autofixable>
residual:      <the findings / verifier output / refusal that remain>
state:         <commits made (sha + subject), pushed? PR url?, working-tree dirty?>
next:          <the single action that unblocks — e.g. "re-run plan with narrower scope", "resolve test X", "authorize push to <branch>">
```

## Report format (success or halt)

```
autopilot report
mode:          <full | local-only> [+ headless]
task:          <one line>
phases:        1 Plan ✓  2 Execute ✓  3 Simplify ✓  4 Review ✓  5 Fix <ran once | skipped, G4 clean>  6 Commit+push <✓ | local-only>  7 CI <✓ | skipped>
gates:         <G1 G2 G3 G4 G6 G7 pass/fail, with the autofix arm noted where it fired>
commits:       <sha + subject per commit>
remote:        <pushed branch / PR url | local-only, not pushed>
outcome:       <shipped | HALT at Phase P — see handoff above>
```
