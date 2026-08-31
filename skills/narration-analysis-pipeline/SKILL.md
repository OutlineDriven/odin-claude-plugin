---
name: narration-analysis-pipeline
description: 'Use when a user opts into narration and records speech during capture; the pipeline produces a timestamped, language-tagged transcript written locally as narration.json with version-2 audio segments. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Narration analysis pipeline

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User explicitly opts into narration and records speech during an active capture session |
| Authority | Reversible-local — writes only named local artifacts (version-2 audio segments, narration.json); rollback by deleting the output directory |
| Side effect | Writes version-2 audio segments plus narration.json containing original-language words and atMs offsets; one-time ~252 MB Whisper model download occurs only after explicit user approval and is deletable |
| Done | Timestamped transcript exists offline, language-tagged, with device disconnect stopping capture visibly rather than silently switching inputs |

## Inputs

1. **Audio capture stream** (required) — live audio input from the user's recording device, active during the capture session.
2. **Output directory** (required) — local path where narration.json and version-2 audio segments are written.
3. **User approval for model download** (conditional) — required once if the Whisper model is not already cached locally; the pipeline halts until the user explicitly approves the ~252 MB download.

## Procedure

1. Confirm the user has explicitly opted into narration. If not, stop — do not enable narration implicitly.
2. Begin capturing audio from the active input device. Monitor device status continuously; if the device disconnects, stop capture visibly and report the disconnect to the user rather than silently switching to another input.
3. Decode and resample the captured audio to the format required by the transcription engine (16 kHz mono PCM). Use the audio decode path to normalize raw device output.
4. Apply silence detection to the decoded audio. Segments below the silence threshold are excluded from transcription to avoid processing non-speech audio.
5. If the Whisper model is not cached locally, prompt the user for explicit approval before downloading the ~252 MB model. If the user declines, halt the pipeline and report the block — do not fall back to a remote service or skip transcription.
6. Run local Whisper inference on each non-silence audio segment to produce word-level transcriptions with millisecond timestamps (atMs).
7. Detect the language of each transcribed segment and tag the output with the identified language code.
8. Write narration.json to the output directory containing the transcribed words, their atMs offsets, and language tags. Write the corresponding version-2 audio segments alongside it.
9. Verify the output files exist and are non-empty. If verification passes, the pipeline is complete.

## Failure and recovery
| Failure class | Behavior |
|---|---|
| Device disconnect during capture | Stop capture immediately; report the disconnect visibly to the user; do not silently switch inputs |
| User declines model download | Halt the pipeline; report the block; do not proceed without transcription; do not use a remote fallback |
| Whisper inference error on a segment | Skip the failed segment; continue with remaining segments; mark the skipped segment in narration.json |
| Silence gate excludes all audio | Report that no speech was detected; write an empty narration.json with an explanatory status field |
| Output directory not writable | Halt the pipeline; report the filesystem error; do not write to an alternate location |

Partial results: if some segments transcribe successfully and others fail, the output includes all successful segments with failed segments marked. The pipeline does not discard partial results.

Rollback: delete the output directory to remove all version-2 audio segments and narration.json. No other files or system state are modified.

## Output
- **narration.json** — JSON file containing an array of transcribed words, each with its text, atMs millisecond offset, and language tag.
- **Version-2 audio segments** — decoded and resampled audio files corresponding to the captured speech, stored in the output directory.
- **Status report** — terminal message indicating completion, partial completion with skipped segments, or the specific failure that halted the pipeline.

## Provenance

- Origin: Microsoft skill-recorder (https://github.com/microsoft/skill-recorder)
- Pinned revision: c7f2fe4402527a0eb7f4fc1b653bf438229bac61
- License: MIT — Copyright (c) Microsoft Corporation. Retain the copyright notice and permission notice in all copies or substantial portions. Use of Microsoft trademarks or logos in modified versions must not cause confusion or imply Microsoft sponsorship.
- Adaptation: Clean-room adaptation of the on-device narration pipeline (decode, silence gate, Whisper transcription, analyze-gate, manager orchestration) from the skill-recorder source. No third-party expression is copied; the procedure describes the same mechanisms in operational language.
