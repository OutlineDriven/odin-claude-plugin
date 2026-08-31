---
name: diagnosing-bugs
description: 'Use when a failure, flake, regression, or slowness needs root-cause diagnosis. Reproduce the defect first, then isolate the cause, prove the fix, and remove all instrumentation. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Diagnosing bugs

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A failure, flake, regression, or slowness needs root-cause diagnosis. |
| Authority | Write only named local artifacts: redacted captures, tagged instrumentation, a regression test, and the fix. Roll back by reverting those local writes. |
| Side effect | Redacted captures, tagged instrumentation, regression test, and fix. |
| Done | Original repro is gone, regression proof passes, and all instrumentation is removed. |

## Inputs

The input is the failing test, command, or observed symptom to diagnose. Logs, traces, or previously captured repro steps are optional. The repro must be obtainable before any code mutation.

## Procedure

1. Reproduce the failure before any change. Capture the exact command, input, and environment that triggers it. If it cannot be reproduced, stop and report the irreproducible symptom with the captures gathered. **Done when:** the failure is reproduced with command, input, and environment captured, or the skill stops on an irreproducible symptom.

2. Narrow the repro to the smallest input and code path that still triggers it. Redact secrets from any captured output before storing it. **Done when:** the repro is minimal and captured output is redacted.

3. Form a root-cause hypothesis tied to the narrowed repro. **Done when:** one hypothesis is stated and tied to the narrowed repro.

4. Add tagged instrumentation only around the suspected path to confirm or refute the hypothesis. Tag every probe so it can be found and removed. **Done when:** tagged probes are in place around the suspected path.

5. Apply the minimal fix that removes the root cause. **Done when:** the minimal fix is applied.

6. Run the original repro and confirm it no longer triggers. **Done when:** the original repro no longer triggers.

7. Add a regression test. It must fail against the unfixed code and pass after the fix. **Done when:** the regression test fails before and passes after the fix.

8. Remove all tagged instrumentation. Confirm the regression test still passes with instrumentation gone. **Done when:** all instrumentation is removed and the regression test still passes.

## Failure and recovery
- Irreproducible failure: stop; report the symptom and captures; do not mutate code on a hypothesis without a repro.
- Hypothesis refuted: remove the instrumentation for that hypothesis, form a new one, and repeat from step 3.
- Fix breaks other tests: revert the fix, re-narrow the root cause, and do not widen scope.
- Non-converged: report the blocked state with the last repro, hypothesis, and instrumentation location; remove any instrumentation before stopping.
- Partial results: any instrumentation added must be removed before stopping; the regression test is kept only if the fix is kept.

## Output
A confirmed root cause, the minimal fix, a passing regression test, and a clean tree with all instrumentation removed, or a blocked report stating the irreproducible symptom or unisolated cause with the last captures and hypothesis, ordered reproduce → narrow → hypothesize → instrument → fix → confirm → test → clean.

## Provenance

Adapted from mattpocock/skills, skills/engineering/diagnosing-bugs, revision 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76. MIT license, Copyright (c) 2026 Matt Pocock; the copyright and permission notice is retained in licenses/NOTICE. The reproduction-first diagnosis mechanism is preserved; the lagging docs mirror was superseded by the authoritative SKILL.md per full-read verification.
