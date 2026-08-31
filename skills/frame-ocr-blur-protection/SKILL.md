---
name: frame-ocr-blur-protection
description: 'Use when a raster frame is requested for the describer while advanced protection is enabled, redact detected sensitive values by compositing opaque pixel boxes over OCR word spans so only redacted frames leave the frame store. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Frame OCR blur protection

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A raster frame is requested for the describer while advanced protection is enabled |
| Authority | Composite opaque pixel boxes over requested frames in memory only; discard the composited frame to roll back |
| Side effect | OCR word spans map to padded pixel boxes composited as opaque rectangles over detected sensitive values, including cross-feed from clean-text-known session values and cards split across OCR tokens |
| Done | Only redacted frames leave the frame store; clean frames pass unchanged; coverage proven by evals/sensitive/frames + opt-in real-OCR harness |

## Inputs

- A requested raster frame from the describer frame pipeline.
- The advanced-protection flag; when false the frame passes unchanged and this skill does not act.
- OCR word spans with bounding boxes for the frame (produced by the OCR pass over the frame).
- Clean-text-known session values, optional, used as cross-feed to detect sensitive values not visible as literal spans.

## Procedure

1. Receive the requested raster frame. If advanced protection is not enabled, pass the frame through unchanged and stop.
2. Run OCR over the frame to obtain word spans with bounding boxes.
3. Detect sensitive values: match word spans against sensitive patterns; cross-feed clean-text-known session values to catch values not present as literal spans; reassemble cards split across OCR tokens before matching.
4. For each detected sensitive span, expand its bounding box to a padded pixel box.
5. Composite opaque rectangles over the padded boxes in memory, producing a redacted frame. Compositing touches only the requested frame; the original raster outside this request is untouched.
6. On any OCR failure, unresolvable span, or uncertain sensitive-value boundary, withhold the frame (fail-closed) rather than ship an unredacted or partially redacted frame.
7. Store only the redacted frame in the frame store. Clean frames with no detected sensitive values pass through unchanged.
8. Confirm coverage with evals/sensitive/frames and the opt-in real-OCR harness before treating the done predicate as holding.

## Failure and recovery
- OCR failure or OCR unavailable: withhold the frame; return no frame from the store. Never ship an unredacted frame.
- Unresolvable or ambiguous sensitive span: treat the span as sensitive and withhold the frame.
- Partial result: a partially redacted frame is never shipped. The outcome is either a fully redacted frame or a withheld frame.
- Rollback: discard the in-memory composited frame. The original raster is unchanged outside the requested-frame scope, so re-requesting yields the unredacted source for a fresh pass.
- Blocked result: when the done predicate cannot be proven, report the frame as withheld with the failure class; do not assert redaction succeeded.

## Output
A redacted raster frame placed in the frame store, or no frame (withheld) on a fail-closed outcome. Clean frames pass through unchanged.

## Provenance

Origin: https://github.com/microsoft/skill-recorder, revision c7f2fe4402527a0eb7f4fc1b653bf438229bac61. License MIT (Microsoft Corporation); reuse retains the copyright and permission notice; Microsoft trademarks must not imply sponsorship in modified versions. This skill is a clean-room adaptation of the fail-closed OCR frame-redaction mechanism from electron/sensitive/frame-redact.ts, frame-heuristics.ts, ocr.ts, and electron/describer/tools.ts; no third-party expression is copied.
