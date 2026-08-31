---
name: scaffold-cli
description: 'Use when asked to create a complete Node.js 24 TypeScript 7 command-line project with ESM, pnpm 11, tsdown, Biome, Vitest, Changesets, a locked CI workflow, and one observable command test. Not for a Next.js app scaffold — use scaffold-nextjs.'
---

# Scaffold CLI

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Create or scaffold a new TypeScript command-line package. |
| Authority | Reversible local writes inside a new project directory. No remote repository, registry, credential, or publish mutation. |
| Side effect | Creates the project tree, installs dependencies with pnpm, and writes `pnpm-lock.yaml`. |
| Done | `pnpm run check`, `pnpm test`, `pnpm run build`, and one invocation of the built executable pass on Node.js 24; the lockfile is present and CI uses frozen installation. |

## Inputs

- Project name: required, non-empty kebab-case.
- Parent directory: required and writable.
- Description: optional; defaults to `A TypeScript CLI tool.`
- Executable name: optional; defaults to the project name.

## Procedure

1. Validate the name and parent. Stop if the target exists or the parent is not writable. Run `node --version` and require Node.js 24. Run `pnpm --version` and require pnpm 11; record the exact pnpm version for `packageManager`.
2. Create the target directory and initialize Git so every later file removal or rollback is recoverable.
3. Write `package.json` with `type: "module"`, `engines.node: ">=24 <25"`, `packageManager: "pnpm@<observed-version>"`, `bin` mapping the executable to `dist/index.js`, and scripts: `build: tsdown`, `check: biome check . && tsc --noEmit`, `check:fix: biome check --write .`, `test: vitest run`, and `release: changeset publish`. Add development dependencies `@biomejs/biome`, `@changesets/cli`, `@types/node`, `tsdown`, `typescript`, and `vitest`; add no runtime dependency.
4. Write `tsconfig.json` for NodeNext with target and lib `ES2024`. Enable `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `allowUnreachableCode: false`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `isolatedDeclarations`, `declaration`, and `outDir: "dist"`. Include `src/**/*.ts` and exclude `dist`.
5. Write `tsdown.config.ts` with `src/index.ts` as the entry, Node 24 as the platform target, ESM output, declarations, and a clean output directory.
6. Write `biome.json` for Biome 2.5 with formatter, import organization, and recommended linter rules enabled. Keep generated `dist` and coverage output excluded.
7. Write `src/index.ts` with a Node shebang. Use `node:util` `parseArgs` to accept one optional positional name and export a pure `formatGreeting(name: string): string`; `main(args: readonly string[]): number` prints that string and returns zero. Invoke `main(process.argv.slice(2))` only when the module is the process entry point.
8. Write `src/index.test.ts`. Invoke the built command through `node dist/index.js Ada` and assert exit code zero, empty stderr, and stdout `Hello, Ada!`. This test protects the package bin path, build output, argument parsing, and observable result.
9. Write `.changeset/config.json` with the official `@changesets/cli` keys, access `restricted`, base branch `main`, and patch internal dependency updates. Write `.gitignore` for `node_modules/`, `dist/`, `coverage/`, logs, local environment files, and editor output.
10. Write `.github/workflows/ci.yml` for pushes to `main` and pull requests. Pin Node.js 24 and pnpm 11 setup actions by immutable commit SHA. Run `pnpm install --frozen-lockfile`, `pnpm run check`, `pnpm run build`, and `pnpm test`.
11. Run `pnpm install`, then `pnpm run check`, `pnpm run build`, `pnpm test`, and `node dist/index.js Ada`. Confirm the four observable results and that `pnpm-lock.yaml` exists.

## Failure and recovery

- **Target exists:** stop without writing.
- **Wrong runtime or package-manager major:** stop before creating the directory and report both observed versions.
- **Install or verification fails:** keep the target for diagnosis and report the first failing command. Rollback is deletion of this new Git-initialized directory only after the user requests it.
- **Generated command is not executable:** fix the shebang, bin mapping, or file mode and repeat the built-command test; do not claim success from compilation alone.

## Output

A new Node.js 24 TypeScript 7 CLI project with source, one integration test, strict compiler configuration, Biome configuration, tsdown build, Changesets configuration, frozen pnpm lockfile, and CI. Return the created path and the exact outputs of the check, test, build, and built-command invocation.

## Provenance

Origin: odin-current (`skills/scaffold-cli/SKILL.md`). Project-owned; no third-party license applies. Re-derived for the ODIN 2.0 Node.js 24, TypeScript 7, pnpm 11, Biome 2.5, and tsdown toolchain.
