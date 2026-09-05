---
name: todos-update
description: 'Use when user asks to update todos, resync the task list, say what to do next, or plan and tree have drifted apart. Not for coarse lists: use todos-enhance. Not for adding requirements: use todo-add.'
---

# Update todos

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says 'update the todos', asks to resync the task list or what to do next, or the plan and the tree have drifted apart. |
| Authority | Reversible local: writes only the task list through the todo tool; rollback is undo. No remote mutation. |
| Side effect | Edits the task list or todo state; performs no implementation. |
| Done | The delta report lists Completed, Still open, Overtaken, Blocked, and New; every completion carries proof and the stale count is zero. |

## Inputs

- Current task list (required).
- Codebase state via file reads and test/command output (required for proof).
- Conversation context establishing design decisions (optional; used to detect overtaken items).

## Refusals

- Will not mark an item complete without proof: test output, command result, or `path:line` evidence.
- Will not fabricate a list state if the todo tool fails.
- Will not drop an overtaken item silently: every drop carries a one-line reason.
- Will not pretend the done predicate holds when the codebase state cannot be fully determined.

## Procedure

1. Read the current task list. **Done when:** the current list is loaded.
2. Inspect the codebase: read changed files, run targeted tests or commands, check `path:line` references to determine what actually landed. **Done when:** the codebase state is determined for every item.
3. Read conversation context for design changes that may have overtaken items. **Done when:** overtaken-item candidates are identified.
4. For each existing item, classify exactly once: `landed` (done, with proof), `still-open` (unchanged, still required), `overtaken` (a design change made it unnecessary), `blocked` (cannot proceed until something external clears), `newly-discovered` (not on the list; found during the work). **Done when:** every item is classified.
5. A `landed` claim requires proof: the test, the command output, or the `path:line` that demonstrates it. An unproven completion stays `still-open`. Someone saying an item is done is not proof; it is the claim under test. **Done when:** every `landed` item cites its proof.
6. Write the reconciled list back through the `todo` tool. **Done when:** the reconciled list is written.
7. An `overtaken` item is dropped with a one-line reason recorded in the report, never deleted silently. A dropped item with no recorded reason is indistinguishable from a forgotten item. **Done when:** every dropped item has a recorded reason.
8. Name exactly one next action: the first `still-open` item whose blockers are all clear, stated as a concrete action rather than a heading. When two items tie, the tiebreak is which one unblocks more of the remaining list. When every remaining item is `blocked`, name the blocker that has to clear first, one answer, not a list. **Done when:** exactly one next action or one blocker is named.
9. Emit the delta only: what changed classification, and why. **Done when:** the delta report is emitted.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Missing proof | An item claimed complete but lacking test output, command result, or `path:line` evidence stays `still-open`. Record the proof gap in the report. |
| Todo tool failure | Do not fabricate a list state. Report the error; the list remains unchanged. |
| Non-convergent delta | If the codebase state cannot be fully determined, return a partial result with explicit gaps rather than pretending the done predicate holds. |

## Output

Delta report: each item whose classification changed, its new class, and the reason, every `landed` item cites its proof, exactly one next action is named or one blocker is named as the reason none is, and zero stale items remain.
