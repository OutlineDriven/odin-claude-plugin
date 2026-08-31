---
name: contract-driven
description: 'Use when crossing a public API boundary, guarding complex invariants, or hardening untrusted input or integration seams; every planned PRE/POST/INV contract is implemented at the appropriate static, test, debug, or runtime layer and violations fail explicitly at the boundary. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Contract driven

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Crossing a public API boundary, guarding complex invariants, or hardening untrusted input or integration seams. |
| Authority | Write only named local types, assertions, validators, and tests at contract boundaries; rollback is deleting the added local code or reverting the boundary change. |
| Side effect | Adds or refines local types, assertions, validators, and tests at contract boundaries. |
| Done | Every planned contract is implemented at the appropriate static/test/debug/runtime layer and violations fail explicitly at the boundary. |

## Inputs

Required: the requirements or specification for the operation whose contract is being designed, and the target source file or module containing the public API boundary, invariant, or untrusted seam.

Optional: existing tests that must continue to pass.

## Procedure

1. Plan: extract PRE/POST/INV from the requirements. Formalize each contract with an ID and a one-line description (e.g. PRE-1: amount > 0; POST-1: balance == old(balance) - amount; INV-1: balance >= 0). Do not begin implementation until every planned contract has an ID.
2. Select verification level: for each contract, choose the strongest layer that can enforce it, preferring static over runtime:
   - Static type system or static_assert for type size, alignment, null/type safety, and exhaustiveness.
   - Test assertions for expensive O(n)+ properties.
   - Debug-only invariants for internal invariants.
   - Runtime guards for public API input, and always for external or untrusted input.
   If a property can be verified statically, do not add a runtime contract.
3. Create: implement every PRE, POST, INV at its chosen level in the target local code. Runtime contracts, where used, must be active and not compiled out or disabled.
4. Verify: run the type checker, static analysis, and build. Contracts must compile and lint.
5. Test: write one violation test per PRE/POST/INV proving the contract catches bad input or bad state. Static contracts are verified by the type checker; runtime contracts by violation tests that assert the boundary fails explicitly.

## Failure and recovery
- Contract lint or build fails: fix the contract or implementation; do not disable or compile out the runtime contract to make it pass.
- A violation test does not fire: the contract is not enforced at the chosen layer; re-select the layer or strengthen the check; never delete the test to make it pass.
- A contract restates the implementation trivially (e.g. ensures(result == x - y) for subtract(x, y)): delete that contract; it is contract fatigue, not a boundary guarantee.
- Partial result: if some contracts cannot be implemented because a requirement is missing, stop and report the missing requirement; do not invent contracts or widen scope.
- Rollback: delete the added local types, assertions, validators, or tests, or revert the boundary change; no remote, credential, published, or deployed artifact is touched.

## Output
Local code with every planned PRE/POST/INV contract implemented at its verification layer, plus one violation test per contract. Violations fail explicitly at the boundary. Each contract traces to a requirement by ID.

## Provenance

Origin: ODIN 1.x current skill `skills/contract-driven/SKILL.md`. Revision: unpinned current. License: project-owned. Adaptation: re-expressed as a self-contained Design-by-Contract procedure preserving the PRE/POST/INV extraction, static-over-runtime verification hierarchy, and per-contract violation-test mechanism; no third-party expression copied.
