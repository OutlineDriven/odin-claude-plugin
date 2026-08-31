---
name: recorded-feedback-analysis
description: 'Use when asked to analyze a screen recording, voice capture, or meeting notes artifact for product feedback. Routes to a quick bug report or extensive analysis with timestamped evidence artifacts and a brainstorm handoff. Not for credential, publish, deploy, or irreversible changes.'
---

# Recorded feedback analysis

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User supplies a screen recording, voice capture, or meeting-notes artifact and asks for feedback analysis, or asks how to capture and share recorded feedback. |
| Authority | Reversible local: write only named local evidence artifacts; raw media stays local unless the user explicitly asks otherwise. Temp output is discarded when the path completes; written artifacts are local files the user can delete. No VCS or remote mutation unless the user explicitly commits. |
| Side effect | Analyzes recorded feedback locally and may write evidence artifacts; raw media stays local unless the user asks otherwise. |
| Done | Setup ends with a capture path, quick analysis with one evidence-backed bug report, or extensive analysis with the evidence set and brainstorm handoff. |

## Refusals

- Remote, credential, publish, deploy, or irreversible changes: rejected.
- Fabricating evidence: rejected. If the recording is missing or unreadable, report what was found and stop.
- Substituting a partial artifact set for a complete one: rejected. If a step fails, report the failure and stop rather than emitting incomplete output and claiming the done predicate holds.

## Inputs

- A screen recording (`.mp4`/`.mov`/`.webm`), voice capture (`.m4a`/`.mp3`/`.wav`), or meeting-notes `.md`. A capture bundle containing `session.json` and `events.json` is also accepted when available. Required for quick and extensive paths; absent for setup.
- Optional: a user-named output directory for extensive analysis. If omitted, use a temp directory for the quick path and a repo-relative `docs/brainstorms/recorded-feedback/` default for extensive analysis when that path exists; otherwise use a local `recorded-feedback/` directory.
- Optional: the product source-code workspace, used only for source mapping when present.

## Procedure

1. Route from the input. When the input is ambiguous (a recording arrived without context), inspect recording length and event count before choosing; if still unclear, ask the user which path applies before running anything. **Setup** (no recording yet; user asks how to capture a session or share feedback) goes to step 2. **Quick bug report** (short recording under ~60 seconds, single specific issue, or user asks for "quick", "small", "simple", or "just transcribe") goes to step 3. **Extensive analysis** (longer recording, multiple issues, requirements, or workflow walkthrough) goes to step 4. **Done when**: the path is selected or the user is asked to disambiguate.

2. Setup path. Describe the capture integration shape: add a recording affordance to the web app (a bug report button, a dev-only floating recorder, or a keyboard shortcut), and confirm a sample session produces a downloadable recording file. Share capture habits so later recordings are analyzable: speak the issue out loud while reproducing it (the transcript is the highest-signal artifact), click the affected UI even when it does nothing (failed clicks are the strongest event signal), keep recordings focused (many short clips beat one long one when issues are unrelated), and note when a step is intentional versus a dead end. Do not prescribe a specific recording tool; recommend whatever the team's stack supports. **Done when**: capture guidance is delivered.

3. Quick bug report path. Create a temp output directory. Process the recording: read `session.json` and `events.json` when present, transcribe audio in chunks with timestamp prefixes when a single pass is too large, and extract screenshots for selected moments into a local-only `frames/` directory. If the input is audio-only or notes-only, skip frame extraction and note that no frames are available. Read the session summary and transcript. Select at most one or two screenshots that directly show the reported issue, preferring frames near a verbal complaint, a failed click, a console error, or a failed network request. Emit a single concise bug report with Title (one short sentence naming the broken behavior), Steps to reproduce (bullet list reconstructed from clicks and transcript timestamps), Expected vs actual, Evidence (screenshot references with timestamps), and Severity (based on frequency and impact). Write to `bug-report.md` or print inline. **Done when**: one evidence-backed bug report is emitted.

4. Extensive analysis path. Process the recording as in step 3. Use the user-named output directory or the repo-relative default. Keep `raw/` (normalized recording contents and copied standalone media) and `frames/` local-only by default. Produce the artifact set: `analysis.md` (session summary, transcript, selected moments, screenshot links, candidate findings, review checklist), `problem-analysis.md` (categorized problem statement scaffold), `review-prompt.md` (filled prompt with screenshot paths and transcript for a deeper visual analysis pass), `source-materials.md` (manifest linking original source location, local-only raw files, transcript locations, chunks, local-only frames, and generated artifacts), `requirements-kickoff.md` (requirements starter), and `analysis.json` (structured metadata). End with a brainstorm handoff summarizing the findings and pointing at the artifact set. **Done when**: the complete artifact set is produced and the brainstorm handoff is delivered.

## Failure and recovery

- Missing input: no recording artifact supplied for a non-setup path. Report the missing input and stop; do not fabricate evidence.
- Unreadable recording: the file is corrupt, the media format is unsupported, or expected metadata is missing. Report what was found and what was expected, and stop that path.
- Ambiguous route: a recording arrived without context and length/event inspection does not resolve it. Ask the user which path applies before running analysis.
- Quick-to-extensive escalation: the quick path discovers multiple distinct issues, requirements, or a workflow walkthrough. Stop, tell the user, and re-run with a non-temp output directory per the extensive path.
- No source mapping possible: the workspace is not the product source or no grounded mapping is found. Keep the problem and mark the source mapping as Unknown; do not force a speculative mapping.
- Partial-result rule: never substitute a partial artifact set for a complete one. If a step fails, report the failure and stop.
- Rollback: temp directories are discarded by the OS. Written evidence artifacts are local files the user can delete; no VCS or remote mutation occurs unless the user explicitly commits. `raw/` and `frames/` directories are never committed unless the user explicitly asks and privacy is acceptable.

## Output

Setup: a capture path and integration guidance with no artifacts. Quick: one concise evidence-backed bug report printed inline or written to `bug-report.md`. Extensive: the complete artifact set (`analysis.md`, `problem-analysis.md`, `review-prompt.md`, `source-materials.md`, `requirements-kickoff.md`, `analysis.json`, local-only `frames/` and `raw/`) and a brainstorm handoff. Text/metadata artifacts may be committed for traceability only when they contain no sensitive data and use repo-relative screenshot paths; `raw/` and `frames/` stay local-only by default.
