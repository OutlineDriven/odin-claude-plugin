---
name: record-design-decisions
description: 'Use when codebase terminology or a durable technical decision changes. Records resolved terms and qualifying decisions to the project glossary and architecture decision log. Not for shaping domain language — use domain-modeling. Not for remote or irreversible changes.'
---

# Record design decisions

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Codebase terminology or a durable technical decision changes. |
| Authority | Reversible local writes only; no remote, credential, paid, or deployed mutation. |
| Side effect | Immediate glossary (CONTEXT) and ADR writes to the repository. |
| Done | Every resolved term and qualifying decision is recorded. |

## Refusals

- No recordable content: if no terminology change or qualifying decision is present, do not write anything. Stop.
- Invalid target: if the target path is outside the repository root, stop rather than write. A path outside the repository root is a trust violation and halts the whole skill.
- Unavailable ADR directory: if the ADR directory does not exist and cannot be created, do not halt the whole skill. Record the terminology change if present, skip the ADR, and return `non-converged` (see Failure and recovery).
- Untrusted input in records: rejected. Validate each write at its trust boundary.

## Inputs

- Changed term or decision (required): the term or decision that triggered invocation.
- Resolution context (required): what was agreed, chosen, or ruled out.
- Rejected alternatives (optional, but required for a qualifying decision): alternatives considered and why they were rejected.
- ADR triple (required for a qualifying decision): three affirmative answers confirming that the decision is hard to reverse, surprising without context, and carries a real trade-off.

## Procedure

1. Identify the changed term or decision from the invocation context. **Done when**: the change is named.
2. Determine whether the change is a terminology resolution, an ADR-qualifying decision, or both. **Done when**: the change type is classified.
3. For terminology changes: write the resolved term to `CONTEXT.md` using `assets/CONTEXT-FORMAT.md`. **Done when**: the CONTEXT entry is written.
4. For qualifying decisions: write an ADR to `docs/decisions/` using `assets/ADR-FORMAT.md`. **Done when**: the ADR file is written.
5. Validate each write at its trust boundary: check the target file or directory is within the repository root and that the content does not contain untrusted input. **Done when**: every write passes validation.
6. Write the records before the session continues. **Done when**: all records are persisted.
7. Stop if no term resolves and no decision qualifies. Do not invent content. **Done when**: the procedure has stopped with `blocked:no-recordable-content` or all records are written.

## Failure and recovery

- **`blocked:no-recordable-content`**: no terminology change or qualifying decision is present. Do not write anything. Stop.
- **`blocked:invalid-target`**: the target path is outside the repository root. Stop rather than write.
- **`partial-record`**: a write attempt failed after another had succeeded. Roll back the successful writes and return blocked with the failing class. An ADR that is deliberately skipped is not a failed record, so an unavailable ADR directory is `non-converged` below and never this class.
- **`non-converged`**: a qualifying decision is present but the ADR cannot be produced, either because the ADR triple cannot be satisfied or because the ADR directory does not exist and cannot be created. Record the terminology change if present; skip the ADR. The terminology entry is kept and the ADR is intentionally skipped, so this is not a rollback. Return `non-converged`.

## Output

Each written record: a CONTEXT.md entry (term, definition, avoid, recorded_at) and/or an ADR file path in `docs/decisions/`; otherwise a classification with reason — `blocked:no-recordable-content`, `blocked:invalid-target`, `partial-record`, or `non-converged` — ordered: terminology, decision.
