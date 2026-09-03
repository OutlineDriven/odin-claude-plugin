---
name: poteto-mode
description: 'Use when asked to apply the pstack rigor mode to non-trivial work. Routes the task to a matched playbook from a 23-index and executes it to verified completion on the real surface. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Poteto mode: pstack rigor execution

Classify a non-trivial task against the 23-playbook index, execute the selected contract end-to-end, and verify its outcome on the surface the user will actually use.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Apply the pstack rigor mode to non-trivial work: classify the task against the 23-playbook index and execute the matched playbook end-to-end. |
| Authority | Reversible local writes: execute the selected playbook's actions in the working tree, including code edits, test runs, agent dispatch, worktree creation, and PR workflow operations. Remote or irreversible actions (push, PR creation, release, deployment, credential use, branch or worktree deletion) require explicit human approval per action; approval for one does not authorize another. |
| Side effect | The selected playbook's actions are executed in the working tree; agents, worktrees, and PR workflow operations are dispatched as the playbook requires. |
| Done | The selected playbook's required actions are completed per its contract in `references/playbooks.md`, and its real-surface done check passes: the observation the playbook names as its completion proof is made on the surface the user will actually use, not substituted by compilation, a worker report, a checked box, or source inspection. |
| Invocation policy | model+human |

## Inputs

- `task`: concrete description of the non-trivial work. Required.
- `playbook-name`: one of the 23 names below. Optional; infer it from the requested outcome when absent.
- `depth`: `shallow` or `deep`. Optional; defaults to `deep` for non-trivial work.
- `against <ref>`: base reference for diff-scoped work. Optional.

## Procedure

1. Select exactly one playbook. An explicit valid `playbook-name` wins. Otherwise classify by the requested outcome, not by an isolated keyword: unknown cause → `investigation`; defect → `bug-fix`; measured slowness → `perf-issue`; iterative metric improvement → `hillclimb`; live-process evidence → `runtime-forensics`; event/span chronology → `trace-forensics`; new behavior → `feature`; behavior-preserving restructuring → `refactoring`; throwaway question-answering build → `prototype`; reference-image parity → `visual-parity`; agent skill creation → `authoring-a-skill`; model or system measurement → `eval`; supervision of running work → `babysit`; release/deployment → `shipping`; one delegated unattended objective → `autonomous-run`; multiple coordinated work units → `parallel-launch`; adversarial design pressure → `advocate`; second opinion → `oracle`; architecture decision → `plan`; skill authoring → `authoring-a-skill`. Done when: exactly one playbook name from the 23-name index is selected and the classification rationale is stated, or the run stops with the unmatched outcome named.
2. State the selected playbook, its concrete target, and its real-surface done check before changing anything. Inspect the repository or running surface narrowly enough to identify its existing commands and conventions; do not invent a command or establish a second convention. Done when: the playbook, target, and done check are stated and existing commands and conventions are identified.
3. Execute the selected playbook's required actions and real-surface done check as defined in `references/playbooks.md`. Done when: the playbook's required actions are completed per its contract in references/playbooks.md.
4. For agent, worktree, or PR operations, prefer the host's native primitive when available. Otherwise use the repository's established git operation for worktrees, the host agent dispatch surface for workers, and `gh` for PR workflow. Before each remote or irreversible action, show the exact action and consequence and wait for explicit human approval; approval for one action does not authorize another. Done when: each remote or irreversible action is previewed and approved, or the run stops before it.
5. Run the selected playbook's stated done check after all integration. If it fails, continue repairing within scope or return the precise failure. Never substitute compilation, a worker report, a checked box, or source inspection for the required real-surface observation. Done when: the real-surface done check passes or the precise failure is returned.

## Failure and recovery

- Invalid or unmatched playbook: make no change; list the 23 valid names and the unmatched outcome.
- Ambiguous classification: state the competing outcomes and stop rather than silently choosing the cheaper contract.
- Missing established mechanism: report the unavailable operation; do not invent a command, API, path, or peer-skill dependency.
- Failed check: preserve the failing observation, repair the source, and rerun the same real-surface check. Do not claim done while it is red.
- Unauthorized remote or irreversible action: stop before it and report the exact blocked action and consequence.
- Unexpected reversible mutation: restore the last known consistent local state before returning.
- Partial execution: report completed actions, current surface state, failed check, and next executable action; status is not `done`.

## Output

Return: `playbook` (selected name, or ordered names for independently requested outcomes), `status` (`done`, `blocked`, or `failed`), `actions` (concrete actions completed), `verification` (real surface exercised and observed result for each playbook), `approval` (each remote or irreversible action approved and performed, or the exact pending action), and `next-action` (required only when blocked or failed) — `done` is valid only when every selected playbook completed and its real-surface done check passed.
