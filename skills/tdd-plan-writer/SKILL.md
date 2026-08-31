---
name: tdd-plan-writer
description: 'Use when a spec or requirements document for a multi-step task exists before touching code. Produces a TDD plan with a mandatory header and execution-mode choice. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# TDD plan writer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A spec or requirements document for a multi-step task exists, before touching code. |
| Authority | Reversible local: writes only a local plan document; rollback by deleting the file. |
| Side effect | Writes a plan document with a mandatory header (goal, architecture, tech stack, spec path, Global Constraints with verbatim values) and offers an execution-mode choice. |
| Done | The plan passes self-review: every spec requirement maps to a task, the placeholder scan is clean, types are consistent across tasks, and the user picked an execution path. |

## Inputs

- **Spec path** (required): path to the spec or requirements document.
- **Project context** (optional): existing codebase structure, tech stack, or architecture notes the model should read before planning.

## Procedure

1. Read the spec file at the supplied path. If the file does not exist or is unreadable, stop and report the failure.
2. Extract every requirement from the spec. Each requirement becomes one atomic item in a requirements list. If a requirement is ambiguous, flag it and ask the user to clarify before continuing.
3. Read the project codebase to determine the tech stack, architecture patterns, and existing conventions. Record these as observed facts, not assumptions.
4. Construct the plan document with this mandatory header:
   - **Goal**: one-sentence statement of what the task achieves.
   - **Architecture**: the structural approach derived from the codebase.
   - **Tech stack**: languages, frameworks, and libraries observed in the project.
   - **Spec path**: the path to the source spec file.
   - **Global Constraints**: verbatim constraint values from the spec (e.g., performance budgets, API contracts, data formats). Copy exact values; do not paraphrase.
5. For each extracted requirement, create a task entry containing:
   - The requirement verbatim or a precise restatement.
   - Acceptance criteria derived from the requirement.
   - Dependencies on other tasks, if any.
6. Order tasks by dependency: prerequisites before dependents. Independent tasks may be grouped.
7. Run self-review on the plan:
   a. Verify every spec requirement has a corresponding task. If any requirement is unmapped, add the missing task.
   b. Scan the entire plan for placeholder text (e.g., "TBD", "TODO", "FIXME", "placeholder"). If found, replace with concrete content or flag for user input.
   c. Check that types, interfaces, and data structures referenced across tasks are consistent. If a task references a type differently from how another task defines it, resolve the conflict.
8. Present the user with an execution-mode choice:
   - **TDD**: write tests before implementation for each task.
   - **Implementation-first**: write implementation, then add tests.
   Record the user's choice in the plan header.
9. Save the plan document to the agreed location.

## Failure and recovery
- **Spec not found**: stop immediately. Report the missing path. Do not generate a plan from memory or assumptions.
- **Incomplete requirements**: list the ambiguous or missing items. Ask the user to clarify. Do not proceed with guessed requirements.
- **Placeholder detected in review**: enumerate each placeholder location. Fix or request user input. Do not save a plan containing placeholders.
- **Type inconsistency**: surface the conflicting type definitions across tasks. Resolve before saving.
- **User cancels execution-mode choice**: stop. Do not save a plan without a recorded execution mode.

Partial results are never saved. If any failure class triggers, the plan document is not written or is deleted if partially created.

## Output
A complete plan document containing:
- Mandatory header with goal, architecture, tech stack, spec path, and Global Constraints with verbatim values.
- Task list where every spec requirement maps to exactly one task with acceptance criteria.
- Recorded execution-mode choice (TDD or implementation-first).
- Zero placeholders, zero type inconsistencies.

The plan is ready to drive implementation without further clarification.

## Provenance

Adapted from obra/superpowers (https://github.com/obra/superpowers), skills/writing-plans/SKILL.md and skills/writing-plans/plan-document-reviewer-prompt.md, revision b36e0829c6d0140e93cfef2ca599b1b07d4a7797. Licensed under MIT, copyright 2025 Jesse Vincent. This is a clean-room adaptation; no third-party expression is copied.
