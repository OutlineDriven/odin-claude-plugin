---
name: planning-and-task-breakdown
description: 'Use when multi-step work must be broken into dependency-ordered tasks before implementation begins. Gives every task a checkable acceptance criterion and a coherent size bound, then requires explicit user approval. Not for scoring a plan; use planning. Not for a committed-direction brief; use plan.'
---

# Planning and task breakdown

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to break down a high-level goal into actionable, dependency-ordered tasks before implementation. |
| Authority | Read-only regarding the filesystem; the plan is returned in chat, not written to files. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Plan or task list returned in chat; no repo mutation. |
| Done | Every task carries a checkable acceptance criterion and dependency order, the plan fits its complexity budget, and the user explicitly approves or requests revision. |

## Inputs

Required: the user's description of the goal or feature to be planned. Optional: any existing `tasks/plan.md` or `tasks/todo.md` content, the project's spec or requirements, and the codebase's conventions and structure.

## Procedure

1. Parse the goal and extract constraints. Read the user's goal, any existing spec or requirements, and the relevant codebase sections. Identify existing patterns and conventions. If scope is unclear, ask clarifying questions before proceeding. Do not write or modify any file. Done when: the goal is parsed, constraints are extracted, and scope is clear enough to derive acceptance criteria.
2. Identify the dependency graph and slice work vertically. Determine what each component depends on. Group work into end-to-end feature paths rather than horizontal layers; each vertical slice delivers one complete, testable feature. Implementation proceeds bottom-up from the deepest dependency. Done when: the dependency graph is determined and work is grouped into vertical, testable feature slices.
3. Formulate tasks with acceptance criteria, dependency labels, and a size bound. Write each task with a short descriptive title, one-paragraph description, one to four specific testable acceptance criteria, named dependencies on other task numbers (or "none"), and an explicit scope estimate: XS (1 file), S (1-2 files), M (3-5 files), L (5-8 files; must be subdivided if it spans more than one focused session). If a task touches two or more independent subsystems or its title contains "and", split it. Done when: every task has title, description, acceptance criteria, dependencies, and scope estimate.
4. Order tasks bottom-up, inserting checkpoints. Order so dependencies are satisfied before their dependents, each task leaves the system in a working state, and a checkpoint appears after every two to three tasks. Flag high-risk tasks for early execution. Done when: tasks are ordered with dependencies satisfied, working-state checkpoints, and high-risk flags.
5. Present the breakdown in chat and require explicit user approval or revision before exiting. Include: an ordered task list with acceptance criteria and scope, dependency order, checkpoints, identified risks, and open questions. Keep the task list in the report rather than writing files. Before presenting, if an unchecked `tasks/plan.md` or `tasks/todo.md` exists, stop and describe the conflict to the user; do not overwrite, delete, or bulk-close existing items without explicit confirmation. Done when: the user explicitly approves the plan or requests revision, and the report is presented with all required parts.

## Failure and recovery

- Unclear scope: cannot produce a plan when the user's goal is too vague to derive acceptance criteria. Stop and ask for a clearer description rather than guessing.
- Cyclic or unresolved dependencies: cannot order tasks when a dependency cycle exists or a prerequisite is unknown. Stop and report the specific cycle or gap.
- No verifiable acceptance criteria: a task without at least one testable condition cannot be verified. Stop and flag the task for the user rather than proceeding.
- Plan collision: an existing incomplete plan for different work is detected. Stop and ask. Do not overwrite or bulk-close items.
- Partial-result rule: if the user approves a partial plan, record which tasks are approved and which remain open rather than claiming the full plan is done.

## Output

A task-breakdown report in chat containing an ordered task list with per-task acceptance criteria and scope, dependency order, checkpoints, risks, and open questions, explicitly approved by the user. No file written.
