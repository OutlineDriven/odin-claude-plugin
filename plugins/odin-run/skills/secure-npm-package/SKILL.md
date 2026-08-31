---
name: secure-npm-package
description: 'Use when creating or hardening an npm release with Trusted or Staged Publishing. Writes hardened workflow drafts, configures cooldown and postinstall settings, and produces a human handoff for every remote-only action. Partitions E404 packages so Trusted Publisher setup is sequenced after first publish. Not for remote changes or publishing.'
---

# Secure npm package

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to create, publish, or harden an npm package release using Trusted or Staged Publishing. |
| Authority | Reversible-local: writes only named workflow drafts, project config files, and the handoff document. No remote mutation, credential removal, tag creation, or publish. |
| Side effect | Writes hardened `publish.yaml` and `check-workflows.yaml` drafts, configures cooldown and postinstall-disablement in project config files, and lists every manual setting change in a human handoff. |
| Done | Both workflow drafts exist, cooldown and postinstall settings are written and read back, the handoff lists every human action with exact values, and no remote state changed. |

## Inputs

- Root `package.json` (required): read first to determine monorepo shape, package manager, build script, and repository URL.
- GitHub owner/repo (required): parsed from the `repository` field, normalized from `git+https://github.com/owner/repo.git`, `github:owner/repo`, or `git remote get-url origin`. Ask the user if none resolves.
- Package-manager identity (required): from `packageManager` field or lockfiles.
- Per-package published state (required): `npm view <name> version` per public package. E404 means not yet published.
- Existing workflows (required): read every `.github/workflows/*.yml` to detect existing release workflows and `secrets.NPM_TOKEN` usage.

## Procedure

1. Gather facts read-only. Read the root `package.json`. If it has `workspaces` or `pnpm-workspace.yaml` exists, enumerate every workspace `package.json` without `"private": true`. Resolve the GitHub owner/repo from the `repository` field; fall back to `git remote get-url origin`; ask the user if neither exists. Determine whether the owner is an org or personal account. Extract the package manager from `packageManager` or lockfiles. Run `npm view <name> version` for every public package; E404 means not yet published. Run `git tag --sort=-creatordate | head` to detect existing tag format; default to `v1.0.0` if empty. Read every `.github/workflows/*.yml` file to detect existing release workflows and `secrets.NPM_TOKEN` usage. Done when: all facts are gathered.
2. Ask all decisions in one round. Collect every decision needed before any mutation: cooldown length (1 day or 3 days), whether build tools should move into `dependencies` for the `--omit=dev` monorepo hack, the `repository` field if missing, and any project-specific question the facts raise. Do not drip questions. Wait for all answers. Done when: all decisions are collected.
3. Present the manual-settings checklist with exact values and URLs, partitioned by package state. For every published package: list the npmjs.com Trusted Publisher entry URL with stage-only enforcement and the token revocation URL, with exact values (owner, repo, `publish.yaml`, empty environment). For every E404 package: list the first-publish command (`npm publish --ignore-scripts`, add `--access public` for scoped packages) with interactive 2FA, and note that Trusted Publisher configuration is sequenced after that first publish. On github.com: org or personal 2FA confirmation, tag ruleset creation, and immutable releases enablement. If `secrets.NPM_TOKEN` was found in a workflow, include deletion of that secret and token revocation. Wait for explicit confirmation of the applicable settings. Published packages require Trusted Publisher confirmation now; E404 packages require only the first-publish acknowledgment, since Trusted Publisher cannot be configured until after the first publish. Done when: the user explicitly confirms the applicable settings.
4. Write `publish.yaml` and `check-workflows.yaml`, execute the cooldown config, and configure postinstall disablement. Write `publish.yaml` with these rules: trigger on version tags matching the detected tag format; separate `test`, `build`, and `publish` jobs where only `publish` receives `id-token: write` and all jobs receive `contents: read` and `persist-credentials: false`; the `publish` job installs no dependencies and runs `npm stage publish --ignore-scripts` (use `npm` even when the project uses pnpm, yarn, or bun, unless the package relies on a pnpm-only feature); every action pinned by full SHA commit hash; remove any `secrets.NPM_TOKEN` reference; for a monorepo, run `npm stage publish --ignore-scripts --workspaces` or `--workspace=<name>` per independently-tagged package. Write `check-workflows.yaml` with the zizmor lint workflow triggered on push to `main` and on all pull requests. Execute the cooldown config command matching the detected package manager: `npm config set --location=project min-release-age 3` (npm), `pnpm config set --location=project minimumReleaseAge 4320` (pnpm 11+), `yarn config set npmMinimalAgeGate 3d` (yarn), or `minimumReleaseAge = 259200` under `[install]` in `bunfig.toml` (bun). Done when the setting is written to project config, verified by reading it back. Configure postinstall disablement: if npm 12+, pnpm 10+, yarn 4.14+, or bun, confirm no additional config is needed; otherwise add `npm config set --location=project ignore-scripts true` or `yarn config set enableScripts false`. Done when: postinstall disablement is configured or confirmed unnecessary.
5. Run zizmor until clean and write the handoff. Execute `docker run --rm -t -v "$(pwd):/repo:ro" ghcr.io/zizmorcore/zizmor:latest /repo/.github/workflows` if Docker is available; otherwise instruct the user to run it and paste the output. Fix every finding in existing workflows. Re-run until clean. Write `publish-setup-handoff.md` in the project root covering every human-only action with exact values and direct URLs: per-package Trusted Publisher entries (or first-publish command for E404 packages with Trusted Publisher sequenced after), token and secret deletion, 2FA enforcement, tag ruleset, immutable releases, and the tag-to-approve release flow. Done when: zizmor runs clean and the handoff is written.

## Failure and recovery

| Failure | Recovery |
|---|---|
| `package.json` not found or unreadable | Stop. Cannot determine package names, repository URL, or build shape. |
| `repository` field absent and `git remote` unavailable | Stop. Cannot resolve owner/repo or generate checklist URLs. |
| Unconfirmed applicable settings | Stop before any write. Do not proceed to step 4. |
| Verification error from npmjs.com or github.com | Stop. Re-ask the user to confirm the settings. Do not assume they are complete. |
| Package manager not detected | Stop. Cooldown and publish commands depend on the package manager. |
| zizmor finds vulnerabilities | Fix every reported finding before concluding. Do not suppress. |

Rollback: any local file written by this skill is reversible by reverting the corresponding commit. No remote state is changed.

## Output

`.github/workflows/publish.yaml` (hardened CI release workflow draft), `.github/workflows/check-workflows.yaml` (zizmor lint workflow), project config files with cooldown and postinstall settings written and read back, and `publish-setup-handoff.md` (human handoff listing every Trusted Publisher entry, 2FA enforcement, tag ruleset, immutable releases, token revocation, first-publish command for E404 packages, and the tag-to-approve release flow). No credential is removed, no remote setting or tag is changed, no release is published.
