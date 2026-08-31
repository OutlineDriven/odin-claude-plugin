---
name: todos-update
description: 'Re-sync a stale task list against what actually landed: mark real completions with proof, drop overtaken items, add discovered blockers, re-order what moved. Use when the user says "update the todos", "re-sync the task list", "choose the next task", or the plan and the tree have drifted apart. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Update todos

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says 'update the todos', asks to resync the task list or what to do next, or the plan and the tree have drifted apart. |
| Authority | Reversible local write: edits the task list through the todo tool only; no implementation, no file mutation outside the todo state. |
| Side effect | Edits the task list or todo state; performs no implementation. |
| Done | The delta report lists Completed, Still open, Overtaken, Blocked, and New; every completion carries proof and the stale count is zero. |

## Inputs

- Current task list (required).
- Codebase state via file reads and test/command output (required for proof).
- Conversation context establishing design decisions (optional; used to detect overtaken items).

## Procedure

1. Read the current task list.
2. Inspect the codebase: read changed files, run targeted tests or commands, check `path:line` references to determine what actually landed.
3. Read conversation context for design changes that may have overtaken items.
4. For each existing item, classify exactly once:

   | Class | Meaning |
   |---|---|
   | `landed` | Done, with proof |
   | `still-open` | Unchanged, still required |
   | `overtaken` | A design change made it unnecessary |
   | `blocked` | Cannot proceed until something external clears |
   | `newly-discovered` | Not on the list; found during the work |

5. A `landed` claim requires proof: the test, the command output, or the `path:line` that demonstrates it. An unproven completion stays `still-open`. Someone saying an item is done is not proof; it is the claim under test.
6. Write the reconciled list back through the `todo` tool.
7. An `overtaken` item is dropped with a one-line reason recorded in the report, never deleted silently. A dropped item with no recorded reason is indistinguishable from a forgotten item.
8. Name exactly one next action: the first `still-open` item whose blockers are all clear, stated as a concrete action rather than a heading. When two items tie, the tiebreak is which one unblocks more of the remaining list. When every remaining item is `blocked`, name the blocker that has to clear first — one answer, not a list.
9. Emit the delta only: what changed classification, and why.

## Failure and recovery
- **Missing proof:** An item claimed complete but lacking test output, command result, or `path:line` evidence stays `still-open`. Record the proof gap in the report.
- **Todo tool failure:** Do not fabricate a list state. Report the error; the list remains unchanged.
- **Non-convergent delta:** If the codebase state cannot be fully determined, return a partial result with explicit gaps rather than pretending the done predicate holds.

## Output
Delta report: each item whose classification changed, its new class, and the reason. Every `landed` item cites its proof. Exactly one next action is named, or one blocker is named as the reason none is. Zero stale items remain.

## Provenance

Origin: current ODIN skill tree, candidate `current:current-d:current:update-todos`. Revision: none pinned. License: project-owned. Adaptation: clean-room rewrite preserving the three-way reconciliation mechanism, classification taxonomy, proof requirement, single-next-action tiebreak, and delta-only report from the source skill.
