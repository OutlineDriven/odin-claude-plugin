---
name: planning-and-task-breakdown
description: 'Use when multi-step work must be planned or broken into dependency-ordered tasks before implementation. Gives every task a checkable acceptance criterion and complexity bound. Not for scoring a plan — use planning; not for a committed-direction brief — use plan.'
---

# Planning and task breakdown

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to plan or break down multi-step work before implementation. |
| Authority | No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Plan or task list returned in chat; no repo mutation. |
| Done | Every task carries a checkable acceptance criterion and dependency order, the plan fits its complexity budget, and the user approves. |

## Inputs

Required: the user's description of the goal or feature to be planned. Optional when present: any existing `tasks/plan.md` or `tasks/todo.md` content, the project's spec or requirements, and the codebase's conventions and structure.

## Procedure

1. Enter plan mode. Read the user's goal, any existing spec or requirements, and the relevant codebase sections. Identify existing patterns and conventions. Map dependencies between components. Note risks and unknowns. Do not write or modify any file. Done when: goal, patterns, dependencies, risks, and unknowns are read and noted.
2. Identify the dependency graph. Determine what each component depends on. Implementation proceeds bottom-up from the deepest dependency. Done when: the dependency graph is determined and bottom-up order is established.
3. Slice vertically. Group work into end-to-end feature paths rather than horizontal layers. Each vertical slice delivers one complete, testable feature. Done when: work is grouped into vertical, testable feature slices.
4. Write each task with a short descriptive title, one-paragraph description, two to four specific testable acceptance criteria, named dependencies on other task numbers (or "none"), and an explicit scope estimate: XS (1 file), S (1–2 files), M (3–5 files), L (5–8 files), or XL (8+ files; must be subdivided). Done when: every task has title, description, acceptance criteria, dependencies, and scope estimate.
5. Order tasks so dependencies are satisfied before their dependents, each task leaves the system in a working state, and a checkpoint appears after every two to three tasks. Flag high-risk tasks for early execution. Done when: tasks are ordered with dependencies satisfied, working-state checkpoints, and high-risk flags.
6. Size every task. If a task is L or larger, or would span more than one focused session, split it before presenting the plan. Break it when acceptance criteria cannot be described in three or fewer bullet points, when the task touches two or more independent subsystems, or when the title contains "and". Done when: no task is L or larger or spans more than one session.
7. Before writing a plan for work that already has an unchecked `tasks/plan.md` or `tasks/todo.md`, stop and describe the conflict to the user. Do not overwrite, delete, or bulk-close the existing items without explicit confirmation. Done when: any existing plan conflict is surfaced to the user before proceeding.
8. Present the plan as a report in chat. Include: an ordered task list with acceptance criteria and scope, dependency order, checkpoints, identified risks, and open questions. Keep the task list in the report rather than writing files. Done when: the report is presented in chat with all required parts.

## Failure and recovery
- **Unclear scope**: Cannot produce a plan when the user's goal is too vague to derive acceptance criteria. Stop and ask for a clearer description rather than guessing.
- **Cyclic or unresolved dependencies**: Cannot order tasks when a dependency cycle exists or a prerequisite is unknown. Stop and report the specific cycle or gap.
- **No verifiable acceptance criteria**: A task without at least one testable condition cannot be verified. Stop and flag the task for the user rather than proceeding.
- **Plan collision**: An existing incomplete plan for different work is detected. Stop and ask. Do not overwrite or bulk-close items.
- Partial-result rule: If the user approves a partial plan, record which tasks are approved and which remain open rather than claiming the full plan is done.

## Output
A task-breakdown report in chat containing an ordered task list with per-task acceptance criteria and scope, dependency order, checkpoints, risks, and open questions — no file written.
