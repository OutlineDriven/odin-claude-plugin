---
name: define-goalstate
description: 'Use when the user wants to write the finished-system contract for a piece of work, this skill authors it. The output is an approved success-predicate document naming behavior, protocols, allowed states, forbidden states, and impossible states. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Define goalstate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user wants to write the finished-system contract for a piece of work. |
| Authority | Write only the named local contract document; revert by deleting or overwriting it. |
| Side effect | A finished-system contract document describing behavior, protocols, allowed states, forbidden states, and impossible states. No other file, credential, or remote target is touched. |
| Done | An approved success-predicate document exists, naming behavior, protocols, allowed states, forbidden states, and impossible states, structured for consumption by downstream wayfinding. |

## Inputs

The user must supply the intended finished system: what it must do (behavior) and the rules governing its interaction (protocols). The user must classify the states the finished system may occupy into allowed, forbidden, and impossible. Any class the user cannot yet name is elicited during the procedure; it is not inferred. No external skill, map, or prior artifact is required.

## Procedure

1. Elicit from the user the intended finished system: the behavior it must exhibit and the protocols that govern its interactions.
2. Enumerate the allowed states the finished system may legitimately occupy.
3. Enumerate the forbidden states that must never occur, and the impossible states the design makes structurally unreachable. Elicit any class the user has not yet named; do not infer states the user did not supply.
4. Write a falsifiable success predicate: a concrete, checkable condition that holds if and only if the finished system satisfies the contract.
5. Present the complete draft—behavior, protocols, allowed states, forbidden states, impossible states, and success predicate—to the user for approval.
6. On approval, write the contract to a named local document. On rejection, revise per the user's feedback and re-present; do not write an unapproved contract.

## Failure and recovery
- **Unfalsifiable success predicate**: if the predicate cannot be checked concretely, stop and ask the user to sharpen it. Do not write a contract whose done condition cannot be tested.
- **Incomplete state classification**: if any of allowed, forbidden, or impossible states is missing or vague, stop and elicit the missing class. Do not guess states the user did not name.
- **Rejected draft**: revise per feedback and re-present. Do not persist a rejected draft.
- **Rollback**: the only mutation is the local contract document; delete or overwrite it to revert to the prior state.

## Output
A local finished-system contract document containing the system's behavior, its protocols, its allowed states, its forbidden states, its impossible states, and an approved falsifiable success predicate. The document is self-contained and structured for consumption by downstream wayfinding.

## Provenance

Origin: user-curated planning workflow (project-owned:user-curated-skill-ideas, project-owned:user-supplied-source-brief). Revision: unpinned (null). License: project-owned. Adaptation: clean-room adaptation of the user's curated planning axiom—write the finished-system contract, including behavior, protocols, allowed states, forbidden states, and impossible states, before wayfinding begins—into a self-contained, human-gated contract-authoring procedure.
