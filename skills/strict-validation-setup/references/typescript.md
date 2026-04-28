# TypeScript strict-mode bootstrap (2026)

## tsconfig.json

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2024",
    "lib": ["ES2024", "DOM"],
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": false
  }
}
```

TypeScript 6.0+ defaults to `strict: true`; the additional flags above harden array/index access, optional-property semantics, and override-keyword discipline. `skipLibCheck: false` is intentional — type-check upstream `.d.ts` files to catch upstream regressions.

## biome.json

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": { "noUselessStringConcat": "error" },
      "correctness": { "noUndeclaredVariables": "error" },
      "style": { "useImportType": "error" },
      "suspicious": { "noExplicitAny": "error" }
    }
  },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2 }
}
```

Biome replaces ESLint + Prettier in the 2026 idiom for new projects. `noExplicitAny: error` rejects `any` at the lint layer; `unknown` is intentionally still allowed (it is the safe escape hatch for boundary-typed input that is then narrowed) — if a project wants to forbid `unknown` outright it needs a separate ast-grep rule or `tsc` plugin, since neither Biome nor `tsc` ships a built-in `noExplicitUnknown`.

## Schema validators at IO boundaries

```ts
import { z } from "zod";

const RequestSchema = z.object({
  userId: z.string().uuid(),
  payload: z.record(z.string(), z.unknown()),
}).strict();

type Request = z.infer<typeof RequestSchema>;

export const parseRequest = (input: unknown): Request =>
  RequestSchema.parse(input);
```

Zod `.strict()` rejects unknown keys at IO boundaries. Use `z.infer` to derive the TypeScript type — single source of truth.

## Notes

- React-specific strict-mode wiring (RSC error boundaries, suspense defaults) is its own framework reference; not bundled in this commit.
- Nest-specific DTO + class-validator integration is its own framework reference; not bundled in this commit.
- Vitest test-side strict config (typecheck-on-test, exact-snapshot match) defers to `vitest-testing` skill.
