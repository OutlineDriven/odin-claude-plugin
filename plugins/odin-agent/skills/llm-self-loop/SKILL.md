---
name: llm-self-loop
description: 'Use when a button click, dashboard check, or human verdict sits inside an iteration loop. Replaces it with an autonomous gate or moves non-automatable work outside the loop. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# LLM self loop

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A human explicitly invokes this skill for a task whose iteration loop depends on a button click, dashboard check, terminal or web interaction, screenshot inspection, copy-paste, secret entry, or human verdict. |
| Authority | Inspect the named workflow and make only reversible changes to its named local harness artifacts. Do not change credentials, paid services, published or deployed state, remote data, or external systems. |
| Side effect | Replace inner-loop human gates with local CLI triggers, file outputs, structured logs, or contract assertions, limited to the workflow and local artifacts named by the human. |
| Done | The loop reaches its asserted completion condition without an inner-loop human action, or every step that cannot be automated is removed from the inner loop and represented as one outer-loop approval or a discrete human handoff. |

## Inputs

Required: the workflow or local harness to restructure; the command, click, observation, or verdict that currently requires a human; and the loop's intended completion condition.

Supply any existing local commands, endpoints, logs, metrics queries, schemas, tests, and output paths that expose the gate. Credentials and secret values are neither required nor accepted. An output path and rollback method are optional; when omitted, choose paths inside the named local workflow and preserve the prior files so each change can be reverted.

## Procedure

1. Bound the work to the named workflow and local harness files. Record the files that may change and how each will be restored before writing anything; do not widen the scope to redesign the surrounding system. Done when: the files that may change are recorded with their restore methods.

2. Trace one iteration and name the smallest inner-loop gate: the exact human action, the signal the human contributes, where that signal or result currently lives, and the observable condition that permits the next iteration. Validate commands, paths, schemas, and machine-readable responses where they enter the harness; do not infer unavailable interfaces or evidence. Done when: the smallest inner-loop gate is named with its action, signal, location, and continuation condition.

3. Remove that gate with the narrowest applicable mechanism:
   - Replace a web or terminal action with an existing programmatically invokable local command or a local wrapper around a documented CLI, webhook, REST endpoint, or task target. The wrapper must expose a deterministic exit status or structured response. It must not submit credentials or perform paid, published, deployed, remote-mutating, or irreversible actions.
   - Replace chat-only, screenshot-only, or stdout-only results with a named JSON, Markdown, or append-only log file that the loop can read on the next iteration and compare across iterations.
   - Replace dashboard inspection with a read-only metrics or log query whose structured result yields an explicit `pass`, `fail`, or `warn` classification and retains the measured values.
   - Replace an eyeball verdict with an executable assertion, schema, test, or threshold that states the observable done condition.
   Done when: the gate is replaced with one narrowest mechanism that exposes a deterministic result.

4. Make the local change and run one iteration through the new trigger, persisted output, observation, and assertion. Capture the invoked operation, result, and assertion outcome in the named local output or structured log; never manufacture a successful observation. Done when: one iteration runs through the new mechanism and its result is captured.

5. Re-evaluate the loop after that single gate removal. If it now reaches the completion condition autonomously, stop. Otherwise repeat from step 2 for the next smallest gate without expanding beyond the recorded files. Done when: the loop reaches completion autonomously, or the next smallest gate is identified for another removal pass.

6. Classify every remaining gate. Trap a gate when the model can propose once, obtain one human approval outside the iteration loop, and then iterate autonomously against a fixed contract. When genuine human judgment, compliance review, live customer interaction, hardware access, secret entry, or another unavailable capability must occur on every iteration, remove that step from the autonomous loop and emit it as a discrete handoff containing the required action, inputs, and return artifact. Done when: every remaining gate is classified as trapped (outer-loop approval) or discrete handoff.

7. Confirm that no iteration path still waits for an implicit click, visual check, copy-paste, secret, or unrecorded verdict. Report the autonomous completion assertion or the exact outer-loop approvals and handoffs that remain. Done when: no implicit human wait remains in any iteration path and the terminal classification is reported.

## Failure and recovery
- Invalid or unavailable interface: If a required command, endpoint, query, path, schema, or completion criterion cannot be validated, do not substitute a guessed interface. Leave that gate unchanged and return `blocked` with the missing fact and the gate it prevents removing.
- Forbidden side effect: If closing the gate would require credentials, payment, publishing, deployment, remote mutation, data-at-rest mutation, or an irreversible action, do not perform it. Restore any local files changed for that attempted mechanism and return a discrete human handoff.
- Failed iteration: Preserve the command, structured output, measured values, and failed assertion. Revert only the local change that caused the failure, using the recorded prior file state, and return `non-converged` with the failing gate and evidence.
- Partial restructuring: Retain independently verified local gate removals only when each still works without the failed change and each has its own rollback path. Report every retained file and every unresolved gate; never claim the done predicate.
- Scope pressure: Stop with `blocked` rather than edit unlisted workflow areas, redesign the system, or invent proof.

## Output

Return the exact local files changed and their rollback paths; the former human gate and its replacement trigger, persisted output, structured observation, or assertion; the result of the exercised iteration; and one terminal classification: `autonomous`, `outer-loop-human`, `handoff-required`, `blocked`, or `non-converged`. For `autonomous`, include the passing completion assertion. For any other classification, name each remaining gate and the concrete action or missing evidence required.
