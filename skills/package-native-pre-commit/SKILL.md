---
name: package-native-pre-commit
description: 'Use when a repo needs package-manager-native commit-time checks. Installs the hook, dependencies, and config, then proves them by exercising all configured checks on a real commit. Not for remote, credential, publish, deploy, or irreversible changes.'
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

1. Identify the package manager from the repository manifest. If multiple manifests exist, ask the user which one governs commit-time checks. Done when: the governing package manager is identified.
2. Determine the native hook mechanism for that package manager. Prefer the package-manager-native approach over a generic framework when one exists. Done when: the native hook mechanism is determined.
3. Install the hook mechanism as a project dependency using the package manager's install command. Done when: the hook mechanism is installed as a project dependency.
4. Configure the hook mechanism to run the project's existing check commands (lint, type-check, format-check, test) on pre-commit. Use the commands already defined in the repository's scripts or configuration; do not invent new checks. Done when: the hook is configured to run existing check commands with no invented checks.
5. Write the hook configuration file and any hook scripts to the paths the mechanism requires. Done when: the hook configuration file and scripts are written to the mechanism's required paths.
6. Run the package manager's install command to activate the hooks in `.git/hooks` or the mechanism's hook directory. Done when: hooks are activated in the git repository or mechanism's hook directory.
7. Stage a trivial change (e.g., add a blank line to a tracked file), commit it, and observe the hook output. All configured checks must pass. Done when: a trivial commit is made and all configured checks pass.
8. If any check fails, diagnose whether the failure is in the check itself or in the hook wiring. Fix the hook wiring if the issue is there; report the check failure if the issue is in the check. Done when: the failure is diagnosed as hook-wiring or check-content, and hook-wiring failures are fixed.
9. Revert the trivial test commit and its staged change after verification. Done when: the trivial test commit and staged change are reverted.

## Failure and recovery

- **No manifest found**: stop immediately. Report that no recognized package manager manifest exists in the repository root. Do not proceed.
- **Ambiguous package manager**: stop and ask the user which manifest governs commit-time checks. Do not guess.
- **Hook install fails**: report the exact error from the package manager. Do not retry with a different mechanism unless the user instructs it.
- **Check fails during verification commit**: distinguish between hook-wiring failures (fixable here) and check-content failures (reported to the user). Do not modify check logic.
- **Rollback**: all writes are to local files tracked by the package manager or git. Revert by removing the installed dependency entry, deleting the hook config file, and running the package manager's uninstall command. State this rollback path before writing.

## Output

Hook mechanism installed as a project dependency, hook configuration file at the mechanism's expected path, hooks activated in the local git repository, and a verification report with commit hash, checks run, and pass/fail status for each.
