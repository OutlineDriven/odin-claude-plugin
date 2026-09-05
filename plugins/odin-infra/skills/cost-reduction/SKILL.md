---
name: cost-reduction
description: 'Use when a measured cost surface needs one-change-at-a-time reduction under frozen guardrails. Not for speed-only optimization: use optimize.'
---

# Cost reduction

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A measured cost surface needs one-change-at-a-time reduction under frozen guardrails. |
| Authority | Human-gated: asks the human once before any production billing/infra mutation; otherwise reversible local: runs the pre-registered gate batteries and writes only to an append-only experiment log; rollback is version control. No remote mutation. Prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect; end the run on scope drift. |
| Side effect | Guardrail-safe measured cost reduction. Each proposed change is adopted with N=5 gate evidence or recorded dead with the measurement that killed it. |
| Done | The fixed budget target is reached without any guardrail regression, or every proposed change is resolved as adopted or dead. |
| Stop | no safe saving; no progress; blocked. Bound: exact approved billing/infra scope, budget target, guardrails, and pass cap. |

## Inputs

- Approved scope (required): the billing or infrastructure surface to reduce, frozen before mutation.
- Budget target (required): the cost reduction goal.
- Guardrails (required): quality gates that must not regress: planted-defect catch rate, rejects-extra-features check, end-to-end scenarios, and blind A/B deliverable-parity comparison against the current config.
- Pass cap (required): the maximum number of rungs to test.
- Expensive-model baseline (required): the current behavior for every judgment point the workflow contains.

## Procedure

1. Bound the approved billing/infra scope, budget target, guardrails, and pass cap; freeze before mutation. For production billing/infra mutation, make one harness ask/question call before the run starts. End the run on scope drift. **Done when:** the bound is frozen and start approval is collected or the run ends.
2. Pre-register each proposed cost-reduction change (the rung): name it, state the mechanism, expected dollar saving, and every judgment point it moves to a cheaper tier. **Done when:** the rung is pre-registered with name, mechanism, leverage, and every judgment point enumerated.
3. For each moved judgment point, prove it is mechanical: deterministic, scriptable, or cheaply verifiable after the fact. If a judgment point cannot be proven mechanical, restructure it so the expensive model makes the decision once at plan time, route it back up through an explicit escalation rule at execution time, or kill the rung. "The cheap model usually gets it right" is not acceptance evidence because judgment failures are rare, have a high blast radius, and are largely invisible to pass/fail gates. **Done when:** every moved judgment point is proven mechanical, restructured, escalated, or the rung is killed.
4. Confirm the rung preserves the workflow's thesis. A change that coarsens the fresh-context-per-task property or batches dispatches to save cost is counter-thesis and is barred without a maintainer reversal. **Done when:** the rung is confirmed thesis-preserving, or barred as counter-thesis.
5. Run the N=5 gate battery: the quality gate (planted-defect catch rate over five runs, rejects-extra-features, end-to-end scenarios, and blind A/B deliverable parity with the current config) and a judgment audit that interrogates every adjudication event across the five runs and scores each against the expensive-model baseline. Any silently-absorbed judgment call, where a cheaper tier resolves what it should have escalated, fails the rung regardless of scenario verdicts. Any quality regression kills the rung. **Done when:** the N=5 gate battery is run with quality gate and judgment audit results collected.
6. Re-attribute claims post-hoc from the measured gate results. Report the dollar effect as the measured range, not the pre-registered estimate. If the measured win belongs to a different change than the one tested, attribute it there and claim only what the tested change owns. **Done when:** claims are re-attributed to the measured results.
7. Append the rung's outcome to the append-only experiment log: adopted with its gate evidence attached, or dead with the measurement that killed it. For a dead rung, record a standing bar against re-proposing it without a structurally different design. **Done when:** the experiment log entry is appended with outcome, evidence, and standing bar if dead.

## Failure and recovery

- Approval absent: stop before mutation. Terminal class: `blocked`.
- Scope drift: end the run immediately; do not expand the frozen bound. Terminal class: `blocked`.
- Quality regression or silently-absorbed judgment: the rung is dead. Record the measurement that killed it and the standing bar; adopt nothing. Terminal class: `dead`.
- Indeterminate gate result: record as dead. An indeterminate run does not satisfy N=5; it is not a partial pass. Terminal class: `dead`.
- No safe saving or no progress: stop; do not spend another pass to manufacture movement. Terminal class: `blocked`.
- Missing prerequisite: a gate cannot be run: missing expensive-model baseline, no planted-defect fixture, no current-config A/B pair. Stop and report the missing prerequisite; do not infer a pass from absence of evidence. Terminal class: `blocked`.

## Output

One append-only experiment-log entry per rung containing rung name, pre-registered estimate, measured dollar range, N=5 gate results, judgment-audit results, and a terminal classification of `adopted` or `dead`. A dead entry names the measurement that killed it and the standing bar. No workflow change lands unless the rung is adopted. Run-level terminal classification: `adopted` (budget target reached without guardrail regression), `dead` (all rungs resolved, target not reached), or `blocked` (approval absent, scope drift, or missing prerequisite stopped the run).
