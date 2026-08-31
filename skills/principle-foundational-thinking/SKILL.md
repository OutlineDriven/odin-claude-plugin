---
name: principle-foundational-thinking
description: 'Use when starting a new feature or module to choose core types and data structures before writing logic. Data shapes make downstream code obvious. Don''t use for tasks that require source or remote-system changes.'
---

# Principle foundational thinking

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Choose core types and data structures before logic. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Constrains sequencing only. No state change. |
| Done | Data shapes make downstream code obvious. |

## Inputs

- The feature or module being designed.
- Domain knowledge sufficient to identify the entities, relationships, and invariants the feature must represent.

Both must be supplied. No optional inputs.

## Procedure

1. Name the problem domain and the single responsibility of the feature or module.
2. Enumerate every distinct entity, value, and relationship the feature must represent. Do not write functions, handlers, or control flow yet.
3. For each entity, define its fields, constraints, and invariants as types or data structures. Prefer the strongest type the language offers: enums over string unions, branded types over bare primitives, records over loose maps.
4. Validate each type against the trust boundary it crosses: input from external sources must be parsed and narrowed before entering internal logic; internal types may assume invariants already hold.
5. Confirm the data shapes compose: that every downstream operation the feature requires can be expressed as a pure or near-pure function over the types defined in steps 2–3 without additional ad-hoc fields or casts.
6. If step 5 fails, return to step 2 and extend the type set. Do not patch with runtime checks, optional fields, or escape hatches.
7. Only after steps 2–5 pass, write the logic that operates on the established types.

## Failure and recovery
- **Premature logic:** If control flow or business logic appears before types are settled, stop and return to step 2. Partial implementations built on unstable shapes are discarded, not patched.
- **Type escape hatches:** If anycast, unchecked cast, or untyped map is introduced to bypass a type gap, remove it and extend the type set instead.
- **Scope widening:** If the type enumeration in step 2 grows beyond the feature's single responsibility, split the feature before continuing. Do not widen the module boundary.
- **Non-converged result:** If three iterations of steps 2–6 do not produce composable types, the feature scope is under-specified. Stop and request additional domain clarification.

## Output
A settled set of types and data structures that fully represent the feature's domain, validated against their trust boundaries, and confirmed composable for all downstream operations. Logic written against these shapes follows deterministically.

## Provenance

Adapted from pstack/skills/principle-foundational-thinking/SKILL.md (revision 68836ddaf5697224520f1847d90cdb90ca8babaa) by Lauren Tan (poteto), licensed MIT per pstack/LICENSE blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25. Clean-room adaptation for ODIN 2.0; no third-party expression retained verbatim.
