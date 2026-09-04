---
name: council
description: 'Use when the user asks for a council, second opinions, or parallel investigation. Not for cross-examination of existing proposals: use cross-critique.'
---

# Council

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks for a council, second opinions, or parallel investigation. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Subagents inherit the same read-only posture unless the user explicitly scopes a narrower mutation. |
| Side effect | Spawns parallel subagents in chat output. No repo mutation unless the user explicitly scopes it. Deliverable is the council's decision memo. |
| Done | Decision memo with recommendation, consensus, risks, and evidence. |

## Inputs

The question or decision to investigate (required). Number of council members or specific investigative stances to represent (optional; default three distinct stances). Scope constraints and admissible evidence sources (optional). The user-stated criteria bound the investigation; do not widen scope beyond them.

## Procedure

1. Restate the question and confirm scope against the user-stated criteria. Bound the investigation before spawning; do not widen scope. Done when: the question is restated and scope is confirmed against user criteria.
2. Define council members as distinct investigative stances appropriate to the question (for example optimist, skeptic, risk-auditor, domain expert). Use the user-specified stances when supplied; otherwise default to three. Done when: each council member is assigned a distinct investigative stance.
3. Spawn one subagent per stance. Each subagent investigates the question independently from its assigned stance, gathers evidence, and returns a position with supporting evidence and identified risks. Done when: one subagent is spawned per stance and each returns a position with evidence and risks.
4. Collect all subagent positions without merging prematurely. Done when: every subagent position is collected unmerged.
5. Compare positions across stances: mark consensus points, disagreements, and unresolved risks. Done when: consensus points, disagreements, and unresolved risks are marked across all positions.
6. Synthesize a decision memo stating the recommendation, the consensus reached, dissenting views, residual risks, and the evidence supporting each. Done when: the memo states recommendation, consensus, dissent, residual risks, and per-point evidence.
7. Present the memo. Do not select or execute a decision unless the user explicitly authorizes further action. Done when: the memo is presented and no decision is executed without explicit user authorization.

## Failure and recovery
- Subagent returns no usable position: mark that stance as inconclusive, proceed with remaining members, and note the gap in the memo.
- All subagents inconclusive or evidence insufficient: return a non-converged memo stating the blocker; do not fabricate consensus or pretend the done predicate holds.
- Scope drift detected: stop, restate the user-stated criteria, and re-bound before continuing; never widen scope to manufacture a result.
- Subagent attempts repo mutation without user-scoped authorization: treat as out-of-scope, exclude the action, and record the violation in the memo.
- Partial-result rule: a memo with some inconclusive stances is valid as long as every gap is explicitly recorded; never silently drop a stance.

## Output
A decision memo containing recommendation, consensus, dissenting views, residual risks, and evidence. Terminal classification is converged (consensus reached) or non-converged (insufficient evidence or unresolved disagreement).
