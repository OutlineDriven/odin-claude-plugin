---
name: principle-model-the-domain
description: 'Use when modeling stateful or branch-heavy logic to encode state transitions and invariants in the type system so invalid states are unrepresentable. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Principle: model the domain

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Model stateful or branch-heavy logic. |
| Authority | Reversible local edits to source files; no VCS mutation, no credential exposure, no remote or deployed artifact change. |
| Side effect | Reshapes domain code: type definitions, constructors, and functions may be added, removed, or replaced to enforce invariants. |
| Done | Invalid states are unrepresentable: the type system statically rules out every illegal state value or transition. |

## Inputs

- **Required**: the source file or module containing the logic to model.
- **Optional**: any existing state machine, enum, or registry the codebase already uses for this domain.

## Procedure

1. **Identify state.** List every state variable, flag, or branch condition that tracks domain progress or mode.
2. **Enumerate transitions.** For each state, list every legal transition: the input or event that triggers it, the preconditions that must hold, and the resulting state. Include every branch condition in this enumeration.
3. **Encode as a sum type.** Model the state as a tagged union or algebraic data type. Each constructor of the type corresponds to exactly one live state. Encode preconditions as constructor parameters constrained by the type system.
4. **Eliminate invalid transitions.** Replace conditional branches that check raw flags or indices with pattern matches or exhaustive destructors on the new type. Ensure the compiler enforces that only legal transitions are expressible.
5. **Validate reachability.** Confirm that every constructor is reachable from a valid initial state and that no constructor encodes an invalid state.
6. **Migrate callers.** Update every call site to use the new typed interface. Remove raw flag assignments and index checks that the type now renders redundant.
7. **Verify done predicate.** Assert that the type system rejects any code path that would construct or transition to an invalid state. Compile or type-check to confirm.

## Failure and recovery
- **Type system insufficient**: if the language cannot express the invariant through types (e.g., a cross-field constraint requiring runtime validation), document the remaining runtime guard explicitly in the code and declare the type-model complete to the degree possible.
- **Circular dependencies**: if modeling a type creates an import cycle, extract the type into a shared module and repeat from step 2 for the cycle boundary.
- **Combinatorial explosion**: if the state space grows beyond a manageable number of constructors, group states into a hierarchy of subtypes and model transitions at the appropriate granularity.
- **Non-converged result**: if a call site cannot be migrated to the new type without violating another invariant, stop the migration at that boundary. The done predicate does not hold until all call sites are migrated.

## Output
Refactored source files in which every domain state and transition is modeled as a type. The type system statically rules out all invalid states and transitions. If modeling cannot be completed, a written explanation of the remaining invariants, their location in code, and why the type system cannot enforce them.

## Provenance

Origin: cursor/plugins (`cursor/skills/principle-model-the-domain`). Source revision: `68836ddaf5697224520f1847d90cdb90ca8babaa`. License: MIT — pstack authored by Lauren Tan (poteto). Adaptation: extracted the state-machine and typed-model principle into a self-contained ODIN 2.0 `odin-code` skill. No third-party expression copied directly; all procedure steps are clean-room re-derivation of the modeling principle for the ODIN catalog.
