---
name: eslint-to-biome-migration
description: 'Use when asked to migrate a JavaScript or TypeScript project from ESLint, Prettier, Standard, or mixed legacy lint configuration to Biome 2.5. Biome owns linting and formatting, legacy configuration and dependencies are removed, and the project CI check passes without auto-fix. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# ESLint to Biome migration

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Migrate an existing JavaScript or TypeScript project from ESLint, Prettier, Standard, or mixed lint configuration to Biome 2.5. |
| Authority | Reversible local writes only. Edit lint configuration, package scripts, dependencies, hooks, and CI checks. Roll back with version control. |
| Side effect | Writes `biome.json` or `biome.jsonc`; removes superseded lint and format configuration and dependencies; updates local scripts, hooks, and CI. No remote mutation. |
| Done | Biome 2.5 lint and format checks pass; the prior lint and format checks have an explicit coverage disposition; no ESLint, Prettier, Standard, or legacy config remains; CI runs Biome without auto-fix and passes. |

## Inputs

- Project root with `package.json` and an existing lint or format setup. Required.
- Existing package manager and lockfile. Required; keep the manager fixed during this lint-only migration.
- CI and hook configuration paths. Optional; detect them when present.

## Procedure

1. Bound the migration. Read `package.json`, the lockfile, all ESLint, Prettier, Standard, and Biome configuration, package scripts, hook configuration, and CI lint steps. Run the existing lint and format checks without auto-fix. Record each command, exit code, and finding count.
2. Resolve Biome 2.5 with the package manager already pinned by the repository. Add `@biomejs/biome` as a development dependency. Do not change the package manager or introduce a second lockfile.
3. Read the installed Biome CLI help. Run its `migrate eslint --write` command when ESLint configuration exists and its `migrate prettier --write` command when Prettier configuration exists. Merge both results into one `biome.json` or `biome.jsonc`; do not keep parallel configuration files.
4. Reconcile coverage. Map each project-specific legacy rule or override to a Biome rule, formatter option, file include, or ignore. Mark an unsupported rule as `unsupported: <rule> — <observable risk>` before removal. Do not claim parity from equal issue counts alone.
5. Replace package scripts with `"check": "biome check ."` and `"check:fix": "biome check --write ."`, preserving unrelated scripts. Replace hook and CI lint commands with the repository package runner followed by `biome check .`; CI never uses `--write`.
6. Run Biome once with `--write`, inspect the diff, then run `biome check .` without mutation. Run the repository type check, tests, and build because formatting can expose parse or generated-file defects.
7. After all checks pass, remove ESLint, Prettier, Standard, their plugins and shared configs, `.eslintrc*`, `eslint.config.*`, `.eslintignore`, `.prettierrc*`, `prettier.config.*`, and package-level `eslintConfig` or `prettier` fields. Preserve an ignore only by moving its pattern into Biome configuration first.
8. Reinstall from the lockfile, rerun Biome, type check, tests, build, and the exact CI lint command, then scan manifests and configuration for a live reference to a removed package or config.

## Failure and recovery

- **Migration command rejects the legacy config:** stop before deletion. Report the config path and diagnostic; translate only rules whose behavior is documented by the installed tools.
- **Unsupported rule protects an observable invariant:** keep the migration blocked until Biome or another current project-native check covers that invariant. Do not retain ESLint as a silent second linter.
- **Finding count changes:** compare finding identities and covered files. Counts alone neither prove nor disprove coverage.
- **Downstream check fails:** restore the pre-migration files and lockfile, report the first failing command, and keep the recorded coverage map.
- **Mixed configuration remains:** the done predicate fails. Remove the superseded path only after its patterns and rules have a disposition.

## Output

- One `biome.json` or `biome.jsonc` configuration.
- Updated package scripts, hook command, CI command, dependency manifest, and lockfile.
- A coverage map for legacy rules and file scopes, including every unsupported invariant.
- Terminal classification: `migrated` or `blocked`, with exact command evidence.

## Provenance

- Origin: `mcollina/skills`, revision `856efd268ae85482d882f3d0bed869fd020b5c06`.
- License: MIT; notice retained, mechanism adapted.
- Adaptation: the source ESLint 9 migration was re-derived as an ESLint-to-Biome cutover for the current ODIN toolchain. Its useful inventory, parity, CI, and rollback mechanisms remain; no third-party expression is copied.
