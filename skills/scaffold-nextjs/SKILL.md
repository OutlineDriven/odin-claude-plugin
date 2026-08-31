---
name: scaffold-nextjs
description: 'Use when asked to scaffold Next.js turborepo end to end. Trigger: scaffold Next.js, Next.js turborepo, Vercel app, Next.js app with turborepo. Outcome: a working local Next.js turborepo exists with verified app setup and turbo configuration; deployment and launch are deferred to a human. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Scaffold Next.js

## Contract

| Field | Bound contract |
|---|---|
| Trigger | scaffold Next.js, Next.js turborepo, Vercel app, Next.js app with turborepo |
| Authority | reversible-local: write only named local scaffolding artifacts; git init is the rollback boundary |
| Side effect | Scaffolds and verifies a working local Next.js turborepo with app setup and turbo configuration, then stops before deployment or launch; a human performs any deployment or publication |
| Done | A working local Next.js turborepo exists with verified app setup and turbo configuration; deployment and launch steps are prepared for a human but not executed |

## Inputs

| Variable | Required | Default |
|---|---|---|
| `name` | Yes | — |
| `description` | Yes | — |
| `repo` | Yes | — |
| `domain` | Ask if missing | — |
| `author` | Yes | — |
| `year` | No | current year |

Ask only for what is missing. Do not infer values.

## Procedure

1. **Phase 1: Gather project info.**
   Collect `name`, `description`, `repo`, `domain`, `author`, and `year` from the user.

2. **Phase 2: Create Next.js app.**
   From the parent of `{{name}}`, run:

   ```bash
   pnpm dlx create-next-app@latest {{name}} --typescript --tailwind --biome --react-compiler --app --no-src-dir --import-alias "@/*" --use-pnpm
   ```

   Set `--no-src-dir`. Adding `src/` later breaks the `@/*` alias and every shadcn component path.

   Verify:

   ```bash
   cd {{name}} && pnpm run dev
   ```

   Confirm the app loads at `http://localhost:3000` before continuing.

3. **Phase 2.1: Upgrade to TypeScript 7.**

   ```bash
   pnpm add --save-dev typescript@^7
   ```

   Verify:

   ```bash
   pnpm exec tsc --version   # 7.x
   pnpm run build      # type check succeeds
   ```

   Never set `experimental.useTypeScriptCli`. Since Next.js 16.3 the CLI checker is the default; the flag exists only to switch it off. Setting it to `true` is noise.

4. **Phase 2.2: Turn on Instant Navigations.**

   Replace `next.config.ts` with:

   ```typescript
   import type { NextConfig } from "next";

   const nextConfig: NextConfig = {
     cacheComponents: true,
     partialPrefetching: true,
     reactCompiler: true,
     experimental: {
       turbopackRustReactCompiler: true,
     },
   };

   export default nextConfig;
   ```

  `partialPrefetching` requires `cacheComponents`; they ship together or not at all. Validate in `next dev`: instant navigation insights are development-only and never fail `next build`.

5. **Phase 3: Install Blode UI components.**

   ```bash
   pnpm dlx shadcn@latest init
   pnpm dlx shadcn@latest registry add @blode=https://blode.co/ui/r/{name}.json
   pnpm dlx shadcn@latest add @blode/button
   ```

   Order matters: `registry add` must run before any `add @blode/...` call, or the namespace is unknown and the add fails.

   Use `blode-icons-react` for all icon imports. If any generated file imports `lucide-react`, replace the import paths with `blode-icons-react`.

6. **Phase 4: Install Agentation.**

   ```bash
   pnpm add agentation
   ```

   Patch `app/layout.tsx`: add `import { Agentation } from "agentation";` at the top, and render `{process.env.NODE_ENV === "development" && <Agentation />}` before `</body>`.

7. **Phase 5: Install Ultracite.**

   a. Delete Biome placeholder:

   ```bash
   rm biome.json
   pnpm remove @biomejs/biome
   ```

   b. Init Ultracite (Oxlint + Oxfmt + Lefthook):

   ```bash
   pnpm dlx ultracite@latest init \
     --linter oxlint \
     --frameworks next react \
     --integrations lefthook \
     --pm pnpm \
     --skip-install \
     --quiet
   ```

   `--frameworks` takes space-separated values; commas fail validation.

   c. Install and verify:

   ```bash
   pnpm install --frozen-lockfile
   pnpm exec ultracite fix
   pnpm exec ultracite check
   ```

   Both pass with zero errors. Use `pnpm exec ultracite fix` / `pnpm exec ultracite check` (or root `pnpm run fix` / `pnpm run check`), not bare `oxlint` or `oxfmt`; config resolution must match the lefthook.

   Add `--no-error-on-unmatched-pattern` to the generated `lefthook.yml` job so a dependency bump or CSS-only commit does not fail the hook outright. Ultracite passes unknown options through to the linter.

   Never run `oxlint` or `oxfmt` ad hoc; use the wrapper commands above.

8. **Phase 6: Convert to Turborepo.**

   a. Move the app into `apps/web/`:

   ```bash
   mkdir -p {{name}}-turbo/apps
   mv {{name}} {{name}}-turbo/apps/web
   mv {{name}}-turbo {{name}}
   ```

   The app is now at `{{name}}/apps/web/`. Never create `apps/web/` by hand; hand-building skips create-next-app defaults (Tailwind wiring, alias config).

   b. Run `pnpm --version`, require major 11, record the exact output as `{{pnpm_version}}`, then create `{{name}}/package.json`:

   ```json
   {
     "name": "{{name}}",
     "private": true,
     "packageManager": "pnpm@{{pnpm_version}}",
     "workspaces": ["apps/*"],
     "scripts": {
       "build": "turbo build",
       "dev": "turbo dev",
       "lint": "turbo lint",
       "lint:fix": "turbo lint:fix",
       "format": "turbo format",
       "format:check": "turbo format:check",
       "check-types": "turbo check-types",
       "check": "ultracite check",
       "fix": "ultracite fix"
     },
     "devDependencies": {
       "turbo": "^2",
       "ultracite": "^7.1.5"
     }
   }
   ```

   No app dependencies in the root `package.json`; root holds only `turbo` and `ultracite`. App dependencies break workspace isolation and turbo cache keys.

   c. Create `{{name}}/turbo.json`:

   ```json
   {
     "$schema": "https://turbo.build/schema.json",
     "tasks": {
       "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**", "out/**"] },
       "dev": { "cache": false, "persistent": true },
       "lint": { "dependsOn": ["^build"] },
       "lint:fix": { "cache": false },
       "format": { "cache": false },
       "format:check": { "dependsOn": ["^build"] },
       "check-types": { "dependsOn": ["^build"] }
     }
   }
   ```

   d. Create `{{name}}/.gitignore`:

   ```
   node_modules
   out
   dist
   *.tgz
   coverage
   *.lcov
   logs
   *.log
   .env
   .env.development.local
   .env.test.local
   .env.production.local
   .env.local
   .eslintcache
   .cache
   *.tsbuildinfo
   .idea
   .DS_Store
   .turbo
   .vercel
   .claude/
   .vscode/
   ```

   e. Create `{{name}}/knip.json`:

   ```json
   {
     "$schema": "https://unpkg.com/knip@5/schema.json",
     "ignore": [".vercel/**"]
   }
   ```

   f. Update `apps/web/package.json` scripts to:

   ```json
   {
     "scripts": {
       "dev": "next dev",
       "build": "next build",
       "start": "next start",
       "lint": "oxlint .",
       "lint:fix": "oxlint --fix .",
       "format": "oxfmt --write .",
       "format:check": "oxfmt .",
       "check-types": "tsc --noEmit"
     }
   }
   ```

   g. Verify `apps/web/next.config.ts` still has `reactCompiler: true`, `cacheComponents: true`, and `partialPrefetching: true`.

   h. Run `pnpm install --frozen-lockfile` from the root.

   i. Verify `pnpm run dev` works from the root (turbo runs `apps/web`).

9. **Placeholder sweep.**
   Before concluding, sweep for unresolved `{{variable}}` tokens:

   ```bash
   grep -rn '{{' --include='*.json' --include='*.ts' --include='*.tsx' --include='*.md' .
   ```

   A `{{name}}` left in `package.json` fails `pnpm install --frozen-lockfile` with an invalid-name error.

10. **Stop.** Do not create the GitHub repo, do not run Vercel deployment, do not run the pre-launch checklist. The turborepo is scaffolded. Deployment and launch are deferred to the human.

## Failure and recovery
- **`create-next-app` fails or network is unavailable.** Report the error verbatim. Do not retry with different flags unless the failure message explicitly requests it. Do not scaffold by hand.
- **TypeScript 7 install fails or `tsc` reports errors after install.** Report the first diagnostic. A type error in a file `next build` used to skip now blocks the build; fixing it is the user's responsibility before continuing.
- **`pnpm run dev` does not start or app does not load at `http://localhost:3000`.** Report the startup error. Stop; do not proceed to later phases until this resolves.
- **`pnpm exec ultracite check` fails after Phase 5.** Run `pnpm exec ultracite fix` and retry. If it persists, report the linter output. Do not bypass the check.
- **Any phase fails to meet its verification step.** Stop. Report the observed failure. Do not proceed to the next phase on a partial result.
- **Partial-result rule.** If the skill stops mid-scaffold (user cancels, error, or stop), leave the working tree as-is. The rollback path is `git init` — the only committed state before skill start is empty.

## Output
The skill produces:

- `{{name}}/` — project root directory
- `{{name}}/apps/web/` — Next.js application with TypeScript 7, Tailwind CSS, React Compiler, Instant Navigations, shadcn/ui + Blode registry, Blode icons, Agentation, Ultracite tooling
- `{{name}}/package.json` — root workspace package with turbo and ultracite
- `{{name}}/turbo.json` — turborepo task graph
- `{{name}}/.gitignore` — root gitignore
- `{{name}}/knip.json` — dead-code configuration
- `{{name}}/apps/web/next.config.ts` — Next.js config with Instant Navigations flags
- `{{name}}/apps/web/package.json` — turbo-compatible workspace scripts
- Installed all workspace dependencies with a frozen pnpm lockfile

No GitHub repo, no Vercel deployment, no favicon, no OG images, no pre-launch checklist.

Done predicate satisfied when: `pnpm run dev` starts from the project root, `pnpm run build` succeeds with zero errors, `pnpm run check-types` passes, and `pnpm run check` passes Ultracite checks.

## Provenance

**Origin:** `mblode/agent-skills` — `skills/scaffold-nextjs/SKILL.md` and its reference files `references/app-setup.md`, `references/deploy-and-launch.md`, `references/turbo-configs.md`.

**Revision:** `e97a3b383f5944f90d41eb92b24b4fb3b917a7f9`

**License:** MIT — Copyright (c) 2026 Matthew Blode. Reuse constraint: preserve the copyright notice and license text in all copies or substantial portions.

**Adaptation statement:** Adapted from the upstream MIT-licensed source. Phases 7 (GitHub and Vercel setup) and 8 (pre-launch checklist) are excised because they fall outside the reversible-local authority boundary and the side-effect contract: the skill stops after local scaffolding, defers deployment to a human. Reference file content is reproduced verbatim for source-mechanism fidelity. No deployment, remote, or irreversible actions are performed.
