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
- **Project context** (optional): existing codebase structure, tech stack, or architecture notes to read before planning.

## Refusal

- Spec not found: stop immediately. Report the missing path. Do not generate a plan from memory or assumptions.
- Incomplete requirements: list the ambiguous or missing items. Ask the user to clarify. Do not proceed with guessed requirements.
- Placeholder detected in review: enumerate each placeholder location. Fix or request user input. Do not save a plan containing placeholders.
- Type inconsistency: surface the conflicting type definitions across tasks. Resolve before saving.
- User cancels execution-mode choice: stop. Do not save a plan without a recorded execution mode.

## Procedure

1. **Read the spec file** at the supplied path. Done when: the spec is read or a not-found failure is reported.
2. **Extract every requirement** from the spec. Each requirement becomes one atomic item in a requirements list. If a requirement is ambiguous, flag it and ask the user to clarify before continuing. Done when: every requirement is an atomic item.
3. **Read the project codebase** to determine the tech stack, architecture patterns, and existing conventions. Record these as observed facts, not assumptions. Done when: tech stack and conventions are recorded as facts.
4. **Construct the plan document header.** Include: Goal (one-sentence statement), Architecture (structural approach derived from the codebase), Tech stack (languages, frameworks, libraries observed), Spec path, Global Constraints (verbatim constraint values from the spec — copy exact values, do not paraphrase). Done when: the header is complete with verbatim constraint values.
5. **Create a task entry per requirement.** Each entry contains: the requirement verbatim or a precise restatement, acceptance criteria derived from the requirement, and dependencies on other tasks if any. Done when: every requirement maps to one task entry.
6. **Order tasks by dependency.** Prerequisites before dependents. Independent tasks may be grouped. Done when: the task list is ordered.
7. **Run self-review on the plan.** (a) Verify every spec requirement has a corresponding task; add missing tasks. (b) Scan the entire plan for placeholder text (TBD, TODO, FIXME, placeholder); replace with concrete content or flag for user input. (c) Check that types, interfaces, and data structures referenced across tasks are consistent; resolve conflicts. Done when: every requirement is mapped, zero placeholders remain, and types are consistent.
8. **Present the user with an execution-mode choice.** TDD (write tests before implementation for each task) or Implementation-first (write implementation, then add tests). Record the user's choice in the plan header. Done when: an execution mode is recorded.
9. **Save the plan document** to the agreed location. Done when: the plan file is written.

## Failure modes

- Partial results are never saved. If any refusal condition triggers, the plan document is not written or is deleted if partially created.

## Output

A complete plan document: mandatory header (goal, architecture, tech stack, spec path, Global Constraints with verbatim values), task list where every spec requirement maps to one task with acceptance criteria, recorded execution-mode choice, zero placeholders, zero type inconsistencies.

## Provenance

Adapted from obra/superpowers (https://github.com/obra/superpowers), skills/writing-plans/SKILL.md and skills/writing-plans/plan-document-reviewer-prompt.md, revision b36e0829c6d0140e93cfef2ca599b1b07d4a7797. Licensed under MIT, copyright 2025 Jesse Vincent. This is a clean-room adaptation; no third-party expression is copied.
