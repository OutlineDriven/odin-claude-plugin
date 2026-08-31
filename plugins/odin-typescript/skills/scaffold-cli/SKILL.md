---
name: scaffold-cli
description: 'Use when asked to create a complete Node.js 24 TypeScript 7 command-line project with ESM, pnpm 11, tsdown, Biome, Vitest, Changesets, a locked CI workflow, and one observable command test. Not for a Next.js app scaffold; use scaffold-nextjs.'
---

# Scaffold CLI

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Create or scaffold a new TypeScript command-line package. |
| Authority | Reversible local writes inside a new project directory. No remote repository, registry, credential, or publish mutation. |
| Side effect | Creates the project tree, installs dependencies with pnpm, and writes `pnpm-lock.yaml`. |
| Done | `pnpm run check`, `pnpm test`, `pnpm run build`, and one invocation of the built executable through the package-manager-resolved bin path all pass on Node.js 24; the lockfile is present and CI uses frozen installation. |

## Inputs

- Project name: required, non-empty kebab-case.
- Parent directory: required and writable.
- Description: optional; defaults to `A TypeScript CLI tool.`
- Executable name: optional; defaults to the project name.

## Procedure

1. **Validate name, parent, Node 24, and pnpm 11.** Stop if the target exists or the parent is not writable. Run `node --version` and require Node.js 24 (major version 24). Run `pnpm --version` and require pnpm 11 (major version 11); record the exact pnpm version for `packageManager`. Run `pnpm exec tsc --version` after install to confirm TypeScript 7 (major version 7). Done when: name, parent, Node major, and pnpm major are validated.

2. **Create the project directory and initialize Git.** Create the target directory and run `git init` so every later file removal or rollback is recoverable. Done when: the directory exists and Git is initialized.

3. **Write the project tree with pinned dependency versions and immutable CI action SHAs.** Write the following files:

   - `package.json` with `type: "module"`, `engines.node: ">=24 <25"`, `packageManager: "pnpm@<observed-version>"`, `bin` mapping the executable to `dist/index.js`, and scripts: `build: tsdown`, `check: biome check . && tsc --noEmit`, `check:fix: biome check --write .`, `test: vitest run`, `release: changeset publish`. Pin development dependencies to exact current versions: `@biomejs/biome`, `@changesets/cli`, `@types/node`, `tsdown`, `typescript` (pinned to `^7`), and `vitest`. Add no runtime dependency.
   - `tsconfig.json` for NodeNext with target and lib `ES2024`. Enable `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `allowUnreachableCode: false`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `isolatedDeclarations`, `declaration`, and `outDir: "dist"`. Include `src/**/*.ts` and exclude `dist`.
   - `tsdown.config.ts` with `src/index.ts` as the entry, Node 24 as the platform target, ESM output, declarations, and a clean output directory.
   - `biome.json` for Biome 2.5 with formatter, import organization, and recommended linter rules enabled. Exclude `dist` and coverage output.
   - `src/index.ts` with a Node shebang. Use `node:util` `parseArgs` to accept one optional positional name and export a pure `formatGreeting(name: string): string`; `main(args: readonly string[]): number` prints that string and returns zero. Invoke `main(process.argv.slice(2))` only when the module is the process entry point.
   - `src/index.test.ts`. Invoke the built command through the package-manager-resolved bin path (`pnpm exec <executable-name> Ada` or `npx <executable-name> Ada`) and assert exit code zero, empty stderr, and stdout `Hello, Ada!`. This test protects the package bin link, build output, argument parsing, and observable result. Do not invoke `node dist/index.js` directly; the test must prove the bin link works.
   - `.changeset/config.json` with the official `@changesets/cli` keys, access `restricted`, base branch `main`, and patch internal dependency updates.
   - `.gitignore` for `node_modules/`, `dist/`, `coverage/`, logs, local environment files, and editor output.
   - `.github/workflows/ci.yml` for pushes to `main` and pull requests. Pin the Node.js 24 and pnpm 11 setup actions by immutable commit SHA (not floating tag). Run `pnpm install --frozen-lockfile`, `pnpm run check`, `pnpm run build`, and `pnpm test`.

   Done when: all files are written with pinned dependency versions and immutable CI action SHAs.

4. **Run install, check, build, and test.** Run `pnpm install`, then `pnpm run check`, `pnpm run build`, and `pnpm test`. Confirm `pnpm exec tsc --version` reports TypeScript 7. Confirm `pnpm-lock.yaml` exists. Done when: install, check, build, and test all pass and the lockfile is present.

5. **Invoke the built executable through the package-manager-resolved bin path and confirm the lockfile and frozen-install CI.** Run `pnpm exec <executable-name> Ada` (or `npx <executable-name> Ada`) and confirm exit code zero and stdout `Hello, Ada!`. Confirm the CI workflow uses `pnpm install --frozen-lockfile` and the action SHAs are immutable. Done when: the built executable invocation passes through the bin path, the lockfile is present, and CI uses frozen installation with pinned actions.

## Failure and recovery

- Target exists: stop without writing.
- Wrong runtime or package-manager major: stop before creating the directory and report both observed versions.
- Install or verification fails: keep the target for diagnosis and report the first failing command. Rollback is deletion of this new Git-initialized directory only after the user requests it.
- Generated command is not executable: fix the shebang, bin mapping, or file mode and repeat the built-command test through the bin path; do not claim success from compilation alone.

## Output

A new Node.js 24 TypeScript 7 CLI project with source, one integration test, strict compiler configuration, Biome configuration, tsdown build, Changesets configuration, frozen pnpm lockfile, and CI with pinned actions. Return the created path and the exact outputs of the check, test, build, and built-executable invocation through the bin path.
