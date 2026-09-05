---
name: ios-build-fix
description: 'Use when asked to run /ios-build-fix to fix a failing iOS build, regenerate an Xcode project from project.yml, or correct UI behavior. Not for a clean rebuild: use ios-build-cleanup.'
---

# iOS build fix

## Mode A — Debug-bridge UI-fix

### Contract

| Field | Bound contract |
|---|---|
| Trigger | the user runs /ios-build-fix |
| Authority | Reversible local: writes the iOS project's Swift source plus snapshot and screenshot fixtures and the regression test under test/fixtures/ios-fix/, applied and verified through the iOS debug bridge; rollback is version control. No remote mutation. The user picks among competing root-cause fixes. |
| Side effect | project code changes edited directly, rebuilt and verified through the debug bridge, plus snapshot and screenshot fixtures and a regression test written under test/fixtures/ios-fix/ |
| Done | the failing iOS behavior is fixed and verified on a device or simulator, with a reproducing snapshot and a regression test committed alongside the fix |

### Inputs

Required:
- A bug finding with a description of the failing behavior, a screenshot, and the suspected accessibility-tree node. Supplied by the user or a prior QA pass.
- The iOS debug bridge (StateServer) running with a connected device or simulator, identified by UDID.
- The Xcode scheme name and build destination.

Optional:
- The user's choice among plausible root causes, if more than one remains after source tracing.

### Procedure

1. Do not edit any Swift source until a `GET /state/snapshot` that reproduces the bug is captured. A fix without a reproducing snapshot is rejected.
2. Read the bug finding (description, screenshot, suspected accessibility-tree node).
3. Drive the device into the bug state through the debug bridge: `POST /tap`, `POST /swipe`, `POST /type`, or `POST /state/<key>` (snapshot-eligible fields only).
4. Capture `GET /state/snapshot` and write it to `test/fixtures/ios-fix/<bug-slug>-pre.json`.
5. Capture `GET /screenshot` and write it to `test/fixtures/ios-fix/<bug-slug>-pre.png`.
6. Record one line stating what is wrong and the expected behavior.
7. Locate the root cause. Read the Swift source and trace the buggy screen back to the view model, data flow, and state mutation. Identify the smallest change that fixes the behavior.
8. If more than one plausible root cause remains, present them to the user and let the user pick the one to fix before editing.
9. Apply the fix: edit the Swift source, keeping the diff minimal. Rollback path: `git checkout -- <edited files>` reverts this edit.
10. Rebuild and reinstall: `xcodebuild -scheme <SchemeName> -destination <BuildDestination> build`, then `xcrun simctl install <UDID> <app-path>` on a simulator or `ios-deploy --bundle <app-path> --id <UDID>` on a device. The daemon reconnects the StateServer tunnel after the rebuild; re-deploy through the boot-token rotation flow.
11. Verify: `POST /state/restore` with the pre-bug snapshot to reproduce the state, then take a fresh `GET /screenshot` and compare it against `test/fixtures/ios-fix/<bug-slug>-pre.png`.
12. If the bug visibly persists, the fix did not work: revert the Swift edit (`git checkout -- <edited files>`) and retry from step 9, up to 3 iterations before escalating to the user.
13. If the bug is gone, capture `test/fixtures/ios-fix/<bug-slug>-post.png`.
14. Add a regression test at `test/fixtures/ios-fix/<bug-slug>.test.ts` that loads the pre-bug snapshot, restores it via `POST /state/restore`, and asserts the post-fix behavior on a real device (gated on a device-available flag).
15. Commit the snapshot fixture, the pre-fix and post-fix screenshots, and the regression test alongside the Swift fix.

### Failure and recovery

- Bug still present after 3 iterations: STOP. Report to the user with the current best hypothesis. Do not claim the done predicate holds.
- `409 schema_mismatch` on `POST /state/restore` after a rebuild: re-codegen the accessors (`swift run gen-accessors`), re-snapshot, then retry verification.
- Device disconnects mid-fix: the daemon auto-reconnects; resume from the verification step (step 11).
- Build fails: revert the Swift edits and investigate the compile error before re-applying the fix. Do not commit a broken build.
- No reproducing snapshot can be captured: do not edit source. Report BLOCKED with what was attempted.
- Partial results: the pre-fix snapshot and screenshot fixtures are kept regardless of outcome. Never delete a reproducing snapshot to force the done predicate.

### Output

A minimal Swift source fix committed with its reproducing snapshot (`<bug-slug>-pre.json`), pre-fix and post-fix screenshots, and a regression test that restores the pre-bug snapshot and asserts the post-fix behavior on a device or simulator. Terminal status is DONE with the verification evidence, or BLOCKED with the blocker and the attempts made.

## Mode B — Declarative XcodeGen regeneration

### Contract

| Field | Bound contract |
|---|---|
| Trigger | the user asks to regenerate an Xcode project from `project.yml` via XcodeGen, or the skill detects that the generated xcodeproj is stale after `project.yml` changed |
| Authority | Reversible local: write only the regenerated xcodeproj built from `project.yml`; roll back via `git restore` of the xcodeproj. Never edit handwritten Swift or hand-patch generated files. |
| Side effect | Regenerates the xcodeproj from `project.yml` without modifying handwritten Swift files. |
| Done | The regenerated project builds: `xcodebuild -scheme <SchemeName>` succeeds, and `swift build` also succeeds when the app root has a `Package.swift`; or the freshness check reports "already up to date" with the freshness result reported; the early exit is DONE in Output. |

### Inputs

- `project.yml` in the app root. Must exist; stop if absent.
- The app's Xcode scheme name. Must be supplied or discoverable from the regenerated project.
- The generator command. Default and preferred: `xcodegen generate` on PATH. Required if the project does not use xcodegen, in which case that command must resolve on PATH.

### Procedure

1. Resolve the generator command. Default and preferred: `xcodegen generate`. If the default is requested and `xcodegen` is not on PATH, return BLOCKED with "xcodegen not found" and list the checked PATH. If a non-default command is requested and is not on PATH, return BLOCKED with "generator command not found" and list the checked PATH.
2. Verify `project.yml` exists in the app root. If absent, return BLOCKED with "missing project.yml".
3. Check freshness: hash the current `project.yml` content and compare the hash to the value recorded inside the generated xcodeproj bundle. Look for a recorded hash in a known comment or sidecar file within the bundle; if no recorded hash is found, proceed with regeneration. If the hashes match, exit with "already up to date".
4. Save the uncommitted handwritten Swift diff (`mkdir -p .outline && git diff -- "*.swift" > .outline/ios-regen-pre.patch`). Run the resolved generator command against the app root or `project.yml` path. The generator removes obsolete generated files and emits the current xcodeproj. If the generator reports an invalid `project.yml` entry, return BLOCKED with "invalid manifest entry" and the generator's error message.
5. Review the generated diff under the xcodeproj. Confirm the generator did not modify the app's handwritten Swift files. Canonical template files are regenerated from upstream and should not be hand-edited; keep app-specific wiring in the app target. If handwritten Swift files appear in the generated diff, revert via `git restore` of the xcodeproj, then restore those files by applying the saved patch first (`git apply .outline/ios-regen-pre.patch`) when the patch is non-empty; fall back to `git checkout -- <file>` only for files that were clean before the run. Return BLOCKED with "handwritten Swift modified by regenerator".
6. Build. If the app root has a `Package.swift`, run `swift build` against the app's package; without one, the project has no SwiftPM package to build. Run `xcodebuild -scheme <SchemeName>` against the regenerated project. If a required build fails, revert via `git restore` of the xcodeproj, surface the compile error, and return BLOCKED with "build failure after regeneration" and the failing command's output.
7. If the required builds succeed and the generated diff contains only expected xcodeproj files, classify DONE. The regenerated xcodeproj is left uncommitted; the build verification covers it.

### Failure and recovery

- BLOCKED "xcodegen not found" (when the default `xcodegen generate` is requested and `xcodegen` is not on PATH): list the checked PATH. The user must install xcodegen or supply an alternate generator command.
- BLOCKED "generator command not found" (when a non-xcodegen command is requested and is not on PATH): list the checked PATH. The user must install the generator or correct the command.
- BLOCKED "missing project.yml": stop. The user must create or restore `project.yml` in the app root.
- BLOCKED "invalid manifest entry": the generator rejected an entry in `project.yml`. Fix the entry to use a supported type or remove it, then rerun. Do not edit the generated xcodeproj by hand to work around the rejection.
- BLOCKED "build failure after regeneration": revert via `git restore` of the xcodeproj. Surface the compile error. Do not proceed with a broken project.
- BLOCKED "handwritten Swift modified": revert via `git restore` of the xcodeproj, then restore those files by applying the saved patch first (`git apply .outline/ios-regen-pre.patch`) when the patch is non-empty; fall back to `git checkout -- <file>` only for files that were clean before the run. The generator should not touch handwritten Swift; report the affected files.
- xcodeproj unchanged after a `project.yml` edit: the recorded hash matched. Confirm `project.yml` was saved and the recorded hash is not stale before rerunning.
- Partial-result rule: if any step fails, the xcodeproj may be in a partially regenerated state. Revert via `git restore` and return BLOCKED with the failing step and what was attempted.

### Output

The regenerated xcodeproj under the app root, a diff summary of changed files, and a terminal classification: DONE (the project builds, or the freshness check reports "already up to date") or BLOCKED with the failing step and what was attempted. On "already up to date", no files are changed and the freshness result is reported.
