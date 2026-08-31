---
name: principle-type-system-discipline
description: 'Use when asked to design static types and signatures that encode domain constraints. The compiler detects every invalid or unhandled state. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Principle type system discipline

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Design static types and signatures. |
| Authority | Reversible-local: write only named local type-definition files; state the rollback path (revert the changed file or restore from VCS). |
| Side effect | Reshapes types in local source files. |
| Done | Compiler detects invalid or unhandled states. |

## Inputs

- **Domain description** (required): the set of values, states, and operations the types must model.
- **Target language** (required): the language whose type system is used.
- **Existing type file** (optional): path to a file whose types are being redesigned; if absent, types are written to a new file.

## Procedure

1. Enumerate every domain value, state, and operation from the domain description. Record each as a named entity with its valid companions and exclusions.
2. For each set of mutually exclusive entities, model it as a **sum type** (tagged union, discriminated union, or sealed trait) so that holding one variant excludes the others at the type level.
3. For each set of entities that are structurally identical but semantically distinct, model each as a **branded type** (newtype, opaque alias, or nominal wrapper) so that the compiler rejects cross-domain interchange.
4. For each set of fixed known values, model it as a **literal union** or **enum** so that the compiler rejects any value outside the set.
5. Design data structures: use product types (structs, records) for entities whose properties coexist; use sum types from step 2 for entities whose properties are mutually exclusive.
6. Design function signatures so that each parameter type accepts exactly the values the function handles and no others. Return types encode the possible outcomes as a sum type.
7. Verify exhaustiveness: confirm that every consumer of a sum type handles all variants. Add an exhaustiveness check (pattern match with no wildcard, compiler flag, or explicit exhaustive switch) so the compiler rejects unhandled variants.
8. Verify invalid-state rejection: construct a mental or literal example of an invalid domain state and confirm the type system makes it unrepresentable. If the compiler accepts the invalid state, return to step 2 or 5 and tighten the types.
9. Run the compiler. Confirm it accepts valid code and rejects invalid states. If it rejects valid code, widen the affected type. If it accepts invalid code, narrow it.
10. Write the final type definitions to the target file. If redesigning an existing file, replace the prior type definitions in place.

## Failure and recovery
| Failure class | Response |
|---|---|
| Domain ambiguity | Stop. Report the ambiguous entities and ask for clarification. Do not guess domain semantics. |
| Compiler rejects valid code | The type is too narrow. Widen it to accept the valid case. Re-run the compiler. |
| Compiler accepts invalid code | The type is too broad. Narrow it to reject the invalid case. Re-run the compiler. |
| Non-convergence after one iteration | Report the blocker: which state cannot be made unrepresentable and why. Leave existing types unchanged. |
| Rollback | Revert the changed type-definition file to its prior content or restore from VCS. |

## Output
- A set of type definitions and function signatures in the target language where the compiler enforces domain constraints.
- A brief report listing any domain states that could not be made statically unrepresentable, with the reason.

## Provenance

Adapted from Lauren Tan (poteto) pstack skill `principle-type-system-discipline` and `cursor-team-kit/rules/typescript-exhaustive-switch.mdc`, revision 68836ddaf5697224520f1847d90cdb90ca8babaa. Licensed MIT per pstack/LICENSE blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25. Clean-room adaptation: procedure rewritten for language-agnostic use; core mechanisms (sum types, branded values, exhaustive matching, compiler-as-proof) preserved.
