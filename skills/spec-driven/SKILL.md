---
name: spec-driven
description: 'Use when starting a new project or feature, requirements are unclear, the change touches multiple modules, or the task exceeds roughly 30 minutes. Produces a reviewed, approved spec covering six areas (Objective, Commands, Project Structure, Code Style, Testing Strategy, Boundaries) saved to the repo; implementation follows that spec test-first. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Spec-driven development

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A new project or feature is starting, requirements are unclear, the change touches multiple modules, or the task exceeds roughly 30 minutes. |
| Authority | Reversible local: files, VCS, and credentials scoped to the current working tree; no remote mutation, credential exposure, or irreversible action. |
| Side effect | Writes and commits a spec, records human-approved plan and tasks, and implements test-first. All writes are local; no external service calls. |
| Done | A reviewed, approved spec covering six areas is saved to the repo and the implementation follows it. |

## Inputs

The user's request is mandatory. The requester must approve the spec before planning begins.

## Procedure

1. **Surface assumptions first.** Before writing any spec content, list every assumption being made and require explicit correction. Do not silently fill ambiguous requirements.

2. **Write the spec covering six core areas.**

   a. **Objective**: what is being built and why, who the user is, what success looks like.

   b. **Commands**: full executable commands with flags (build, test, lint, dev) for the stack the project actually uses. Record exact commands, not bare tool names.

   c. **Project structure**: where source lives, where tests go, where docs belong. Capture the layout that applies.

   d. **Code style**: one real snippet of the project's style beats paragraphs describing it. Include naming conventions, formatting rules, and an accepted example in the project's language.

   e. **Testing strategy**: sketch the seams where the feature will be tested. Prefer an existing seam to a new one; use the highest seam available; propose any new seam at the highest point where it can sit. Record the framework, test locations, coverage expectations, and which test level covers each concern. Confirm seams with the user before proceeding because a seam disagreement invalidates the testing strategy beneath it.

   f. **Boundaries**: three tiers:
      - **Always:** run tests before commits, follow naming conventions, validate inputs
      - **Ask first:** schema changes, adding dependencies, changing CI config
      - **Never:** commit secrets, edit vendored directories, delete failing tests without approval

3. **Present the spec to the human.** Do not advance until the human reviews and approves it. The human's approval gates every subsequent phase.

4. **Plan from the validated spec.** Identify major components and dependencies; determine implementation order; note risks and mitigations; separate parallel from sequential work; define verification checkpoints.

5. **Present the plan to the human.** Do not advance until the human reviews and approves it.

6. **Break the plan into discrete tasks.** Each task: completable in one focused session; has explicit acceptance criteria; includes a verification step (test, build, or manual check); is ordered by dependency; changes no more than ~5 files.

7. **Present the task list to the human.** Do not advance until the human reviews and approves it.

8. **Implement test-first, one task at a time.** For each task: turn its acceptance criteria into a failing test, write the code that makes it pass, then verify against the acceptance criteria before starting the next task. Load only the spec sections and source files the current task needs.

9. **Update the spec first when decisions change.** If the data model or scope changes, update the spec, then implement.

10. **Commit the spec** to version control alongside the code. Reference the spec in each PR.

## Failure and recovery
| Failure class | Rule |
|---|---|
| Human withholds approval | Do not proceed to the next phase. Surface the specific objection and wait. |
| Scope widens mid-implementation | Stop. Return to the spec. Update it; get approval; then proceed. |
| Assumption surfaces after spec is written | Surface it immediately; do not proceed until the human resolves or approves it. |
| No spec written or saved | The done predicate is not met. Implement nothing until the spec exists and is approved. |

Partial-result rule: if a phase fails, no subsequent phase begins. Rollback: do not commit partial spec content that has not been approved.

Non-converged result: if the human never approves, the skill ends with no implementation. State this outcome explicitly rather than proceeding anyway.

## Output
A reviewed, approved spec saved to a file in the repository covering all six areas, a human-approved plan, a human-approved task list, and implementation that follows that spec test-first. The spec is a living document committed to version control.

## Provenance

Two sources. (1) `current:current-d:current:spec-driven` — existing odin-code skill, origin `current-odin-skill-tree`, no external license, adapted for ODIN 2.0 authoring format and authority contract. (2) `source:source-addy:addy-spec-driven-development` — MIT-licensed skill from addyosmani/agent-skills (Copyright (c) 2025 Addy Osmani; SPDX: MIT; pinned revision d2c37ef6225dd8726cdd369a8030307f48592d26; obligation: retain copyright notice and MIT permission text in derived distributions; otherwise unrestricted use); exact four-field duplicate of current:spec-driven, absorbed into that survivor with no surviving alias.
