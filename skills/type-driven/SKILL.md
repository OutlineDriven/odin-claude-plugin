---
name: type-driven
description: 'Develop with refined types. Use when modeling a domain, encoding a state machine in types, hardening an API boundary against malformed input, or the user says ''make invalid states unrepresentable'' or ''parse don''t validate''. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Type-driven development

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The work is modeling a domain, encoding a state machine, hardening an API boundary, making invalid states unrepresentable, or parsing instead of validating. |
| Authority | Reversible local. No file, VCS, credential, paid, published, or remote mutation. |
| Side effect | Rewrites domain types, public signatures, and affected callers and tests to the new algebraic model. |
| Done | Invalid states are unconstructible, matches are exhaustive, boundaries parse, and no scattered post-hoc validation remains. |

## Inputs

Required: the domain problem, data model, or API surface to encode.
Optional: existing types or callers to refactor.

## Procedure

1. **Plan.** State the domain in one paragraph. List all valid states, all invalid states, and every operation with its preconditions and postconditions. If any operation is partial, mark it as such.
2. **Design types first.** For each invalid state, write a type that the compiler prevents. Use ADTs, phantom types, branded types, newtype wrappers, sealed hierarchies, or opaque types, whichever the language supports. Do not write implementation bodies until all types compile.
3. **Parse at boundaries.** For every untrusted input (external data, deserialization, FFI, user input), write a `parse` constructor that returns the new type. Do not return `bool` and defer validity to callers.
4. **Exhaustive matching.** Encode state machine transitions as exhaustive `match`/`switch`/`visit` on the sum type. Compiler warnings on incomplete arms are failures.
5. **Verify.** Run the language's strict type checker and exhaustiveness check. Fix the type design, not the implementation, when the checker reports an illegal state is representable.
6. **Build.** Run the full target build. Implement the bodies guided by the types.

## Failure and recovery
- **Unsupported language:** If the language lacks ADTs, sealed hierarchies, or equivalent sum-type support, skip this approach and report.
- **Type checker failure:** Block. Fix the type design until the invalid state is unrepresentable. Do not add runtime guards.
- **Non-exhaustive match:** Compile-time failure. Add the missing variant to the type, not a wildcard arm.
- **Invalid state remains representable:** Block. The type design is insufficient; iterate until the compiler enforces the invariant.
- **Type holes remain:** Block. Complete all incomplete bodies or remove the holes before proceeding.
- **Build fails:** Block. Resolve implementation errors until the target build passes.

## Output
A domain type system where every algebraic constructor is present, every boundary has a parse function returning the new type, every state-machine variant is matched exhaustively, and no runtime validation scattered outside the parse layer remains.

## Provenance

Origin: ODIN 1.x current skill tree. License: project-owned; no external license. Adaptation: distilled from the full current body to the ODIN 2.0 self-contained section contract. Runtime dependencies: zero.
