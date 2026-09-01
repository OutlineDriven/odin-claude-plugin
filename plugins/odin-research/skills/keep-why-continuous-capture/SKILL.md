---
name: keep-why-continuous-capture
description: 'Use when a non-trivial change lands or is abandoned and the decision, its rejected alternatives, and the reason must be captured in a local topic file. Records Decision, Rejection, Reason, Type, Status, and Evidence with a confirmation gate before writing. Not for remote, credential, publish, deploy, or irreversible changes; not for trivial or corrective changes — those belong in CHANGELOG.'
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

- Topic name (required): the decision or topic this entry belongs to. Supplied by the change context (e.g., the name of the file, feature, or concern being modified).
- Decision text (required): what was decided or what constraint is in force.
- Rejection(s) (required): what was rejected, abandoned, or considered and why. If nothing was rejected, state 'none' explicitly.
- Reason (required): the cause or constraint that justifies this outcome. Must not be invented; if unknown, state 'unknown — <what would confirm it>'.
- Type (required): one of decision, workaround, incident, constraint. If ambiguous, list all that apply.
- Status (required): one of active, superseded, open, needs-review.
- Evidence (required): confirmed, inferred, or unknown.
- Source/Verification (optional): URL, commit, issue, PR, or post-mortem link. Per source-reference setting (always | never | filtered:<criteria>). 'no reference exists' is a complete answer.
- Context directory (required at invocation time): the configured local directory where topic files live.
- Confirmation gate: present the completed entry to the user before writing; proceed only on explicit confirmation.

## Procedure

1. **Detect trigger.** Recognize a non-trivial change involving a design decision, rejected alternative, workaround, incident fix, operational constraint, or changed assumption. This includes any change that was started and then abandoned after discovering why it must not be touched (zero diff). Apply the proportionality gate: obvious or self-evident choices require a sentence, not a full entry; corrections of stale values or bugs belong in CHANGELOG, not here. Done when: the trigger is confirmed or the skill exits silently for a trivial/corrective change.

2. **Bound scope.** Identify the single decision or topic at the center of the change. Do not widen scope to related decisions, history, or speculative futures. Stop if the change is trivial, purely corrective, or does not involve a decision worth recording. Done when: one decision or topic is identified and scope is bounded.

3. **Collect entry fields.** Gather the required fields: decision text, rejected alternatives and why each was rejected, reason for the outcome, type, status, evidence quality, and source/verification if available. If the reason is unknown, state 'unknown — <what would confirm it>'. Never invent rationale or resolve conflicts unilaterally. Done when: all required fields are gathered or marked unknown.

4. **Record conflicts open.** If two or more sources give conflicting reasons, record each reason and its source, flag the conflict as open, and set the status to needs-review. Do not resolve the conflict. Done when: every conflict is recorded with both sides and flagged open.

5. **Confirm with user.** Present the completed entry to the user for confirmation before writing. If the user declines or revises, incorporate feedback and reconfirm. Done when: the user explicitly confirms the entry.

6. **Write or update the topic file.** Locate or create the topic file in the context directory. If the topic already has an entry with the same decision, update the existing entry instead of creating a duplicate. Write the entry with all collected fields. Keep the context index lean: do not add a new index entry if one already exists for this topic. Done when: the topic file is written or updated with the entry and the index is lean.

7. **Stop on confirmation gate refusal.** If the user does not confirm, stop without writing. Return the collected (but uncommitted) fields as the result. Done when: the skill stops and returns the uncommitted fields.

## Failure and recovery
- No context directory configured: stop and report that the context directory is required. Do not choose a default location.
- Topic file write fails (permission, disk full): stop, report the exact failure, and do not attempt rollback — the file is unchanged.
- User declines confirmation: stop without writing. The entry is not persisted. Return the uncommitted fields.
- Invented rationale detected: stop before writing. Flag the field as unknown and reconfirm rather than fabricating evidence.
- No non-trivial decision found: exit silently without writing; do not manufacture an entry for a trivial or purely corrective change.
- Conflicting sources: record each source as conflicting, set status to needs-review, do not resolve unilaterally.

## Output

A new or updated entry in the topic file (Decision, Rejected alternative(s) with reason, Reason, Type, Status, Evidence, Source/Verification, and conflict flags where applicable), or the uncommitted fields if confirmation was refused or the trigger did not fire.
