---
name: keep-why-continuous-capture
description: 'Use when a non-trivial change lands or is abandoned, capture the decision, its rejected alternatives, and the reason in a local topic file without inventing evidence or widening scope. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Keep why continuous capture

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User implements or reviews a non-trivial change involving a design decision, rejected alternative, workaround, incident fix, operational constraint, or changed assumption — including a change started and then abandoned after discovering why it must not be touched (no diff results). Proportionality gate: obvious/self-evident choices get a sentence, not an entry; corrections of stale values/bugs are CHANGELOG material, not decisions. |
| Authority | Reversible-local: write only to one named topic file in the configured context directory; no VCS mutation, no credential use, no remote change. Rollback: leave the file unchanged or revert by editing it. |
| Side effect | Writes or updates one topic file in the configured context directory and keeps the context index lean; records Decision + rejected alternative(s) + Reason, Type (decision | workaround | incident | constraint, one line per value or 'undefined — <reason>'), Status (active | superseded | open | needs-review), Evidence (confirmed | inferred | unknown), Source/Verification when traceable; optionally asks for issue/ticket/PR/post-mortem link per source-reference setting (always | never | filtered:<criteria>) — 'no reference exists' is a complete answer, never invented. |
| Done | Entry exists with all weight-bearing fields, zero invented rationale (gaps become focused questions or explicit unknown), conflicting sources recorded with conflict flagged open rather than resolved, confirmation gate honored, existing topic file updated instead of duplicated. |

## Inputs

- **Topic name** (required): the decision or topic this entry belongs to. Supplied by the change context (e.g., the name of the file, feature, or concern being modified).
- **Decision text** (required): what was decided or what constraint is in force.
- **Rejection(s)** (required): what was rejected, abandoned, or considered and why. If nothing was rejected, state 'none' explicitly.
- **Reason** (required): the cause or constraint that justifies this outcome. Must not be invented; if unknown, state 'unknown — <what would confirm it>'.
- **Type** (required): one of decision, workaround, incident, constraint. If ambiguous, list all that apply.
- **Status** (required): one of active, superseded, open, needs-review.
- **Evidence** (required): confirmed, inferred, or unknown.
- **Source/Verification** (optional): URL, commit, issue, PR, or post-mortem link. Per source-reference setting (always | never | filtered:<criteria>). 'no reference exists' is a complete answer.
- **Context directory** (required at invocation time): the configured local directory where topic files live.
- **Confirmation gate**: present the completed entry to the user before writing; proceed only on explicit confirmation.

## Procedure

1. **Detect trigger.** Recognize a non-trivial change involving a design decision, rejected alternative, workaround, incident fix, operational constraint, or changed assumption. This includes any change that was started and then abandoned after discovering why it must not be touched (zero diff). Apply the proportionality gate: obvious or self-evident choices require a sentence, not a full entry; corrections of stale values or bugs belong in CHANGELOG, not here.

2. **Bound scope.** Identify the single decision or topic at the center of the change. Do not widen scope to related decisions, past history, or speculative futures. Stop if the change is trivial, purely corrective, or does not involve a decision worth recording.

3. **Collect entry fields.** Gather the required fields: decision text, rejected alternative(s) and the reason each was rejected, reason the outcome was chosen, type, status, evidence quality, and source/verification if available. If the reason is unknown, state 'unknown — <what would confirm it>'. Never invent rationale or resolve conflicts unilaterally.

4. **Record conflicts open.** If two or more sources give conflicting reasons, record each with the conflict flagged as open. Do not resolve the conflict; flag it needs-review.

5. **Confirm with user.** Present the completed entry to the user for confirmation before writing. If the user declines or revises, incorporate feedback and reconfirm.

6. **Write or update the topic file.** Locate or create the topic file in the context directory. If the topic already has an entry with the same decision, update the existing entry instead of creating a duplicate. Write the entry with all collected fields. Keep the context index lean: do not add a new index entry if one already exists for this topic.

7. **Stop on confirmation gate refusal.** If the user does not confirm, stop without writing. Return the collected (but uncommitted) fields as the result.

## Failure and recovery
- **No context directory configured**: stop and report that the context directory is required. Do not choose a default location.
- **Topic file write fails (permission, disk full)**: stop, report the exact failure, and do not attempt rollback — the file is unchanged.
- **User declines confirmation**: stop without writing. The entry is not persisted. Return the uncommitted fields.
- **Invented rationale detected**: stop before writing. Flag the field as unknown and reconfirm rather than fabricate evidence.
- **No non-trivial decision found**: exit silently without writing; do not manufacture an entry for a trivial or purely corrective change.
- **Conflicting sources**: record each source as conflicting, set status to needs-review, do not resolve unilaterally.

## Output
A new or updated entry in the topic file, or the uncommitted fields if confirmation was refused or the trigger did not fire. The entry contains: Decision, Rejected alternative(s) with reason, Reason, Type, Status, Evidence, Source/Verification, and conflict flags where applicable.

## Provenance

Origin: https://github.com/oliver-zehentleitner/keep-the-why
Revision: c01597a506efa24652d7ecb9e18b6a8ccc97b175
License: MIT — Copyright (c) 2026 Oliver Zehentleitner. Retain the copyright notice and this permission notice in all copies or substantial portions of the Software. No other obligations; verified at pinned SHA.
Adaptation: Clean-room adaptation for ODIN 2.0: the artifact-state-change trigger class replaces the source's change-completion event; the zero-diff abandoned-change clause is preserved verbatim; reversible-local authority restricts writes to the context directory; the confirmation gate, conflict-open flagging, and proportionality gate are new. No expression copied directly.
