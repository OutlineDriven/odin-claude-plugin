---
name: setup-ts-deep-modules
description: 'Wire dependency-cruiser into a TypeScript repo so each package is a deep module: implementation hidden in subfolders, reachable only through its entry-point files. Use when the user asks to enforce package boundaries, set up deep modules, stop deep imports, or wants code outside a package to import only its entry points. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Setup TS deep modules

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to enforce package boundaries, set up deep modules, stop deep imports, or import only entry points |
| Authority | Reversible-local: writes .dependency-cruiser.cjs, package.json, package scripts, and optional example package and README; refuses to overwrite existing config or touch tsconfig |
| Side effect | Installs dependency-cruiser as devDependency; writes .dependency-cruiser.cjs, lint:boundaries script, example package, packages README, and AGENTS.md/CLAUDE.md pointer |
| Done | lint:boundaries passes on the clean example; fails on a deep import; passes after revert |

## Inputs

Required: a TypeScript monorepo with a packages root (`src/packages/` or `packages/`).

Optional: the preferred packages root if the repo has a different convention.

## Procedure

1. **Detect the environment.** Identify the package manager: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lock` or `bun.lockb` → bun, else npm. Identify the packages root: use `src/packages` if `src/` exists, else `packages`. Check for an existing `.dependency-cruiser.*` config file.

2. **Install dependency-cruiser.** Add `dependency-cruiser` as a devDependency using the detected package manager.

3. **Write the config.** Write `.dependency-cruiser.cjs` to the repo root with these four error-level forbidden rules:

   - `entrypoint-boundary-from-app`: importers outside any package (`pathNot: ^PACKAGES_ROOT/`) may not reach `PACKAGES_ROOT/[^/]+/[^/]+/` (subfolder internals).
   - `entrypoint-boundary-across-packages`: importers inside a package but not in its `tests/` folder may reach other packages' subfolder internals only if not cross-package; same-package internals are allowed (intra-package freedom).
   - `tests-through-entrypoints`: importers in `PACKAGES_ROOT/([^/]+)/tests/` may reach subfolder internals of any package except their own `tests/` fixtures.
   - `no-circular`: no dependency cycles.

   Set `PACKAGES_ROOT` to the detected root (e.g. `src/packages`). Use `.cjs` (not `.js`) for compatibility with `"type": "module"` repos. The rules are path-depth based and extension-agnostic; the `PACKAGES_ROOT` constant is the only thing to adapt.

4. **Wire the lint script.** Add a `lint:boundaries` npm script: `depcruise <packages-root>`. Fold it into the existing umbrella check command (e.g. `check`, `ci`, `validate`). Do not touch tsconfig or add path aliases. If no umbrella script exists, add `lint:boundaries` and instruct the user to include it in CI.

5. **Scaffold the example package.** Create `<packages-root>/example/` with: `index.ts` exporting a function that delegates to an internal file; `lib/impl.ts` in a subfolder, imported by `index.ts`; `tests/example.test.ts` importing only `../index` and asserting on the public function. Mark it as a copy-me template.

6. **Prove the rules bite.** Run `lint:boundaries`: it must pass. Temporarily add a deep import to `tests/example.test.ts` (e.g. `import { thing } from "../lib/impl"`). Run `lint:boundaries`: it must fail with `tests-through-entrypoints`. Revert the deep import. Run once more: it must pass. If step 2 does not fail, the rules are not wired correctly; fix before finishing.

7. **Document the convention.** Write `<packages-root>/README.md` covering: the `<name>/` layout (entry points at root, `lib/` for implementation, `tests/` for tests), the four boundary rules, how to run `lint:boundaries`, and an explicit warning against barrel files. Add one line to the repo's `CLAUDE.md` or `AGENTS.md` (create if absent): `Packages are deep modules: see [src/packages/README.md](./src/packages/README.md) before adding or importing one.`

## Failure and recovery
| Failure class | Condition | Result |
|---|---|---|
| `existing-config` | `.dependency-cruiser.*` already exists | Merge the four forbidden rules and options into it; report what was added |
| `package-manager-unknown` | No lockfile detected and no explicit preference | Ask the user which package manager to use |
| `step-2-does-not-fail` | Deep import does not trigger a lint:boundaries error | Config rules are incorrect; inspect and fix the regex patterns before continuing |
| `example-does-not-pass` | Clean example produces lint errors | Package layout or config is wrong; do not proceed until the clean example passes |

## Output
- `.dependency-cruiser.cjs` written to repo root with the four forbidden rules.
- `lint:boundaries` script added to `package.json` and folded into the umbrella check.
- `<packages-root>/example/` committed as a starter template.
- `<packages-root>/README.md` and AGENTS.md/CLAUDE.md pointer created.
- Done predicate confirmed: pass → fail (deep import) → pass (after revert).

## Provenance

Origin: `odin-current` (project-owned).

Adaptation: clean-room implementation of the dependency-cruiser deep-module boundary workflow. The four forbidden rules, path-depth based private/public distinction, intra-package freedom via `$1` back-reference, and three-step bite proof are preserved from the source mechanism. Written for the ODIN 2.0 Skill Foundry literal authoring contract.
