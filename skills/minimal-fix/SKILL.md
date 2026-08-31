---
name: minimal-fix
description: 'Use when a defect is reported, apply the smallest correct change that removes its root cause and verify the reproduction no longer triggers. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Minimal fix

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A reported defect must be repaired with the smallest correct change |
| Authority | Reversible local: write only named local artifacts; state the rollback path before mutating |
| Side effect | Applies the smallest diff that removes the root cause; no adjacent refactor, no symptom suppression |
| Done | The reproduction no longer triggers, the diff is minimal, and the verification was executed rather than asserted |

## Inputs

- **Required**: defect description with reproduction steps, affected file(s) and line range(s), or error transcript
- **Optional**: existing test that reproduces the defect

## Procedure

1. Confirm the defect by reproducing it using the provided steps or equivalent observable behavior. Stop if reproduction cannot be demonstrated.
2. Diagnose the root cause by tracing the execution path from the observed failure to the offending statement or condition. Do not infer from surface symptoms alone.
3. Validate that the identified root cause is sufficient: removing or correcting it must prevent the defect from occurring.
4. Apply the smallest change that removes the root cause. If no single-file, single-location change satisfies the root cause, stop and report scope too broad.
5. Verify the reproduction no longer triggers using the same observable check from step 1. Asserting absence without re-running the reproduction is not permitted.
6. Confirm the diff is minimal: no added or removed lines are unrelated to the root cause. Revert any adjacent or incidental change.

## Failure and recovery
- **Root cause not found**: Stop. Do not apply any change. Report the defect as requiring broader investigation.
- **Reproduction still triggers after fix**: Revert the change. Stop. Report the attempted fix as ineffective.
- **Scope too broad**: Stop. Do not widen the change. Report that a single-file, single-location repair is not possible.
- **Partial-result rule**: Any revert restores the exact original artifact state; partial or ambiguous state is not a valid result.

## Output
A minimal diff that removes the defect's root cause, verified by re-running the original reproduction. If verification fails, the result is the revert confirmation and a blocked report.

## Provenance

Origin: cobusgreyling/loop-engineering (MIT) at d03dcb92cc1e0efb59789a2557131c6ad5897ccc
Source paths consulted: /skills/minimal-fix/SKILL.md, /templates/SKILL.md.minimal-fix
Adaptation: self-contained, contract-preserving rewrite. MIT license.
