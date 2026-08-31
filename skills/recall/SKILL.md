---
name: recall
description: 'Use when asked to recover prior work and current status before resuming, returning a status-tagged capsule and one concrete next move. Don''t use for tasks that require source or remote-system changes.'
---

# Recall

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Recover prior work and current status before resuming. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat-output only. No file, credential, paid, published, deployed, or remote mutation. |
| Done | Status-tagged capsule and one concrete next move. |

## Inputs

- **Session identifier** (required): the active session ID or session directory path to recover.
- **Current working directory** (required): the directory the agent was operating in when the session ended.
- **Optional scope hint**: a specific file, module, or task tag to narrow recovery. Omit to recover the full capsule.

## Procedure

1. **Identify session source.** Locate the session state file or transcript corresponding to the supplied session identifier. If no session file is found, return the `session-not-found` failure.
2. **Extract transcript.** Parse the session transcript. If parsing fails, return the `transcript-parse-failure` failure.
3. **Mine transcript for work state.** Collect all completed actions, emitted artifacts, tool results, and navigation events from the transcript. Extract each as a discrete record with its outcome.
4. **Verify against live repository state.** For each file, artifact, and VCS-tracked target mentioned in the transcript, read the live filesystem and confirm the record matches current state. Flag each mismatch as a `divergence`.
5. **Tag the capsule.** Assign each recovered record one of: `completed`, `in-progress`, `blocked`, or `diverged`.
6. **Identify the concrete next move.** From the in-progress and blocked records, select the highest-priority actionable item that is not blocked by an unresolved divergence. State it as one concrete next move.
7. **Emit the capsule.** Return a structured capsule containing: all tagged records, the concrete next move, and a summary of divergences.

## Failure and recovery
| Failure class | Condition | Result |
|---|---|---|
| `session-not-found` | No session state file exists for the supplied identifier | Return `session-not-found` with the identifier. Do not fabricate state. |
| `transcript-parse-failure` | Transcript cannot be parsed or is corrupted | Return `transcript-parse-failure` with the parse error. Do not continue with partial data. |
| `no-recoverable-state` | Transcript exists but contains no identifiable work records | Return `no-recoverable-state`. Do not invent artifacts or actions. |

**Partial-result rule:** If some records verify and others diverge, return the verified records with divergence flags. Do not suppress divergences to satisfy the done predicate.

**Rollback rule:** This skill performs no mutations. No rollback is required.

## Output
A structured capsule:
```
{
  "session_id": <identifier>,
  "records": [
    { "action": <string>, "outcome": <string>, "status": "completed" | "in-progress" | "blocked" | "diverged", "divergence_note": <string | null> }
  ],
  "next_move": <one concrete next-move sentence>,
  "divergences": [ <string> ]
}
```

If the done predicate cannot be satisfied, return the exact failure class from the table above.

## Provenance

- Origin: `cursor/plugins` — pstack `recall` skill authored by Lauren Tan (poteto), MIT-licensed.
- Revision: `68836ddaf5697224520f1847d90cdb90ca8babaa`
- License: MIT (evidence: `pstack/LICENSE` blob `6b5400237fdf6545be0b8fae370d6f2fcff8fb25`; pstack authored by Lauren Tan under MIT per audit license block)
- Adaptation: Clean-room rewrite for ODIN 2.0 `odin-research` module. Transcript-mining mechanism retained; authority scoped to read-only; output shaped to the ODIN capsule contract.
