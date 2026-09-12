---
name: scaffold-nextjs
description: 'Use when asked to scaffold a Next.js turborepo, Vercel app, or Node.js 24 TypeScript 7 CLI project, including scaffold-cli mode. Not for course exercises: use scaffold-exercises.'
---

# Scaffold Next.js or CLI projects

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Scaffold a Next.js turborepo, Vercel app, or a complete Node.js 24 TypeScript 7 command-line package. |
| Authority | Reversible local: Next.js mode runs `git init` followed by an initial empty commit before generation; `scaffold-cli` mode creates a new target and runs `git init` before writing files. Writes stay inside the named project directory. Rollback is resetting to the Next.js initial commit, or deleting the new CLI directory only after the user requests it. No remote repository, registry, credential, publish, deployment, or launch mutation. |
| Side effect | Next.js mode scaffolds and verifies a local Next.js turborepo, then stops before deployment or launch. `scaffold-cli` mode scaffolds and verifies a local Node.js 24 TypeScript 7 CLI package, installs dependencies, writes its lockfile, and invokes its built executable through the package-manager-resolved bin path. |
| Done | Next.js mode passes root `pnpm install --frozen-lockfile`, `pnpm run build`, `pnpm run check-types`, and lint or format check, with no unresolved template variables or unchosen product dependency. `scaffold-cli` mode passes `pnpm run check`, `pnpm test`, `pnpm run build`, and one built-executable invocation through the package-manager-resolved bin path on Node.js 24, with a lockfile and frozen-install CI. |

## Inputs

| Variable | Required | Default |
|---|---|---|
| `mode` | Yes | none (`nextjs` or `scaffold-cli`) |
| `name` | Yes | none; CLI names must be non-empty kebab-case |
| Parent directory | Yes for `scaffold-cli`; parent of `name` for Next.js | current named parent when supplied |
| UI registry overlay | No for Next.js | none (user chooses explicitly) |
| Dev tooling overlay | No for Next.js | none (user chooses explicitly) |
| CLI project description | No for `scaffold-cli` | `A TypeScript CLI tool.` |
| CLI executable name | No for `scaffold-cli` | project `name` |

Select `mode` from an explicit request and ask when it is ambiguous. Ask only for missing values. Do not infer overlay choices or install product-specific dependencies the user did not choose.

## Procedure

1. **Select the mode, validate its inputs, and establish the rollback boundary.** For `nextjs`, collect the project `name`, UI registry choice, and dev tooling choice; require the target not to exist; run `pnpm --version` and require pnpm 11 before creating anything; create `{{name}}/`; and run `git init` followed by an initial empty commit before generation. For `scaffold-cli`, require a non-empty kebab-case name, a writable parent, and a target that does not exist; run `node --version` and require Node.js 24, run `pnpm --version` and require pnpm 11, record the exact pnpm version for `packageManager`, create the target directory, and run `git init` before writing files. Done when: the selected mode and required values are recorded, the selected target is absent before creation, the runtime prerequisites for the selected mode are validated, and the new directory has the correct Git rollback boundary.

2. **Generate the selected project.** Branch before running any generation command. In `scaffold-cli` mode, skip the Next.js commands in this step and write the CLI project tree below. In `nextjs` mode, from the parent of `{{name}}`, run:

   ```bash
   pnpm dlx create-next-app@latest {{name}} --typescript --tailwind --biome --react-compiler --app --no-src-dir --import-alias "@/*" --use-pnpm
   ```

   Set `--no-src-dir`; adding `src/` later breaks the `@/*` alias and every shadcn component path. Verify the app starts:

   ```bash
   cd {{name}} && pnpm run dev
   ```

   Confirm the app loads at `http://localhost:3000`, then stop the dev server. Done when: in `nextjs` mode the app is generated, the dev-server smoke check passes, and the server is stopped.

   In `scaffold-cli` mode, write the project tree with pinned configuration: `package.json` uses the project `name`, the supplied or default project description, `type: "module"`, `engines.node: ">=24 <25"`, the observed `packageManager`, a `bin` mapping under the supplied or default executable name to `dist/index.js`, scripts for `build: tsdown`, `check: biome check . && tsc --noEmit`, `check:fix: biome check --write .`, `test: vitest run`, and `release: changeset publish`, exact current versions of `@biomejs/biome`, `@changesets/cli`, `@types/node`, `tsdown`, `typescript` pinned to `^7`, and `vitest`, with no runtime dependency. Write a NodeNext `tsconfig.json` with `target` and `lib` set to `ES2024`, `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `allowUnreachableCode: false`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `isolatedDeclarations`, `declaration`, and `outDir: "dist"`, including `src/**/*.ts` and excluding `dist`. Write `tsdown.config.ts` for `src/index.ts`, Node 24, ESM, declarations, and a clean output directory; `biome.json` for Biome 2.5 with formatter, import organization, recommended lint rules, and `dist` and coverage exclusions; `src/index.ts` with a Node shebang, `node:util` `parseArgs`, one optional positional name, pure `formatGreeting(name: string): string`, and `main(args: readonly string[]): number` that prints the greeting and returns zero; invoke `main(process.argv.slice(2))` only when the module is the process entry point. Write `src/index.test.ts` that invokes the built command through the package-manager-resolved bin path and asserts exit code zero, empty stderr, and `Hello, Ada!` on stdout rather than invoking `node dist/index.js` directly. Also write `.changeset/config.json` with official Changesets keys, restricted access, main base branch, and patch internal updates; `.gitignore` for `node_modules/`, `dist/`, `coverage/`, logs, local environment files, and editor output; and `.github/workflows/ci.yml` for main pushes and pull requests, with immutable Node 24 and pnpm 11 action SHAs, frozen installation, check, build, and test. Done when: in `scaffold-cli` mode every required file and configuration is written with the pinned behavior.

3. **Apply mode-specific upgrades and install dependencies.** In `nextjs` mode, if the user chose Next config flags, replace `next.config.ts` with the requested configuration (for example `cacheComponents: true`, `partialPrefetching: true`, and `reactCompiler: true`); `partialPrefetching` requires `cacheComponents`, and each change must pass `pnpm run build` or `pnpm run check-types`. Install a chosen UI registry with `pnpm dlx shadcn@latest init` and any requested components, or install and configure chosen Agentation or Ultracite tooling; install no unchosen overlay. If the user chose a TypeScript upgrade, run `pnpm add --save-dev typescript@^7`, verify `pnpm exec tsc --version` reports 7.x, and run `pnpm run build`. In `scaffold-cli` mode, run `pnpm install`, then `pnpm exec tsc --version` and require TypeScript 7; confirm `pnpm-lock.yaml` exists. Done when: every chosen Next.js upgrade is verified, or CLI dependencies are installed with TypeScript 7 and a lockfile.

4. **Finalize the selected project shape and run its build checks.** In `nextjs` mode, confirm `{{name}}/pnpm-lock.yaml` exists from the `create-next-app --use-pnpm` install and require the temporary `{{name}}-turbo/` path not to exist; if either precondition fails, stop and report it before moving anything. Then convert the app to a Turborepo by moving it while preserving the Git boundary and relocating the lockfile to the workspace root:

   ```bash
   mkdir -p {{name}}-turbo/apps
   mv {{name}}/.git {{name}}-turbo/.git
   mv {{name}} {{name}}-turbo/apps/web
   mv {{name}}-turbo {{name}}
   mv {{name}}/apps/web/pnpm-lock.yaml {{name}}/pnpm-lock.yaml
   ```

   Moving `.git` before the app keeps the initial commit at the final project root; moving `pnpm-lock.yaml` after the app move seeds the workspace lockfile. Never create `apps/web/` by hand; hand-building skips create-next-app defaults. From the resulting root, require pnpm 11 and record the version, then create `package.json` with `workspaces: ["apps/*"]`, the observed `packageManager`, root `turbo` (and chosen `ultracite`) development dependencies, and `build`, `dev`, `lint`, `check-types`, `check`, and `fix` scripts; keep application dependencies in `apps/web/package.json`, not the root. The package field preserves the cross-tool workspace contract; create `pnpm-workspace.yaml` with `packages: ["apps/*"]` as pnpm's workspace discovery file. Create `turbo.json` with `build`, `dev`, `lint`, `format`, and `check-types` tasks, create a root `.gitignore` for `node_modules`, `.next`, `dist`, `.turbo`, `.vercel`, and editor output, update `apps/web/package.json` with `dev: next dev`, `build: next build`, `start: next start`, `check-types: tsc --noEmit`, and matching lint or format scripts, run `pnpm install` at the workspace root to regenerate `pnpm-lock.yaml` with the root importer, `turbo`, and `apps/web` workspace dependencies before the later frozen-install gate, and sweep JSON, TypeScript, TSX, and Markdown files for unresolved `{{` variables. In `scaffold-cli` mode, run `pnpm run check`, `pnpm run build`, and `pnpm test`. Done when: the Next.js app is at `apps/web/`, the final root contains `.git`, `pnpm-workspace.yaml`, and a regenerated root `pnpm-lock.yaml` covering the root and app importers, its root and app task configuration is complete and placeholder-free, or all CLI check, build, and test commands pass.

5. **Run final gates and prove the observable result.** In `nextjs` mode, from the project root run `pnpm install --frozen-lockfile`, `pnpm run build`, `pnpm run check-types`, and the lint or format check (for example `pnpm run check`); record the exact outputs and require all four to pass. In `scaffold-cli` mode, invoke the built executable through the package-manager-resolved bin path with `Ada` using `pnpm exec <executable-name> Ada` or `npx <executable-name> Ada`; require exit code zero, empty stderr, and `Hello, Ada!` on stdout. Confirm the CLI lockfile is present, CI uses `pnpm install --frozen-lockfile`, and its action SHAs are immutable. Done when: every gate for the selected mode has run and passed, and its required result is observed through the real command path.

## Failure and recovery

- Ambiguous mode or missing required input: ask only for the missing value and do not write a project.
- Next.js generation or network failure: report the error verbatim, do not retry with different flags unless the message requests it, and do not scaffold by hand. Roll back through the initial Git commit, then remove generated and ignored files with `git clean -fdx` inside this new target, or delete the new directory only after the user requests it.
- `scaffold-cli` target exists: stop before writing. A wrong Node or pnpm major: stop before creating the directory and report both observed versions. Install or verification failure: keep the target for diagnosis and report the first failing command. Delete the target only after the user requests rollback.
- Any verification gate failure: stop, report the observed failure, and leave the tree for the user or roll back through its Git boundary; do not claim success from an unrun gate.
- `scaffold-cli` generated command is not executable: fix the shebang, bin mapping, or file mode and repeat the built-command test through the bin path; compilation alone is insufficient.
- TypeScript 7 installation fails or `tsc` reports errors: report the first diagnostic. A type error in a file `next build` used to skip now blocks the build; fixing it is the user's responsibility before continuing.

## Output

For `nextjs`, return the `{{name}}/` root containing `apps/web/`, a root workspace package with turbo, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, and a regenerated frozen pnpm lockfile with root and app importers, plus TypeScript, Tailwind, React Compiler, and only the overlays the user chose. For `scaffold-cli`, return the created CLI project path and the exact outputs of `pnpm run check`, `pnpm run build`, `pnpm test`, and the built-executable bin-path invocation, along with its source, one bin-path integration test, strict compiler and Biome configuration, tsdown build, Changesets configuration, frozen pnpm lockfile, and CI with pinned actions. No GitHub repository, Vercel deployment, production launch, or pre-launch checklist is included. Done is satisfied only when the selected mode's gates and observable result above pass with no unresolved template variables or unchosen product-specific dependency.
