---
name: session-describe-analysis
description: 'Use when a user clicks Analyze on a recorded session to produce an editable analysis with overall intent and ordered steps that gates builder unlock upon approval. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Session describe analysis

## Contract

| Field | Bound contract |
|---|---|
| Trigger | user clicks Analyze on a recorded session |
| Authority | reversible-local: write only named local artifacts in the session directory; rollback by deleting analysis.json and description.md |
| Side effect | sends only redacted timeline, events, and frames to the provider; persists analysis.json and description.md in the session dir |
| Done | one overall intent plus an ordered list of steps exists in description.md, user-editable until approved; approval unlocks the builders |

## Inputs

- **Session directory** (required): path to the recorded session containing timeline, events, and frames.
- **Provider configuration** (required): model endpoint capable of processing the redacted session bundle.

## Procedure

1. Validate that the session directory exists and contains timeline, events, and frame data. If any required artifact is missing, stop and report the gap.
2. Read the session bundle: timeline, events, and frames from the session directory.
3. Redact the bundle: strip credentials, tokens, personal identifiers, and any content outside the recorded interaction before provider submission. Only redacted data leaves the local boundary.
4. Send the redacted bundle to the configured provider with instructions to identify one overall intent and produce an ordered list of interaction steps.
5. Receive the provider response and persist two artifacts in the session directory:
   - `analysis.json`: structured representation with `intent` (string) and `steps` (ordered array of step objects, each with `index`, `action`, and `evidence` fields).
   - `description.md`: human-readable prose rendering the same intent and steps, editable by the user.
6. Mark the description as pending approval. The user reviews and edits description.md. Upon explicit approval, unlock the builder tools for downstream artifact generation from the approved steps.

## Failure and recovery
- **Missing session data**: stop before step 3. No artifacts written. Report which required file is absent.
- **Provider error**: stop after step 4. No partial artifacts written. Report the provider error. User may retry.
- **Redaction failure**: stop before step 3. Do not send unredacted data. Report the redaction gap.
- **Approval not granted**: description.md remains in pending state. Builders stay locked. No timeout or auto-approval.

## Output
- `analysis.json` in the session directory: structured intent and ordered steps.
- `description.md` in the session directory: human-readable, user-editable analysis pending approval.
- Upon approval: builder tools unlocked for downstream artifact generation from approved steps.

## Provenance

Adapted from Microsoft skill-recorder (https://github.com/microsoft/skill-recorder), commit c7f2fe4402527a0eb7f4fc1b653bf438229bac61. Source paths: electron/describer/instructions.ts, electron/describer/tools.ts, electron/describer/describer.ts, common/analysis.ts, common/bundle.ts, electron/pipeline.ts. License: MIT (Copyright Microsoft Corporation). Clean-room adaptation: procedure and artifact contracts re-derived for the ODIN session-analysis workflow; no third-party expression copied.
