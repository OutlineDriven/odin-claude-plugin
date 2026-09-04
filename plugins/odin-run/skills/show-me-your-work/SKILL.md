---
name: show-me-your-work
description: 'Use when the user invokes it to append a structured decision record to an append-only TSV log, ending with an Attention section for reviewers. Not for an ephemeral visual: use show-me.'
---

# Show me your work

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Keep an auditable decision trail for unattended work. |
| Authority | Reversible local: writes only named local artifacts; append-only TSV with manual revert possible. |
| Side effect | Writes decision log and invokes reviewer. |
| Done | Resolvable evidence trail ending in Attention section. |

## Not for

- An ephemeral chat visual: use show-me.

## Inputs

Required:
- `log_path`: path to the append-only TSV decision log. Required; no default.
- `session`: current session identifier. Required.
- `task`: the current task description. Required.

Optional:
- `context`: additional framing or constraints. Optional.
- `reviewer`: reviewer identifier for the Attention section. Optional; omit if not yet known.

## Procedure

1. **Define decision.** A decision is a deliberate choice made without direct human guidance that produces artifacts, code, documentation, or non-trivial state changes. Routine implementation, style fixes, and unchanged scope do not qualify. **Done when:** the decision is identified or confirmed as not qualifying.

2. **Generate decision ID.** If `log_path` uses a sequence counter at `.decision-counter`, read the current integer N and increment it. Otherwise generate a UNIX timestamp-based ID. **Done when:** a unique decision ID is produced.

3. **Capture fields.** Gather: `timestamp` (ISO 8601 UTC), `session`, `decision_id`, `context` (task + context inputs combined), `decision`, `rationale`, `alternatives`, `consequences`, `evidence` (file paths, command outputs, or transcript references), `reviewer` (as supplied or `pending`), `status` (`pending`). **Done when:** all eleven fields are populated.

4. **Validate before append.** Stop if any of `decision`, `rationale`, or `evidence` is empty. Stop if `log_path` points outside the project tree. **Done when:** all required fields are non-empty and the path is inside the project tree.

5. **Append one TSV row.** Append a single tab-separated row to `log_path` containing the eleven fields in order. If `log_path` does not exist, create it with the header line: `timestamp\tsession\tdecision_id\tcontext\tdecision\trationale\talternatives\tconsequences\tevidence\treviewer\tstatus`. **Done when:** the row is appended.

6. **Write Attention section.** Append a blank line and a section titled `## Attention` followed by a one-line summary: "Decision [decision_id] by [session] requires reviewer review." with the `reviewer` field set to the value from step 3. **Done when:** the Attention section is appended.

## Failure and recovery

- Missing log file: if `log_path` does not exist, create it with headers before step 5. This is automatic recovery; proceed.
- Malformed row: if any TSV field contains an unescaped tab or newline, raise `malformed-input` and stop. Do not append.
- Append failure: raise `log-write-failed` and stop. The evidence trail is incomplete; the done predicate does not hold.
- Empty required field: raise `validation-failed` and stop. Do not append an incomplete row.

## Output

Append-only TSV artifact at `log_path` with eleven fields per row (timestamp, session, decision_id, context, decision, rationale, alternatives, consequences, evidence, reviewer, status), ending with a blank line and an `## Attention` section; the done predicate holds when both the row and Attention section are written.
