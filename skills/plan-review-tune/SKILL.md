---
name: plan-review-tune
description: 'Use when plan-mode enforcement hooks intercept a plan review or the user runs /plan-review-tune to tune which plan-review questions fire. Persists the tuned question flow to a local question-registry and hook configuration. Not for auditing a plan against code — use plan-review.'
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

1. Load the question-registry and developer profile from the local harness config directory; treat absent files as empty maps. Done when: the registry and profile are loaded or treated as empty.
2. For an inspect request, render the dual-track profile (declared versus behavior-suggested) and the current per-question preferences, then stop. Done when: the dual-track profile and preference map are rendered.
3. For a per-question preference request, validate that the question id is a member of the plan-review question set and that the preference is one of `never-ask`, `always-ask`, `ask-only-for-one-way`. Reject unknown ids or values before any write. Done when: the question id and preference are validated or rejected.
4. For an enable or disable request, set the question-tuning flag in the hook configuration. Done when: the flag is set in the hook configuration.
5. Persist the registry and hook configuration atomically: write to a temporary file in the config directory, then rename over the target. Leave every field the request did not name unchanged. Done when: the registry and hook configuration are persisted atomically with unnamed fields unchanged.
6. Re-read the persisted files and confirm the persisted state matches the request exactly. Done when: the re-read confirms the persisted state matches the request.

## Failure and recovery
- Unknown question id: stop, list the valid plan-review question ids, do not mutate the registry.
- Invalid preference value: stop, list the valid values, do not mutate the registry.
- Concurrent modification between read and persist: re-read, re-apply the requested change, re-persist; if the conflict persists, block and report the conflicting state without guessing.
- Write or rename failure: leave the prior configuration intact, report the error, and do not claim the done predicate holds.

## Output
The persisted question-registry and hook configuration plus a one-line confirmation naming the changed question id or flag and its new value — or, for an inspect request, the rendered dual-track profile and preference map.
