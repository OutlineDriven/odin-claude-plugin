---
name: architect
description: 'Use when asked to design non-trivial code before implementation. Emits an explicit design choice with tradeoffs and a coherent implementation shape. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Architect

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Design non-trivial code before implementation. |
| Authority | Write only named local design artifacts; recover by deleting or reverting them. No VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Produces a local design package and may implement the selected shape in the working tree. |
| Done | An explicit design choice, its tradeoffs, and a coherent implementation shape are recorded. |

## Inputs

- Required: a human request naming the non-trivial code unit to design.
- Optional: existing code, type signatures, constraints, or caller expectations already present in the working tree.

## Procedure

1. Bound scope. Confirm the code unit to design and its trust boundary (inputs, callers, failure paths). If the request is trivial or already fully specified, stop and report that no design is needed.
2. Sketch the usage surface first. Write the public call shape—signatures, call sites, and data shapes—before any implementation detail. Record it as a local artifact.
3. Produce at least two competing design sketches that each satisfy the usage surface and differ in structure or tradeoff.
4. Evaluate every sketch against design red flags: hidden complexity, leaky abstraction, unbounded scope, premature generality, and missing error or edge handling. Record which red flags each sketch trips.
5. Apply the redesign threshold. If every sketch trips a blocking red flag or no sketch is coherent, redesign from the usage surface rather than choosing the least-bad sketch. Stop redesigning once at least one sketch is coherent and trips no blocking red flag.
6. Select the sketch with the best tradeoff record. State the explicit design choice and the rejected alternatives with their tradeoffs.
7. Derive the coherent implementation shape—modules, types, control flow, and failure paths—from the selected sketch. Record it as a local artifact.
8. Implement only if the human request and authority permit; otherwise stop at the design package.

## Failure and recovery
- Trivial or fully specified request: stop, report no design needed; mutate nothing.
- No coherent sketch after the redesign threshold: report blocked with the red-flag record; do not implement.
- Scope drift: stop, report the widening, mutate nothing outside the named artifacts.
- Partial result: keep the usage sketch and red-flag record; never present an incomplete design as done.
- Rollback: delete or revert the named local design artifacts. No VCS, credential, or remote mutation is permitted.

## Output
A design package containing the usage surface, the competing sketches, the red-flag evaluation, the selected design with tradeoffs, the rejected alternatives, and the coherent implementation shape. Terminal classification: coherent or blocked.

## Provenance

Origin: cursor/plugins pstack architect skill. Pinned revision 68836ddaf5697224520f1847d90cdb90ca8babaa. License MIT. Clean-room adaptation preserving the usage-first design, competing-sketch, and redesign-threshold mechanism without copying source expression.
