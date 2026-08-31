---
name: xcode-project-sync
description: 'Use when /xcode-project-sync must regenerate an Xcode project from project.yml through gstack templates. Verifies preconditions, checks freshness, regenerates, reviews the diff, and confirms the build. Not for handwritten Swift files, edits outside the generated xcodeproj, a missing project.yml, or simulator testing; use xcode-simulator-testing for the latter.'
---

# Xcode project sync

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /xcode-project-sync after project edits to regenerate the Xcode project from its declarative manifest. |
| Authority | Reversible-local: write only the regenerated xcodeproj built from project.yml; roll back via `git restore` of the xcodeproj. Never edit handwritten Swift or hand-patch generated files. |
| Side effect | Regenerates the xcodeproj from project.yml without modifying handwritten Swift files. |
| Done | The regenerated project builds: `swift build` and `xcodebuild -scheme <SchemeName>` both succeed. |

## Inputs

- `project.yml` in the app root. Must exist; stop if absent.
- The app's Xcode scheme name. Must be supplied or discoverable from the regenerated project.
- The gstack installation root: explicit `GSTACK_ROOT` env var, or the default `~/.claude/skills/gstack`. Must exist and carry a `VERSION` marker file.

## Procedure

1. **Preconditions.** Verify all three prerequisites before proceeding:
   - `project.yml` exists in the app root. If absent, return BLOCKED with "missing project.yml".
   - The gstack root resolves: check `$GSTACK_ROOT` if set, otherwise use `~/.claude/skills/gstack`. The directory must exist and contain a `VERSION` marker file. If the root is missing or has no VERSION marker, return BLOCKED with "missing or invalid gstack root" and name the checked path.
   - The regenerator executable resolves: look for `$GSTACK_ROOT/bin/gstack-project-sync`, then `$GSTACK_ROOT/bin/gstack`, then any executable in `$GSTACK_ROOT/bin/` whose name contains `project` or `sync`. If no regenerator is found, return BLOCKED with "regenerator not found" and list the checked paths.

   Done when: all three preconditions are verified, or BLOCKED is returned with the missing prerequisite named.

2. **Freshness check.** Read the `.gstack-version` marker in the generated xcodeproj and compare it to `$GSTACK_ROOT/VERSION`. Compare the current `project.yml` content against the state recorded at the last regeneration (if a hash or timestamp is stored in the xcodeproj or a sidecar file). If both the gstack version and the project.yml state are unchanged, exit early with "already up to date". Done when: the freshness check is complete and either early-exit is taken or regeneration is confirmed necessary.

3. **Regenerate.** Invoke the resolved regenerator executable with the app root or `project.yml` path as its argument (e.g., `$GSTACK_ROOT/bin/gstack-project-sync <app_root>/project.yml`). The regenerator removes obsolete generated files, emits the current xcodeproj, and no-ops on a composite-hash cache hit (Swift version, generator git rev, lockfile, source content, platform triple). If the regenerator reports an invalid `project.yml` entry, return BLOCKED with "invalid manifest entry" and the regenerator's error message. Done when: the xcodeproj is regenerated from project.yml, or BLOCKED is returned.

4. **Diff review.** Review the generated diff under the xcodeproj. Confirm the regenerator did not modify the app's handwritten Swift files. Canonical template files are regenerated from upstream and should not be hand-edited; keep app-specific wiring in the app target. If handwritten Swift files appear in the diff, revert via `git restore` of the xcodeproj and return BLOCKED with "handwritten Swift modified by regenerator". Done when: the diff is reviewed and handwritten Swift files are confirmed unmodified.

5. **Build verification.** Run `swift build` against the app's package. Run `xcodebuild -scheme <SchemeName>` against the regenerated project. If either fails, revert via `git restore` of the xcodeproj, surface the compile error, and return BLOCKED with "build failure after regeneration" and the failing command's output. Done when: both `swift build` and `xcodebuild` succeed.

## Failure and recovery

- BLOCKED missing project.yml: stop. The user must create or restore `project.yml` in the app root.
- BLOCKED missing or invalid gstack root: stop. Name the checked path. The user must install gstack or set `GSTACK_ROOT` to the correct location.
- BLOCKED regenerator not found: stop. List the checked paths. The user must install the gstack project-sync tool or verify the executable name.
- BLOCKED invalid manifest entry: the regenerator rejected an entry in `project.yml`. Fix the entry to use a supported type or remove it, then rerun. Do not edit the generated xcodeproj by hand to work around the rejection.
- BLOCKED build failure after regeneration: revert via `git restore` of the xcodeproj. Surface the compile error. Do not proceed with a broken project.
- BLOCKED handwritten Swift modified: revert via `git restore` of the xcodeproj. The regenerator should not touch handwritten Swift; report the affected files.
- xcodeproj unchanged after a project.yml edit: the composite-hash cache matched. Confirm `project.yml` was saved and the cache marker is not stale before rerunning.
- Partial-result rule: if any step fails, the xcodeproj may be in a partially regenerated state. Revert via `git restore` and return BLOCKED with the failing step and what was attempted.

## Output

The regenerated xcodeproj under the app root, a diff summary of changed files, and a terminal classification: DONE (the project builds) or BLOCKED with the failing step and what was attempted. On "already up to date", no files are changed and the freshness result is reported.
