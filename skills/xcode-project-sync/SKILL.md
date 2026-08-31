---
name: xcode-project-sync
description: 'Use when the user runs /xcode-project-sync to regenerate the Xcode project from project.yml through gstack templates after project edits. Do not use for handwritten Swift files, edits outside the regenerated xcodeproj, or when `project.yml` is absent.'
---

# Xcode project sync

## Contract

| Field | Bound contract |
|---|---|
| Trigger | the user runs /xcode-project-sync after project edits |
| Authority | reversible-local: write only the regenerated xcodeproj built from project.yml; rollback via git restore of the xcodeproj |
| Side effect | the regenerated xcodeproj built from project.yml; handwritten Swift files are not modified |
| Done | the regenerated project builds |

## Inputs

- `project.yml` in the app root — must exist; stop if absent.
- The app's Xcode scheme name — must be supplied or discoverable from the regenerated project.
- `GSTACK_ROOT` or the installed gstack root — optional; defaults to `~/.claude/skills/gstack`.

## Procedure

1. Read `project.yml` from the app root. Stop if it is absent.
2. Detect the installed gstack version from the `.gstack-version` marker in the generated xcodeproj; read the upstream version from `$GSTACK_ROOT/VERSION`. If the versions match and `project.yml` is unchanged since the last regeneration, exit early with "already up to date".
3. Regenerate the xcodeproj from `project.yml` through the gstack template regenerator. The regenerator resolves its own gstack root, copies only the supported template files, removes obsolete generated files before emitting the current xcodeproj, and uses a composite-hash cache key (Swift version, generator git rev, lockfile, source content, and platform triple) to no-op when nothing changed.
4. Review the generated diff under the xcodeproj. Confirm the regenerator did not modify the app's handwritten Swift files. Canonical template files are regenerated from upstream and should not be hand-edited; keep app-specific wiring in the app target.
5. Verify: `swift build` succeeds against the app's package; `xcodebuild -scheme <SchemeName>` succeeds.

## Failure and recovery
- **Swift compile fails after regeneration.** Revert via `git restore` of the xcodeproj; surface the compile error. Do not proceed with a broken project.
- **Regenerator reports an invalid `project.yml` entry.** Fix the entry to use a supported type or remove it; rerun. Do not edit the generated xcodeproj by hand to work around the rejection.
- **xcodeproj unchanged after a `project.yml` edit.** The composite-hash cache matched; confirm `project.yml` was saved and the cache marker is not stale before rerunning.
- **Regenerator sees generated sources.** Pass the narrow app source directory; the regenerator excludes generated paths automatically.
- **Partial-result rule.** If any step fails, the xcodeproj is in a partially regenerated state; revert via `git restore` and report BLOCKED with the failing step.

## Output
The regenerated xcodeproj under the app root, a diff summary of changed files, and a terminal classification: the project builds (DONE), or BLOCKED with the failing step and what was attempted.

## Provenance

Origin: https://github.com/garrytan/gstack, revision `07b59e396c6be5a86619a43151cb9ed62a15ae69`, path `ios-sync/SKILL.md`. License: MIT, Copyright (c) 2026 Garry Tan. Clean-room adaptation: the gstack iOS debug-bridge resync procedure was re-derived as an Xcode project regeneration skill; no third-party expression was copied wholesale.
