---
name: typescript-type-hardening
description: 'Use when existing TypeScript code has concrete type errors, any, failing inference, or needs advanced type mechanism design (generics, conditional or infer, mapped or template-literal, branded, utility derivation, overloads, builders) repaired against the current project state. Not for strict-flag setup or proactive shaping; use typescript-best-practices.'
---

# TypeScript type hardening

## Contract

| Field | Bound contract |
|---|---|
| Trigger | TS type errors, eliminating `any`, designing complex generics, branded or opaque types, inference problems, utility-type design, overloads, builder-pattern typing. A concrete problem description is required, not a proactive shaping pass. |
| Authority | Reversible local: write only named TypeScript source and type-test files; rollback via VCS. Does not create or modify `tsconfig.json`. |
| Side effect | Edits TypeScript source and type tests; runs tsc. |
| Done | Zero new errors versus the recorded baseline and zero new `any` by a defined detection rule (a compiler-level check such as `noImplicitAny` diagnostics or an AST scan, not a three-pattern textual grep), with all consuming call sites compiling. |

## Inputs

- Target TypeScript file or directory (required).
- `tsconfig.json` path (required; must already exist).
- Specific type problem description: error message, desired generic shape, or branded type contract (required).
- Existing type tests if extending coverage (optional).

## Procedure

1. **Run tsc --noEmit and record the exact baseline error list.** Capture the full error output before any edit. If the baseline already has errors unrelated to the target, isolate the target file or files with a scoped `tsc --noEmit` run and record both the full baseline and the scoped baseline. Done when: the exact baseline error list is recorded.

2. **Classify each item into one named mechanism class and apply the narrowest matching mechanism.** Classify each error or requested improvement as: missing annotation, incorrect narrowing, `any` elimination, generic design, conditional or infer extraction, mapped or template-literal transform, branded or opaque type, utility-type derivation, function overload, builder-pattern typing, array or index access, or deep inference. For each class, apply the narrowest matching mechanism, never widening to suppress:
   - Missing annotation or `any` elimination: add explicit type annotations. Replace `any` with `unknown` then narrow via type guards, discriminated unions, or assertion functions. Never widen to `object` or `{}` as a substitute.
   - Incorrect narrowing: add or correct discriminated union tags, `typeof` or `in` or `instanceof` guards, assertion functions, or control-flow analysis. Ensure exhaustiveness with `never` checks in switch or default.
   - Generic design: introduce type parameters with explicit constraints (`extends`). Use defaults only when the consumer should not need to supply them. Prefer `const` type parameters (TS 5.0+) for literal inference.
   - Conditional or infer extraction: use `T extends U ? X : Y` for branching. Use `infer R` inside `extends` clauses to extract from arrays, promises, function return types, and tuple positions. Chain `infer` for nested extraction.
   - Mapped or template-literal transform: use `{ [K in keyof T]: ... }` for structural transforms. Use template literal types with `Uppercase` or `Lowercase` or `Capitalize` or `Uncapitalize` intrinsic helpers for string-key remapping.
   - Branded or opaque types: create brands via `declare const __brand: unique symbol; type Branded<T, B> = T & { readonly [__brand]: B }`. Provide constructor and type-guard helpers. Never expose the raw intersected type.
   - Utility-type derivation: build from primitives (`Partial`, `Required`, `Pick`, `Omit`, `Record`, `Readonly`, `ReturnType`, `Parameters`, `InstanceType`, `Awaited`). Compose them. For recursive structures, use conditional types with `infer` and recursive references.
   - Function overloads: define overload signatures for distinct call patterns. Place the implementation signature last with a union parameter type. Each overload must be assignable to the implementation.
   - Builder-pattern typing: use chained generics (`Builder<Step>`) with branded step types or literal type parameters so each method returns a builder constrained to valid next steps.
   - Array or index access: use `T[number]` for element types. Use `as const` assertions or `satisfies` for readonly tuple inference. Use variadic tuple types (`[...T, U]`) for push or prepend operations.
   - Deep inference: for nested structures, use recursive conditional types. Limit recursion depth with a counter parameter to avoid TS instantiation-depth errors.

   Done when: every classified item has its mechanism applied.

3. **After each edit, re-run tsc --noEmit on the changed files and revert any edit that adds errors outside the baseline.** Run `tsc --noEmit` scoped to the changed files after each individual edit. If the edit introduces errors outside the recorded baseline, revert it and apply a narrower fix. Done when: no new errors appear outside the baseline after every edit.

4. **Write positive and negative type tests for every mechanism applied.** Write or update type-test files that demonstrate: the `any` that was eliminated (before and after), the generic that now constrains correctly, the branded type that rejects unbranded values, or the utility type that derives the expected shape. Use `// @ts-expect-error` for negative tests proving type rejection. Done when: positive and `// @ts-expect-error` negative tests exist for each mechanism applied.

5. **Run the full-project pass and prove Done.** Run `tsc --noEmit` on the full project. Confirm zero new errors compared to the recorded baseline. Confirm zero new `any` by a defined detection rule: a compiler-level check such as `noImplicitAny` diagnostics, or an AST scan for `: any`, `as any`, and `<any>` patterns. A three-pattern textual grep is not sufficient; use the compiler's own diagnostics or a tool that parses the AST. Verify all consuming call sites that consumed the changed types still compile; if a call site breaks, update it to match the new contract rather than weakening the type. Done when: the full-project pass shows zero new errors versus baseline, zero new `any` by the defined detection rule, and all consuming call sites compile.

## Failure and recovery

- Mechanism fails: revert the failing edit. Report the exact error, the mechanism attempted, and why it did not resolve. Do not widen the type to suppress the error.
- Call-site breakage beyond scope: revert the change. Report which call sites broke and what contract change they require. Await scope expansion approval.
- Instantiation-depth exceeded: simplify the recursive type. Use a depth-limited recursion pattern with a counter generic. If the structure genuinely requires deep recursion, report the limit and propose a runtime fallback.
- Dirty baseline: the baseline already has errors unrelated to the target. Scoped check is the defined mode; Done is relative to the scoped baseline, not the full project. Report pre-existing errors separately.
- No tsconfig.json found: block. Report the missing prerequisite. Do not create a `tsconfig.json`; that is the job of typescript-best-practices or the project setup.

## Output

Modified source files, type-test files (positive and `// @ts-expect-error` negative), and a terminal report with baseline count, final count, `any` eliminated, mechanisms applied, and both tsc run statuses (scoped per-edit and full-project final), in that order.
