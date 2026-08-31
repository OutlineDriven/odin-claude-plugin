---
name: principle-laziness-protocol
description: 'Use when asked to minimize an implementation or refactor by applying deletion-first smallest-change discipline. Produces the smallest maintainable solution that fully satisfies the requirement. Don''t use for tasks that require source or remote-system changes.'
---

# Principle laziness protocol

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Minimize an implementation or refactor. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | None. Constrains design posture only. |
| Done | Smallest maintainable solution identified or verified. |

## Inputs

- **Target code or design** (required): the implementation, refactor, or design under evaluation.
- **Requirement or acceptance criteria** (required): what the code must do; defines the boundary of "enough."

## Procedure

1. State the requirement in one sentence. Anything the code does beyond that sentence is a candidate for deletion.
2. Search existing code, utilities, and patterns for reuse before proposing any new code.
3. For each candidate addition (function, abstraction, config key, dependency, wrapper), ask: "Does removing it break the requirement?" If no, delete it.
4. Prefer editing existing code over writing new code. Prefer deleting code over editing it.
5. When two approaches satisfy the requirement, choose the one with fewer moving parts: fewer files touched, fewer abstractions introduced, fewer indirections.
6. Make intent obvious through naming and structure, not through comments or documentation layers. If a name requires a comment, rename it.
7. Stop at the requirement boundary. Note adjacent improvements in a single line; do not implement them.

## Failure and recovery
- **Requirement unclear**: stop and request clarification. Do not guess scope.
- **Existing code cannot be reused and new code is required**: document the reason in one line and proceed with the smallest addition that satisfies the requirement.
- **Deletion would break the requirement**: retain the code; mark it as load-bearing with a one-line reason.
- **Non-convergent**: if repeated passes do not reduce the solution, declare the current form as the smallest maintainable solution and stop.

## Output
The smallest maintainable solution: code that satisfies the requirement with the fewest moving parts, where every retained element has a stated reason for existence.

## Provenance

- Origin: cursor/plugins, pstack/skills/principle-laziness-protocol/SKILL.md
- Revision: 68836ddaf5697224520f1847d90cdb90ca8babaa
- License: MIT (pstack/LICENSE blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25; authored by Lauren Tan (poteto))
- Adaptation: Clean-room adaptation for ODIN 2.0 module odin-code. Mechanism preserved: deletion-first smallest-change principle with read-only guidance posture.
