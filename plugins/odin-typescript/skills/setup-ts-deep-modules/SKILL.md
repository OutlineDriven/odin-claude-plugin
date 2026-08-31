---
name: setup-ts-deep-modules
description: 'Use when the user asks to enforce package boundaries, set up deep modules, stop deep imports, mutation-prove boundary rules, or ensure packages are reachable only through entry points in a TypeScript repo. Wires dependency-cruiser so each package is a deep module and mutation-verifies the rules bite. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Setup TS deep modules

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to enforce package boundaries, set up deep modules, stop deep imports, import only entry points, or mutation-prove that boundary rules catch forbidden imports. |
| Authority | Reversible-local: writes `.dependency-cruiser.cjs`, `package.json`, package scripts, and an optional example package and README; refuses to overwrite existing config or touch tsconfig. |
| Side effect | Installs dependency-cruiser as a devDependency; writes `.dependency-cruiser.cjs`, `lint:boundaries` script, example package, packages README, and AGENTS.md or CLAUDE.md pointer. |
| Done | `lint:boundaries` passes on the clean example, fails on an injected deep import, and passes after the deep import is reverted. |

## Inputs

Required: a TypeScript monorepo with a packages root (`src/packages/` or `packages/`).

Optional: the preferred packages root if the repo has a different convention.

## Procedure

1. **Detect the environment.** Identify the package manager: `pnpm-lock.yaml` leads to pnpm, `yarn.lock` to yarn, `bun.lock` or `bun.lockb` to bun, else npm. Identify the packages root: use `src/packages` if `src/` exists, else `packages`. Check for an existing `.dependency-cruiser.*` config file. Done when: package manager, packages root, and existing-config status are recorded.

2. **Install or verify dependency-cruiser.** If `dependency-cruiser` is not already a devDependency, add it using the detected package manager. If it is already installed, verify with the package manager's exec command (e.g., `pnpm exec depcruise --version`) and record the version. Done when: dependency-cruiser is installed and its version is recorded.

3. **Write the config.** Write `.dependency-cruiser.cjs` to the repo root with these five error-level forbidden rules (see `references/dependency-cruiser.config.cjs` for the full annotated config):
   - `entrypoint-boundary-from-app`: importers outside any package may not reach package subfolder internals.
   - `entrypoint-boundary-across-packages`: importers inside a package but outside its `tests/` folder may not reach another package's subfolder internals; same-package internals remain allowed.
   - `tests-through-entrypoints`: importers in a package's `tests/` may reach subfolder internals of any package except their own `tests/` fixtures.
   - `tests-folder-is-private`: a package's `tests/` folder is reachable only from tests.
   - `no-circular`: no dependency cycles.

   Set `PACKAGES_ROOT` to the detected root. Use `.cjs` (not `.js`) for compatibility with `"type": "module"` repos. If an existing config is present, merge these rules into it and report what was added. Done when: the config file is written with all five rules.

4. **Wire the lint script.** Add a `lint:boundaries` npm script: `depcruise <packages-root>`. Fold it into the existing umbrella check command (e.g., `check`, `ci`, `validate`). Do not touch tsconfig or add path aliases. If no umbrella script exists, add `lint:boundaries` and instruct the user to include it in CI. Done when: the lint script is added and folded into the umbrella check or the user is instructed.

5. **Scaffold the example package.** Create `<packages-root>/example/` containing: `index.ts`, which exports a function that delegates to an internal file; `lib/impl.ts`, imported by `index.ts`; and `tests/example.test.ts`, which imports only `../index` and asserts on the public function. Mark it as a copy-me template. Done when: the example package exists with all three files.

6. **Prove the rules bite with mutation verification.** Run `lint:boundaries`: it must pass. Inject a forbidden deep import: temporarily add `import { thing } from "../lib/impl"` to `tests/example.test.ts`. Run `lint:boundaries`: it must fail with a boundary violation. Revert the deep import. Run `lint:boundaries` once more: it must pass. If the injected violation does not trigger a failure, the rules are not wired correctly; fix the config before finishing. Do not leave the proof artifact in the repo. Done when: the pass, fail, pass sequence is confirmed.

7. **Document the convention.** Write `<packages-root>/README.md` covering: the `<name>/` layout (entry points at root, `lib/` for implementation, `tests/` for tests), the five boundary rules, how to run `lint:boundaries`, and an explicit warning against barrel files. Add one line to the repo's `CLAUDE.md` or `AGENTS.md` (create if absent): `Packages are deep modules: see [src/packages/README.md](./src/packages/README.md) before adding or importing one.` Done when: the README and steering-file pointer are written.

## Failure and recovery

| Failure class | Condition | Result |
|---|---|---|
| `existing-config` | `.dependency-cruiser.*` already exists | Merge the five forbidden rules and options into it; report what was added. |
| `package-manager-unknown` | No lockfile detected and no explicit preference | Ask the user which package manager to use. |
| `mutation-does-not-fail` | Injected deep import does not trigger a `lint:boundaries` error | Config rules are incorrect; inspect and fix the regex patterns before continuing. |
| `example-does-not-pass` | Clean example produces lint errors | Package layout or config is wrong; do not proceed until the clean example passes. |
| `revert-does-not-pass` | `lint:boundaries` fails after reverting the injected import | The violation artifact was not fully removed; clean up manually and re-run. |

## Output

`.dependency-cruiser.cjs` with five forbidden rules; `lint:boundaries` script in `package.json` folded into the umbrella check; `<packages-root>/example/` as a starter template; `<packages-root>/README.md` and AGENTS.md or CLAUDE.md pointer; done predicate confirmed via the pass, fail, pass mutation-verification sequence.
