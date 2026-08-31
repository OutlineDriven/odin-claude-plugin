---
name: fail-recover
description: 'Use when a user wants to restore service from a known failure. Apply a single bounded recovery operation to the running system or its configuration until service is restored. Not for design-time failure definition — use fail-design.'
---

# Fail recover

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to restore service from a known failure. |
| Authority | Reversible local writes only: write only named local artifacts; state and follow the rollback path before mutating. |
| Side effect | Recovery actions applied to the running system or its configuration; limited to the single named recovery operation. |
| Done | Service is restored from the known failure. |

## Inputs

Required: the known failure (symptom and identity), the single recovery operation to apply, and the local target (running system or configuration artifact) it changes. Optional: an explicit rollback path; if absent, derive and record one before any mutation.

## Procedure

1. Confirm the observed symptom matches the known failure; if it does not, stop. Done when: the symptom matches the known failure, or the skill stops.
2. Identify the single recovery operation and the named local target it will change; record the rollback path that reverses that change. Done when: the recovery operation, target, and rollback path are recorded.
3. Validate at the trust boundary that the recovery operation is the one prescribed for this known failure and targets only the named local artifact. Done when: the operation is validated as prescribed and scoped to the named target.
4. Apply the recovery operation to the named local target only. Done when: the recovery operation is applied to the named target.
5. Verify the done predicate: service is restored from the known failure. Done when: service is restored, or the predicate does not hold.
6. If the predicate does not hold, stop; do not widen scope, retry a different action, or invent evidence. Done when: the skill stops without widening scope.

## Failure and recovery
- Unknown failure: the symptom does not match the known failure. Stop; apply no recovery operation.
- Non-restoring action: the recovery operation was applied but service is not restored. Stop, report the remaining symptom and the action taken, and do not retry with widened scope or an unvalidated action.
- Partial result: no partial application is reported as done. Report what was applied and the remaining failure.
- Rollback: reverse the named local change via the recorded rollback path. Never swallow errors or assert the done predicate when it does not hold.

## Output
Terminal classification: `restored` or `not-restored`. Include the recovery operation applied, the named local target changed, the rollback path, and the remaining symptom when not restored.

## Provenance

Origin: `project-owned:user-curated-skill-ideas` (curated-049). Revision: none. License: project-owned. Adaptation: clean-room restatement of a user-curated runtime-recovery workflow as a single bounded recovery operation.
