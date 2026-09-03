---
name: figure-it-out
description: 'Use when asked to design a bespoke execution workflow when no playbook fits; verify a falsifiable predicate on the real product with a reviewable trail. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Figure it out

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Design a bespoke execution workflow when no playbook fits. |
| Authority | Write only named local artifacts built for this task; state the rollback path before writing each one. |
| Side effect | Builds and runs task-specific levers; changes limited to local artifacts named in the workflow. |
| Done | Predicate verified on real product with reviewable trail. |

## Inputs

- The task to execute and the falsifiable success predicate that defines done. Required.
- Available tools and the real product surface the predicate must be verified against. Required.
- Existing playbooks or prior workflows, if any, to confirm none fits. Optional.

## Procedure

1. Confirm no existing playbook fits the task; if one does, stop and defer to it. Done when: no playbook fits, or the skill stops and defers.
2. Define a falsifiable success predicate: a check that can fail on the real product, not a tautology. Done when: the predicate is stated and can fail.
3. Design the smallest bespoke workflow that reaches the predicate: name each lever (script, command, probe, or local artifact), its input, and its expected output. Done when: every lever is named with its input and expected output.
4. State the rollback path for every local artifact the workflow writes before writing it. Done when: every artifact's rollback path is stated before it is written.
5. Build and run each lever in order, recording the command, the real output, and whether it advanced the predicate. Done when: every lever is run with its real output recorded.
6. Verify the success predicate against the real product, not a mock or a proxy. Done when: the predicate is verified or fails on the real product.
7. Assemble the reviewable trail: the predicate, each lever run with its real output, and the final verification result. Done when: the trail is assembled with predicate, lever runs, and verification result.

## Failure and recovery
- No-fitting-playbook check fails: if a playbook fits, stop; do not invent a bespoke workflow.
- Predicate is not falsifiable: stop; require a predicate that can fail before proceeding.
- Lever output contradicts expected output: record the contradiction, do not advance; revise the lever or the workflow and re-run from the changed step.
- Predicate fails on real product: report the failure with the trail; do not claim done. Roll back local artifacts via the stated rollback path if the workflow left the product in a worse state.
- Blocked or non-converged result: the predicate is not verified and the trail shows which lever failed and why; no done claim is made.

## Output
A reviewable trail containing the falsifiable predicate, the bespoke workflow with each named lever, the real output of every lever run, and the final predicate verification result (verified or not verified).
