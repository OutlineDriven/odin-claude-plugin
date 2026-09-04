---
name: tasty-abstraction
description: 'Use when a user wants to design an abstraction boundary that collapses a complex implementation into a simpler interface without leaking internal state. Not for implementation.'
---

# Tasty abstraction

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to design an abstraction boundary that collapses a complex implementation into a simpler interface |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Stops before implementation. |
| Side effect | Chat output: one abstraction specification document |
| Done | A standalone specification exists detailing the abstraction boundary, leak surface, and usage constraints |

## Inputs

- Target problem (required): the concrete complexity, repetition, or leak the abstraction must address.
- Raw form (required): the current unabstracted surface the user works with directly.
- Identified failure modes (required): the ways the raw form breaks, surprises, or requires expert knowledge.

## Procedure

1. **Enumerate the raw form's surface and failure modes.** List every operation, concept, and escape hatch the user touches, plus every failure mode supplied as input. If the raw form has no meaningful complexity to collapse, report that finding and write no specification. Done when: the surface and failure modes are enumerated, or the workflow stops because no problem exists.

2. **Propose a collapsed boundary.** The boundary must collapse at least two raw-form concepts into one interface operation, expose every escape hatch the raw form offers as a direct pass-through or named override, and introduce no concept that does not exist in the raw form. Done when: one boundary is proposed meeting all three constraints.

3. **Map escape hatches for raw access.** For every point where the user must reach past the abstraction, state whether the hatch is sealed, exposed as configuration, or documented as a known seam. Done when: every escape hatch is classified.

4. **Document leaked surface and trade-offs.** Every point where the abstraction can break, surprise, or require raw-form knowledge is a leak. For each leak, state the trade-off: what the abstraction gains by leaking here and what the user must still understand. Done when: every leak and trade-off is documented.

5. **Write the specification.** The specification contains: abstraction name, boundary definition, surface comparison table (raw-form concepts mapped to abstraction concepts), escape-hatch mapping, leak surface inventory with trade-offs, and usage contract (when to use, when to bypass, what the user must still understand about the raw form). Deliver as chat output. Done when: the specification is complete and delivered.

## Failure and recovery

| Failure class | Rule |
|---|---|
| `boundary-violation` | The abstraction cannot collapse the raw form without leaking the problem it exists to hide. Report which leak breaks the boundary. Write no specification. |

Partial results are not artifacts. If any step fails, no specification is delivered.

## Output

One abstraction specification delivered as chat output: boundary definition, surface comparison, escape-hatch mapping, leak surface with trade-offs, and usage contract.
