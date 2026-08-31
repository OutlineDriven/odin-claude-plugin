---
name: planning-and-task-breakdown
description: 'Use when a user asks to plan or break down multi-step work before implementation. Every task carries a checkable acceptance criterion and dependency order, the plan fits its complexity budget, and the user approves. Don''t use for tasks that require source or remote-system changes.'
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

Required: the user's description of the goal or feature to be planned. Optional but used when present: any existing `tasks/plan.md` or `tasks/todo.md` content, the project's spec or requirements, and the codebase's conventions and structure.

## Procedure

1. Enter plan mode. Read the user's goal, any existing spec or requirements, and the relevant codebase sections. Identify existing patterns and conventions. Map dependencies between components. Note risks and unknowns. Do not write or modify any file.
2. Identify the dependency graph. Determine what each component depends on. Implementation proceeds bottom-up from the deepest dependency.
3. Slice vertically. Group work into end-to-end feature paths rather than horizontal layers. Each vertical slice delivers one complete, testable feature.
4. Write each task with:
   - A short descriptive title.
   - One-paragraph description of what the task accomplishes.
   - Two to four specific, testable acceptance criteria.
   - Named dependencies on other task numbers (or "none").
   - An explicit scope estimate: XS (1 file), S (1–2 files), M (3–5 files), L (5–8 files), or XL (8+ files; must be subdivided).
5. Order tasks so dependencies are satisfied before their dependents, each task leaves the system in a working state, and a checkpoint appears after every two to three tasks. Flag high-risk tasks for early execution.
6. Size every task. If a task is L or larger, or would span more than one focused session, split it before presenting the plan. Break it when acceptance criteria cannot be described in three or fewer bullet points, when the task touches two or more independent subsystems, or when the title contains "and".
7. Before writing a plan for work that already has an unchecked `tasks/plan.md` or `tasks/todo.md`, stop and describe the conflict to the user. Do not overwrite, delete, or bulk-close the existing items without explicit confirmation.
8. Present the plan as a report in chat. Include: an ordered task list with acceptance criteria and scope, dependency order, checkpoints, identified risks, and open questions. Keep the task list in the report rather than writing files.

## Failure and recovery
- **Unclear scope**: Cannot produce a plan when the user's goal is too vague to derive acceptance criteria. Stop and ask for a clearer description rather than guessing.
- **Cyclic or unresolved dependencies**: Cannot order tasks when a dependency cycle exists or a prerequisite is unknown. Stop and report the specific cycle or gap.
- **No verifiable acceptance criteria**: A task without at least one testable condition cannot be verified. Stop and flag the task for the user rather than proceeding.
- **Plan collision**: An existing incomplete plan for different work is detected. Stop and ask. Do not overwrite or bulk-close items.
- Partial-result rule: If the user approves a partial plan, record which tasks are approved and which remain open rather than claiming the full plan is done.

## Output
A task-breakdown report returned in chat containing: an ordered task list, each task's acceptance criteria and scope estimate, dependency order, checkpoints, risks, and open questions. No file is written or modified.

## Provenance

Adapted from the MIT-licensed "Planning and Task Breakdown" skill by Addy Osmani, origin `addyosmani/agent-skills`, pinned revision `d2c37ef6225dd8726cdd369a8030307f48592d26`, SPDX `MIT`. The MIT obligation to retain the copyright notice "Copyright (c) 2025 Addy Osmani" and permission text is satisfied in this artifact. Adaptation for ODIN is clean-room: the procedure restates the method as a self-contained, executable contract without copying expression from the source.
