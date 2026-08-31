---
name: typescript-best-practices
description: 'Use when TypeScript source must be shaped proactively toward narrow types, discriminated unions, readonly fields, exhaustive variants, typed trust boundaries, correct module resolution, and the TypeScript 7 strict-flag baseline. Not for concrete error repair; use typescript-type-hardening; not for language-agnostic domain modeling; use type-driven.'
---

# TypeScript best practices

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A proactive shaping pass on TypeScript source: narrow types, discriminated unions, readonly fields, exhaustive variants, typed trust boundaries, module resolution, TypeScript 7 strict flags. Not a concrete error report (routes to typescript-type-hardening) and not language-agnostic domain modeling (routes to type-driven). |
| Authority | Reversible-local writes covering named TypeScript source files and the named `tsconfig.json`; rollback via VCS. No invented strict flags, no universal branded-type or `as` bans, no unvalidated external shapes. |
| Side effect | Shapes TypeScript source and tsconfig. |
| Done | `tsc --noEmit` passes with no `any`, `!`, or double-assertion introduced: illegal states unrepresentable, variants exhaustive, boundaries validated. |

## Inputs

The in-scope TypeScript source files and the target `tsconfig.json`. Scope must name a proactive shaping pass, not a concrete error report (which routes to typescript-type-hardening) nor language-agnostic domain modeling (which routes to type-driven).

## Refusals

- Will not introduce `any`, `!` non-null assertions, or `as unknown as` double-assertions.
- Will not invent strict flags beyond the named TypeScript 7 set.
- Will not universally ban branded types or `as`; use them where the invariant is real or narrowing is insufficient.
- Will not ship unvalidated external shapes without a validating boundary.

## Procedure

1. **Read in-scope files.** Read every TypeScript file named in the scope. Done when: all in-scope files are read.

2. **Verify or apply the TypeScript 7 strict-flag set in tsconfig.json.** Check the project `tsconfig.json` for the full strict set: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `allowUnreachableCode: false`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `isolatedDeclarations`. Apply any that are missing. Use only these flags; do not invent additional strict flags. Done when: the strict-flag set is verified or applied in `tsconfig.json`.

3. **Shape types.** For each type: keep `unknown` only while it is genuinely opaque and narrow it at trust boundaries using narrowing, type predicates, or explicit casts where TypeScript narrowing is available. Do not universally ban branded types; use opaque types for domain identity where the invariant they model is real and enforced. Use `as` only where TypeScript narrowing is insufficient, and state the reason. Design discriminated unions for state machines and mutually exclusive variants. Add `readonly` to properties that must not be reassigned. Done when: every type is narrowed, discriminated where applicable, and readonly where required.

4. **Put a validating parser on every trust boundary and set module resolution.** Validate untrusted external input at trust boundaries using Zod 4, Valibot, or ArkType through the Standard Schema interface. Do not widen or re-export unvalidated external shapes without a validating boundary. Set module resolution to `NodeNext` for Node.js targets and `ESNext` with a bundler for SPAs. Done when: every trust boundary has a validating parser and module resolution matches the target runtime.

5. **Prove the result by running tsc --noEmit.** Run `tsc --noEmit` and confirm it passes. Verify that no `any`, `!`, or `as unknown as` double-assertion was introduced by the shaping pass. Verify exhaustiveness on discriminated unions using the compiler's exhaustive switch and match checks; if the language lacks built-in exhaustiveness, add a final otherwise-branch that narrows the unknown variant to `never`. Done when: `tsc --noEmit` passes with no `any`, `!`, or double-assertion introduced, and every discriminated union is exhaustively checked.

## Failure and recovery

| Failure class | Recovery |
|---|---|
| Cannot narrow an unknown | Report the un-narrowable type and stop. Do not widen scope or add a placeholder cast. |
| Domain lacks a discriminant | Propose a discriminant field or tag; stop if the domain does not support it. Do not force a discriminated union where the domain does not fit. |
| Validation library unavailable | State the missing library constraint and stop. Do not ship unvalidated external shapes. |
| Missing tsconfig strict flags | Apply only the named flags in step 2. VCS rollback. |

## Output

Modified source and `tsconfig.json` files with a clean `tsc --noEmit` run as the objective Done proof: illegal states unrepresentable, variants exhaustive, boundaries validated. No invented strict flags, no universal branded-type or `as` bans.
