---
name: setup-ts-deep-modules
description: 'Use when the user asks to enforce package boundaries, set up deep modules, or stop deep imports in a TypeScript repo. Wires dependency-cruiser so each package is reachable only through entry points. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Setup TS deep modules

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to enforce package boundaries, set up deep modules, stop deep imports, or import only entry points. |
| Authority | Reversible-local: writes .dependency-cruiser.cjs, package.json, package scripts, and optional example package and README; refuses to overwrite existing config or touch tsconfig. |
| Side effect | Installs dependency-cruiser as devDependency; writes .dependency-cruiser.cjs, lint:boundaries script, example package, packages README, and AGENTS.md/CLAUDE.md pointer. |
| Done | lint:boundaries passes on the clean example; fails on a deep import; passes after revert. |

## Inputs

Required: a TypeScript monorepo with a packages root (`src/packages/` or `packages/`).

Optional: the preferred packages root if the repo has a different convention.

## Procedure

1. **Detect the environment.** Identify the package manager: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lock` or `bun.lockb` → bun, else npm. Identify the packages root: use `src/packages` if `src/` exists, else `packages`. Check for an existing `.dependency-cruiser.*` config file. **Done when:** package manager, packages root, and existing-config status are recorded.

2. **Install dependency-cruiser.** Add `dependency-cruiser` as a devDependency using the detected package manager. **Done when:** dependency-cruiser is installed.

3. **Write the config.** Write `.dependency-cruiser.cjs` to the repo root with these four error-level forbidden rules:
   - `entrypoint-boundary-from-app`: importers outside any package (`pathNot: ^PACKAGES_ROOT/`) may not reach `PACKAGES_ROOT/[^/]+/[^/]+/` (subfolder internals).
   - `entrypoint-boundary-across-packages`: importers inside a package but outside its `tests/` folder may not reach another package's subfolder internals; same-package internals remain allowed (intra-package freedom).
   - `tests-through-entrypoints`: importers in `PACKAGES_ROOT/([^/]+)/tests/` may reach subfolder internals of any package except their own `tests/` fixtures.
   - `no-circular`: no dependency cycles.
   Set `PACKAGES_ROOT` to the detected root (e.g. `src/packages`). Use `.cjs` (not `.js`) for compatibility with `"type": "module"` repos. The rules are path-depth based and extension-agnostic; the `PACKAGES_ROOT` constant is the only thing to adapt. **Done when:** the config file is written with all four rules.

4. **Wire the lint script.** Add a `lint:boundaries` npm script: `depcruise <packages-root>`. Fold it into the existing umbrella check command (e.g. `check`, `ci`, `validate`). Do not touch tsconfig or add path aliases. If no umbrella script exists, add `lint:boundaries` and instruct the user to include it in CI. **Done when:** the lint script is added and folded into the umbrella check or the user is instructed.

5. **Scaffold the example package.** Create `<packages-root>/example/` containing: `index.ts`, which exports a function that delegates to an internal file; `lib/impl.ts`, imported by `index.ts`; and `tests/example.test.ts`, which imports only `../index` and asserts on the public function. Mark it as a copy-me template. **Done when:** the example package exists with all three files.

6. **Prove the rules bite.** Run `lint:boundaries`: it must pass. Temporarily add a deep import to `tests/example.test.ts` (e.g. `import { thing } from "../lib/impl"`). Run `lint:boundaries`: it must fail with `tests-through-entrypoints`. Revert the deep import. Run once more: it must pass. If step 2 does not fail, the rules are not wired correctly; fix before finishing. **Done when:** the pass-fail-pass sequence is confirmed.

7. **Document the convention.** Write `<packages-root>/README.md` covering: the `<name>/` layout (entry points at root, `lib/` for implementation, `tests/` for tests), the four boundary rules, how to run `lint:boundaries`, and an explicit warning against barrel files. Add one line to the repo's `CLAUDE.md` or `AGENTS.md` (create if absent): `Packages are deep modules: see [src/packages/README.md](./src/packages/README.md) before adding or importing one.` **Done when:** the README and steering-file pointer are written.

## Failure and recovery

| Failure class | Condition | Result |
|---|---|---|
| `existing-config` | `.dependency-cruiser.*` already exists | Merge the four forbidden rules and options into it; report what was added. |
| `package-manager-unknown` | No lockfile detected and no explicit preference | Ask the user which package manager to use. |
| `step-2-does-not-fail` | Deep import does not trigger a lint:boundaries error | Config rules are incorrect; inspect and fix the regex patterns before continuing. |
| `example-does-not-pass` | Clean example produces lint errors | Package layout or config is wrong; do not proceed until the clean example passes. |

## Output

`.dependency-cruiser.cjs` with four forbidden rules; `lint:boundaries` script in `package.json` folded into the umbrella check; `<packages-root>/example/` as a starter template; `<packages-root>/README.md` and AGENTS.md/CLAUDE.md pointer; done predicate confirmed via pass-fail-pass sequence.

## Provenance

Origin: `odin-current` (project-owned).

Adaptation: clean-room implementation of the dependency-cruiser deep-module boundary workflow. The four forbidden rules, path-depth based private/public distinction, intra-package freedom via `$1` back-reference, and three-step bite proof are preserved from the source mechanism. Written for the ODIN 2.0 Skill Foundry literal authoring contract.
