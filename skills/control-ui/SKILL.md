---
name: control-ui
description: 'Use when asked to verify or reproduce browser or Electron UI behavior. Capture before and after UI evidence with no leftover processes. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Control UI

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Verify or reproduce browser/Electron UI behavior. |
| Authority | Write only named local evidence artifacts under the working directory and discard spawned processes on exit. Rollback: delete the evidence directory and kill any spawned process. |
| Side effect | Runs the app or a browser locally and captures screenshots, console logs, and DOM state into one named evidence directory. |
| Done | Before/after UI evidence exists in the named directory and no spawned app or browser process remains. |

## Inputs

Required: a UI target that is a local app command, a local URL, or an Electron entry, and the behavior to verify or reproduce.

Optional: a viewport size, an authentication state file, and an evidence directory name (defaults to a timestamped folder under the working directory).

## Procedure

1. Bound scope: confirm the target is a local app command, local URL, or Electron entry the human supplied. Refuse remote URLs or targets requiring credentials the human did not provide.
2. Create or reuse the named evidence directory under the working directory.
3. Capture the before state: launch the app or browser, navigate to the target, and record the viewport, screenshot, console log, and relevant DOM state into the evidence directory as `before.*`.
4. Perform or reproduce the behavior under verification (click, input, navigation, or the reported reproduction steps). Record each step taken.
5. Capture the after state: record the screenshot, console log, and DOM state into the evidence directory as `after.*`.
6. Compare before and after evidence against the expected behavior. Record pass, fail, or mismatch with the differing evidence file names.
7. Terminate every spawned app or browser process and confirm none remain.

## Failure and recovery
- Launch failure: the app or browser did not start. Record the error, leave no process, and return blocked with the launch error.
- Behavior not reproducible: the after state matches the before state. Record both evidence sets and return the mismatch classification; do not invent a difference.
- Process leak: a spawned process remains after capture. Kill it by PID; if it cannot be killed, return blocked naming the PID.
- Partial result: if capture fails mid-run, keep the before evidence, discard incomplete after artifacts, and return blocked naming the failed capture step.
- Rollback: delete the evidence directory and kill any spawned process; the working tree returns to its prior state.

## Output
A before/after evidence directory containing screenshots, console logs, and DOM state, plus a one-line classification (pass, fail, mismatch, or blocked) citing the evidence file names.

## Provenance

Origin: cursor/plugins, cursor-team-kit/skills/control-ui/SKILL.md. Pinned revision 68836ddaf5697224520f1847d90cdb90ca8babaa. License: MIT, declared by the cursor/plugins root README and the candidate plugin manifest. Clean-room adaptation: the procedure is rewritten from the source mechanism (UI verification harness with before/after evidence) without copying its expression.
