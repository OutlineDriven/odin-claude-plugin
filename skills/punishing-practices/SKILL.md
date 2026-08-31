---
name: punishing-practices
description: 'Use when a workflow, plan, diff, or completed work cycle must be checked for practices that punish the project later: symptom patching, infinite retries, weak verification, score chasing, budget burn. Defaults to a read-only evidence report; extends to a written six-section retrospective when the user explicitly requests an after-action account. Not for source, remote, credential, publish, deploy, or irreversible changes.'
---

# Punishing practices

## Contract

| Field | Bound contract |
|---|---|
| Trigger | a workflow, plan, diff, or completed work cycle must be checked for practices that punish the project later, or the user explicitly requests an after-action account, retrospective, or post-mortem of a completed work cycle. |
| Authority | read-only by default: no file, VCS, credential, paid, published, deployed, or remote mutation. When the user explicitly requests an after-action account for a completed cycle, authority extends to one reversible local write of a retrospective file. Rollback: delete the written file. |
| Side effect | default — chat output naming each detected practice with evidence and cheaper alternative, or a clean verdict; extended — one local file containing the after-action account with concrete changed practices. |
| Done | every detected practice is named with an evidence line and a cheaper alternative (or explicit absence), or the artifact is reported clean with scan coverage stated; when extended, a candid after-action account exists as a written artifact naming what happened, what failed, what worked, and at least one concrete changed practice for the next cycle. The report itself changes nothing except the single retrospective file in extended mode. |

## Refusals

- **Remote, credential, publish, deploy, or irreversible changes**: rejected. This skill emits a chat report and, in extended mode, writes one local file only.
- **Invented failures**: rejected. If no practice class matches, report the artifact clean. If the user reports no failures in a retrospective, record that explicitly rather than fabricating them.
- **Sanitized account**: rejected when the user declines to be candid. State that the retrospective value depends on honesty, then write whatever the user is willing to state with a note that the account is partial.
- **Source or remote-system changes**: rejected. This skill never edits code, branches, credentials, or remote state.

## Inputs

- **Artifact to audit** (required): a workflow, plan, diff, or completed work cycle, supplied as a concrete artifact (file path, pasted content, committed diff range, workflow definition, or verbal cycle description).
- **Success metric or budget** (optional): the metric or budget the artifact is meant to serve, used only to judge whether a practice is score chasing or budget burn.
- **Scope hint** (optional): the user may bound the audit or retrospective to a specific subsystem, time window, or decision.

## Procedure

1. Read the supplied artifact without mutating it. Bound the audit to the artifact's stated scope; do not widen to unreferenced code or history. If the artifact is a completed work cycle and the user explicitly requests an after-action account, note that the extended retrospective path applies after the audit scan. Done when: the artifact is read and the audit scope is bounded.
2. For each of the five practice classes, scan the artifact for a match and collect the exact evidence line (quote, step number, or configuration value) that proves it:
   - **Symptom patching**: a change suppresses a signal (warning, error, failing test, metric) without addressing its cause.
   - **Infinite retries**: a loop, hook, or agent step retries without a bounded attempt count, backoff ceiling, or stop condition.
   - **Weak verification**: a check, gate, or test that can pass while the defect it claims to catch is still present (tautological assertion, mocked-out assertion, missing assertion, green-on-broken).
   - **Score chasing**: work optimizes a metric or rubric score while the underlying outcome it proxies degrades or stays unknown.
   - **Budget burn**: spend, tokens, time, or iterations accumulate without a ceiling or a stopping rule tied to the outcome.
   Done when: all five classes have been scanned and evidence collected or confirmed absent.
3. For every match, name the practice class, quote the evidence line, and state one cheaper alternative that achieves the same goal without the punishing effect. If no cheaper alternative exists for a match, state that explicitly rather than inventing one. Done when: every match has its class, evidence, and alternative (or explicit absence) recorded.
4. If no practice class matches, report the artifact clean with the scan coverage stated: name the five classes scanned and the artifact scope covered. Done when: the clean verdict is emitted.
5. Emit the audit report as chat output. Do not edit, stage, commit, or open issues. Done when: the report is emitted as chat output and no mutation occurred.
6. If the user explicitly requested an after-action account for a completed work cycle, extend the audit into a retrospective. Ask the user to state in their own words what the goal was, what happened, and what surprised them. Ask only for facts the artifacts and audit scan cannot supply. Done when: the user has stated goal, outcome, and surprises.
7. From the user's answers and the audit findings, extract and list: what was attempted (concrete actions, decisions, commits), what failed or underperformed (specific outcomes with the user's stated reason, plus any practice class the audit flagged), what worked (outcomes that met or exceeded intent), and what was surprising (deviations from expectation). Done when: all four categories are populated.
8. For each failure or underperformance, ask the user: "What practice, if changed, would prevent this next time?" Record the answer verbatim or near-verbatim. Done when: each failure has a user-stated practice change.
9. Synthesize the account into a written artifact with six sections: **Cycle** (name and boundary), **Goal** (what was intended), **Account** (candid narrative in the user's voice), **Failures** (each with root cause as stated by the user, cross-referenced to any audit-flagged practice class), **Wins** (what worked and why), **Changed practices** (each as an imperative specific enough that a future self could check whether it was followed). Done when: all six sections are written.
10. Present the draft to the user. Ask: "Is this candid enough? What would you soften or sharpen?" Done when: the user has reviewed and responded.
11. Incorporate the user's edits. Done when: all user edits are applied.
12. Write the final artifact to a local file named `retrospective-<cycle-slug>.md` in the current working directory. Done when: the file exists on disk.

## Failure and recovery

- **Ambiguous evidence**: if a line could match a practice class only by assuming intent the artifact does not state, do not classify it; record it as "unconfirmed" with the line quoted, and continue scanning the remaining classes. Never promote an unconfirmed line to a named practice.
- **Missing artifact**: if the supplied artifact cannot be read or is empty, stop and report that no scan was possible. Do not infer practices from absence.
- **Partial result**: if scanning is interrupted, emit the practices already confirmed as evidence-backed and mark the remaining classes as "not scanned." Never report clean when classes remain unscanned.
- **User declines to be candid** (extended mode): state that the retrospective value depends on honesty, then ask one targeted question about the single largest deviation. If the user still declines, write whatever they are willing to state and note in the artifact that the account is partial.
- **No clear failure** (extended mode): record that explicitly and focus changed practices on what could be optimized or hardened.
- **Scope too broad** (extended mode): propose splitting into sub-cycles and let the user choose.
- **Write failure** (extended mode): output the full artifact to the conversation and instruct the user to save it manually.
- **Non-convergence does not apply**: the audit is a single-pass read-only scan, not an iterative fix loop. It does not retry, and because it mutates nothing, it needs no rollback. The extended retrospective is a single synthesis pass, not an iterative loop.

## Output

- **Default (audit)**: a chat-only report — per detected practice, class name, exact evidence line, one cheaper alternative (or explicit statement that none was found); if nothing matched, a clean verdict naming the five classes scanned and the artifact scope covered. The report changes no file, branch, credential, or remote state.
- **Extended (retrospective)**: a local file `retrospective-<cycle-slug>.md` with sections Cycle, Goal, Account, Failures, Wins, Changed practices, ordered as listed. The audit findings are cross-referenced inside Failures. No other file, branch, credential, or remote state is changed.
