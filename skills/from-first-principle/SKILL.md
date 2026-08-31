---
name: from-first-principle
description: 'Use when a user wants to rebuild a design, organization, or API from primitives. Produces a rebuilt first-principles specification of that design, organization, or API. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# From first principle

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to rebuild a design, organization, or API from primitives. |
| Authority | Write one named local rebuild specification artifact; read the existing target as read-only. Rollback is deleting the artifact. |
| Side effect | A first-principles rebuild specification of design, organization, or API, written to a local file. |
| Done | A rebuilt first-principles design/organization/API specification is produced, naming primitives, derived structure, and open assumptions. |

## Inputs

Required: the target to rebuild (a design, an organization, or an API) and access to its current form for read-only comparison. Optional: the primitives the user insists on starting from; when absent, primitives are derived from the target itself.

## Procedure

1. Name the target and confirm whether it is a design, an organization, or an API. This rebuilds a target from primitives; it does not prune an existing structure down to its primitives, nor restart from a blank greenfield.
2. Enumerate the irreducible primitives the target cannot exist without: concepts, data, or operations that are not themselves derivable from something smaller in this target.
3. Derive the target's structure from those primitives only. Reject any element that is not forced by a primitive or a necessary composition of primitives.
4. For each derived element, record the primitive or composition that forces it. Elements with no primitive basis are open assumptions, not derived.
5. Write the rebuild specification to a local artifact: the enumerated primitives, the derived structure, each derivation step, and the open assumptions.
6. Diff the rebuilt structure against the existing target, marking what changed and what was eliminated as non-primitive.

## Failure and recovery
- Primitives not enumerable: stop and report that the target cannot be reduced to stated primitives, naming the missing concept. Do not invent primitives.
- Element with no primitive basis: record it as an open assumption; never present an underived element as primitive-forced.
- Partial result: emit the artifact with derived sections complete and open assumptions listed; never fill a gap with a plausible but underived element.
- Non-mutation: the existing target is read-only throughout. Rollback is deleting the written artifact; no other state is touched.

## Output
A local first-principles rebuild specification artifact containing the enumerated primitives, the derived structure, per-element derivation steps, a change/elimination diff against the existing target, and any open assumptions.

## Provenance

Origin: `project-owned:user-curated-skill-ideas` (user-curated one-line workflow: "rebuild a design, organization, or API from primitives"). Revision: null. License: project-owned. Adaptation: clean-room expansion of the curated one-line workflow into a bounded local-write procedure with explicit primitive enumeration, derivation recording, and open-assumption handling.
