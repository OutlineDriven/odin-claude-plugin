---
name: strike-the-root
description: 'Use when a bug, failure, flake, regression, review finding, or ticket needs the core fixed so it cannot recur. Not for greenfield features: use tdd. Not for style-only review or typo-class one-liners.'
---

# Strike the root

Find the core and make it not break next time. Grill the real core and solve it from first principles, not the outskirts. Be sharp and work for the longer horizon.

A bug is evidence about the design that produced it. When the design is wrong, blocking symptoms is unlimited treadmill work: the same fault keeps spawning new bugs no matter how many are fixed. Sharp means acting on evidence in the code, never on speculation. Long horizon means the repair is still right in six months, under the next feature, with the next maintainer.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A bug, failure, flake, regression, slowness, review finding, or ticket needs root-shape repair, not the nearest patch. |
| Authority | Reversible local: writes only named local artifacts (an evidence ledger, tagged instrumentation, the fix, and a regression test); rollback is undo (revert those local writes). No remote mutation. |
| Side effect | A confirmed root cause, a root-shape fix, a passing regression test, and a clean tree with all instrumentation removed. |
| Done | The fault class named at the core can no longer produce the reported bug family; the full project check set passes with no monkey patch, shim, special-cased input, or suppressed symptom left in the diff; every review comment on the touched surface carries an explicit verdict. |

## Refusals

- No symptom patches. A conditional that special-cases the reported input, a wrapper that catches the fault downstream, or a config flag that hides it all leave the design fault in place. Remove the fault instead.
- No suppression. No `@ts-ignore`, `# type: ignore`, `// eslint-disable`, ignore flags, or deleted tests to silence errors.
- No special-casing inputs. The repair removes the fault class, not the reported instance.
- No outskirts work. Renames, formatting, and comment edits around a bug change nothing. Spend the effort where the failure lives.
- No speculative redesign. The wide view informs the repair; it does not license rewriting subsystems the fault does not touch.
- No patch without a reproduced root cause. When the input is a ticket, reproduction and root-cause analysis precede any fix. An unstructured fix that skips reproduction is refused.

## Inputs

- The failing symptom, test, command, or review finding to repair. Required.
- The project check command that defines "passes". Required, or discoverable in the repo.
- Full review history for the affected surface: prior review comments, fix attempts, and reverted patches. Gather from the repo and VCS before any mutation.
- The named local artifacts in scope. State before any edit.
- For flaky tests: the confirmed flaky test, the preselected N (consecutive run count for the proof standard), and a comparable environment. Required when the input is a flaky test.
- For tickets: one ticket with a described defect, and a bounded reproduction attempt count. Required when the input is a ticket.

## Procedure

1. **Locate the core.** Reproduce the failure before any change; capture the exact command, input, and environment that triggers it. If it cannot be reproduced, stop and report the irreproducible symptom with the captures gathered. Then survey wide: read the failing code with its neighbors: callers, the data it transforms, the invariants it relies on. Narrow the repro to the smallest input and code path that still triggers it. Redact secrets from any captured output before storing it. Name the subsystem that owns the failure before touching a line. Done when: the failure is reproduced with command, input, and environment captured, the repro is minimal, captured output is redacted, and the owning subsystem is named; or the skill stops on an irreproducible symptom.
2. **Prove it.** Open the evidence ledger and record the first entry: symptom, observed versus expected, reproduction command, and the narrowed repro. State one root-cause hypothesis tied to the narrowed repro, in the ledger, before reading or changing any source. Bound the read set to the smallest file set that could satisfy the hypothesis and read only those files. Add tagged instrumentation only around the suspected path to confirm or refute the hypothesis; tag every probe so it can be found and removed. Name the core fault in one sentence: the wrong assumption, the missing invariant, the misplaced responsibility. If the best available sentence names only the symptom, keep reading. Validate that the identified root cause is sufficient: removing or correcting it must prevent the defect from occurring. Done when: the ledger's first entry records symptom, expected, and reproduction command; one hypothesis is recorded before any source read or change; the read set is bounded to the smallest satisfying file set; tagged probes are in place around the suspected path; and the core fault is named in one design-level sentence tied to the narrowed repro.
3. **Repair at the root.** Restructure so the general case absorbs the special case. Apply the smallest coordinated change that removes the proven cause inside the named scope; the repair removes the fault class, not the reported instance. Do not refactor, rename, or touch code unrelated to that cause. When the cause requires a consumer-visible or out-of-scope change, stop and present the exact scope expansion before editing it. Done when: the smallest root-shape change is applied within the named scope, or the required expansion is reported before mutation.
4. **Pin with a regression test.** Add a regression test that must fail against the unfixed code and pass after the fix. Run the original repro and confirm it no longer triggers; asserting absence without re-running the reproduction is not permitted. For flaky tests, the proof standard is N consecutive comparable full-suite runs: all N runs must be green, using the same hardware, build, test suite, and environment. A single green run is not proof; fewer than N consecutive green runs is not proof. If a run fails, revisit the root cause. Done when: the regression test fails before and passes after the fix, the original reproduction no longer triggers, and for flaky tests, N consecutive comparable full-suite runs are green.
5. **Verify the full check set.** Run the project's existing test suite for the touched file or module, then the full project check set. Confirm it passes with no monkey patch, shim, special-cased input, or suppressed symptom left in the diff. If an unrelated test regresses, record it and stop without widening the fix. Remove all tagged instrumentation and confirm the regression test still passes with instrumentation gone. Done when: the full check set passes clean, all instrumentation is removed, and the regression test still passes: or a regression is recorded and the run stops.
6. **Work the full review queue.** For every open human or AI review comment on the touched surface, current round and every earlier round that never closed: judge validity first (valid, invalid, or trade-off), then fix the valid ones at their root and decline the invalid ones with one line of evidence. An old comment never silently lapses. Done when: every review comment carries an explicit verdict: fixed at root, or declined with evidence.
7. **Re-read wide.** After the repair, re-read the touched surface and its neighbors. If the fix added a special case, a flag, or a shim, step 3 failed; go back. Confirm the diff is minimal: no added or removed lines are unrelated to the root cause; revert any adjacent or incidental change. Done when: a fresh wide read finds no special case added by the repair and the diff is minimal.
8. **Durability note.** Write one line stating why the fault class named at the core can no longer produce the reported bug family: the invariant now enforced, the boundary now closed, the assumption now corrected. Done when: the durability note is written and the done predicate holds.

## Failure and recovery

- Irreproducible failure: stop; report the symptom and captures; do not mutate code on a hypothesis without a repro.
- Hypothesis refuted: remove the instrumentation for that hypothesis, form a new one, and repeat from step 2.
- Fix passes reproduction but regresses an unrelated test: record the regressing test, do not widen the fix, and return blocked naming that test.
- Scope too broad: the proven cause requires a consumer-visible or out-of-scope change. Stop before that change and report the exact expansion needed.
- Symptom-creep: if the repair drifts back to patching the symptom, stop, restate the root-shape problem, and restart at step 3.
- Monkey-patch detected: if the check set passes only because of a shim, special-cased input, or suppressed error, the done predicate is not met. Remove the patch and re-repair.
- Fresh-review failure: if a fresh reviewer rejects the change, address the rejection at the root shape. Do not override or silence the reviewer.
- Non-converged: if the root shape cannot be repaired within the named scope, or the check set cannot pass without a monkey patch, stop and report the blocked root-shape cause, the last repro, hypothesis, and instrumentation location. Remove any instrumentation before stopping; the regression test is kept only if the fix is kept.
- Root cause blocked (flaky test): the flake's root cause cannot be identified or repaired. Stop; report the flake evidence and what was attempted. Do not quarantine the test and call it fixed.
- Visible quarantine: the only available stabilization is quarantining the test without root-cause repair. Stop; report that quarantine is not root-cause repair.
- Budget exhausted (flaky test): the declared budget is spent before N consecutive green runs. Report how many consecutive runs passed. Budget exhaustion is never success unless it is the predeclared success predicate.
- Partial-result rule: any revert restores the exact original artifact state; partial or ambiguous state is not a valid result.

## Output

A confirmed root cause, the root-shape fix, a passing regression test, a clean tree with all instrumentation removed, the durability note, and each review-comment verdict, ordered locate, prove, repair, pin, verify, verdicts, durability. For flaky tests: the root cause, the repair applied, and the N consecutive run results. For tickets: reproduction and root-cause evidence, the patch, regression results, and reviewer evidence. On non-convergence, a blocked report stating the irreproducible symptom or unisolated cause with the last captures, hypothesis, and artifacts tried.
