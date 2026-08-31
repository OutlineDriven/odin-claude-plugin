---
name: ios-build-fix
description: 'Use when asked to run /ios-build-fix to fix a failing iOS build or UI behavior through the debug bridge. Not for a clean rebuild — use ios-build-cleanup.'
---

# iOS build fix

## Contract

| Field | Bound contract |
|---|---|
| Trigger | the user runs /ios-build-fix |
| Authority | reversible local edits to the iOS project's Swift source, applied and verified through the iOS debug bridge; the user picks among competing root-cause hypotheses |
| Side effect | project code changes made through the debug bridge, plus snapshot and screenshot fixtures and a regression test written under test/fixtures/ios-fix/ |
| Done | the failing iOS behavior is fixed and verified on a device or simulator, with a reproducing snapshot and a regression test committed alongside the fix |

## Inputs

Required:
- A bug finding with a description of the failing behavior, a screenshot, and the suspected accessibility-tree node. Supplied by the user or a prior QA pass.
- The iOS debug bridge (StateServer) running with a connected device or simulator, identified by UDID.
- The Xcode scheme name and build destination.

Optional:
- The user's choice among plausible root causes, if more than one remains after source tracing.

## Procedure

1. Iron Law gate: do not edit any Swift source until a `GET /state/snapshot` that reproduces the bug is captured. A fix without a reproducing snapshot is rejected.
2. Read the bug finding (description, screenshot, suspected accessibility-tree node).
3. Drive the device into the bug state through the debug bridge: `POST /tap`, `POST /swipe`, `POST /type`, or `POST /state/<key>` (snapshot-eligible fields only).
4. Capture `GET /state/snapshot` and write it to `test/fixtures/ios-fix/<bug-slug>-pre.json`.
5. Capture `GET /screenshot` and write it to `test/fixtures/ios-fix/<bug-slug>-pre.png`.
6. Record one line stating what is wrong and the expected behavior.
7. Locate the root cause. Read the Swift source and trace the buggy screen back to the view model, data flow, and state mutation. Identify the smallest change that fixes the behavior.
8. If more than one plausible root cause remains, present them to the user and let the user pick the one to fix before editing.
9. Apply the fix: edit the Swift source, keeping the diff minimal. Rollback path: `git checkout -- <edited files>` reverts this edit.
10. Rebuild and reinstall: `xcodebuild -scheme <SchemeName> -destination 'platform=iOS,id=<UDID>' build install`. The daemon reconnects the StateServer tunnel after the rebuild; re-deploy through the boot-token rotation flow.
11. Verify: `POST /state/restore` with the pre-bug snapshot to reproduce the state, then take a fresh `GET /screenshot` and compare it against `test/fixtures/ios-fix/<bug-slug>-pre.png`.
12. If the bug visibly persists, the fix did not work: revert the Swift edit (rollback path above) and retry from step 9, up to 3 iterations before escalating to the user.
13. If the bug is gone, capture `test/fixtures/ios-fix/<bug-slug>-post.png`.
14. Add a regression test at `test/fixtures/ios-fix/<bug-slug>.test.ts` that loads the pre-bug snapshot, restores it via `POST /state/restore`, and asserts the post-fix behavior on a real device (gated on a device-available flag).
15. Commit the snapshot fixture, the pre-fix and post-fix screenshots, and the regression test alongside the Swift fix.

## Failure and recovery
- Bug still present after 3 iterations: STOP. Report to the user with the current best hypothesis. Do not claim the done predicate holds.
- `409 schema_mismatch` on `POST /state/restore` after a rebuild: re-codegen the accessors (`swift run gen-accessors`), re-snapshot, then retry verification.
- Device disconnects mid-fix: the daemon auto-reconnects; resume from the verification step (step 11).
- Build fails: revert the Swift edits and investigate the compile error before re-applying the fix. Do not commit a broken build.
- No reproducing snapshot can be captured: do not edit source. Report BLOCKED with what was attempted.
- Partial results: the pre-fix snapshot and screenshot fixtures are kept regardless of outcome. Never delete a reproducing snapshot to force the done predicate.

## Output
A minimal Swift source fix committed with its reproducing snapshot (`<bug-slug>-pre.json`), pre-fix and post-fix screenshots, and a regression test that restores the pre-bug snapshot and asserts the post-fix behavior on a device or simulator. Terminal status is DONE with the verification evidence, or BLOCKED with the blocker and the attempts made.
