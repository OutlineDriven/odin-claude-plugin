---
name: plan-review-tune
description: 'Use when asked to plan-mode enforcement hooks intercept a plan review, or the user runs /plan-review-tune, to tune which plan-review questions fire. The tuned plan-review question flow is persisted to a local question-registry and hook configuration. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Plan review tune

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Plan-mode enforcement hooks intercept a plan review, or the user runs /plan-review-tune |
| Authority | Reversible local writes to the plan-review question-registry and hook configuration only; no VCS, credential, paid, published, deployed, or remote mutation |
| Side effect | Local question-registry and hook configuration files under the harness config directory |
| Done | The tuned plan-review question flow is persisted |

## Inputs

- Tuning request (required): one of (a) a question id plus a preference of `never-ask`, `always-ask`, or `ask-only-for-one-way`; (b) enable or disable question tuning; (c) inspect the current state.
- Question-registry (optional): the persisted per-question preference map; treated as empty if absent.
- Developer profile (optional): the dual-track record of declared preferences versus behavior-suggested preferences; treated as empty if absent.

## Procedure

1. Load the question-registry and developer profile from the local harness config directory; treat absent files as empty maps.
2. For an inspect request, render the dual-track profile (declared versus behavior-suggested) and the current per-question preferences, then stop.
3. For a per-question preference request, validate that the question id is a member of the plan-review question set and that the preference is one of `never-ask`, `always-ask`, `ask-only-for-one-way`. Reject unknown ids or values before any write.
4. For an enable or disable request, set the question-tuning flag in the hook configuration.
5. Persist the registry and hook configuration atomically: write to a temporary file in the config directory, then rename over the target. Leave every field the request did not name unchanged.
6. Re-read the persisted files and confirm the persisted state matches the request exactly.

## Failure and recovery
- Unknown question id: stop, list the valid plan-review question ids, do not mutate the registry.
- Invalid preference value: stop, list the valid values, do not mutate the registry.
- Concurrent modification between read and persist: re-read, re-apply the requested change, re-persist; if the conflict persists, block and report the conflicting state without guessing.
- Write or rename failure: leave the prior configuration intact, report the error, and do not claim the done predicate holds.

## Output
The persisted question-registry and hook configuration, plus a one-line confirmation naming the question id or flag that changed and its new value. An inspect request returns the rendered dual-track profile and preference map instead.

## Provenance

Origin: https://github.com/garrytan/gstack at revision 07b59e396c6be5a86619a43151cb9ed62a15ae69, path plan-tune/SKILL.md. License: MIT, Copyright (c) 2026 Garry Tan. Clean-room adaptation: the per-question preference vocabulary, dual-track developer profile, and question-tuning enable/disable mechanism are re-derived; no source expression is copied.
