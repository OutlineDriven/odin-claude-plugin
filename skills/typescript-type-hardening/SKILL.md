---
name: typescript-type-hardening
description: 'Use when TypeScript code has type errors, any, difficult generics, branded types, or inference failures. Also handles utility-type derivation when primitives must compose. Not for strict-flag setup or runtime pitfalls — use typescript-best-practices.'
---

# TypeScript type hardening

## Contract

| Field | Bound contract |
|---|---|
| Trigger | TS type errors, eliminating any, designing complex generics, branded/opaque types, inference problems, utility-type design |
| Authority | Reversible local: write only named TypeScript source and type-test files; rollback via VCS |
| Side effect | Edits TypeScript source and type tests; runs tsc |
| Done | Two clean tsc --noEmit passes, zero new any, call sites still type-check, type tests demonstrate before/after representations |

## Inputs

- Target TypeScript file(s) or directory. Required.
- tsconfig.json present in the project root or a specified path. Required.
- Specific type problem description (error message, desired generic shape, branded type contract). Required.
- Existing type tests if extending coverage. Optional.

## Procedure

1. Run `tsc --noEmit` to capture the baseline error set. **Done when:** the exact error list is recorded before any edit.
2. Classify each error or requested type improvement as missing annotation, incorrect narrowing, any elimination, generic design, conditional/infer extraction, mapped/template-literal transform, branded/opaque type, utility-type derivation, function overload, or builder-pattern typing. **Done when:** every item has one classification.
3. For each classified item, apply the narrowest matching mechanism:
   a. **Missing annotation / any elimination**: Add explicit type annotations. Replace `any` with `unknown` then narrow via type guards, discriminated unions, or assertion functions. Never widen to `object` or `{}` as a substitute.
   b. **Incorrect narrowing**: Add or correct discriminated union tags, `typeof`/`in`/`instanceof` guards, assertion functions, or control-flow analysis. Ensure exhaustiveness with `never` checks in switch/default.
   c. **Generic design**: Introduce type parameters with explicit constraints (`extends`). Use defaults only when the consumer should not need to supply them. Prefer `const` type parameters (TS 5.0+) for literal inference.
   d. **Conditional/infer extraction**: Use `T extends U ? X : Y` for branching. Use `infer R` inside `extends` clauses to extract from arrays, promises, function return types, and tuple positions. Chain `infer` for nested extraction.
   e. **Mapped/template-literal transform**: Use `{ [K in keyof T]: ... }` for structural transforms. Use template literal types with `Uppercase`/`Lowercase`/`Capitalize`/`Uncapitalize` intrinsic helpers for string-key remapping.
   f. **Branded/opaque types**: Create brands via `declare const __brand: unique symbol; type Branded<T, B> = T & { readonly [__brand]: B }`. Provide constructor and type-guard helpers. Never expose the raw intersected type.
   g. **Utility-type derivation**: Build from primitives: `Partial`, `Required`, `Pick`, `Omit`, `Record`, `Readonly`, `ReturnType`, `Parameters`, `InstanceType`, `Awaited`. Compose them. For recursive structures, use conditional types with `infer` and recursive references.
   h. **Function overloads**: Define overload signatures for distinct call patterns. Place the implementation signature last with a union parameter type. Each overload must be assignable to the implementation.
   i. **Builder-pattern typing**: Use chained generics (`Builder<Step>`) with branded step types or literal type parameters so each method returns a builder constrained to valid next steps.
   j. **Array/index access**: Use `T[number]` for element types. Use `as const` assertions or `satisfies` for readonly tuple inference. Use variadic tuple types (`[...T, U]`) for push/prepend operations.
   k. **Deep inference**: For nested structures, use recursive conditional types. Limit recursion depth with a counter parameter to avoid TS instantiation-depth errors.
   **Done when:** every classified item has its mechanism applied.
4. After each edit, run `tsc --noEmit` on the changed file(s). If the edit introduces errors outside the baseline, revert it and apply a narrower fix. **Done when:** no new errors appear outside the baseline.
5. Write or update type-test files that demonstrate: the `any` that was eliminated (before/after), the generic that now constrains correctly, the branded type that rejects unbranded values, or the utility type that derives the expected shape. Use `// @ts-expect-error` for negative tests proving type rejection. **Done when:** positive and negative tests exist for each mechanism applied.
6. Run `tsc --noEmit` a second time on the full project. Confirm zero new errors compared to baseline and zero new `any` occurrences (grep source for `: any`, `as any`, `<any>`). **Done when:** the full-project pass is clean against the baseline.
7. Verify all call sites that consumed the changed types still compile. If a call site breaks, update it to match the new contract rather than weakening the type. **Done when:** every consuming call site compiles.

## Failure and recovery
- **Type error persists after mechanism application**: Revert the failing edit. Report the exact error, the mechanism attempted, and why it did not resolve. Do not widen the type to suppress the error.
- **Call-site breakage beyond scope**: Revert the change. Report which call sites broke and what contract change they require. Await scope expansion approval.
- **tsc instantiation-depth exceeded**: Simplify the recursive type. Use a depth-limited recursion pattern with a counter generic. If the structure genuinely requires deep recursion, report the limit and propose a runtime fallback.
- **Baseline already has errors unrelated to the target**: Isolate the target file(s) with `--noEmit` scoped to the changed files only. Report pre-existing errors separately.
- **No tsconfig.json found**: Block. Report the missing prerequisite. Do not create a tsconfig.

## Output
Modified source files, type-test files (positive and `@ts-expect-error` negative), and a terminal report (baseline count, final count, any eliminated, mechanisms applied, tsc status for both runs), in that order.
