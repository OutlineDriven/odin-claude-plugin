---
name: package-native-pre-commit
description: 'Use when a repo needs package-manager-native commit-time checks. Install the hook, dependencies, and config, then prove them by exercising all configured checks on a real commit. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Package native pre commit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A repo needs package-manager-native commit-time checks. |
| Authority | Reversible local: write only named local artifacts (hook config, dependency entries, hook scripts). State the rollback path before any write. |
| Side effect | Hook, dependencies, and config installed in the working tree. |
| Done | A real commit exercises all configured existing checks successfully. |

## Inputs

1. **Repository root** (required): the working tree that needs commit-time checks. Must contain a recognized package manager manifest (`package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, or equivalent). If no manifest exists, stop and report the blocker.
2. **Check tool** (optional): the specific pre-commit framework or package-manager-native hook mechanism to install (e.g., `husky`, `lefthook`, `pre-commit`, `cargo-husky`, `go-pre-commit`). If omitted, detect the dominant package manager from the manifest and select its native hook mechanism.

## Procedure

1. Identify the package manager from the repository manifest. If multiple manifests exist, ask the user which one governs commit-time checks.
2. Determine the native hook mechanism for that package manager. Prefer the package-manager-native approach over a generic framework when one exists.
3. Install the hook mechanism as a project dependency using the package manager's install command.
4. Configure the hook mechanism to run the project's existing check commands (lint, type-check, format-check, test) on pre-commit. Use the commands already defined in the repository's scripts or configuration; do not invent new checks.
5. Write the hook configuration file and any hook scripts to the paths the mechanism requires.
6. Run the package manager's install command to activate the hooks in `.git/hooks` or the mechanism's hook directory.
7. Stage a trivial change (e.g., add a blank line to a tracked file), commit it, and observe the hook output. All configured checks must pass.
8. If any check fails, diagnose whether the failure is in the check itself or in the hook wiring. Fix the hook wiring if the issue is there; report the check failure if the issue is in the check.
9. Revert the trivial test commit and its staged change after verification.

## Failure and recovery
- **No manifest found**: stop immediately. Report that no recognized package manager manifest exists in the repository root. Do not proceed.
- **Ambiguous package manager**: stop and ask the user which manifest governs commit-time checks. Do not guess.
- **Hook install fails**: report the exact error from the package manager. Do not retry with a different mechanism unless the user instructs it.
- **Check fails during verification commit**: distinguish between hook-wiring failures (fixable here) and check-content failures (reported to the user). Do not modify check logic.
- **Rollback**: all writes are to local files tracked by the package manager or git. Revert by removing the installed dependency entry, deleting the hook config file, and running the package manager's uninstall command. State this rollback path before writing.

## Output
- Hook mechanism installed as a project dependency.
- Hook configuration file written to the mechanism's expected path.
- Hooks activated in the local git repository.
- Verification report: the commit hash, which checks ran, and pass/fail status for each.

## Provenance

- Origin: `mattpocock/skills` at revision `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76`.
- Source paths: `skills/misc/setup-pre-commit/SKILL.md`, `skills/misc/setup-pre-commit/agents/openai.yaml`.
- License: MIT. Copyright (c) 2026 Matt Pocock. Retain the copyright and permission notice in licenses/NOTICE.
- Adaptation: clean-room adaptation into odin-code. The source installs package-manager-native commit-time checks verified by a real commit exercising all configured checks. This adaptation preserves that mechanism, adds explicit manifest detection, distinguishes hook-wiring from check-content failures, and requires rollback-path disclosure before writes.
