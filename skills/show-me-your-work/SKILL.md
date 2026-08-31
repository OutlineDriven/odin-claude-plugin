---
name: show-me-your-work
description: 'Use when invoked, append a structured decision record to an append-only TSV decision log and end with an Attention section for reviewer review. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Show me your work

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Keep an auditable decision trail for unattended work. |
| Authority | Write only named local artifacts; append-only TSV with manual revert possible. |
| Side effect | Writes decision log and invokes reviewer. |
| Done | Resolvable evidence trail ending in Attention section. |

## Inputs

Must supply:
- `log_path` — path to the append-only TSV decision log. Required; no default.
- `session` — current session identifier. Required.
- `task` — the current task description. Required.

May supply:
- `context` — additional framing or constraints. Optional.
- `reviewer` — reviewer identifier for the Attention section. Optional; omit if not yet known.

## Procedure

1. **Define decision.** A decision is a deliberate choice made without direct human guidance that produces artifacts, code, documentation, or non-trivial state changes. Routine implementation, style fixes, and unchanged scope do not qualify.

2. **Generate decision ID.** If `log_path` uses a sequence counter at `.decision-counter`, read the current integer N and increment it. Otherwise generate a UNIX timestamp-based ID.

3. **Capture fields.** Gather:
   - `timestamp` — ISO 8601 UTC.
   - `session` — as supplied.
   - `decision_id` — N or timestamp-based ID.
   - `context` — `task` and `context` inputs combined.
   - `decision` — what was decided.
   - `rationale` — why this choice was made.
   - `alternatives` — options that were considered and rejected.
   - `consequences` — expected outcomes and side effects.
   - `evidence` — file paths, command outputs, or transcript references that prove the decision was made.
   - `reviewer` — as supplied or `pending`.
   - `status` — `pending`.

4. **Validate before append.** Stop if any of `decision`, `rationale`, or `evidence` is empty. Stop if `log_path` points outside the project tree.

5. **Append one TSV row.** Append a single tab-separated row to `log_path` containing the eleven fields above in order. If `log_path` does not exist, create it with the header line:
   `timestamp\tsession\tdecision_id\tcontext\tdecision\trationale\talternatives\tconsequences\tevidence\treviewer\tstatus`

6. **Write Attention section.** Append a blank line and a section titled `## Attention` followed by a one-line summary: "Decision [decision_id] by [session] requires reviewer review." with the `reviewer` field set to the value from step 3.

## Failure and recovery
- **Missing log file.** If `log_path` does not exist, create it with headers before step 5. This is automatic recovery; proceed.
- **Malformed row.** If any TSV field contains an unescaped tab or newline, raise `malformed-input` and stop. Do not append.
- **Append failure.** Raise `log-write-failed` and stop. The evidence trail is incomplete; the done predicate does not hold.
- **Empty required field.** Raise `validation-failed` and stop. Do not append an incomplete row.

## Output
Append-only TSV artifact at `log_path`. Each row contains eleven fields in order: timestamp, session, decision_id, context, decision, rationale, alternatives, consequences, evidence, reviewer, status. The file ends with a blank line and an `## Attention` section. The done predicate holds when the row and Attention section are both written.

## Provenance

Origin: cursor/plugins pstack/skills/show-me-your-work revision 68836ddaf5697224520f1847d90cdb90ca8babaa. License: MIT (pstack authored by Lauren Tan (poteto) per MIT license block at pstack/LICENSE blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25). Adapted for ODIN 2.0 clean-room reimplementation. Support files (decision-log-template.tsv, log.sh) not carried; their mechanism reproduced inline.
