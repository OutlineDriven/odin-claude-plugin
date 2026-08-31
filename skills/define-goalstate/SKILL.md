---
name: define-goalstate
description: 'Use when the user wants the finished-system contract for a piece of work. Authors an approved success-predicate document naming behavior, protocols, allowed states, forbidden states, and impossible states.'
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

The user must supply the intended finished system: what it must do (behavior) and the rules governing its interaction (protocols). The user must classify the states the finished system may occupy as allowed, forbidden, or impossible. The procedure elicits any class the user cannot yet name; it does not infer one. No external skill, map, or prior artifact is required.

## Procedure

1. Elicit from the user the intended finished system: the behavior it must exhibit and the protocols that govern its interactions. Done when: behavior and protocols are elicited from the user.
2. Enumerate the allowed states the finished system may legitimately occupy. Done when: allowed states are enumerated from the user.
3. Enumerate the forbidden states that must never occur, and the impossible states the design makes structurally unreachable. Elicit any class the user has not yet named; do not infer states the user did not supply. Done when: forbidden and impossible states are enumerated or elicited, not inferred.
4. Write a falsifiable success predicate: a concrete, checkable condition that holds if and only if the finished system satisfies the contract. Done when: the success predicate is concrete and checkable.
5. Present the complete draft—behavior, protocols, allowed states, forbidden states, impossible states, and success predicate—to the user for approval. Done when: the complete draft is presented to the user.
6. On approval, write the contract to a named local document. On rejection, revise per the user's feedback and re-present; do not write an unapproved contract. Done when: the approved contract is written to a named local document.

## Failure and recovery
- **Unfalsifiable success predicate**: if the predicate cannot be checked concretely, stop and ask the user to sharpen it. Do not write a contract whose done condition cannot be tested.
- **Incomplete state classification**: if any of allowed, forbidden, or impossible states is missing or vague, stop and elicit the missing class. Do not guess states the user did not name.
- **Rejected draft**: revise per feedback and re-present. Do not persist a rejected draft.
- **Rollback**: the only mutation is the local contract document; delete or overwrite it to revert to the prior state.

## Output
A local finished-system contract document with sections in order: behavior, protocols, allowed states, forbidden states, impossible states, falsifiable success predicate.
