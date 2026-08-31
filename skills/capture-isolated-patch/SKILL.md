---
name: capture-isolated-patch
description: 'Use when a candidate change must be produced without touching the working tree; an ephemeral worktree runs the declared command and returns a binary-safe patch plus its exit code. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Capture isolated patch

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A candidate change must be produced without touching the working tree. |
| Authority | Reversible local writes only: write to an ephemeral worktree and a temporary patch file under the repository's worktree metadata; never write to the original working tree. Rollback is `git worktree remove <path>`. |
| Side effect | Creates an ephemeral worktree, runs the declared command inside it, and returns the exit code plus a binary-safe patch path. No commit, no push, no merge. The worktree is preserved on extraction failure. |
| Done | Patch bytes are returned, or the failure is preserved for inspection; the original working tree is unchanged either way. |

## Inputs

- `command` (required): the shell command that produces the candidate change. Run it inside the ephemeral worktree, with that worktree as its working directory.
- `base-ref` (optional): the git ref the worktree is created from. Defaults to the current `HEAD`.
- `repo-path` (optional): path to the repository. Defaults to the current working directory.

## Procedure

1. Require `command`. Accept optional `base-ref` (default: current `HEAD`) and optional `repo-path` (default: current working directory). **Done when:** the command is present and optional inputs are resolved to defaults or supplied values.
2. Verify `repo-path` is a git work tree and `base-ref` resolves with `git rev-parse --verify <base-ref>`. Stop and report the exact failing check before creating any worktree if either check fails. **Done when:** both checks pass, or the failing check is named and the run stops.
3. Create an ephemeral worktree at a fresh temporary path with `git worktree add --detach <tmp-path> <base-ref>`. Record `<tmp-path>` as the worktree path. **Done when:** the worktree is created and its path is recorded, or the git error is reported.
4. Run `command` inside the worktree with the worktree as its working directory. Capture stdout, stderr, and the exit code. Do not commit, push, or merge. **Done when:** the command returns with stdout, stderr, and exit code captured.
5. After the command returns, compute the worktree diff against `base-ref` with `git -C <tmp-path> diff --binary <base-ref>` so binary file changes are representable. Write the diff to a patch file under the worktree's parent temporary directory. **Done when:** the binary-safe diff is written to a patch file, or the extraction failure is captured.
6. If extraction succeeds, remove the ephemeral worktree with `git worktree remove <tmp-path>` and return the patch file path, the command exit code, and captured stdout/stderr. **Done when:** the worktree is removed and the patch path, exit code, and output are returned.
7. If extraction fails, preserve the worktree in place and return the worktree path, the command exit code, and the failure reason. Do not delete the worktree. **Done when:** the worktree is preserved and its path, exit code, and failure reason are returned.

## Failure and recovery
- **Bad input** (non-repo path or unresolvable `base-ref`): stop before creating any worktree; report the exact check that failed. No mutation occurs; the original working tree is unchanged.
- **Worktree creation failure:** no worktree exists; report the git error. Original tree unchanged.
- **Command non-zero exit:** still extract the patch from whatever changes the command made and return the non-zero exit code alongside the patch. A non-zero command exit is not a skill failure.
- **Extraction failure:** preserve the worktree for inspection; return its path and the failure reason instead of a patch. Do not delete the worktree.
- **Rollback:** the original working tree is never written to. On success, cleanup is `git worktree remove <tmp-path>`. On extraction failure the worktree is intentionally retained for inspection.

## Output
On success, a binary-safe patch file path, the command's exit code, and captured stdout/stderr; on extraction failure, the preserved worktree path, the command's exit code, and the failure reason; the original working tree is unchanged in every case.

## Provenance

- Origin: `cobusgreyling/loop-engineering`; source paths `/tools/loop-sandbox/src/sandbox.ts`, `/tools/loop-sandbox/README.md`, `/stories/loop-sandbox-ephemeral-isolation.md`.
- Pinned revision: `d03dcb92cc1e0efb59789a2557131c6ad5897ccc`.
- License: MIT.
- Adaptation: clean-room adaptation of the ephemeral-worktree isolation mechanism into a self-contained procedure; no third-party expression copied.
