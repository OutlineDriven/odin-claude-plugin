---
name: reflect
description: 'Use when a completed task needs reflection on the invoked skills to propose and apply approved improvements, with explicit human approval before any edit. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
disable-model-invocation: true
---

# Reflect

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Reflect on a completed task to improve invoked skills. |
| Authority | Human-only: explicit invocation required before any mutation. |
| Side effect | Edits approved skills and may file backlog items. |
| Done | Approved improvements applied and rejections explained. |

## Inputs

The human must supply:
- The completed task context (what was attempted, what happened, what remains).
- The list of invoked skill slugs or names.

Optional: evidence of failure patterns, specific lines or sections to target, or scope constraints.

## Procedure

1. **Collect context.** Gather the task context and the list of invoked skills from the human. Identify which skill files are reachable in the workspace.
2. **Analyze.** Examine the invoked skills for failure patterns, missing coverage, unclear scope, or improvement opportunities. Do not widen the analysis beyond the named skills.
3. **Propose.** Present each finding as a discrete improvement proposal. Label each as "apply now", "apply on approval", or "backlog item". Keep proposals scoped to one skill.
4. **Get approval.** For every "apply now" or "apply on approval" proposal, obtain explicit human approval before making any file change.
5. **Execute.** Apply approved edits to the skill files. File any approved backlog items. Report every applied change and every rejected or deferred proposal.

## Failure and recovery
- **Analysis failure.** If the skill files cannot be read or the task context is insufficient, stop and report the reason.
- **No improvement found.** If no actionable improvement is identified, state that finding and end without mutation.
- **Approval withheld.** If the human rejects or defers a proposal, record the reason and continue with remaining proposals.
- **Application failure.** If an approved edit cannot be applied after human sign-off, attempt to roll back any partial change and report the blocked state. Do not declare success when the done predicate does not hold.

## Output
A reflection report listing:
- Each analyzed skill and the findings.
- Each approved change and its result.
- Each rejected or deferred proposal and the reason.
- Any filed backlog items.

The report ends with a statement that the done predicate holds or identifies the specific outstanding block.

## Provenance

Origin: cursor-reflect skill from pstack (cursor/plugins), revision 68836ddaf5697224520f1847d90cdb90ca8babaa.
License: MIT — per pstack/LICENSE blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25; pstack authored by Lauren Tan (poteto).
Adaptation: rebuilt from MIT-licensed source under clean-room adaptation rules. Structural mechanism (approval-gated improvement workflow) preserved. Execution authority and failure handling aligned to ODIN 2.0 contracts.
