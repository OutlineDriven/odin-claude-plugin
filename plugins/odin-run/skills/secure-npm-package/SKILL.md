---
name: secure-npm-package
description: 'Use when creating or hardening an npm release with Trusted or Staged Publishing. Writes hardened workflow drafts and a human handoff for credentials, 2FA, tags, and immutable releases. Not for remote changes or publishing.'
---

# Secure npm package

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to create, publish, or harden an npm package release using Trusted or Staged Publishing. |
| Authority | Reversible local: write only to named local artifacts (`.github/workflows/publish.yaml`, `.github/workflows/check-workflows.yaml`, project config files); no remote mutation, no credential removal, no service-setting change. |
| Side effect | Local write: writes hardened `publish.yaml` and `check-workflows.yaml` drafts to `.github/workflows/`, configures cooldown and postinstall-disablement in project config files, and lists every manual setting change in a human handoff. Does not remove credentials, change repository or npm service settings, create tags, or publish any test or production release. |
| Done | The local `publish.yaml` and `check-workflows.yaml` drafts exist in `.github/workflows/`; the project cooldown and postinstall config are written; and the human handoff lists every npm Trusted Publisher entry, 2FA enforcement, tag ruleset, immutable-releases setting, token revocation, and first-publish command that only a human can perform. |

## Inputs

| Input | Required | Notes |
|---|---|---|
| `package.json` | Yes | Root of the project; read first to determine monorepo shape, package manager, build script, and repository URL. |
| `repository` field | Conditional | Ask if absent and no `git remote get-url origin` resolves it. |
| GitHub owner/repo | Yes | Parsed from the `repository` field, normalized from `git+https://github.com/owner/repo.git`, `github:owner/repo`, or `git remote get-url origin`. |
| Package names to protect | Yes | Every workspace `package.json` without `"private": true`; enumerate each for its own Trusted Publisher entry. |
| Org or personal account | Yes | Determines whether 2FA enforcement is an org-level setting or a personal-account confirmation. |
| Existing version tag format | Conditional | From `git tag --sort=-creatordate | head`; default to `v1.0.0` if no tags exist. |
| Package manager | Yes | From `packageManager` field or lockfiles; determines which cooldown command to emit. |
| Monorepo | Yes | From `workspaces` field or `pnpm-workspace.yaml`; determines whether `--omit=dev` or `--workspaces` applies. |
| `npm view <name> version` per package | Yes | E404 means not yet published; changes the first-release path. |
| Existing `.github/workflows/` files | Yes | To detect an existing release workflow and any `secrets.NPM_TOKEN` usage. |

## Procedure

1. **Gather facts (read-only).** Read the root `package.json`. If it has `workspaces` or `pnpm-workspace.yaml` exists, enumerate every workspace `package.json` without `"private": true`. Resolve the GitHub owner/repo from the `repository` field (normalize `git+https://github.com/owner/repo.git`, `github:owner/repo`, bare `owner/repo`); fall back to `git remote get-url origin`; ask the user if neither exists. Determine whether the owner is an org or personal account. Extract the package manager from `packageManager` or lockfiles. Run `npm view <name> version` for every public package; an E404 means not yet published. Run `git tag --sort=-creatordate | head` to detect existing tag format; default to `v1.0.0` if empty. Read every `.github/workflows/*.yml` file to detect an existing release workflow and any `secrets.NPM_TOKEN` usage. Check whether a `build` script exists and what directory it emits. **Done when:** all facts are gathered and recorded.

2. **Ask all questions together.** In one message, collect every decision needed before any mutation: cooldown length (1 day or 3 days), whether build tools should move into `dependencies` for the `--omit=dev` monorepo hack, the `repository` field if missing, and any other project-specific question the facts raise. Do not drip questions; wait for all answers. **Done when:** all decisions are collected in one round.

3. **Present manual settings with resolved links.** After receiving answers, produce a numbered checklist for the user with exact values resolved from Step 1 data — package names, owner/repo, the `publish.yaml` filename — grouped by website. Include direct URLs. For every public package on npmjs.com: Trusted Publisher configuration with stage-only enforcement, and token revocation. On github.com: org or personal 2FA confirmation, tag ruleset creation, and immutable releases enablement. If `secrets.NPM_TOKEN` was found in a workflow: include deletion of that secret and token revocation. Ask the user to confirm all settings are complete before any repo changes. **Done when:** the manual-settings checklist is presented with exact values and direct URLs.

4. **Verify and wait for explicit confirmation.** After the user confirms, verify what can be verified (`npm view <name>`, `gh api repos/<owner>/<repo>/rulesets` if `gh` is authenticated). Re-ask about anything not confirmed. Do not write any file or run any mutating command until the user explicitly confirms. **Done when:** the user explicitly confirms and verifiable settings are checked.

5. **Write `.github/workflows/publish.yaml`.** Create the file with these rules regardless of project shape:
   - Trigger on version tags matching the detected tag format (`v*`, `[0-9]*`, or the repo's existing pattern).
   - Separate `test`, `build`, and `publish` jobs. The `publish` job is the only one that receives `id-token: write`; all jobs receive `contents: read` and `persist-credentials: false` on checkout.
   - The `publish` job installs no dependencies and uses no cache; it downloads build artifacts from the `build` job and runs `npm stage publish --ignore-scripts`.
   - Use `npm` for the publish command even when the project uses pnpm, yarn, or bun, unless the package genuinely relies on a pnpm-only feature (workspace protocol, beforePacking hook); in that case use `pnpm stage publish`.
   - Every action is pinned by full SHA commit hash.
   - If an old workflow used `secrets.NPM_TOKEN`, remove that secret reference from the new file (the Step 3 checklist already covers deleting the secret itself).
   - If no build script exists, omit the `build` job and the artifact steps entirely.
   - For a monorepo, the publish job runs `npm stage publish --ignore-scripts --workspaces` or `npm stage publish --ignore-scripts --workspace=<name>` per independently-tagged package. **Done when:** `publish.yaml` is written with all rules applied.

6. **Write `.github/workflows/check-workflows.yaml`.** Add the zizmor lint workflow: trigger on push to `main` and on all pull requests, with `contents: read` and `actions: read` permissions, using the `zizmorcore/zizmor-action` action pinned by SHA. This keeps workflow linting in CI after the publish workflow is hardened. **Done when:** `check-workflows.yaml` is written.

7. **Run zizmor and fix every finding.** Execute `docker run --rm -t -v "$(pwd):/repo:ro" ghcr.io/zizmorcore/zizmor:latest /repo/.github/workflows` if Docker is available; otherwise instruct the user to run this command and paste the output. Fix every finding it reports in the existing workflows (pull_request_target misuse, shell injection, unpinned actions). Re-run until clean. Warn the user to delete stale branches that contain old vulnerable workflows. **Done when:** zizmor runs clean on all workflows.

8. **Configure dependency cooldown.** Apply the cooldown the user chose in Step 2. If not chosen, default to 3 days (blocks ~94% of malicious releases; median attacker takedown is 14 hours). Emit the command matching the detected package manager:
   - npm: `npm config set --location=project min-release-age 3`
   - pnpm 11+: `pnpm config set --location=project minimumReleaseAge 4320`
   - yarn: `yarn config set npmMinimalAgeGate 3d`
   - bun: add `minimumReleaseAge = 259200` under `[install]` in `bunfig.toml` **Done when:** the cooldown command for the detected package manager is emitted.

9. **Disable postinstall scripts locally.** Check the detected version (from `packageManager` field, `npm --version`, etc.). If the version is npm ≥12, pnpm ≥10, yarn ≥4.14, or bun: no additional config needed — just confirm. If older, add `npm config set --location=project ignore-scripts true` or `yarn config set enableScripts false`. Warn that `ignore-scripts=true` also skips the project's own lifecycle scripts (prepare, husky); check nothing depends on them; if a single package genuinely needs its build script, allowlist only that package. **Done when:** postinstall disablement is configured or confirmed unnecessary for the detected version.

10. **Handle not-yet-published packages.** For each package where `npm view <name>` returned E404: (a) warn about typosquatting-adjacent names, (b) add the first-publish command to the human handoff: `npm publish --ignore-scripts` (add `--access public` for scoped packages), authenticating interactively with 2FA — no token, no CI for this one release, (c) note that Trusted Publisher and stage-only enforcement are configured immediately after this first publish, and (d) add every such package to the manual-settings checklist in the human handoff. **Done when:** every E404 package is handled in the handoff.

11. **Write the human handoff.** Create `publish-setup-handoff.md` in the project root listing every action that only a human can perform, with exact values and direct URLs:
    - Per package: npmjs.com Trusted Publisher entry URL (stage-only, deny plain publish), token revocation URL, and the exact values (owner, repo, `publish.yaml`, empty environment).
    - Token and secret deletion: exact URLs and command to revoke the npm token and delete `NPM_TOKEN` from GitHub secrets.
    - 2FA enforcement: org-level URL and setting name, or personal-account confirmation URL.
    - Tag ruleset: direct URL to create it, with exact values (name, active, admin bypass, restrict-creations).
    - Immutable releases: URL and the exact setting to enable.
    - First-publish command for any E404 package: exact `npm publish` invocation with flags.
    - Release flow summary: tag push → CI staged approval → human approves in Staged Packages or with `npm stage approve`. **Done when:** `publish-setup-handoff.md` is written with every human-only action, exact values, and direct URLs.

## Failure and recovery
| Failure | Result |
|---|---|
| `package.json` not found or unreadable | Stop. Cannot determine package names, repository URL, or build shape. |
| `repository` field absent and `git remote` unavailable | Stop. Cannot resolve Trusted Publisher owner/repo or generate correct checklist URLs. |
| User has not completed manual settings | Stop. Do not proceed to Step 5 or any subsequent write. |
| npmjs.com or github.com returns an error when verifying settings | Stop. Re-ask the user to confirm the settings; do not assume they are complete. |
| zizmor finds vulnerabilities | Do not suppress findings. Fix every reported finding in existing workflows before concluding. |
| Package manager not detected and user has not specified one | Stop. Cooldown command and publish command depend on the package manager. |
| Not-yet-published package requires immediate Trusted Publisher setup | Stop. Trusted Publisher requires a published package to configure. Emit the first-publish command in the handoff instead. |

**Rollback:** Any local file written by this skill is reversible by reverting the corresponding commit. No remote state is changed; no rollback of remote state is needed.

## Output
`.github/workflows/publish.yaml` (hardened CI release workflow draft), `.github/workflows/check-workflows.yaml` (zizmor lint workflow), project config files with cooldown and postinstall-disablement settings, and `publish-setup-handoff.md` (human handoff listing every Trusted Publisher entry, 2FA enforcement, tag ruleset, immutable-releases setting, token revocation, first-publish command, and tag-to-approve release flow); no credential is removed, no remote setting or tag is changed, no release is published.
