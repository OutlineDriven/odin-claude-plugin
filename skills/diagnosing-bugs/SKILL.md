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

The failing test, command, or observed symptom that needs diagnosis. Optional: logs, traces, or repro steps already captured. The repro must be obtainable before any code mutation.

## Procedure

1. Reproduce the failure before any change. Capture the exact command, input, and environment that triggers it. If it cannot be reproduced, stop and report the irreproducible symptom with the captures gathered.
2. Narrow the repro to the smallest input and code path that still triggers it. Redact secrets from any captured output before storing it.
3. Form a root-cause hypothesis tied to the narrowed repro.
4. Add tagged instrumentation only around the suspected path to confirm or refute the hypothesis. Tag every probe so it can be found and removed.
5. Apply the minimal fix that removes the root cause.
6. Run the original repro and confirm it no longer triggers.
7. Add a regression test that fails against the unfixed code and passes after the fix.
8. Remove all tagged instrumentation. Confirm the regression test still passes with instrumentation gone.

## Failure and recovery
- Irreproducible failure: stop; report the symptom and captures; do not mutate code on a hypothesis without a repro.
- Hypothesis refuted: remove the instrumentation for that hypothesis, form a new one, and repeat from step 3.
- Fix breaks other tests: revert the fix, re-narrow the root cause, and do not widen scope.
- Non-converged: report the blocked state with the last repro, hypothesis, and instrumentation location; remove any instrumentation before stopping.
- Partial results: any instrumentation added must be removed before stopping; the regression test is kept only if the fix is kept.

## Output
A confirmed root cause, the minimal fix, a passing regression test, and a clean tree with all instrumentation removed; or a blocked report stating the irreproducible symptom or the unisolated cause with the last captures and hypothesis.

## Provenance

Adapted from mattpocock/skills, skills/engineering/diagnosing-bugs, revision 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76. MIT license, Copyright (c) 2026 Matt Pocock; the copyright and permission notice is retained in licenses/NOTICE. The reproduction-first diagnosis mechanism is preserved; the lagging docs mirror was superseded by the authoritative SKILL.md per full-read verification.
