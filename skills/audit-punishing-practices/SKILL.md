---
name: audit-punishing-practices
description: 'Use when a workflow, plan, or diff must be checked for practices that punish the project later. Names each detected harmful practice with its evidence and cheaper alternative or reports the artifact clean. Don''t use for tasks that require source or remote-system changes.'
---

# Audit punishing practices

## Contract

| Field | Bound contract |
|---|---|
| Trigger | a workflow, plan, or diff must be checked for practices that punish the project later |
| Authority | read-only: no file, VCS, credential, paid, published, deployed, or remote mutation; the report changes nothing |
| Side effect | chat output naming each detected harmful practice (symptom patching, infinite retries, weak verification, score chasing, budget burn) with its evidence and its cheaper alternative; no code mutation |
| Done | every detected practice is named with an evidence line, or the artifact is reported clean; the report itself changes nothing |

## Inputs

- A workflow, plan, or diff to audit. Must be supplied as a concrete artifact (file path, pasted content, or committed diff range).
- Optional: the success metric or budget the artifact is meant to serve, used only to judge whether a practice is score chasing or budget burn.

## Procedure

1. Read the supplied artifact without mutating it. Bound the audit to the artifact's stated scope; do not widen to unreferenced code or history.
2. For each of the five practice classes, scan the artifact for a match and collect the exact evidence line (quote, step number, or configuration value) that proves it:
   - Symptom patching: a change suppresses a signal (warning, error, failing test, metric) without addressing its cause.
   - Infinite retries: a loop, hook, or agent step retries without a bounded attempt count, backoff ceiling, or stop condition.
   - Weak verification: a check, gate, or test that can pass while the defect it claims to catch is still present (tautological assertion, mocked-out assertion, missing assertion, green-on-broken).
   - Score chasing: work optimizes a metric or rubric score while the underlying outcome it proxies degrades or stays unknown.
   - Budget burn: spend, tokens, time, or iterations accumulate without a ceiling or a stopping rule tied to the outcome.
3. For every match, name the practice class, quote the evidence line, and state one cheaper alternative that achieves the same goal without the punishing effect. If no cheaper alternative exists for a match, state that explicitly rather than inventing one.
4. If no practice class matches, report the artifact clean with the scan coverage stated.
5. Emit the report as chat output only. Do not edit, stage, commit, or open issues.

## Failure and recovery
- Ambiguous evidence: if a line could match a practice class only by assuming intent the artifact does not state, do not classify it; record it as "unconfirmed" with the line quoted, and continue scanning the remaining classes. Never promote an unconfirmed line to a named practice.
- Missing artifact: if the supplied artifact cannot be read or is empty, stop and report that no scan was possible. Do not infer practices from absence.
- Partial result: if scanning is interrupted, emit the practices already confirmed as evidence-backed and mark the remaining classes as "not scanned." Never report clean when classes remain unscanned.
- Non-convergence does not apply: this is a single-pass read-only audit, not an iterative fix loop. There is no retry and no rollback beyond not having mutated anything.

## Output
A chat-only report. For each detected practice: the practice class name, the exact evidence line, and one cheaper alternative (or an explicit statement that none was found). If nothing matched: a clean verdict naming the five classes scanned and the artifact scope covered. The report changes no file, branch, credential, or remote state.

## Provenance

Origin: cobusgreyling/loop-engineering. Pinned revision d03dcb92cc1e0efb59789a2557131c6ad5897ccc. License: MIT. Source paths: /docs/anti-patterns.md, /docs/failure-modes.md, /stories/score-climbs-then-budget-burns.md, /stories/why-we-killed-ci-sweeper.md, /docs/distribution/substack-score-climbs-then-budget-burns.md. Clean-room adaptation: the five practice classes and the evidence-plus-cheaper-alternative audit shape are derived from the source's anti-pattern and failure-mode documentation; no third-party expression is copied.
