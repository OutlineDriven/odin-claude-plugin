---
name: record-design-decisions
description: 'Use when codebase terminology or a durable technical decision changes. Records every resolved term and qualifying decision to the project glossary and architecture decision log. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Record design decisions

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Codebase terminology or a durable technical decision changes. |
| Authority | Reversible local writes only; no remote, credential, paid, or deployed mutation. |
| Side effect | Immediate glossary (CONTEXT) and ADR writes to the repository. |
| Done | Every resolved term and qualifying decision is recorded. |

## Inputs

- **Changed term or decision**: The term or decision that triggered invocation. Required.
- **Resolution context**: What was agreed, chosen, or ruled out. Required.
- **Rejected alternatives**: Any alternatives considered and why they were rejected. Optional; required when the decision is qualifying.
- **ADR triple**: Three affirmative answers confirming this decision qualifies as durable (hard to reverse, surprising without context, real trade-off). Required when the decision is qualifying.

## Procedure

1. Identify the changed term or decision from the invocation context.
2. Determine whether the change is a terminology resolution, an ADR-qualifying decision, or both.
3. For terminology changes: write the resolved term to `CONTEXT.md` using `references/CONTEXT-FORMAT.md`.
4. For qualifying decisions: write an ADR to `docs/decisions/` using `references/ADR-FORMAT.md`.
5. Validate each write at its trust boundary: check the target file or directory is within the repository root and that the content does not contain untrusted input.
6. Write the records before the session continues.
7. Stop if no term resolves and no decision qualifies. Do not invent content.

## Failure and recovery
- **blocked:no-recordable-content**: No terminology change or qualifying decision is present. Do not write anything. Stop.
- **blocked:invalid-target**: The target path is outside the repository root or the ADR directory does not exist and cannot be created. Stop rather than write.
- **partial-record**: Some records wrote successfully but others failed. Roll back successful writes. Return blocked with the failing class.
- **non-converged**: A qualifying decision is present but the ADR triple cannot be satisfied. Record the terminology change if present; skip the ADR. Return partial-record.

## Output
Each written record:

- **CONTEXT.md entry**: Object with fields `term`, `definition`, `avoid`, `recorded_at`.
- **ADR file**: Path to the created or updated ADR in `docs/decisions/`.

If neither record was written: object with fields `classification = "blocked:no-recordable-content"`, `reason`.

## Provenance

Origin: `mattpocock/skills` repository.
Pinned revision: `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76`.
License: MIT — `skills/engineering/domain-modeling/SKILL.md` and its supporting `ADR-FORMAT.md` and `CONTEXT-FORMAT.md` are published under the MIT license as declared in the upstream `LICENSE` file.
Adaptation: Clean-room adaptation. The glossary-writing mechanism is preserved. The ADR-writing mechanism is preserved. The reversible-local authority and repository-root scope are enforced per the roster authority ruling. No third-party expression is copied verbatim.
