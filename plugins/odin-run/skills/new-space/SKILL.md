---
name: new-space
description: 'Use when a user starts a new work session and asks to split userspace decisions from agentspace execution. Writes a contract-bound brief and runs spawn, work, review, and human-gate phases. Not for remote, credential, publish, deploy, or irreversible changes.'
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

1. Confirm with the user that they want to split userspace decisions from agentspace execution for this session. Halt if the intent is ambiguous. Done when: the user confirms the split or halts on ambiguity.
2. Draft the brief as a written statement: work goal, scope, constraints, and what constitutes done. Show the draft to the user. Revise until the user approves. Done when: the user approves the brief.
3. Record the approved brief as a durable artifact (e.g., `run/<session-id>/brief.md`). Done when: the brief file exists at the stated path.
4. Write the spawn phase: define which agent or worker to launch, what it may read, what outputs it must produce, and what it must not change. Show the spawn definition to the user before proceeding. Done when: the user approves the spawn definition.
5. Execute the spawn phase. Capture stdout, stderr, and the exit code. Done when: spawn output is captured with exit code recorded.
6. Write the work phase: document the agent's actual execution path, outputs, and any deviations from the brief. Done when: the work record reflects the actual execution path and deviations.
7. Write the review-artifact phase: record what was produced, whether it meets the brief, and what the human must verify. Done when: the review artifact states production status, brief conformance, and human verification items.
8. Present the review artifact to the user. Await explicit sign-off or revision request. Done when: the user signs off or requests revision.
9. On sign-off, record the human-gate record (e.g., `run/<session-id>/human-gate.md`) with the decision, timestamp, and any conditions. Done when: the human-gate record is written with decision, timestamp, and conditions.
10. Return the complete workspace state: brief, spawn output, work record, review artifact, and human-gate record. Done when: all five artifacts are returned.

## Failure and recovery

- **Unprovided or ambiguous brief:** Stop. Ask the user for a concrete work goal before proceeding.
- **Spawn phase failure:** Attempt one retry with corrected spawn definition. Record the failure and the retry count. Stop if the second attempt fails.
- **Review artifact divergence:** Present the divergence to the user. Do not proceed until the user resolves or approves.
- **Missing sign-off:** The session is not done. Record the last state and stop.
- **Partial-result rule:** If any phase halts midstream, all durable artifacts written up to that point remain; no automatic rollback.

## Output

One workspace directory (`run/<session-id>/`) containing brief.md, spawn.md, work.md, review.md, human-gate.md — in that order.
