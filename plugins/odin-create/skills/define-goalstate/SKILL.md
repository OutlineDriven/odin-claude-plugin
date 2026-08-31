---
name: define-goalstate
description: 'Use when the user wants the finished-system contract for a piece of work. Authors an approved success-predicate document naming behavior, protocols, allowed states, forbidden states, and impossible states, with a concrete state-space proof and terminal failure behavior.'
---

# Define goalstate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user wants to write the finished-system contract for a piece of work. |
| Authority | Write only the named local contract document; revert by deleting or overwriting it. |
| Side effect | A finished-system contract document describing behavior, protocols, a concrete state-space proof, allowed states, forbidden states, impossible states with their structural invariants, a falsifiable success predicate, and terminal failure behavior. No other file, credential, or remote target is touched. |
| Done | An approved success-predicate document exists, naming behavior, protocols, allowed states, forbidden states, impossible states, falsifiable success predicate, state-space proof, and terminal failure behavior, structured for consumption by downstream wayfinding. |

## Inputs

The user must supply the intended finished system: what it must do (behavior) and the rules governing its interaction (protocols). The user must classify states as allowed, forbidden, or impossible. An impossible state is only admitted if the user can name the structural invariant or boundary that makes it unreachable; "unlikely" or "undesired" is not enough. The success predicate must be falsifiable: it must be able to return true for at least one allowed state and false for at least one forbidden state. No external skill, map, or prior artifact is required.

## State classification

- Allowed state: a concrete, observable system configuration that the finished system may legitimately occupy while honoring the contract.
- Forbidden state: a concrete, observable configuration that violates the contract. Every forbidden state must be paired with an explicit terminal failure behavior (halt, rollback, retry-with-limit, degrade-to-safe-mode, etc.).
- Impossible state: a configuration that cannot be reached because the design, protocol, or environment structurally excludes it. Each impossible state must name the structural invariant or boundary that makes it unreachable. If no such invariant can be named, reclassify the state as forbidden or allowed.

## Procedure

1. Elicit from the user the intended finished system: the behavior it must exhibit and the protocols that govern its interactions. Done when: behavior and protocols are elicited and written as concrete statements.
2. Enumerate allowed states. For each state, name the concrete observable and the protocol step or input that produces it. Done when: there is at least one allowed state and each allowed state is concrete and reachable under the protocols.
3. Enumerate forbidden states. For each forbidden state, name the concrete violation, the boundary it breaches, and the terminal failure behavior the system must exhibit if that state is observed. Done when: each forbidden state has a violation, a boundary, and a terminal failure behavior.
4. Enumerate impossible states. For each impossible state, name the structural invariant or boundary that makes it unreachable. If the user cannot name one, stop and reclassify; do not accept "impossible" as a wish. Done when: each impossible state is justified by an invariant or boundary.
5. Build a concrete state-space proof. For each allowed state, show a sequence of protocol steps that reaches it from an initial allowed state. For each forbidden state, show a sequence of allowed steps that could reach it unless the named boundary or terminal failure behavior intervenes; then show the intervention. For each impossible state, demonstrate that no sequence of allowed protocol steps can reach it because of the named invariant or boundary. Done when: the state space is partitioned and the proof is stated in the contract.
6. Write a falsifiable success predicate: a concrete, checkable condition that holds if and only if the finished system satisfies the contract. Test it mentally against the enumerated states: it must be true for at least one allowed state and false for at least one forbidden state. If it cannot distinguish allowed from forbidden, stop and reject the draft; ask the user to sharpen the predicate. Done when: the success predicate is concrete, checkable, and distinguishes an allowed state from a forbidden state.
7. Define terminal failure behavior for every forbidden state: an observable action the finished system takes when the forbidden state is encountered, with no ambiguity about whether the system halts, retries, degrades, or rolls back. Done when: every forbidden state has a terminal failure behavior.
8. Present the complete draft—behavior, protocols, allowed states, forbidden states, impossible states with invariants, state-space proof, success predicate, and terminal failure behavior—to the user for approval. Done when: the complete draft is presented to the user.
9. On approval, write the contract to a named local document. On rejection, revise per the user's feedback and re-present; do not write an unapproved contract. Done when: the approved contract is written to a named local document.

## Failure and recovery

- Unfalsifiable success predicate: if the predicate is not concrete, not checkable, or cannot be shown to return true for at least one allowed state and false for at least one forbidden state, stop and ask the user to sharpen it. Do not write a contract whose predicate cannot distinguish allowed from forbidden.
- Incomplete state classification: if any of allowed, forbidden, or impossible states is missing, vague, or not justified, stop and elicit the missing class or invariant. Do not guess states the user did not name, and do not accept "impossible" without a structural invariant or boundary.
- Unclassified forbidden-state failure: if a forbidden state lacks a named terminal failure behavior, stop and elicit one. Do not assume "raise an error" is sufficient.
- Rejected draft: revise per feedback and re-present. Do not persist a rejected draft.
- Rollback: the only mutation is the local contract document; delete or overwrite it to revert to the prior state.

## Output

A local finished-system contract document with sections in order: behavior, protocols, allowed states, forbidden states, impossible states (each with the structural invariant or boundary that makes it unreachable), a concrete state-space proof, a falsifiable success predicate, and terminal failure behavior for every forbidden state.
