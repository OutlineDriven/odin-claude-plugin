---
name: typescript-best-practices
description: 'Shape TypeScript code toward narrow types, discriminated unions, readonly fields, exhaustive variants, and typed boundaries using TypeScript 7 doctrine. Not for language-agnostic type design — use type-driven; not for remote, credential, publish, deploy, or irreversible changes.'
---

# TypeScript best practices

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Read or edit TypeScript. |
| Authority | Reversible local: write only named TypeScript source files; rollback via VCS. |
| Side effect | Shapes code changes to TypeScript source. |
| Done | Illegal states unrepresentable and exhaustive variants enforced. |

## Inputs

The TypeScript source files in scope. The target tsconfig.json if present.

## Refusals

- Will not introduce `any`, `!` non-null assertions, or `as unknown as` double-assertions.
- Will not invent strict flags beyond the named TypeScript 7 set.
- Will not universally ban branded types or `as` — use them where the invariant is real or narrowing is insufficient.
- Will not ship unvalidated external shapes without a validating boundary.

## Procedure

1. Read the TypeScript files in scope. **Done when:** all in-scope files are read.
2. Verify the project tsconfig.json has the TypeScript 7 strict flag set. Apply the full strict set if absent: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `allowUnreachableCode: false`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `isolatedDeclarations`. Use only these flags; do not invent additional strict flags. **Done when:** the strict flag set is verified or applied.
3. For each type: keep `unknown` only while it is genuinely opaque — narrow it at trust boundaries using narrowing, type predicates, or explicit casts where TypeScript narrowing is available. Do not universally ban branded types — use opaque types for domain identity where the invariant they model is real and enforced. Use `as` only where TypeScript narrowing is insufficient, and state the reason. Design discriminated unions for state machines and mutually exclusive variants. Add `readonly` to properties that must not be reassigned. **Done when:** every type is narrowed, discriminated where applicable, and readonly where required.
4. Validate untrusted external input at trust boundaries using Zod 4, Valibot, or ArkType through the Standard Schema interface. Do not widen or re-export unvalidated external shapes without a validating boundary. **Done when:** every trust boundary has a validating parser.
5. Verify that exhaustiveness is enforced on discriminated unions using the compiler's exhaustive switch and match checks. If the language lacks built-in exhaustiveness, add a final otherwise-branch that narrows the unknown variant to `never`. **Done when:** every discriminated union is exhaustively checked.
6. For module resolution: use `NodeNext` for Node.js targets and `ESNext` with a bundler for SPAs. **Done when:** module resolution matches the target runtime.
7. Replace `any` with a typed equivalent, `!` with explicit narrowing, and `as unknown as` double-assertions with a typed narrowing chain. **Done when:** no `any`, `!`, or double-assertion remains.

## Failure and recovery

| Failure class | Partial-result rule | Recovery |
|---|---|---|
| Missing tsconfig strict flags | Apply only the named flags in step 2 | VCS rollback |
| Cannot narrow unknown | Report the un-narrowable type and stop | Do not widen scope or add a placeholder cast |
| No discriminant for variant types | Propose a discriminant field or tag; stop if the domain does not support it | Do not force a discriminated union where the domain does not fit |
| External validation unavailable | State the missing library constraint and stop | Do not ship unvalidated external shapes |

## Output

TypeScript source files with narrowed types, discriminated unions, readonly fields, exhaustive variant checks, and validated trust boundaries — no invented strict flags, no universal branded-type or `as` bans.

## Provenance

Origin: cursor/plugins | Revision: 68836ddaf5697224520f1847d90cdb90ca8babaa | License: MIT | Adaptation from pstack/typescript-best-practices (Lauren Tan/poteto). Clean-room adaptation: frontmatter normalized to ODIN 2.0 schema, trigger/authority/end-state translated to ODIN 2.0 contract table, procedures bound to TypeScript 7 doctrine flags, universal `as` and branded-type bans removed per doctrine, external validation through Standard Schema named.
