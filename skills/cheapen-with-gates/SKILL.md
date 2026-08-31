---
name: cheapen-with-gates
description: 'Use when an agent workflow or pipeline is too expensive and a cost-reduction change is being proposed. Each proposed change is adopted with N=5 gate evidence or recorded dead with the measurement that killed it.'
---

# Cheapen with gates

## Contract

| Field | Bound contract |
|---|---|
| Trigger | An agent workflow or pipeline is too expensive and a cost-reduction change is being proposed. |
| Authority | Reversible local: runs pre-registered gate batteries and appends to an append-only experiment log; adopts a change or records it dead. No workflow change lands unless the rung is adopted. |
| Side effect | Runs an N=5 gate battery per proposed change and appends one entry to an append-only experiment log; adopts the change, or records it dead with its evidence and a standing bar. |
| Done | Each proposed change is either adopted with its gate evidence attached, or recorded dead with the measurement that killed it and a standing bar against re-proposing it without a structurally different design. |

## Inputs

- A proposed cost-reduction change (the "rung"), including the mechanism it cheapens and the expected dollar leverage.
- The current workflow's quality gate fixtures: a planted-defect catch-rate battery, a rejects-extra-features check, end-to-end scenarios, and a blind A/B deliverable-parity comparison against the current config.
- The expensive-model baseline behavior for every judgment point the workflow contains.
- Optional: a pre-registered dollar estimate. The measured range supersedes it in the final claim.

## Procedure

1. Pre-register the rung before any gate runs. Name it, state the mechanism it cheapens and the expected dollar leverage, and enumerate every judgment point the rung would move to a cheaper model or lower tier:
   - stuck-subagent diagnosis and remedy choice;
   - cannot-verify-from-diff resolution;
   - dispatch curation and task-boundary drawing;
   - review verdicts and severity calibration;
   - review-loop false-positive adjudication;
   - escalate-to-human recognition.
   **Done when:** the rung is pre-registered with name, mechanism, leverage, and every judgment point enumerated.
2. For each judgment point the rung moves, prove it is mechanical: deterministic, scriptable, or cheaply verifiable after the fact. If a judgment point cannot be proven mechanical, take one of three actions:
   - restructure it so the expensive model makes the decision once at plan time;
   - route it back up through an explicit escalation rule at execution time;
   - kill the rung.
   "The cheap model usually gets it right" is not acceptance evidence because judgment failures are rare, have a high blast radius, and are largely invisible to pass/fail gates. **Done when:** every moved judgment point is proven mechanical, restructured, escalated, or the rung is killed.
3. Confirm the rung preserves the workflow's thesis. A change that coarsens the fresh-context-per-task property or batches dispatches to save cost is counter-thesis and is barred without a maintainer reversal. **Done when:** the rung is confirmed thesis-preserving, or barred as counter-thesis.
4. Run the N=5 gate battery. It includes the quality gate (planted-defect catch rate over five runs, rejects-extra-features, end-to-end scenarios, and blind A/B deliverable parity with the current config) and a judgment audit that interrogates every adjudication event across the five runs and scores each against the expensive-model baseline. Any silently-absorbed judgment call, where a cheaper tier resolves what it should have escalated, fails the rung regardless of scenario verdicts. Any quality regression kills the rung, full stop. **Done when:** the N=5 gate battery is run with quality gate and judgment audit results collected.
5. Re-attribute claims post-hoc from the measured gate results. Report the dollar effect as the measured range, not the pre-registered estimate. If the measured win belongs to a different change than the one tested, attribute it there and claim only what the tested change owns. **Done when:** claims are re-attributed to the measured results, not the pre-registered estimate.
6. Append the rung's outcome to the append-only experiment log: adopted with its gate evidence attached, or dead with the measurement that killed it. **Done when:** the experiment log entry is appended with outcome and evidence.
7. For a dead rung, record a standing bar against re-proposing it without a structurally different design. **Done when:** the standing bar is recorded for the dead rung.

## Failure and recovery
- **Quality regression or silently-absorbed judgment:** the rung is dead. Record the measurement that killed it and the standing bar; adopt nothing.
- **Indeterminate gate result:** record as dead. An indeterminate run does not satisfy N=5; it is not a partial pass.
- **Partial-result rule:** a rung that passes some gates but fails any one is not partially adopted. Adoption requires every gate green across all five runs and a clean judgment audit.
- **Non-mutation rule:** a dead rung changes no workflow. Only the experiment log gains an entry.
- **Blocked:** if a gate cannot be run — missing expensive-model baseline, no planted-defect fixture, no current-config A/B pair — stop and report the missing prerequisite. Do not infer a pass from absence of evidence.

## Output
One append-only experiment-log entry per rung containing rung name, pre-registered estimate, measured dollar range, N=5 gate results, judgment-audit results, and a terminal classification of adopted or dead; a dead entry names the measurement that killed it and the standing bar; no workflow change lands unless the rung is adopted.

## Provenance

Origin: github.com/obra/superpowers, file docs/superpowers/specs/2026-06-10-strict-cost-sdd-design.md, revision b36e0829c6d0140e93cfef2ca599b1b07d4a7797. License: MIT, holder Jesse Vincent, 2025. Clean-room adaptation: the pre-registered cost ladder, judgment guardrail with enumerated judgment points, N=5 gate battery plus judgment audit, post-hoc claim re-attribution, and negative-results register with standing bar are restated as a self-contained agent cost-engineering procedure; no source expression is copied.
