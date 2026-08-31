---
name: offline-frame-extraction
description: 'Use when a recording session ends or a describer requests frame evidence, extract sparse visually-distinct JPEG snapshots from the session without decoding the WebM; write video-frames.json and retained JPEGs under frames/ with 1 fps snapshot cadence. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Offline frame extraction

## Contract

| Field | Bound contract |
|---|---|
| Trigger | post-recording processing or a describer frame request |
| Authority | reversible-local: no remote, credential, or VCS mutation |
| Side effect | writes video-frames.json plus retained JPEGs under frames/; 1 fps snapshot cadence caps achievable sampling density |
| Done | Frame evidence addressable by event time with exact crop dimensions, no video decoder dependency |

## Inputs

Required:
- `sessionDir` — absolute path to a completed recording session directory
- `framesDir` — absolute path to the session's `frames/` subdirectory
- `anchorEpochMs` — wall-clock epoch (ms) at which the session recording started, from `video.json`

Optional:
- `videoPath` — absolute path to the session's WebM; required only for pre-change sessions that have no captured-frame manifest
- `capturedFramesManifest` — absolute path to the versioned source-frame manifest (written by the recorder alongside the WebM); omit to use only retained frames
- `events` — array of `{ tMs: number; reason?: string }`; each epoch anchor triggers one extraction if it does not duplicate a previously retained cell
- `window` — `{ startMs, endMs, crop?, fps?, maxFrames? }`; extract a dense probe across a time window
- `maxFrames` — hard cap on retained frames; defaults to 300
- `dedupeThreshold` — Hamming-distance threshold below which two frames are considered near-duplicates; defaults to 8

One of `events` or `window` must be supplied.

## Procedure

1. **Validate trust boundaries.** Reject `sessionDir` and all derived paths that contain `..` path segments or resolve outside the user's home directory. If `capturedFramesManifest` or `videoPath` is supplied, apply the same check to each. Stop on any violation.
2. **Create output directory.** If `framesDir` does not exist, create it. Stop if creation fails.
3. **Load captured-frame manifest.** If `capturedFramesManifest` exists and its JSON parses as `{ version: 1, format: "jpeg", frames: CapturedVideoFrame[] }`, read and sort the frames by `tMs` ascending; otherwise use an empty array. A frame entry is valid only when it has `file`, `tMs`, `offsetMs`, `width > 0`, `height > 0` and the referenced JPEG file exists at an absolute path derived by resolving `file` relative to the manifest's directory. Skip invalid entries silently.
4. **Load or initialize retained-frame manifest.** If `framesDir/video-frames.json` exists and parses as a `FrameRecord[]`, read it; otherwise start with an empty array.
5. **Determine extraction pipeline.** If captured source frames are available, use the manifest pipeline. If no captured frames exist and `videoPath` points to a readable WebM, use the legacy system-FFmpeg pipeline. If neither source is available, return the existing retained-frame manifest unchanged with no new extractions.
6. **For event-anchored extraction** (`events` supplied):
   a. Sort `events` by `tMs` ascending.
   b. For each event, compute `offsetSec = max(0, (event.tMs - anchorEpochMs) / 1000)`.
   c. Compute `cell = round(offsetSec / frameGridSec)` where `frameGridSec` defaults to 0.5. Skip this event if its cell was already seen in this run.
   d. Guard against duration: if `durationSec` is known and `offsetSec > durationSec`, skip this event.
   e. Find the nearest captured source frame to `event.tMs` using binary search over the sorted captured frame list. If no captured frames are available, fall through to the legacy pipeline.
   f. Copy the source JPEG to `framesDir` using a name derived as `{source}_{offsetMs}_{stem}.jpg` where `source` is the `FrameSource` string (`event`, `scene`, or `probe`) and `stem` is sanitized to `[a-zA-Z0-9_-]` with length ≤ 80.
   g. Run perceptual hash (dHash, 9×8 grayscale resize, 64-bit Hamming) on the copied JPEG. If dHash is unavailable (sharp not installed), retain the frame without a hash.
   h. Apply near-duplicate suppression: compute Hamming distance between the new frame's hash and every already-retained frame's hash; if any distance ≤ `dedupeThreshold`, delete the newly copied JPEG and skip this event.
   i. Apply `maxFrames` cap: if retained count ≥ `maxFrames`, delete the newly copied JPEG and skip this event.
   j. Append a `FrameRecord` to the in-memory manifest: `{ file, tMs: epochForOffset(offsetSec), offsetSec, source, phash, reason? }`.
   k. Suppress duplicate source-file selection: if the same captured source file was already selected in this run, skip.
7. **For window extraction** (`window` supplied):
   a. Clamp `startMs` to `anchorEpochMs` or later, and `endMs` to `max(startMs, endMs)`.
   b. Limit `fps` to the range `1..30`, defaulting to 1. Limit `maxFrames` to `1..maxFrames`, defaulting to 24.
   c. Generate candidate timestamps from `startMs` to `endMs` in steps of `1000 / fps`, capped at `maxFrames`. For each candidate, find the nearest captured frame using binary search; deduplicate by source filename.
   d. If no captured source frames exist, fall through to the legacy FFmpeg window pipeline.
   e. Render each selected captured frame: copy directly if no `crop` is supplied; otherwise invoke sharp to extract `{ left: round(crop.x), top: round(crop.y), width: round(crop.w), height: round(crop.h) }` with JPEG quality 88. Validate crop bounds against the source frame dimensions; reject and skip on out-of-bounds.
   f. Name output files `probe_{stamp}_{paddedIndex}.jpg` where `stamp` is a random UUID suffix and `index` is zero-padded to 4 digits.
   g. Apply dedupe and `maxFrames` cap as in step 6h–6i.
8. **Persist.** Write the updated in-memory manifest sorted by `tMs` to `framesDir/video-frames.json` as pretty-printed JSON. If persistence fails, log the warning and continue; the in-memory result is still returned.
9. **Return** the updated `FrameRecord[]` sorted by `tMs`.

## Failure and recovery
| Failure class | Partial-result rule | Recovery |
|---|---|---|
| Source manifest unreadable or invalid | Use empty captured-frame list; proceed if legacy pipeline is available | Re-read on next invocation; manifest is reloaded from disk each run |
| JPEG copy fails | Skip that frame; continue to next | Frame is not in retained manifest; re-invoke to retry |
| Crop out of bounds | Skip that frame; do not write JPEG | Caller corrects crop dimensions; re-invoke |
| Dedup or cap rejects frame | Delete the already-copied JPEG; skip entry | No manifest entry; re-invoke with different events or window |
| sharp unavailable | Use direct JPEG copy; perceptual dedupe is skipped | Install sharp; re-invoke for future extractions |
| System FFmpeg unavailable (legacy pipeline) | Return empty extraction result | Install FFmpeg or ensure `capturedFramesManifest` is provided |
| Persistence write fails | Return in-memory result; manifest not updated | Retry invocation; manual recovery: re-run extraction |
| Path traversal attempt detected | Stop immediately; return error | Never partial-result; no writes occur |

The blocked result is: the returned `FrameRecord[]` has fewer entries than the number of valid events or window samples, and `framesDir/video-frames.json` does not reflect the in-memory result.

## Output
- `framesDir/video-frames.json` — array of `FrameRecord` objects sorted by `tMs` ascending; each record: `{ file: string, tMs: number, offsetSec: number, source: "event"|"scene"|"probe", phash: string, reason?: string }`
- `framesDir/*.jpg` — retained JPEG files named either `{source}_{offsetMs}_{stem}.jpg` (event/scene) or `probe_{stamp}_{index}.jpg` (window probe)
- Return value: the sorted `FrameRecord[]` written to `video-frames.json`

## Provenance

Origin: `https://github.com/microsoft/skill-recorder`, revision `c7f2fe4402527a0eb7f4fc1b653bf438229bac61`.
License: MIT — Microsoft Corporation. Adaptation is clean-room: the source mechanisms (manifest schema, binary-search nearest-frame, FPS-stepped sampling, dHash dedupe with Hamming threshold, sharp-based crop, frame-grid cell suppression, maxFrames cap) were re-expressed as an independent algorithmic procedure without copying source code.

Retained MIT notice: Copyright (c) Microsoft Corporation.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Modified versions must not use Microsoft trademarks or logos in a way that causes confusion or implies Microsoft sponsorship.
