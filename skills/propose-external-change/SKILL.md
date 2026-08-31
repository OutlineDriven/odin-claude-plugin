---
name: propose-external-change
description: 'Use when asked to change state in an external system, propose the write locally and halt at the human gate without executing it. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Propose external change

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Work must change state in an external system such as a tracker, chat workspace, or remote repository rather than local files. |
| Authority | Reversible-local: write only named local artifacts. Rollback path is deletion of the persisted proposal file. |
| Side effect | Discovers through a least-privilege read connector, emits one signed and minimized write proposal, persists it, and stops at the human gate; no direct external mutation. |
| Done | The proposal is persisted and the run halts awaiting a human decision; no external write occurred without that decision. |

## Inputs

| Input | Required | Note |
|---|---|---|
| Target system type | Yes | Tracker, chat workspace, remote repository, or named external system. |
| Desired change | Yes | The exact state change to propose. |
| Read connector or credentials | No | Used only for discovery; read-only access is sufficient. |
| Signing identity | Yes | Must be supplied explicitly; no ambient fallback. |

## Procedure

1. Validate the external system type and the proposed change. Reject if the target is a local file or an unspecified system.
2. Establish a least-privilege read connector to the named external system. Perform discovery only. Stop if the connector cannot connect or returns no access.
3. Validate that a signing identity is present and unambiguous. If missing or ambiguous, halt and request the identity; do not substitute or infer one. From discovery output, emit one JSON proposal containing: the system, the specific change, the signing identity, and the affected scope.
4. Minimize the proposal to the smallest scoped change that satisfies the requested outcome. Reject overbroad changes.
5. Persist the signed, minimized proposal as a local artifact.
6. Stop. Do not execute any write against the external system. Halt at the human gate.

## Failure and recovery
| Failure class | Behavior |
|---|---|
| Connector unavailable | Run stops; no proposal emitted; external system not modified. |
| Connector returns no access | Run stops; no proposal emitted; reports the access denial. |
| Change is overbroad or ambiguous | Run stops; no proposal emitted; requests a more specific target. |
| Signing identity missing or ambiguous | Run stops; no proposal emitted; halts and requests an explicit signing identity. |

Partial-result rule: if a proposal is written before a failure, the file is left on disk as the output artifact. No external write is rolled back because none occurred.

## Output
A signed, minimized JSON proposal persisted to local storage. The proposal names the external system, the specific change, the signing identity, and the affected scope. The run halts at the human gate. No mutation of the external system has occurred.

## Provenance

Origin: cobusgreyling/loop-engineering, revision d03dcb92cc1e0efb59789a2557131c6ad5897ccc, license MIT. Adaptation of the safe-write-pattern and github-propose examples for odin-run-advanced. No third-party expression copied directly.
