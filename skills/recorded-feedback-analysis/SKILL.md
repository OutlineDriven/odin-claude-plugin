---
name: recorded-feedback-analysis
description: 'Use when asked to invoke /recorded-feedback-analysis with a Riffrec capture, screen, voice, or notes artifact, or a setup request. Setup ends with a capture path, quick analysis with one evidence-backed bug report, or extensive analysis with the evidence set and brainstorm handoff. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Recorded feedback analysis

## Contract

| Field | Bound contract |
|---|---|
| Trigger | /recorded-feedback-analysis [Riffrec capture, screen/voice/notes artifact, or setup request] |
| Authority | Reversible local: write only named local evidence artifacts; raw media stays local unless the user explicitly asks otherwise. Temp output is discarded when the path completes; written artifacts are local files the user can delete. No VCS or remote mutation unless the user explicitly commits. |
| Side effect | Analyzes capture bundles locally and may write evidence artifacts; raw media stays local unless the user asks otherwise. |
| Done | Setup ends with a capture path, quick analysis with one evidence-backed bug report, or extensive analysis with the evidence set and brainstorm handoff. |

## Inputs

- A Riffrec `.zip` or unpacked capture directory containing `session.json` and `events.json`; `.mp4`/`.mov`/`.webm` video; `.m4a`/`.mp3`/`.wav` audio; or meeting-notes `.md`. Required for quick and extensive paths; absent for setup.
- Optional: a user-named output directory for extensive analysis. If omitted, use a temp directory for the quick path and a repo-relative `docs/brainstorms/riffrec-feedback/` default for extensive analysis when that path exists; otherwise use a local `riffrec-feedback/` directory.
- Optional: the product source-code workspace, used only for source mapping when present.

## Procedure

1. Route from the input. When the input is ambiguous (a zip arrived without context), inspect recording length and event count before choosing; if still unclear, ask the user which path applies before running anything.
   - **Setup** — no recording yet; user asks how to install Riffrec, capture a session, or share feedback. Go to step 2.
   - **Quick bug report** — short recording (under ~60 seconds), single specific issue, or user asks for "quick", "small", "simple", or "just transcribe". Go to step 3.
   - **Extensive analysis** — longer recording, multiple issues, requirements, or workflow walkthrough, or user wants requirements material. Go to step 4.

2. **Setup path.** Tell the user Riffrec lives at https://github.com/kieranklaassen/riffrec and to follow its README for the current install command. Describe the integration shape: add the capture script to the web app, wire a "Record feedback" affordance (a bug report button, a dev-only floating recorder, or a keyboard shortcut), and confirm a sample session produces a downloadable `riffrec-*.zip`. Share capture habits so later recordings are analyzable: speak the issue out loud while reproducing it (the transcript is the highest-signal artifact), click the affected UI even when it does nothing (failed clicks are the strongest event signal), keep recordings focused (many short clips beat one long one when issues are unrelated), and note when a step is intentional vs accidental (the analyzer cannot infer intent). End with the capture path. Do not run analysis — there is nothing to analyze yet.

3. **Quick bug report path.**
   1. Create a temp output directory. Unpack the capture bundle: read `session.json` and `events.json`, transcribe audio in chunks with timestamp prefixes when a single pass is too large, and extract screenshots for selected moments into a local-only `frames/` directory. If the input is audio-only or notes-only, skip frame extraction and note that no frames are available.
   2. Read the session summary and transcript. Select at most one or two screenshots that directly show the reported issue. Prefer frames near a verbal complaint, a failed click, a console error, or a failed network request.
   3. Emit a single concise bug report with: Title (one short sentence naming the broken behavior), Steps to reproduce (bullet list reconstructed from clicks and transcript), Expected vs actual (what the user said should happen vs what happened), Evidence (transcript quotes with timestamps plus 0–2 screenshot references), and Suggested next step (file an issue, debug, or escalate to extensive analysis if more issues surfaced).
   4. Default to printing the report inline so the user can confirm before anything is written. Write a `bug-report.md` only if the user asks; prefer a single file next to the source recording or in a user-named path. Do not auto-create brainstorm directories.
   5. If the workspace is the product source and the broken surface is named clearly in the transcript or visible UI, add one "Likely surface" line with file path and confidence (High/Medium/Low). Skip it when the mapping is speculative.
   6. If the recording contains multiple distinct issues, requirements, or a workflow walkthrough, stop and tell the user: "This recording has more than one issue. Switching to the extensive path." Then re-run with a non-temp output directory per step 4.

4. **Extensive analysis path.**
   1. Unpack the capture bundle as in step 3.1. Use the user-named output directory or the repo-relative default. Keep `raw/` (normalized capture contents and copied standalone media) and `frames/` local-only by default.
   2. Produce the artifact set:
      - `analysis.md` — session summary, transcript, selected moments, screenshot links, candidate findings, and review checklist.
      - `problem-analysis.md` — categorized problem statement scaffold.
      - `review-prompt.md` — a filled prompt containing screenshot paths and transcript for a deeper visual analysis pass.
      - `source-materials.md` — manifest linking the original source location, local-only raw files, transcript locations, chunks, local-only frames, and generated artifacts. This is the source-of-truth for traceability.
      - `requirements-kickoff.md` — a requirements starter with Problem Frame, Actors, Key Flows (trigger, actors, steps, outcome, covered-by R-IDs), Requirements (observed product behavior + feedback evidence/reviewability), Acceptance Examples (Given/When/Outcome covering R-IDs), Success Criteria, Scope Boundaries, Key Decisions, Dependencies/Assumptions, Outstanding Questions (Resolve Before Planning + Deferred to Planning), and Next Steps.
      - `analysis.json` — structured session, event, transcript, moment, and artifact metadata.
   3. Inspect extracted screenshots for high-signal moments using the image-view tool. Select moments containing verbal complaint cues ("weird", "doesn't work", "can't", "broken", "bug", "problem", "confusing", "should", "wrong", "stuck", "failed"), clicks on controls shortly before or after a complaint, repeated clicks on the same control, failed requests outside known development noise, console errors or uncaught exceptions, or visible toasts, validation errors, disabled controls, empty states, or surprising navigation. Look at screenshots and transcript together before turning a candidate finding into a requirement.
   4. Fill `problem-analysis.md` with exactly these top-level categories: Visual/UI Problems, Functional Problems, Requirements, Usability/UX Problems. Each numbered item describes the problem, location, UI element, frame reference, and relevant transcript context when available. Focus on WHAT is wrong, not HOW to fix it. Each finding follows the shape: title, Severity (P0/P1/P2/P3), Observed (grounded in transcript/events/screenshots), Expected, Evidence (moment IDs and screenshot links), Confidence (High/Medium/Low with reason), and Requirement candidates (R-IDs).
   5. Convert evidence into requirements, keeping these distinct: Observed facts (transcript quotes, click targets, request statuses, screenshot contents), Inferences (likely user intent, likely broken control, suspected missing state), and Requirements (product behavior needed to resolve the problem). Requirements should describe product behavior, not implementation details. Mark visual interpretation as an inference when the screenshot does not prove intent. Prefer moment IDs and screenshot links over prose-only claims.
   6. Capture every distinct problem, bug, request, expectation, confusion point, and "note to self" that appears in the transcript or frames. Include concrete examples for each (timestamp, transcript phrase, screenshot path, clicked UI element, observed state). Do not drop lower-priority items; mark them as lower priority or secondary. Separate capture from prioritization; the brainstorm step may regroup, split, defer, or reject items later, but the first requirements pass preserves the full signal. If a session contains many issues, create a comprehensive capture document and state that planning should split it into smaller plans.
   7. When the workspace contains the product source code, run a source-mapping pass. Use transcript language, visible UI labels, screenshot paths, route names, and generated requirements to search for likely components, controllers, services, models, tests, and state stores. For larger sessions, split by product area and inspect independent areas in parallel. Classify each mapping as one of: Likely buggy surface (the code path exists and directly handles the observed behavior), Missing or incomplete surface (the feedback names a behavior but the repo has no clear implementation yet), Indirect surface (the code is adjacent but the interaction may happen through rendered email, third-party UI, or generated HTML), or Unknown (no grounded mapping found). Include requirement/example IDs (e.g., R14, AE4), file paths with line numbers when practical, a short evidence note from code (not just a file guess), and confidence (High/Medium/Low/Unknown). Add mappings as suspected implementation surfaces, not proven root cause unless the code clearly proves it. Prefer saying "I did not find a current implementation for this surface" over forcing a speculative mapping; missing surfaces are useful findings and stay in the brainstorm.
   8. Unless the user explicitly asked only to extract or analyze artifacts, announce that analysis is complete and hand off `requirements-kickoff.md` plus `source-materials.md` to a brainstorm or requirements-planning step. The callee owns requirements confirmation and the durable plan.

## Failure and recovery
- **Missing input:** no capture artifact supplied for a non-setup path. Report the missing input and stop; do not fabricate evidence.
- **Unreadable capture:** the bundle is corrupt, missing `session.json`/`events.json`, or the media format is unsupported. Report what was found and what was expected, and stop that path.
- **Ambiguous route:** a zip arrived without context and length/event inspection does not resolve it. Ask the user which path applies before running analysis.
- **Quick-to-extensive escalation:** the quick path discovers multiple distinct issues, requirements, or a workflow walkthrough. Stop, tell the user, and re-run with a non-temp output directory per the extensive path.
- **No source mapping possible:** the workspace is not the product source or no grounded mapping is found. Keep the problem and mark the source mapping as Unknown; do not force a speculative mapping.
- **Partial-result rule:** never substitute a partial artifact set for a complete one. If a step fails, report the failure and stop rather than emitting incomplete output and claiming the done predicate holds.
- **Rollback:** temp directories are discarded by the OS. Written evidence artifacts are local files the user can delete; no VCS or remote mutation occurs unless the user explicitly commits. `raw/` and `frames/` directories are never committed unless the user explicitly asks and privacy is acceptable.

## Output
- **Setup:** a capture path and integration guidance; no artifacts.
- **Quick bug report:** one concise evidence-backed bug report, printed inline by default or written to a user-named `bug-report.md`. No durable artifact unless requested.
- **Extensive analysis:** the complete artifact set (`analysis.md`, `problem-analysis.md`, `review-prompt.md`, `source-materials.md`, `requirements-kickoff.md`, `analysis.json`, local-only `frames/` and `raw/`) and a brainstorm handoff unless the user asked for extraction only.
- Text/metadata artifacts (requirements kickoff material, analysis summaries, problem analyses, source manifests) may be committed when needed for traceability and contain no sensitive data. Use repo-relative screenshot paths in any committed doc so later agents can open evidence without absolute local paths. `raw/` and `frames/` stay local-only by default.

## Provenance

Origin: https://github.com/EveryInc/compound-engineering-plugin, revision a1f601f17137f648be439965f8fdd9123303de5d, file skills/ce-riffrec-feedback-analysis/SKILL.md. License MIT (Copyright (c) 2025 Every). Mechanisms extracted and rewritten in ODIN style under clean-room adaptation; the bundled analyzer script and reference files are not retained — the analysis procedure is restated as agent-performed steps.
