---
name: poteto-mode
description: 'Use when asked to apply the pstack rigor mode to non-trivial work. Routes the task to a matched playbook from a 23-index and executes it to verified completion on the real surface. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Poteto mode: pstack rigor execution

Classify a non-trivial task against the inline 23-playbook index, execute the selected contract end-to-end, and verify its outcome on the surface the user will actually use.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Apply the pstack rigor mode to non-trivial work. |
| Authority | reversible-local |
| Side effect | Routes and executes playbooks, agents, worktrees, and PR workflow. |
| Done | Matched playbook completed and verified on the real surface. |
| Invocation policy | model+human |

Remote or irreversible actions are outside reversible-local authority until the human approves the exact action and consequence. This includes pushes, PR creation, releases, deployments, credential use, and branch or worktree deletion.

## Inputs

- `task`: concrete description of the non-trivial work. Required.
- `playbook-name`: one of the 23 names below. Optional; infer it from the requested outcome when absent.
- `depth`: `shallow` or `deep`. Optional; defaults to `deep` for non-trivial work.
- `against <ref>`: base reference for diff-scoped work. Optional.

## Procedure

1. Select exactly one playbook. An explicit valid `playbook-name` wins. Otherwise classify by the requested outcome, not by an isolated keyword: unknown cause → `investigation`; defect → `bug-fix`; measured slowness → `perf-issue`; iterative metric improvement → `hillclimb`; live-process evidence → `runtime-forensics`; event/span chronology → `trace-forensics`; new behavior → `feature`; behavior-preserving restructuring → `refactoring`; throwaway question-answering build → `prototype`; reference-image parity → `visual-parity`; agent skill creation → `authoring-a-skill`; model or system measurement → `eval`; supervision of running work → `babysit`; release/deployment → `shipping`; one delegated unattended objective → `autonomous-run`; multiple coordinated workers → `orchestrate`; complete plan-to-shipped flow → `autopilot-full`; ordered cross-layer delivery → `autopilot-stack`; resume interrupted work → `session-pickup`; leave interruptible work safely → `pause-safely`; execute a dependency-ordered phase plan → `multi-phase-plan`; retire worktrees safely → `worktree-cleanup`; publish a pull request → `opening-a-pr`. If several outcomes are independently requested, execute the corresponding playbooks in dependency order and report each separately. If none fits, stop and list all 23 names.
2. State the selected playbook, its concrete target, and its real-surface done check before changing anything. Inspect the repository or running surface narrowly enough to identify its existing commands and conventions; do not invent a command or establish a second convention.
3. Execute the selected inline contract:

| Playbook | Required actions | Real-surface done check |
|---|---|---|
| `investigation` | Reproduce or directly observe the unknown behavior; collect source/runtime evidence; rank competing hypotheses; run discriminating probes until one explanation survives. | Re-run the decisive probe and show that its observed result supports the stated cause or answer and rules out the live alternatives. |
| `bug-fix` | Reproduce the defect; trace it to the source invariant that fails; fix that source rather than suppressing the symptom; update affected callers and an existing changed-contract test when one exists. | Exercise the original reproduction on the actual interface and observe it no longer fails; run the focused existing regression check for the changed contract. |
| `perf-issue` | Capture a baseline with the repository's real benchmark or profiler; identify the measured hot path; change that path; compare under the same workload and environment. | Re-run the same measurement and report baseline and new result; the requested metric improves without a failed correctness check. |
| `hillclimb` | Choose one measurable objective and fixed workload; establish a baseline; make one attributable change per iteration; retain only measured wins; stop after a full pass yields no acceptable improvement. | Run the fixed workload once more and report the best reproducible result plus the correctness check for the optimized surface. |
| `runtime-forensics` | Observe the live or reproducible process with available logs, debugger, profiler, dump, or process state; align evidence to the failing interval; trace control and resource state to the responsible operation. | Reproduce or replay the interval and cite runtime observations that establish the failure mechanism and responsible code path. |
| `trace-forensics` | Identify the request/trace and relevant time window; order spans or events; correlate IDs across boundaries; locate the first divergence from expected chronology; validate it against code. | Present the trace-supported timeline with concrete IDs/timestamps and verify the claimed boundary against the corresponding implementation or a fresh trace. |
| `feature` | Translate the request into observable acceptance cases; inspect the existing integration seam; implement the complete behavior; migrate every affected caller and remove the superseded path. | Use the feature through its actual CLI, TUI, UI, API, or library entry point and observe every named acceptance case; run the focused existing contract checks. |
| `refactoring` | Record current observable behavior; restructure behind the existing interface; migrate all callers; remove obsolete code, aliases, and compatibility paths; preserve semantics. | Run the same before/after behavior checks through the public entry point and inspect the final call graph or references to confirm the old path has no callers. |
| `prototype` | Name the single uncertainty; build the smallest runnable artifact that answers it; use real data or interactions needed by that question; discard unrelated production architecture. | Run or interact with the prototype and record the observation that answers the named uncertainty. |
| `visual-parity` | Capture the reference, viewport, state, content, and theme; compare structure, typography, spacing, color, and responsive behavior; adjust the implementation by largest visible mismatch first. | Render the actual surface at each target viewport/state and compare it to the reference; no acceptance-relevant mismatch remains. |
| `authoring-a-skill` | Freeze trigger, authority, side effects, inputs, procedure, failures, output, and provenance; encode concrete mechanisms and recovery; keep the skill self-contained and remove dangling dependencies. | Load it through the host's actual skill discovery, invoke a representative matching request, and confirm the produced workflow reaches the declared output without an unavailable path or command. |
| `eval` | Define the behavior under evaluation, representative cases, deterministic checks or a scored rubric, baseline, and comparison conditions; run the cases; inspect failures rather than only aggregate scores. | Re-run the evaluation under the recorded conditions and report case results and aggregate values with enough evidence to reproduce the verdict. |
| `babysit` | Identify the process, terminal conditions, health signals, and intervention boundary; observe at bounded intervals; intervene only within authority; retain the final status and relevant diagnostics. | Observe the real process reach its required terminal condition, or report the concrete blocked/failed state with its latest health evidence. |
| `shipping` | Identify the exact artifact and destination; run existing release preflight checks; preview remote mutations; obtain human approval; publish or deploy using the repository's established release mechanism. | Inspect the destination users consume—release page, package registry, deployment, or endpoint—and verify the intended version/artifact is available and healthy. |
| `autonomous-run` | Bound one objective, allowed surface, done predicate, and stop conditions; launch with the host's native agent primitive; monitor its handle; inspect and integrate the returned work. | Independently exercise the integrated result on the real surface and satisfy the original done predicate; worker self-report alone does not count. |
| `orchestrate` | Decompose outcomes into dependency-aware owned units; launch only independent units in parallel with the host's native agent primitive; collect each handle; verify returns; integrate in dependency order. | Re-run parent-level acceptance and integration checks after all required child work is integrated; every required unit is accounted for. |
| `autopilot-full` | Derive a complete plan from the request; implement all units; review and repair the integrated result; run real-surface verification; request approval for shipping actions; ship when approved. | Verify the delivered behavior on its user-facing surface and, when shipping was requested and approved, verify the published destination. No planned unit remains. |
| `autopilot-stack` | Map the ordered layers and their contracts; implement bottom-up; verify each boundary before advancing; integrate and remove replaced paths; request approval for any remote publication. | Exercise the complete top-to-bottom path and each acceptance-changing layer boundary; the whole stack works without a fallback to the old path. |
| `session-pickup` | Inspect the current worktree, durable task artifacts, active processes, and available session handoff; reconstruct completed, pending, and blocked work from evidence; resume at the first unmet contract. | Exercise the resumed task's real surface and reconcile the result against the original request; no claimed prior completion is accepted without current evidence. |
| `pause-safely` | Stop at a consistent boundary; finish or roll back partial mutations; stop or identify owned processes/agents; record completed, pending, blocked, and the exact safe resumption action in the returned handoff. | Confirm the worktree and live processes are in the recorded state and that the handoff names an executable next action without claiming completion. |
| `multi-phase-plan` | Inventory all required outcomes; divide them into dependency-ordered phases with observable gates; execute each phase only after its prerequisites; re-plan discovered work without silently dropping scope. | Reconcile every phase and gate against the current request, then run the final cross-phase real-surface check; no required phase remains open. |
| `worktree-cleanup` | Inventory worktrees and their branch/dirty/unmerged state; retain anything not proven integrated or intentionally disposable; preview each deletion and obtain human approval; use the host's native worktree operation or established git operation. | Re-list worktrees and branches, confirm only approved targets disappeared, and confirm no retained worktree lost uncommitted or unintegrated work. |
| `opening-a-pr` | Inspect the intended base and compare range; review the complete diff; run focused existing checks; prepare an accurate title/body; preview push and PR creation; obtain human approval; use the established `gh` workflow. | Open the returned PR URL, verify base/head, changed-file range, title/body, and visible checks match the reviewed change. |

4. For agent, worktree, or PR operations, prefer the host's native primitive when available. Otherwise use the repository's established git operation for worktrees, the host agent dispatch surface for workers, and `gh` for PR workflow. Before each remote or irreversible action, show the exact action and consequence and wait for explicit human approval; approval for one action does not authorize another.
5. Run the selected playbook's stated done check after all integration. If it fails, continue repairing within scope or return the precise failure. Never substitute compilation, a worker report, a checked box, or source inspection for the required real-surface observation.

## Failure and recovery

- Invalid or unmatched playbook: make no change; list the 23 valid names and the unmatched outcome.
- Ambiguous classification: state the competing outcomes and stop rather than silently choosing the cheaper contract.
- Missing established mechanism: report the unavailable operation; do not invent a command, API, path, or peer-skill dependency.
- Failed check: preserve the failing observation, repair the source, and rerun the same real-surface check. Do not claim done while it is red.
- Unauthorized remote or irreversible action: stop before it and report the exact blocked action and consequence.
- Unexpected reversible mutation: restore the last known consistent local state before returning.
- Partial execution: report completed actions, current surface state, failed check, and next executable action; status is not `done`.

## Output

Return:
- `playbook`: selected name, or ordered names for independently requested outcomes.
- `status`: `done`, `blocked`, or `failed`.
- `actions`: concrete actions completed.
- `verification`: real surface exercised and observed result for each playbook.
- `approval`: each remote or irreversible action approved and performed, or the exact pending action.
- `next-action`: required only when blocked or failed.

`done` is valid only when every selected inline playbook completed and its real-surface done check passed.

## Provenance

Origin: `cursor/plugins` pstack repository, authored by Lauren Tan (poteto). Pinned revision: `68836ddaf5697224520f1847d90cdb90ca8babaa`. License: MIT. Adaptation statement: clean-room reimplementation of the 23-playbook role-model routing mechanism and per-playbook execution contracts, preserving the role-model routing and per-playbook contract mechanism while restructuring for the ODIN skill contract format and authority model. The MIT license permits adaptation and reuse with attribution.
