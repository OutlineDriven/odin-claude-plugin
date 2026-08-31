---
name: to-spec
description: 'Use when settled decisions need synthesis into an agent-ready implementation spec. Synthesize the current conversation into a local specification file and stop before publication. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# To spec

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Settled decisions need synthesis into an implementation spec. |
| Authority | Reversible local: write only a named local spec file; the rollback path is deleting that file. |
| Side effect | Writes an agent-ready specification file locally and stops before publishing or distributing it; a human performs any publication. |
| Done | Problem, solution, stories, decisions, tests, and exclusions are agent-ready in a verified local specification file; publication remains an unexecuted human handoff. |

## Inputs

- **Conversation context.** The current conversation must contain settled decisions: what is being built, why, and how completion will be judged. If the conversation lacks settled decisions, stop and state what is missing.
- **Codebase state.** Explore the repository to understand the current state. Use the project's domain glossary vocabulary throughout the spec and respect any ADRs (Architecture Decision Records) in the area being touched.
- **Optional: CONTEXT.md or domain docs.** If present, read them for vocabulary and constraints. Do not require them.

## Procedure

1. Explore the repository to understand the current state of the codebase if not already done. Identify the project's domain vocabulary and any ADRs in the relevant area.
2. Identify the seams at which the feature will be tested. Prefer existing seams to new ones. Use the highest seam possible. If new seams are needed, propose them at the highest point possible. Fewer seams across the codebase is better; the ideal number is one.
3. Present the identified seams to the user and confirm they match expectations. Do not proceed until the user confirms.
4. Synthesize the spec from the conversation context, codebase understanding, and confirmed seams. Do NOT interview the user or open a new round of questioning. Capture what has already been decided.
5. Write the spec to a local file using the template below. The file path follows the pattern `docs/specs/<feature-slug>-spec.md`.
6. Verify the written file contains all seven sections populated with substantive content. If any section is empty or stubbed, fill it before declaring done.
7. Stop. Do not publish, distribute, or assign labels. Report the file path and that publication is a human handoff.

### Spec template

Write the spec using this structure:

```markdown
# <Feature name> - spec

### Problem statement

The problem from the user's perspective.

### Solution

The solution from the user's perspective.

### User stories

A numbered list of user stories. Each in the format:

1. As an <actor>, I want a <feature>, so that <benefit>

Cover all aspects of the feature exhaustively.

### Implementation decisions

A list of implementation decisions:
- Modules to build or modify
- Interfaces to modify
- Technical clarifications
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets unless a prototype produced a snippet that encodes a decision more precisely than prose (state machine, reducer, schema, type shape). Trim to the decision-rich part.

### Testing decisions

- What makes a good test (external behavior only, not implementation details)
- Which modules will be tested
- Prior art for similar tests in the codebase

### Out of scope

What is deliberately excluded from this spec.

### Further notes

Any additional notes about the feature.
```

## Failure and recovery
- **Missing settled decisions.** If the conversation lacks concrete decisions about what is being built, stop. Report exactly which decisions are missing. Do not fabricate decisions or fill gaps with assumptions.
- **No seams identifiable.** If the codebase structure does not reveal testable seams, propose seams at the highest reasonable points and present them as proposals, not facts.
- **User rejects seams.** If the user rejects the proposed seams, ask what they would prefer and iterate. Do not proceed to spec writing until seams are confirmed.
- **Write failure.** If the spec file cannot be written to disk, report the error. No partial artifact is acceptable; delete any incomplete file.
- **Non-convergent synthesis.** If the conversation context is contradictory or underspecified, name the contradiction and stop rather than choosing a side silently.

## Output
A local specification file at `docs/specs/<feature-slug>-spec.md` containing all seven sections (Problem Statement, Solution, User Stories, Implementation Decisions, Testing Decisions, Out of Scope, Further Notes) populated with substantive, agent-ready content. The file is ready for a fresh agent session to pick up implementation. Publication to an issue tracker or project management tool is a separate human step not performed by this skill.

## Provenance

- Origin: mattpocock/skills, `skills/engineering/to-spec/SKILL.md` and `skills/engineering/to-spec/agents/openai.yaml`.
- Pinned revision: 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76.
- License: MIT. Copyright (c) 2026 Matt Pocock. Retain copyright and permission notice in licenses/NOTICE.
- Adaptation: ODIN voice; synthesis-only mechanism preserved; issue-tracker publication replaced with local file write and explicit publication stop; language-agnostic; self-contained with no peer-skill or setup-skill dependency.
