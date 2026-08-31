---
name: principle-encode-lessons-in-structure
description: 'Use when asked to turn repeated agent instruction into structural enforcement that runs automatically, so the lesson holds without a reminder. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Principle encode lessons in structure

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Turn repeated agent instruction into enforcement. |
| Authority | Reversible local writes to named project artifacts only. |
| Side effect | Creates durable enforcement artifacts in the project. |
| Done | Lesson enforced structurally. |

## Inputs

- **Lesson**: the repeated instruction to encode: what the agent keeps being told to do.
- **Violation evidence**: when the lesson was violated (user complaint, review finding, or observed mismatch).
- **Enforcement kind** (must be supplied): lint rule, check script, CI gate, config constraint, or file-level convention.

## Procedure

1. **Name the violation.** State the gap between what the agent did and what the lesson requires. One sentence.
2. **Identify the enforcement surface.** Choose the narrowest mechanism that catches the violation automatically:
   - Lint rule or regex guard for code/text patterns.
   - Test or assertion for observable behaviour.
   - CI gate for pre-commit or pre-push.
   - Config constraint or schema enforcement for structured data.
   - Naming convention or file-layout rule for project structure.
3. **Scope the enforcement.** One violation per enforcement artifact. Do not bundle unrelated lessons.
4. **Write the enforcement.** Implement the chosen mechanism against the violation evidence. Validate it catches the named violation.
5. **Verify enforcement fires.** Run the enforcement against the violation evidence. It must fail before the lesson is encoded and pass after.
6. **Name the rollback path.** Record the exact steps to remove the enforcement without leaving artifacts behind.
7. **Confirm done.** Report the enforcement artifact path, what it catches, and that it fires on the named violation.

## Failure and recovery
- **No violation evidence**: block. Encode only lessons with a named violation; do not encode preemptive rules.
- **Enforcement does not fire**: block. Reimplement until the enforcement catches the named violation.
- **Enforcement too broad**: block. Narrow scope to the named lesson only; do not widen to cover adjacent cases.
- **Rollback unavailable**: report non-converged. Do not deliver the enforcement.

## Output
A named enforcement artifact (lint rule, check script, CI gate, config constraint, or structural convention) with a brief record of what it catches, where it lives, and how to roll it back.

## Provenance

Origin: `cursor/plugins` pstack, revision `68836ddaf5697224520f1847d90cdb90ca8babaa`.
License: MIT — authored by Lauren Tan (poteto) per `pstack/LICENSE` blob `6b5400237fdf6545be0b8fae370d6f2fcff8fb25`.
Adaptation: Clean-room reimplementation. Structural-enforcement principle preserved; execution scoped to one named violation per enforcement artifact with named rollback path. MIT expression not copied.
