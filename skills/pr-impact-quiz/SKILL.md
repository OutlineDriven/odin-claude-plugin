---
name: pr-impact-quiz
description: 'Use when a user invokes this skill, generate three targeted questions that prove the author understands how the submitted change affects the existing codebase. Don''t use for tasks that require source or remote-system changes.'
---

# PR impact quiz

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants a small set of impact questions proving the author understands how the change affects the existing codebase. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output of three impact questions. |
| Done | Three impact questions are generated for the author to answer. |

## Inputs

The following must be supplied before the skill can run:

- **PR description**: The authored description of the change, including motivation, scope, and expected behavior. Required.
- **Diff or change summary**: The diff or a structured summary of what changed. Required.
- **Codebase context**: The language, primary modules, and key patterns in the affected area. Required.

## Procedure

1. Receive the PR description and diff or change summary.
2. Identify the primary modules, interfaces, and data flows touched by the change.
3. Identify any side effects the change could have on callers, downstream consumers, or shared state.
4. Formulate three impact questions that require the author to confirm understanding of how the change affects the existing codebase. Each question must:
   - Target a specific area of the codebase (not a generic concern).
   - Require a concrete answer, not a yes/no or "I checked."
   - Probe a different axis of impact: for example, call-site behavior, data invariants, or backward compatibility.
5. Present the three questions in the chat output.

## Failure and recovery
| Failure class | Condition | Result |
|---|---|---|
| Missing input | PR description or diff is absent or empty | State what is required and do not generate questions. |
| Empty diff | Diff contains no changed lines | State that no changes are present and do not generate questions. |
| Non-converged | Questions are generic, redundant, or require only yes/no answers | Stop; do not present. The done predicate does not hold. |

No rollback is required. No partial result is returned when the done predicate does not hold.

## Output
Three concrete, non-generic impact questions delivered as chat output. Each question addresses a distinct area of potential effect on the existing codebase.

## Provenance

- Origin: `project-owned:user-curated-skill-ideas` — Review, QA, and completeness section.
- License: Project-owned.
- Adaptation: Extracted from a general curated-ideas roster into a standalone read-only skill with bounded inputs, authority, and failure classes. The skill preserves the source mechanism: low-frequency pre-review quiz generation focused on verifying author understanding of change impact on the existing codebase.
