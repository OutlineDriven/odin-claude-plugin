---
name: ios-build-cleanup
description: 'Use when the user wants a clean Xcode rebuild by deleting DerivedData and build artifacts. Do not use for diagnosing a specific build error: use ios-build-fix.'
disable-model-invocation: true
---

# iOS build cleanup

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /ios-build-cleanup. |
| Authority | Human-gated: requires explicit human invocation and previews the target and consequence before any irreversible deletion. The model never invokes it autonomously. |
| Side effect | Local deletion of DerivedData and build artifacts only. These artifacts are untracked and regenerable by a rebuild. No source, VCS, credential, or remote mutation. |
| Done | A clean build state is restored: DerivedData and project build artifacts are removed and the next build starts from a clean cache. |

## Inputs

- Project root directory (optional; defaults to the current working directory). Used to locate project-specific build artifacts.
- DerivedData path (optional; defaults to `~/Library/Developer/Xcode/DerivedData`).

## Procedure

1. Resolve the DerivedData directory. Default to `~/Library/Developer/Xcode/DerivedData`. If the user supplies a path, use it.
2. Resolve the deletion targets. Within the project root, resolve project build artifacts: `.build`, `build/`, and `*.xcodeproj`/`*.xcworkspace` build outputs. Under the DerivedData directory, identify this project's entries by Xcode's DerivedData naming rule: each entry is named `<projectName>-<hash>`, where `<projectName>` is the basename of the `.xcodeproj` or `.xcworkspace` file with its extension removed and spaces replaced by the underscore character, and `<hash>` is Xcode's digest of that file's absolute path (a 28-character lowercase alphabetic digest of the NFD-normalized path). Apple does not document this scheme publicly; it is reproduced from Xcode's behavior by `bitrise-io/go-xcode` `xcodecache/derived_data_path.go` (`xcodeProjectDerivedDataPath` + `xcodeDerivedDataHash`, MD5 of the NFD path rendered as 28 base-26 letters). Match directories whose name is `<projectName>-` followed by the hash, anchoring on the exact project name and the dash. Do not match on a bare project-name prefix: a bare prefix over-matches sibling projects whose names share it (a prefix of `MyApp` also catches `MyAppTests-<hash>`), and deletion is irreversible. When the DerivedData path is the shared default, match only this project's entries; when the user supplies a project-specific path, the whole directory is the target.
3. Enumerate every target directory and file that will be deleted. Compute the total size.
4. Present the full target list and total size to the user. State the consequence: deletion is irreversible and the artifacts are untracked, but a rebuild regenerates them.
5. Wait for explicit human confirmation. Do not proceed without it.
6. On confirmation, delete each enumerated target, applying no filter that was not part of the enumeration.
7. Verify each target no longer exists on disk.

## Failure and recovery
- Target not found: If a DerivedData or build-artifact path does not exist, skip it and report it as already-clean. Do not treat absence as an error.
- Permission denied: If deletion fails for a target, stop, report the failing path and error, and leave all remaining targets untouched. Do not retry with elevated privileges.
- Partial deletion: If some targets were deleted and a later target fails, report which targets were deleted and which remain. The clean build state is not achieved; the user must resolve the blocker and re-run.
- No human confirmation: If the user does not confirm, delete nothing and report that the operation was cancelled.

## Output
A report listing every target deleted, every target skipped as already-clean, and any target that failed deletion. The terminal classification is `clean` when all targets are removed or were already absent, or `blocked` when any target could not be deleted.
