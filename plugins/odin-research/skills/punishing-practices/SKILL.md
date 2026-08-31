---
name: punishing-practices
description: 'Use when a workflow, plan, diff, or completed work cycle must be checked for practices that punish the project later: symptom patching, infinite retries, weak verification, score chasing, budget burn. Returns a read-only evidence report naming each detected practice with a cheaper alternative. Not for source, remote, credential, publish, deploy, or irreversible changes.'
---

# Punishing practices

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A workflow, plan, diff, or completed work cycle must be checked for practices that punish the project later. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output naming each detected practice with evidence and a cheaper alternative, or a clean verdict. |
| Done | Every detected practice is named with an evidence line and a cheaper alternative (or explicit absence), or the artifact is reported clean with scan coverage stated. The report changes nothing. |

## Refusals

- Remote, credential, publish, deploy, or irreversible changes: rejected. This skill emits a chat report only.
- Invented failures: rejected. If no practice class matches, report the artifact clean.
- Source or remote-system changes: rejected. This skill never edits code, branches, credentials, or remote state.

## Inputs

- Artifact to audit (required): a workflow, plan, diff, or completed work cycle, supplied as a concrete artifact (file path, pasted content, committed diff range, workflow definition, or verbal cycle description).
- Success metric or budget (optional): the metric or budget the artifact is meant to serve, used only to judge whether a practice is score chasing or budget burn.
- Scope hint (optional): the user may bound the audit to a specific subsystem, time window, or decision.

## Procedure

1. Read the supplied artifact without mutating it. Bound the audit to the artifact's stated scope; do not widen to unreferenced code or history. Done when: the artifact is read and the audit scope is bounded.
2. For each of the five practice classes, scan the artifact for a match and collect the exact evidence line (quote, step number, or configuration value) that proves it:
   - Symptom patching: a change suppresses a signal (warning, error, failing test, metric) without addressing its cause.
   - Infinite retries: a loop, hook, or agent step retries without a bounded attempt count, backoff ceiling, or stop condition.
   - Weak verification: a check, gate, or test that can pass while the defect it claims to catch is still present (tautological assertion, mocked-out assertion, missing assertion, green-on-broken).
   - Score chasing: work optimizes a metric or rubric score while the underlying outcome it proxies degrades or stays unknown.
   - Budget burn: spend, tokens, time, or iterations accumulate without a ceiling or a stopping rule tied to the outcome.
   Done when: all five classes have been scanned and evidence collected or confirmed absent.
3. For every match, name the practice class, quote the evidence line, and state one cheaper alternative that achieves the same goal without the punishing effect. If no cheaper alternative exists for a match, state that explicitly rather than inventing one. Done when: every match has its class, evidence, and alternative (or explicit absence) recorded.
4. If no practice class matches, report the artifact clean with the scan coverage stated: name the five classes scanned and the artifact scope covered. Done when: the clean verdict is emitted.
5. Emit the audit report as chat output. Do not edit, stage, commit, or open issues. Done when: the report is emitted as chat output and no mutation occurred.

## Failure and recovery

- Ambiguous evidence: if a line could match a practice class only by assuming intent the artifact does not state, do not classify it; record it as "unconfirmed" with the line quoted, and continue scanning the remaining classes. Never promote an unconfirmed line to a named practice.
- Missing artifact: if the supplied artifact cannot be read or is empty, stop and report that no scan was possible. Do not infer practices from absence.
- Partial result: if scanning is interrupted, emit the practices already confirmed as evidence-backed and mark the remaining classes as "not scanned." Never report clean when classes remain unscanned.
- Non-convergence does not apply: the audit is a single-pass read-only scan, not an iterative fix loop. It does not retry, and because it mutates nothing, it needs no rollback.

## Output

A chat-only report — per detected practice, class name, exact evidence line, one cheaper alternative (or explicit statement that none was found); if nothing matched, a clean verdict naming the five classes scanned and the artifact scope covered. The report changes no file, branch, credential, or remote state.
