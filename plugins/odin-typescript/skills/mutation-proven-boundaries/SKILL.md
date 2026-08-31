---
name: mutation-proven-boundaries
description: 'Use when a TypeScript repo needs enforced package entry-point boundaries. Writes dependency-cruiser config and mutation-verifies the boundary rules so a forbidden import fails and the revert passes. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Mutation proven boundaries

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A TypeScript repo needs enforced package entry-point boundaries. |
| Authority | Reversible-local: write only config, scripts, docs, and one example package to the local repo; revert restores the pre-run state. |
| Side effect | Local-write: dependency-cruiser config, scripts, docs, and one example package. |
| Done | Check-set passes: base clean run passes, injected forbidden import fails, revert passes. |

## Inputs

- **Repo root**: required. The directory containing the TypeScript source to protect. Must contain TypeScript source files.
- **Packages root**: required. The directory that holds the packages (e.g. `src/packages`, `packages`).
- **Package manager**: required. The package manager in use (npm, pnpm, yarn, bun). Must be stated by the user or detected from a lockfile at the repo root.

### Prerequisites

- `dependency-cruiser` must already be installed as a devDependency. Verify with `pnpm exec depcruise --version` from the repo root. If this command fails or is not found, stop and report: "dependency-cruiser is not installed. Install it with `pnpm add --save-dev dependency-cruiser` and re-run this skill."

## Procedure

1. **Verify prerequisite.** Run `pnpm exec depcruise --version` from the repo root. If it exits non-zero or is not found, stop with the prerequisite message above. Done when: the step’s stated result is achieved or its stop condition is reported.

2. **Write the config.** Create `.dependency-cruiser.cjs` in the repo root with the following content, replacing `PACKAGES_ROOT` with the supplied packages root value: Done when: the step’s stated result is achieved or its stop condition is reported.

```javascript
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-internal-from-app',
      comment: 'App code may not reach package internals.',
      severity: 'error',
      from: {},
      to: {
        path: '(.+)/lib/.+',
        pathNot: ['node_modules', '.+\.spec\..+', '.+\.test\..+', '$1'],
      },
    },
    {
      name: 'no-cross-package-internal',
      comment: 'Cross-package imports may not reach internals.',
      severity: 'error',
      from: {
        path: 'PACKAGES_ROOT/[^/]+',
      },
      to: {
        path: 'PACKAGES_ROOT/[^/]+/lib/.+',
        pathNot: ['node_modules', '$1'],
      },
    },
    {
      name: 'no-internal-from-tests',
      comment: 'Tests may not reach any package internals.',
      severity: 'error',
      from: {
        path: '\.test\..+$|\.spec\..+$|/__tests__/',
      },
      to: {
        path: '(.+)/lib/.+',
        pathNot: ['node_modules', '$1'],
      },
    },
    {
      name: 'tests-importable-only-from-tests',
      comment: 'The tests/ folder is importable only from tests.',
      severity: 'error',
      from: {
        pathNot: '\.test\..+$|\.spec\..+$|/__tests__/',
      },
      to: {
        path: '/tests/',
        pathNot: ['node_modules'],
      },
    },
  ],
  options: {
    doNotFollow: 'node_modules',
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
  },
};
```

Replace every literal `PACKAGES_ROOT` in the config above with the actual packages root path relative to the repo root (e.g. `src/packages`).

3. **Wire the lint script.** Add a `lint:boundaries` script to `package.json`: Done when: the step’s stated result is achieved or its stop condition is reported.
   ```json
   "lint:boundaries": "depcruise <packages-root>"
   ```
   Replace `<packages-root>` with the actual packages root. If an existing lint script or pre-check hook exists, append `lint:boundaries` to it.

4. **Scaffold the example package.** Create `<packages-root>/example/` with: Done when: the step’s stated result is achieved or its stop condition is reported.
   - `index.ts`: exports one function that delegates to an internal file.
   - `lib/impl.ts`: contains the internal implementation.
   - `tests/example.test.ts`: imports `../index.ts` and tests the export.

5. **Prove pass.** Run `lint:boundaries`. Must exit zero. Done when: the step’s stated result is achieved or its stop condition is reported.

6. **Prove fail.** Add a temporary file `<packages-root>/example/lib/deep-import.ts` that imports `../index.ts` and re-exports it. This is a deep import that violates the boundary. Run `lint:boundaries`; it must exit non-zero and report a violation. Done when: the step’s stated result is achieved or its stop condition is reported.

7. **Revert and prove clean.** Delete the temporary deep-import file. Run `lint:boundaries` again; it must exit zero. Do not leave the proof artifact in the repo. Done when: the step’s stated result is achieved or its stop condition is reported.

8. **Document the convention.** Write `<packages-root>/README.md` covering: the layout (root files are entry points, `lib/` for implementation, `tests/` for tests), the rule (import only through entry points), and how to run `lint:boundaries`. Done when: the step’s stated result is achieved or its stop condition is reported.

## Failure and recovery
- **Prerequisite missing**: report that dependency-cruiser is not installed and the exact install command; stop.
- **Config write failure**: report the path and error; stop.
- **Pass step fails**: the clean example did not pass; fix the config or example layout before continuing.
- **Fail step passes**: the injected violation did not trigger a violation report; the rules are not wired. Fix the config, then redo steps 5-7.
- **Revert step fails**: the violation artifact was not fully removed; clean up manually and re-run step 7.

Partial-result rule: stop at the first failure. Do not commit a broken state.

## Output
- `.dependency-cruiser.cjs` in the repo root with the packages root set correctly.
- `lint:boundaries` script in `package.json`.
- `<packages-root>/example/` committed example package.
- `<packages-root>/README.md` documenting the convention.

The done predicate is satisfied when three sequential runs of `lint:boundaries` produce: pass, non-zero, then pass again.
