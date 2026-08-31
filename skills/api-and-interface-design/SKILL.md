---
name: api-and-interface-design
description: 'Use when asked to design or change a public API, route, CLI flag, or module boundary. It documents the contract with semantics and errors, then migrates every consumer so no legacy path remains. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# API and interface design

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Designing or changing a public API, route, CLI flag, or module boundary. |
| Authority | Write only named local interface definitions and contract docs before implementation; rollback by discarding the uncommitted draft. |
| Side effect | Interface definitions and contract docs written before implementation; no implementation, build, publish, or remote mutation. |
| Done | Contract is documented with semantics and errors, every consumer is migrated, and no legacy path remains. |

## Inputs

The interface being designed or changed: its name and kind (API endpoint, route, CLI flag, or module boundary), and whether it is new or a change to an existing interface. The current contract text, when changing an existing interface. The list of known consumers, found by search over the codebase. Optional: target language or runtime conventions for type and error spelling.

## Procedure

1. Bound scope before any mutation: name the exact interface and whether it is new or a change. Search the codebase for every consumer and record the list; record any consumer that cannot be inspected as an unmigrated risk.
2. Write the contract before implementation. For each operation, field, or flag, document its name, input types, output type, error cases, and side effects. State semantics explicitly: idempotent or not, ordering, nullability, encoding, and concurrency.
3. For a change to an existing interface, classify it as breaking or non-breaking. If breaking, design the cutover in one change: the new contract, the per-consumer migration, and the removal of the legacy path.
4. Validate inputs at the trust boundary per the documented contract: reject malformed input with a documented error; do not silently coerce or default undocumented values.
5. Migrate every consumer to the new contract. Update each consumer so it compiles or type-checks against the new signature; record a consumer as migrated only after it is updated.
6. Remove the legacy path: delete the old signature, alias, re-export, and deprecated entry point. No compatibility shim, alias, or fallback remains.
7. Verify the done predicate: the contract docs contain semantics and errors for every operation, field, and flag; every listed consumer is recorded as migrated; a search for the old signature returns no live reference.

## Failure and recovery
- Unmigrated consumer: if a consumer cannot be inspected or updated, stop. Record it as a blocking risk; the change is not complete and the done predicate does not hold.
- Ambiguous semantics: if a field's semantics cannot be stated concretely, stop and request the missing specification rather than guessing or leaving it implicit.
- Partial-result rule: a partially migrated change is not shippable. Keep the draft uncommitted and report the remaining consumers and unresolved semantics.
- Rollback: discard the uncommitted draft. No implementation was mutated, so no source rollback is required.
- Blocked result: return the unmigrated-consumer list and the unresolved-semantics list. Do not pretend the done predicate holds.

## Output
A contract document stating semantics and errors for every operation, field, and flag. The migrated-consumer list. Confirmation that a search for the old signature returns no live reference. For a blocked run, the unmigrated-consumer list and the unresolved-semantics list instead of a done confirmation.

## Provenance

Clean-room adaptation from addyosmani/agent-skills, skills/api-and-interface-design/SKILL.md, pinned revision d2c37ef6225dd8726cdd369a8030307f48592d26, MIT (SPDX: MIT). Derived distributions retain the notice "Copyright (c) 2025 Addy Osmani" and the MIT permission text. Adapted to a contract-first, breaking-change-cutover procedure that migrates every caller and leaves no legacy path, with no runtime peer dependency.
