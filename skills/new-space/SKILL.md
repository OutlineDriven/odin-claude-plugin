---
name: new-space
description: 'Use when a user starts a new work session and asks to split userspace decisions from agentspace execution, a contract-bound brief is written, spawn/work/review/human-gate phases are defined and run, and a ready confirmation is returned. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# New space

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User starts a new work session and asks to split userspace decisions from agentspace execution. |
| Authority | Reversible-local: write only named local artifacts; state the rollback path. |
| Side effect | Session contract, brief, spawn/work/review artifacts, and human-gate records in the workspace. |
| Done | A contract-bound brief is in place; spawn, work, review-artifact, and human-gate phases are defined and ready. |

## Inputs

- **Brief (required):** Human-authored statement of work goal and any constraints. State what is optional and what must be supplied.
- **Context (optional):** Current directory, project layout, open issues, or prior session artifacts. Provide these if they exist; the skill proceeds without them.

## Procedure

1. Confirm with the user that they want to split userspace decisions from agentspace execution for this session. Halt if the intent is ambiguous.
2. Draft the brief as a written statement: work goal, scope, constraints, and what constitutes done. Show the draft to the user. Revise until the user approves.
3. Record the approved brief as a durable artifact (e.g., `run/<session-id>/brief.md`).
4. Write the spawn phase: define which agent or worker to launch, what it may read, what outputs it must produce, and what it must not change. Show the spawn definition to the user before proceeding.
5. Execute the spawn phase. Capture stdout, stderr, and the exit code.
6. Write the work phase: document the agent's actual execution path, outputs, and any deviations from the brief.
7. Write the review-artifact phase: record what was produced, whether it meets the brief, and what the human must verify.
8. Present the review artifact to the user. Await explicit sign-off or revision request.
9. On sign-off, record the human-gate record (e.g., `run/<session-id>/human-gate.md`) with the decision, timestamp, and any conditions.
10. Return the complete workspace state: brief, spawn output, work record, review artifact, and human-gate record.

## Failure and recovery
- **Unprovided or ambiguous brief:** Stop. Ask the user for a concrete work goal before proceeding.
- **Spawn phase failure:** Attempt one retry with corrected spawn definition. Record the failure and the retry count. Stop if the second attempt fails.
- **Review artifact divergence:** Present the divergence to the user. Do not proceed until the user resolves or approves.
- **Missing sign-off:** The session is not done. Record the last state and stop.
- **Partial-result rule:** If any phase halts midstream, all durable artifacts written up to that point remain; no automatic rollback.

## Output
A workspace directory (e.g., `run/<session-id>/`) containing:
- `brief.md` — approved work contract
- `spawn.md` — agent spawn definition and result
- `work.md` — execution record and deviations
- `review.md` — artifact review and human checklist
- `human-gate.md` — human sign-off record with timestamp

## Provenance

Origin: `project-owned:user-curated-skill-ideas` (license: null, revision: null). Adapted from the workspace-splitting workflow entry (curated:curated-ideas:curated-011). Design axioms retained: Q5 human gates at start and end; Q47 and Q51 each skill completes independently and must not depend on another skill to complete.
