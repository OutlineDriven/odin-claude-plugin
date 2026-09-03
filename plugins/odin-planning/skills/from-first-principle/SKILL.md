---
name: from-first-principle
description: 'Use when a user wants to rebuild a design, organization, or API from primitives. Produces a first-principles rebuild spec naming primitives, structure, and open assumptions. Not for a perspective take — use from-*-perspective seats. Writes one local spec; no remote mutation.'
---

# From first principle

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to rebuild a design, organization, or API from primitives. |
| Authority | Write one named local rebuild specification artifact; read the existing target as read-only. Rollback is deleting the artifact. |
| Side effect | Writes a first-principles rebuild specification of the design, organization, or API to a local file. |
| Done | Produces a rebuilt first-principles specification naming primitives, derived structure, and open assumptions. |

## Not for

- A perspective take on a question — use the from-*-perspective seats.
- Pruning an existing structure down to its primitives — this rebuilds from primitives, it does not strip down.
- Restarting from a blank greenfield — use fromzero.
- Remote, credential, publish, deploy, or irreversible changes.

## Inputs

Required: the target to rebuild (a design, an organization, or an API) and access to its current form for read-only comparison. Optional: the primitives the user insists on starting from; when absent, primitives are derived from the target itself.

## Procedure

1. Name the target and confirm whether it is a design, an organization, or an API. Done when: the target type is stated.
2. Enumerate the irreducible primitives the target cannot exist without: concepts, data, or operations that are not themselves derivable from something smaller in this target. Done when: primitives are listed and each is confirmed irreducible.
3. Derive the target's structure from those primitives only. Reject any element that is not forced by a primitive or a necessary composition of primitives. Done when: every derived element traces to a primitive or composition.
4. For each derived element, record the primitive or composition that forces it. Elements with no primitive basis are open assumptions, not derived. Done when: each element is labeled derived or open-assumption with its basis.
5. Write the rebuild specification to a local artifact: the enumerated primitives, the derived structure, each derivation step, and the open assumptions. Done when: the artifact is written with all four sections.
6. Diff the rebuilt structure against the existing target, marking what changed and what was eliminated as non-primitive. Done when: the diff is recorded in the artifact.

## Failure and recovery

- Primitives not enumerable: stop and report that the target cannot be reduced to stated primitives, naming the missing concept. Do not invent primitives.
- Element with no primitive basis: record it as an open assumption; never present an underived element as primitive-forced.
- Partial result: emit the artifact with derived sections complete and open assumptions listed; never fill a gap with a plausible but underived element.
- Non-mutation: the existing target is read-only throughout. Rollback is deleting the written artifact; no other state is touched.

## Output

A local first-principles rebuild specification artifact: enumerated primitives, derived structure, per-element derivation steps, change/elimination diff against the existing target, and open assumptions — in that order.
