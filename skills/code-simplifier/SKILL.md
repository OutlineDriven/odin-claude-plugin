---
name: code-simplifier
description: 'Use when the user asks to simplify, clean up, refactor, or improve the readability of code. Refines the named code for clarity and consistency while preserving identical behavior. Not for measured bloat reduction with a test gate — use code-simplification.'
---

# Code simplifier

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to simplify, clean up, refactor, or improve readability of code. |
| Authority | Reversible local edits to the named code files only; restore prior content by reverting the edit. |
| Side effect | Refines code for clarity, consistency, and maintainability; changes no observable behavior. |
| Done | Code is simpler and more maintainable with identical behavior. |

## Inputs

- Target code (required): one or more local files, functions, or ranges the user names.
- Constraints (optional): behavior that must stay identical (public signatures, outputs, side effects, ordering). Infer these constraints from the code when omitted.

## Procedure

1. Read the named target code in full before changing anything. Record the observable behavior it must preserve: inputs, outputs, return paths, exceptions, side effects, and ordering. Done when: the target is read and its behavior contract is recorded.
2. Bound scope to the named targets. Do not edit files, functions, or ranges the user did not name. Done when: scope is bounded to the named targets.
3. Identify simplifications that preserve the recorded behavior: collapse special cases into the general case, inline trivial indirection, flatten deep nesting, remove dead branches and redundant conditions, replace verbose idioms with clearer equivalents, and shorten long parameter lists by grouping related parameters. Done when: a candidate list is produced or the code is already clear and maintainable.
4. Apply one change at a time. After each change, confirm the recorded behavior is unchanged: signatures match, outputs and side effects match, and no control path was added, removed, or reordered. Done when: the change is applied and behavior is confirmed identical, or the change is reverted.
5. Stop when no further simplification preserves behavior or the remaining candidates add no clarity. Do not refactor for taste alone once the code is clear and maintainable. Done when: no candidate remains that both preserves behavior and adds clarity.

## Failure and recovery
- Behavior drift: if a change alters any recorded behavior, revert that change and do not re-attempt it. Report which behavior drifted.
- Ambiguous target: if the user did not name concrete code or the behavior to preserve cannot be determined from the code, stop and ask for the missing input. Do not guess scope.
- Non-converged: if simplification cycles or each candidate is rejected for behavior drift, stop and report the code as non-converged with the attempted changes listed.
- Partial result: keep applied changes that preserve behavior; report any rejected change and the reason. Never claim the done predicate holds when behavior is unverified.

## Output
Refined target code in place, plus a report of each applied simplification and any change rejected for behavior drift or non-convergence.

## Provenance

Adapted clean-room from getsentry/skills `skills/code-simplifier/SKILL.md` at revision c2f99a5b04b4cd992ec3022d7c2c3e23e938d241, Apache-2.0. No third-party expression copied; the procedure is re-derived for behavior-preserving local refactor.
