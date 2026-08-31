---
name: fromzero
description: 'Use when the user wants to restart a greenfield attempt from a clean pad carrying only proven requirements. Don''t use without a committed, VCS-recoverable current attempt.'
disable-model-invocation: true
---

# Fromzero

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user wants to replace a greenfield attempt from a clean pad while carrying only proven requirements. |
| Authority | Restrict changes to VCS-tracked targets, show the exact set before mutation, and use version control as the recovery path. Human-only: act only on explicit human invocation. |
| Side effect | A new greenfield attempt on a clean pad; the old attempt remains recoverable through VCS. |
| Done | A new greenfield attempt exists carrying only proven requirements. |

## Inputs

- The current greenfield attempt, which must be under version control and committed.
- The set of proven requirements to carry forward. A requirement is proven only when it has been verified (tested, accepted, or otherwise demonstrated); speculative or unverified scope is not proven.

## Procedure

1. Verify the current attempt is committed and recoverable through version control. If any uncommitted or untracked work exists, stop and require the human to commit or discard it first.
2. Enumerate the exact set of VCS-tracked targets that the restart will replace, and show that set to the human before any mutation.
3. Extract the proven requirements from the current attempt. Carry only requirements that are verified; discard unproven, speculative, or accumulated scope.
4. Create the clean pad: branch from the recoverable commit (or otherwise reset the working tree) so the old attempt survives in VCS history while the working surface is cleared.
5. Write only the proven requirements into the new attempt. Do not reintroduce discarded scope.
6. Confirm the new attempt exists and carries only proven requirements, and that the old attempt is reachable through version control.

## Failure and recovery
- Current attempt not committed or not VCS-tracked: stop before mutation; require the human to commit. No files change.
- Proven requirements cannot be distinguished from speculation: stop; do not carry unproven scope into the new attempt.
- Partial-result rule: never leave a half-replaced pad. The old attempt must be recoverable through VCS before any working-surface mutation begins.
- Non-mutation rule: when any precondition fails, no target is changed. Report the blocked precondition and the exact recovery step the human must perform.

## Output
A new greenfield attempt on a clean pad carrying only proven requirements, with the old attempt recoverable through VCS history.

## Provenance

Origin: `project-owned:user-curated-skill-ideas` (the `fromzero` entry), supplemented by the raw Korean source at `project-owned:user-supplied-source-brief`. Revision: none pinned. License: project-owned. Adaptation: clean-room restatement of the user-curated one-line brief into a bounded, VCS-reversible-destructive, human-only procedure; no third-party expression copied.
