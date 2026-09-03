---
name: workflow-evidence-mining
description: 'Use when authorized workflow history may contain a repeated process worth extracting and replay-testing. Produces a contradiction-tested workflow mined from authorized history.'
---

# Workflow evidence mining

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Authorized workflow history may contain a repeated process worth extracting and replay-testing. |
| Authority | AUTHORIZED_PRIVATE_SOURCE_READ: read-only access to the authorized corpus. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Produces a contradiction-tested workflow mined from authorized history. |
| Done | The workflow survives at least three independent high-confidence successes and a fresh replay. |
| Stop | contradicted; insufficient evidence; blocked. Bound: authorized corpus and pass cap. |

## Inputs

- Authorized corpus (required): the workflow history to mine, bounded to sources the user is authorized to read.
- Pass cap (required): the maximum number of extraction-replay cycles before declaring insufficient evidence.

## Procedure

1. Bound the authorized corpus and pass cap; freeze before extraction. **Done when:** the corpus scope and pass cap are frozen and recorded.
2. Mine the authorized history for repeated processes. Identify candidate workflows that appear in at least three independent high-confidence success instances. **Done when:** candidate workflows are listed with their supporting instances.
3. Extract the workflow: name the steps, inputs, outputs, decision points, and stop conditions that recur across the supporting instances. **Done when:** the workflow is documented with all recurring elements.
4. Contradiction-test the extracted workflow: search the corpus for instances that contradict any step or decision point. If a contradiction is found, revise the workflow to account for it or kill the candidate if the contradiction is structural. **Done when:** the workflow survives contradiction testing or is killed.
5. Replay-test the surviving workflow on a fresh instance from the corpus. Confirm it reproduces the success path. **Done when:** the replay succeeds or the workflow is killed.

## Failure and recovery

- Contradicted: the workflow is contradicted by corpus evidence that cannot be reconciled. Stop. Terminal class: `contradicted`.
- Insufficient evidence: the authorized history does not contain three independent high-confidence success instances of any candidate. Stop. Terminal class: `insufficient`.
- Blocked: the pass cap is reached before a surviving workflow is confirmed. Stop. Terminal class: `blocked`.

## Output

A contradiction-tested workflow mined from authorized history: the named steps, inputs, outputs, decision points, stop conditions, supporting instances, contradiction-test results, and replay result. Terminal classification: `extracted` (workflow survives three successes and a fresh replay), `contradicted` (structural contradiction killed the candidate), `insufficient` (fewer than three independent successes in the corpus), or `blocked` (pass cap reached before confirmation).
