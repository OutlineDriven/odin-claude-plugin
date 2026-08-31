---
name: orchestration-patterns
description: 'Use when work decomposes across subagents or role panels: select a coupling-based orchestration mechanism, spawn bounded subagents, verify every artifact owner-side, and write only the reconciled synthesis. Not for cloud-agent task-graph orchestration — use cloud-task-orchestrator.'
---

# Orchestration patterns

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Work decomposes across subagents or role panels: parallel research, review waves, or staged handoffs. |
| Authority | reversible-local — spawn subagents and write synthesis to named local artifacts only; no VCS mutation, no credentials, no remote mutation; rollback any unintended write. |
| Side effect | Subagent runs spawned; only the reconciled synthesis is written. |
| Done | Every spawned subagent artifact landed and was verified by the owner; no partial output left unmerged. |

## Inputs

- Task decomposition: required. A named list of subagent tasks, each with a role label and a concrete goal.
- Role definitions: required. Each role's instructions and tool permissions.
- Pattern selection criteria: optional. The coupling characteristics of the decomposition: independent, ordered, or adversarial. Infer them from the decomposition when omitted.

## Procedure

1. **Assess coupling.** Classify each task:
   - Independent: no ordering constraint or shared mutable state, and the task benefits from an isolated context.
   - Ordered: the task requires a prior task's output.
   - Adversarial: another role must challenge its evidence or conclusion.
   Done when: every task is classified as independent, ordered, or adversarial.

2. **Choose one bounded mechanism.** Apply the first matching row; the action in the second column is the complete mechanism, not a pointer to another skill or command.

   | Condition | Mechanism |
   |---|---|
   | Several independent tasks produce mergeable results | Spawn one subagent per task in the same orchestrator turn, require a named artifact from each, then inspect and reconcile all artifacts. |
   | Tasks are ordered | Spawn only the first ready task. Inspect its artifact, extract the exact input required by the next task, then spawn that next task. Stop at any failed handoff. |
   | Independent tasks each consume a large input but return a small digest | Give each subagent only its assigned source slice and a fixed digest schema; keep source text out of the orchestrator context, then reconcile the returned digests. |
   | One task needs one perspective and one artifact | Spawn one subagent with that goal, inspect its artifact, and use it directly after verification. |
   | The same independent role must process several units | Spawn one isolated subagent per unit in the same turn; require the same output schema from all units and reconcile only after every unit verifies. |
   | Roles must challenge one another | Spawn independent advocate and critic roles from the same evidence in one turn; require claim-evidence-objection records, then have the orchestrator resolve each objection against the cited evidence. |

   Done when: one bounded mechanism is chosen matching the coupling assessment.

3. **Validate multi-subagent execution.** Before spawning more than one subagent, confirm all of the following:
   - Concurrent tasks have no ordering dependency and do not write the same target.
   - Each role or unit has a distinct bounded assignment and named output.
   - The returned artifacts can fit in the orchestrator's remaining context for verification and synthesis.
   - Parallel execution materially reduces elapsed time or preserves context enough to justify the extra runs.
   If any check fails, reduce to one ready subagent at a time and use the ordered handoff mechanism from Step 2. Done when: all four validation checks pass, or the plan is reduced to sequential ordered handoffs.

4. **Enforce orchestration depth = 1.** Only the orchestrator spawns subagents. Each subagent receives an explicit prohibition on spawning another agent. A subagent records proposed follow-up work in its artifact for the orchestrator to decide after verification. Done when: every subagent is given an explicit no-spawn prohibition.

5. **Spawn the selected units.** For concurrent work, issue every subagent call in one orchestrator turn. For ordered work, issue one call, verify its artifact, and only then issue the dependent call. Give every subagent its role, bounded input, concrete goal, allowed tools, forbidden writes, output path or schema, and done predicate. Done when: all selected units are spawned with complete role, input, goal, tools, forbidden writes, output, and done predicate.

6. **Owner-verify every artifact.** Inspect each actual artifact rather than trusting a reported path or summary. Confirm that it exists, covers the assigned input, follows the required schema, stays within authority, cites evidence for factual claims, and satisfies the task's done predicate. Treat a missing or invalid artifact as a failed unit. Done when: every artifact is owner-verified against all six criteria.

7. **Reconcile verified artifacts.** Resolve overlaps and disagreements against cited evidence. Include every verified unit's material disposition in the synthesis: accepted, superseded with reason, or rejected with reason. Do not synthesize while any spawned unit lacks a disposition. Done when: every verified unit has a disposition and overlaps/disagreements are resolved against evidence.

8. **Write only the synthesis.** Write the reconciled synthesis to the named local artifact. Remove any partial synthesis created during this run. Subagent artifacts may remain only when the synthesis cites them as evidence; otherwise discard them after reconciliation. Done when: the synthesis is written to the named path with all partial syntheses removed.

## Failure and recovery

- Subagent non-convergence: a subagent loops, returns no artifact, exceeds its bounded assignment, or produces an artifact that fails owner verification. Stop dependent work, name the failed unit and failed criterion, and do not write a synthesis.
- Partial landing: at least one spawned unit verifies and at least one does not. Report both sets and preserve verified artifacts as evidence, but do not merge or present a partial synthesis as complete.
- Contention collision: two assignments target the same mutable artifact. Cancel the colliding parallel plan before accepting either write, restore the named local target to its pre-run state, then rerun the units one at a time with separate artifacts.
- Disagreement without evidence: artifacts conflict and their citations do not resolve the conflict. Return the conflicting claims and missing evidence; do not invent a deciding fact.
- Context overflow risk: verified artifacts will not fit for owner-side reconciliation. Replace each unstarted large-input unit with the bounded digest mechanism from Step 2; if already-returned artifacts still cannot be reconciled, stop without synthesis and report the unprocessed set.
- Rollback: if synthesis began before all artifacts verified and received dispositions, remove that partial synthesis, retain the verified source artifacts, and resume at Step 6.

## Output

One reconciled synthesis artifact at the supplied local path, citing every contributing subagent artifact and recording a disposition for every spawned unit. On failure, return the named failure class, affected units, failed criteria, and rollback state without a partial synthesis.
