---
name: figure-it-out
description: 'Use when non-trivial work should run a matched playbook to verified real-surface completion, or a bespoke workflow when none fits. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Figure it out

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Execute a non-trivial task by classifying it against the 23-playbook index and running the matched playbook end-to-end, or design a bespoke execution workflow when no playbook fits. |
| Authority | Reversible local: actions run in the working tree with version control as rollback, and the bespoke workflow writes only named local artifacts built for this task, each with its rollback path stated before it is written. Human-gated: preview every remote or irreversible action (push, PR creation or any other PR workflow mutation, release, deployment, credential use, branch or worktree deletion) with its exact consequence and obtain explicit human approval per action before it; approval for one does not authorize another. |
| Side effect | The matched playbook's or the bespoke workflow's actions execute in the working tree; agents, worktrees, and PR workflow operations are dispatched as the matched playbook requires; bespoke changes stay limited to the local artifacts named in the workflow. |
| Done | A matched playbook's required actions are completed per its contract in `references/playbooks.md` and its real-surface done check passes: the observation the playbook names as completion proof is made on the surface the user will actually use, not substituted by compilation, a worker report, a checked box, or source inspection; a bespoke run's falsifiable predicate is verified on the real product with a reviewable trail. |

## Inputs

- The task to execute; include the falsifiable success predicate when no playbook fits. Required.
- The real product surface the result must be verified against, and the available tools. Required.
- `playbook-name`: one of the 23 names in `references/playbooks.md`. Optional; infer it from the requested outcome when absent.
- Existing playbooks or prior workflows, if any, to consider alongside the 23-index. Optional.

## Procedure

1. Classify the task against the 23-playbook index in `references/playbooks.md` and select exactly one. An explicit valid `playbook-name` wins. Otherwise classify by the requested outcome, not by an isolated keyword: unknown cause → `investigation`; defect → `bug-fix`; measured slowness → `perf-issue`; iterative metric improvement → `hillclimb`; live-process evidence → `runtime-forensics`; event/span chronology → `trace-forensics`; new behavior → `feature`; behavior-preserving restructuring → `refactoring`; throwaway question-answering build → `prototype`; reference-image parity → `visual-parity`; agent skill creation → `authoring-a-skill`; model or system measurement → `eval`; watch a changing process until a supplied terminal condition → `watch-for` (mode until); release or deployment → `shipping`; one delegated unattended objective → `autonomous-run`; independently owned units decomposed with dependency-aware dispatch → `cloud-task-orchestrator`; a complete plan derived, implemented, reviewed, and shipped under approval → `autopilot-full`; ordered layers implemented bottom-up against layer contracts → `autopilot-stack`; prior work resumed by reconstructing completed, pending, and blocked state → `session-pickup`; stopping at a consistent boundary with a recorded handoff → `pause-safely`; required outcomes spanning dependency-ordered phases → `multi-phase-plan`; worktree and branch inventory with approved disposal → `worktree-cleanup`; a reviewed pull request opened against a base → `opening-a-pr`. Done when: exactly one playbook name from the 23-name index is selected with the classification rationale stated, or no playbook fits and the run proceeds to the bespoke workflow at step 6.
2. If a playbook fits: state the selected playbook, its concrete target, and its real-surface done check before changing anything. Inspect the repository or running surface narrowly enough to identify its existing commands and conventions; do not invent a command or establish a second convention. Done when: the playbook, target, and done check are stated and existing commands and conventions are identified.
3. If a playbook fits: execute the selected playbook's required actions as defined in `references/playbooks.md`. For agent, worktree, or PR operations, prefer the host's native primitive when available; otherwise use the repository's established git operation for worktrees, the host agent dispatch surface for workers, and `gh` for PR workflow. Done when: the playbook's required actions are completed per its contract in `references/playbooks.md`.
4. If a playbook fits: before each remote or irreversible action, show the exact action and consequence and wait for explicit human approval; approval for one action does not authorize another. Done when: each remote or irreversible action is previewed and approved, or the run stops before it.
5. If a playbook fits: run the selected playbook's stated done check after all integration. If it fails, continue repairing within scope or return the precise failure. Never substitute compilation, a worker report, a checked box, or source inspection for the required real-surface observation. Done when: the real-surface done check passes or the precise failure is returned.
6. If no playbook fits: define a falsifiable success predicate: a check that can fail on the real product, not a tautology. Done when: the predicate is stated and can fail.
7. If no playbook fits: design the smallest bespoke workflow that reaches the predicate: name each lever (script, command, probe, or local artifact), its input, and its expected output. Done when: every lever is named with its input and expected output.
8. If no playbook fits: state the rollback path for every local artifact the workflow writes before writing it. Done when: every artifact's rollback path is stated before it is written.
9. If no playbook fits: build and run each lever in order, recording the command, the real output, and whether it advanced the predicate. Done when: every lever is run with its real output recorded.
10. If no playbook fits: verify the success predicate against the real product, not a mock or a proxy. Done when: the predicate is verified or fails on the real product.
11. Assemble the reviewable trail: for a playbook run, the selected playbook with its classification rationale, concrete target, completed actions, approvals, and real-surface verification; for a bespoke run, the predicate, each lever run with its real output, and the final verification result. Done when: the trail is assembled with the playbook or predicate, the executed actions or lever runs, and the verification result.

## Failure and recovery

- Invalid or unmatched playbook: make no change; list the 23 valid names and the unmatched outcome.
- Ambiguous classification: state the competing outcomes and stop rather than silently choosing the cheaper contract.
- A playbook fits after the bespoke workflow started: stop the bespoke workflow and defer to the playbook; do not invent a workflow that duplicates it.
- Predicate is not falsifiable: stop; require a predicate that can fail before proceeding.
- Missing established mechanism: report the unavailable operation; do not invent a command, API, path, or peer-skill dependency.
- Failed check or predicate fails on the real product: preserve the failing observation with the trail, repair the source, and rerun the same real-surface check; roll back local artifacts via the stated rollback path if the surface is left in a worse state; do not claim done while it is red.
- Lever output contradicts expected output: record the contradiction, do not advance; revise the lever or the workflow and re-run from the changed step.
- Unauthorized remote or irreversible action: stop before it and report the exact blocked action and consequence.
- Unexpected reversible mutation: restore the last known consistent local state before returning.
- Partial execution or non-converged result: report completed actions or the failed lever, current surface state, the failed check, and the next executable action; status is not `done`.

## Output

A reviewable trail containing `status` (`done`, `blocked`, or `failed`); for a playbook run, the selected `playbook` (or ordered names for independently requested outcomes), its concrete target, the `actions` completed, the `verification` (real surface exercised and observed result for each playbook), and the `approval` record (each remote or irreversible action approved and performed, or the exact pending action); for a bespoke run, the falsifiable predicate, the bespoke workflow with each named lever, the real output of every lever run, and the final predicate verification result (verified or not verified). Add `next-action` only when blocked or failed. `done` is valid only when every selected playbook completed with its real-surface done check passed, or the bespoke predicate is verified on the real product.
