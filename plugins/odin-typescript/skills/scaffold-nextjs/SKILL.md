---
name: scaffold-nextjs
description: 'Use when asked to scaffold a Next.js turborepo end to end and verify it. Produces a working local turborepo with verified app setup, turbo configuration, and passing root gates. Deployment and launch are deferred to a human. Not for a CLI scaffold; use scaffold-cli; for course exercises; use scaffold-exercises.'
---

# Scaffold Next.js

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Scaffold Next.js, Next.js turborepo, Vercel app, Next.js app with turborepo. |
| Authority | Reversible-local: runs `git init` and makes an initial commit before any generation so the rollback boundary is real. Writes stay inside the named project directory. No remote mutation. |
| Side effect | Scaffolds and verifies a working local Next.js turborepo, then stops before deployment or launch. |
| Done | A turborepo at `{{name}}/` whose root `pnpm install --frozen-lockfile`, `pnpm run build`, `pnpm run check-types`, and lint or format check have all been run and passed, with no unresolved template variables and no product-specific dependency the user did not choose. |

## Inputs

| Variable | Required | Default |
|---|---|---|
| `name` | Yes | none |
| UI registry overlay | No | none (user chooses explicitly) |
| Dev tooling overlay | No | none (user chooses explicitly) |

Ask only for what is missing. Do not infer values. Do not install product-specific dependencies the user did not choose.

## Procedure

1. **Gather name and overlay choices, then git init an empty worktree root.** Collect the project `name` from the user. Ask whether to install a UI component registry (e.g., shadcn or Blode) and dev tooling (e.g., Agentation, Ultracite). These are explicit user choices; do not install any overlay by default. Create the project directory `{{name}}/` and run `git init` followed by an initial empty commit so the rollback boundary exists before any generation. Done when: the name is collected, overlay choices are recorded, and the directory has a Git history with one initial commit.

2. **Generate the app with create-next-app, smoke-check, then stop the dev server.** From the parent of `{{name}}`, run:

   ```bash
   pnpm dlx create-next-app@latest {{name}} --typescript --tailwind --biome --react-compiler --app --no-src-dir --import-alias "@/*" --use-pnpm
   ```

   Set `--no-src-dir`; adding `src/` later breaks the `@/*` alias and every shadcn component path. Verify the app starts:

   ```bash
   cd {{name}} && pnpm run dev
   ```

   Confirm the app loads at `http://localhost:3000`. Then stop the dev server before continuing. Do not leave the dev server running. If the user chose a TypeScript upgrade, run `pnpm add --save-dev typescript@^7` and verify `pnpm exec tsc --version` reports 7.x and `pnpm run build` succeeds. Done when: the app is generated, the dev server smoke-check passes, the dev server is stopped, and any TypeScript upgrade is verified.

3. **Apply verified config upgrades.** If the user chose Next config flags, replace `next.config.ts` with the desired configuration (e.g., `cacheComponents: true`, `partialPrefetching: true`, `reactCompiler: true`). `partialPrefetching` requires `cacheComponents`; they ship together or not at all. Validate each config upgrade with a build or type-check gate: run `pnpm run build` or `pnpm run check-types` after each change. If the user chose a UI registry overlay, install it now (e.g., `pnpm dlx shadcn@latest init` then `pnpm dlx shadcn@latest add button`). If the user chose dev tooling overlays (Agentation, Ultracite), install and configure them now. Do not install any overlay the user did not choose. Done when: each config upgrade is applied and verified with a build or type-check gate, and each chosen overlay is installed and configured.

4. **Convert to Turborepo.** Move the app into `apps/web/`:

   ```bash
   mkdir -p {{name}}-turbo/apps
   mv {{name}} {{name}}-turbo/apps/web
   mv {{name}}-turbo {{name}}
   ```

   The app is now at `{{name}}/apps/web/`. Never create `apps/web/` by hand; hand-building skips create-next-app defaults. Run `pnpm --version`, require major 11, record the exact output, then create `{{name}}/package.json` with `workspaces: ["apps/*"]`, `packageManager: "pnpm@<version>"`, root devDependencies (`turbo`, plus `ultracite` if chosen), and scripts (`build`, `dev`, `lint`, `check-types`, `check`, `fix` delegating to turbo or the chosen tooling). No app dependencies in the root `package.json`. Create `{{name}}/turbo.json` with the task graph for `build`, `dev`, `lint`, `format`, `check-types`. Create `{{name}}/.gitignore` covering `node_modules`, `.next`, `dist`, `.turbo`, `.vercel`, and editor output. Update `apps/web/package.json` scripts to `dev: next dev`, `build: next build`, `start: next start`, `check-types: tsc --noEmit`, and lint or format scripts matching the chosen tooling. Run a placeholder sweep: `grep -rn '{{' --include='*.json' --include='*.ts' --include='*.tsx' --include='*.md' .` and resolve any unresolved template variables. Done when: the app is moved to `apps/web/`, root `package.json` and `turbo.json` exist, `.gitignore` is written, `apps/web` scripts are updated, and the placeholder sweep finds nothing.

5. **Final gates executed, not just named.** From the project root, run `pnpm install --frozen-lockfile`, `pnpm run build`, `pnpm run check-types`, and the lint or format check (e.g., `pnpm run check`). All four must pass before Done. If any gate fails, stop, report the failure, and leave the tree for the user or roll back via the git boundary. Do not declare Done on gates that were not run. Done when: all four gates pass with their exact outputs recorded.

## Failure and recovery

- Generation or network failure: `create-next-app` fails or the network is unavailable. Report the error verbatim. Do not retry with different flags unless the failure message explicitly requests it. Do not scaffold by hand. Roll back via the git boundary: `git reset --hard` to the initial commit, or delete the directory.
- Any verification gate failure: stop. Report the observed failure. Do not proceed on a partial result. Leave the tree for the user or roll back via the git boundary.
- Partial stop: the tree is always behind the git boundary (the initial commit), so rollback is one command: `git reset --hard` to the initial commit, or delete the directory.
- TypeScript 7 install fails or tsc reports errors: report the first diagnostic. A type error in a file `next build` used to skip now blocks the build; fixing it is the user's responsibility before continuing.

## Output

The scaffold contains:
- `{{name}}/` project root directory
- `{{name}}/apps/web/` Next.js application with TypeScript, Tailwind CSS, React Compiler, and any user-chosen overlays
- `{{name}}/package.json` root workspace package with turbo
- `{{name}}/turbo.json` turborepo task graph
- `{{name}}/.gitignore` root gitignore
- A frozen pnpm lockfile with all workspace dependencies installed

No GitHub repo, no Vercel deployment, no pre-launch checklist. Done is satisfied when `pnpm install --frozen-lockfile`, `pnpm run build`, `pnpm run check-types`, and lint or format check all pass from the root, with no unresolved template variables and no product-specific dependency the user did not choose.
