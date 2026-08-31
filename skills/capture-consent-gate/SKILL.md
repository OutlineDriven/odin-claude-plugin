---
name: capture-consent-gate
description: 'Use when a user starts a recording before this process has acknowledged the what-gets-captured disclosure. Withholds recording until the user reviews and acknowledges the disclosure; later starts in the same process begin silently.'
---

# Capture consent gate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User starts a recording while this process has not yet acknowledged the what-gets-captured disclosure |
| Authority | Reversible local: set one in-memory reviewed flag only; no file, persistence, or remote mutation |
| Side effect | None on denial (recording never starts); on acknowledgement sets an in-memory reviewed flag only — no persistence, a new process re-prompts |
| Done | Recording proceeds only after the user reviewed the disclosure; every later start in the same process starts silently |

## Inputs

- A recording-start request from the user (required).
- An in-memory reviewed flag for this process (internal, defaults to false).

## Procedure

1. On receiving a recording-start request, check the in-memory reviewed flag for this process. **Done when:** the flag is checked.
2. If the flag is already true, allow recording to start silently and stop. **Done when:** recording starts silently (flag was already true).
3. If the flag is false, present the what-gets-captured disclosure to the user. The disclosure must state what data the recording captures, where it is stored, and who can access it. **Done when:** the disclosure is presented to the user.
4. Require explicit user acknowledgement of the disclosure before proceeding. Do not auto-acknowledge, default-accept, or allow recording to start without acknowledgement. **Done when:** the user explicitly acknowledges or declines.
5. If the user acknowledges, set the in-memory reviewed flag to true and allow recording to start. **Done when:** the flag is set to true and recording starts.
6. If the user declines or dismisses the disclosure without acknowledging, do not start recording. Leave the reviewed flag false. **Done when:** recording is withheld and the flag remains false.

## Failure and recovery
- **User declines or dismisses the disclosure:** recording does not start; the reviewed flag remains false; the next start request re-prompts. No state to roll back — nothing was mutated.
- **Process restarts before acknowledgement:** the in-memory flag is lost; a new process re-prompts on the next start. This is the intended behavior, not a failure.
- **Disclosure cannot be displayed:** do not start recording; report that the disclosure is unavailable and the start is blocked. Never bypass the gate or start recording without acknowledgement.

## Output
Either recording starts after the user acknowledged the disclosure (with the in-memory reviewed flag set to true for the remainder of this process), or recording is withheld and the user is told the disclosure must be reviewed first.

## Provenance

Adapted from microsoft/skill-recorder (revision c7f2fe4402527a0eb7f4fc1b653bf438229bac61, MIT license). Source files: electron/recording-privacy.ts, src/RecordingPrivacyWarning.tsx, src/WhatsRecorded.tsx. Clean-room adaptation of the consent-gate mechanism: the disclosure-before-capture pattern and the per-process reviewed flag are reimplemented as a self-contained procedure without copying source expression. MIT license requires retaining the copyright notice; no Microsoft trademarks are used in this adaptation.
