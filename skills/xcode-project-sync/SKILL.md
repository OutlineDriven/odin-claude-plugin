---
name: xcode-project-sync
description: 'Use when /xcode-project-sync must regenerate an Xcode project from project.yml through gstack templates. Not for handwritten Swift files, edits outside the generated xcodeproj, or a missing project.yml; not for simulator testing — use xcode-simulator-testing.'
---

# Xcode project sync

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /xcode-project-sync after project edits. |
| Authority | Reversible-local: write only the regenerated xcodeproj built from project.yml; roll back via `git restore` of the xcodeproj. |
| Side effect | Regenerates the xcodeproj from project.yml without modifying handwritten Swift files. |
| Done | The regenerated project builds. |

## Inputs

- `project.yml` in the app root — must exist; stop if absent.
- The app's Xcode scheme name — must be supplied or discoverable from the regenerated project.
- `GSTACK_ROOT` or the installed gstack root — optional; defaults to `~/.claude/skills/gstack`.

## Procedure

1. Read `project.yml` from the app root. Stop if it is absent. Done when: `project.yml` is read and confirmed present.
2. Detect the installed gstack version from the `.gstack-version` marker in the generated xcodeproj; read the upstream version from `$GSTACK_ROOT/VERSION`. If the versions match and `project.yml` is unchanged since the last regeneration, exit early with "already up to date". Done when: the version check is complete and either early-exit is taken or regeneration is confirmed necessary.
3. Regenerate the xcodeproj from `project.yml` through the gstack template regenerator. The regenerator resolves its own gstack root, copies only the supported template files, removes obsolete generated files before emitting the current xcodeproj, and uses a composite-hash cache key (Swift version, generator git rev, lockfile, source content, and platform triple) to no-op when nothing changed. Done when: the xcodeproj is regenerated from `project.yml`.
4. Review the generated diff under the xcodeproj. Confirm the regenerator did not modify the app's handwritten Swift files. Canonical template files are regenerated from upstream and should not be hand-edited; keep app-specific wiring in the app target. Done when: the diff is reviewed and handwritten Swift files are confirmed unmodified.
5. Verify: `swift build` succeeds against the app's package; `xcodebuild -scheme <SchemeName>` succeeds. Done when: both `swift build` and `xcodebuild` succeed.

## Failure and recovery
- **Swift compile fails after regeneration**: revert via `git restore` of the xcodeproj; surface the compile error. Do not proceed with a broken project.
- **Regenerator reports an invalid `project.yml` entry**: fix the entry to use a supported type or remove it; rerun. Do not edit the generated xcodeproj by hand to work around the rejection.
- **xcodeproj unchanged after a `project.yml` edit**: the composite-hash cache matched; confirm `project.yml` was saved and the cache marker is not stale before rerunning.
- **Regenerator sees generated sources**: pass the narrow app source directory; the regenerator excludes generated paths automatically.
- **Partial-result rule**: if any step fails, the xcodeproj is in a partially regenerated state; revert via `git restore` and report BLOCKED with the failing step.

## Output
The regenerated xcodeproj under the app root, a diff summary of changed files, and a terminal classification: the project builds (DONE), or BLOCKED with the failing step and what was attempted.
