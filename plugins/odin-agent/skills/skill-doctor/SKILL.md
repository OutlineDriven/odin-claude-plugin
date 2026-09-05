---
name: skill-doctor
description: 'Use when a user wants agent setup graded from conversation history. Not for skill fixing: use agent-surface-forge. Not for security scanning: use skill-scanner.'
---

# Skill doctor

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants agent setup graded from conversation history. |
| Authority | Reversible local: writes only to a scratch report directory under the current working tree; rollback is deleting that directory. No remote mutation. |
| Side effect | Creates one scratch report directory containing report.html and supporting assets. Never modifies real skill files, configuration, or conversation history. |
| Done | report.html exists in the scratch directory and renders a normalized 0-10 efficiency score, a normalized 0-10 code quality score (or N/A when the session has no code changes), per-turn findings with evidence citations (or no findings when every scored sub-score is at maximum), and ranked improvement suggestions (or none when every scored sub-score is at maximum). |

## Inputs

1. **Conversation history**: a session transcript from the current agent harness. Accept one of:
   - A file path to a transcript log (JSON, JSONL, or plain-text log).
   - A directory of transcript files; process the most recent file.
   - If neither is supplied, attempt to locate the most recent session transcript in the default harness log directory.
2. **Output directory** (optional): path for the scratch report directory. Default: `./skill-doctor-report-<timestamp>`.

## Procedure

1. **Collect session data.**
   - Locate the conversation history from the supplied path, directory, or default harness log.
   - If no transcript is found, write a minimal report.html stating "No conversation history found" and stop.
   - Read the transcript file. If the file is empty or contains fewer than 2 turns, write a minimal report.html stating "Session too short to assess" and stop.
   Done when: the transcript is located and read, or a minimal report is written for the empty/short case.

2. **Decode transcript into structured turns.**
   - Parse each message into a turn record with fields: `role` (user/assistant/tool), `content` (text), `tool_name` (if applicable), `tool_input` (if applicable), `tool_output` (if applicable), `timestamp` (if available).
   - For JSON/JSONL transcripts, parse each line or object directly.
   - For plain-text logs, identify turn boundaries by role markers (e.g., "User:", "Assistant:", "Tool:", or harness-specific prefixes). Extract tool calls from fenced code blocks or structured markers.
   - Produce an ordered list of turn records.
   Done when: an ordered list of turn records is produced.

3. **Score efficiency (0-10).**
   Evaluate the agent's task-completion efficiency against these criteria:
   - Task completion (0-3): Did the agent accomplish the stated goal? 3 = fully complete, 2 = mostly complete with minor gaps, 1 = partial progress, 0 = no progress.
   - Unnecessary exploration (0-3, inverted): Did the agent read or explore files unrelated to the task? 0 = extensive off-topic exploration, 1 = moderate, 2 = minimal, 3 = only task-relevant files touched.
   - Retry waste (0-2, inverted): How many failed attempts or redundant retries occurred? 2 = none, 1 = one retry, 0 = multiple retries.
   - Turn economy (0-2, inverted): Was the turn count reasonable for the task complexity? 2 = concise, 1 = slightly verbose, 0 = significantly excessive turns.
   - Sum sub-scores for the raw efficiency score (0-10).
   Done when: the efficiency score (0-10) is computed.

4. **Score code quality (0-10).**
   Evaluate the agent's code changes against these criteria:
   - Correct file identification (0-3): Did the agent modify the right files and symbols? 3 = all correct, 2 = one wrong file, 1 = multiple wrong files, 0 = entirely wrong targets.
   - Minimal diff (0-3): Were changes precise and minimal? 3 = surgical edits, 2 = minor unnecessary changes, 1 = moderate bloat, 0 = large unnecessary rewrites.
   - Pattern adherence (0-2): Did changes follow existing codebase conventions? 2 = fully consistent, 1 = minor style deviations, 0 = ignores existing patterns.
   - Regression avoidance (0-2): Did changes avoid introducing bugs, dead code, or broken imports? 2 = clean, 1 = minor issues, 0 = introduced regressions.
   - Sum sub-scores for the raw code quality score (0-10).
   - If the session contains no code changes, set code quality to N/A and state the reason in the score summary; do not emit this as a finding.
   Done when: the code quality score (0-10 or N/A) is computed.

5. **Normalize scores.**
   - Efficiency normalized = raw efficiency score (already 0-10).
   - Code quality normalized = raw code quality score (already 0-10), or N/A if no code changes.
   Done when: both scores are normalized.

6. **Compile findings with evidence.**
   - For each sub-score that is not at maximum, produce a finding with:
     - Category name (e.g., "Unnecessary exploration").
     - Score and maximum.
     - Evidence: cite specific turn numbers and content excerpts that justify the score.
     - Suggestion: one concrete, actionable improvement.
   - Rank suggestions by potential score impact (highest possible improvement first).
   Done when: all non-maximum sub-scores have findings with evidence and ranked suggestions.

7. **Generate report.html.**
   - Create the output directory.
   - Write report.html as a self-contained HTML file with embedded CSS (no external dependencies, no network requests).
   - Structure:
     - Header: "Skill Doctor Report" with session identifier and timestamp.
     - Score summary: two horizontal bar charts (efficiency, code quality) showing normalized scores out of 10. If code quality is N/A, show "N/A" instead of a bar and state the reason beside it.
     - Findings section: each finding as a card with category, score, evidence block (cited turn excerpts in a styled blockquote), and suggestion.
     - Suggestions summary: ranked list of all improvement suggestions.
   - Use clean, readable styling: white background, dark text, clear section headings, adequate spacing. No external fonts, no JavaScript, no network dependencies.
   Done when: report.html is written with all sections present.

8. **Verify report.**
   - Confirm report.html exists in the output directory.
   - Confirm it contains the score summary, at least one finding, and at least one suggestion (unless the session was too short or had no history, or every scored sub-score is at maximum, in which case the minimal report satisfies the done predicate).
   Done when: report.html exists and contains the required sections.

## Failure and recovery
| Failure class | Detection | Response |
|---|---|---|
| No conversation history | Transcript path does not exist or directory is empty | Write minimal report.html stating "No conversation history found". Skill terminates; no scores produced. |
| Session too short | Fewer than 2 turns after decoding | Write minimal report.html stating "Session too short to assess". Skill terminates; no scores produced. |
| Unparseable format | Decoder cannot identify turn boundaries | Write report.html with a parsing error note and any partial turns decoded. Mark affected scores as N/A. |
| Write failure | OS error creating output directory or writing report.html | Report the error. No partial artifacts left on disk; delete the output directory if partially created. |

Partial results: if decoding succeeds but scoring encounters an edge case (e.g., no code changes), produce the report with N/A for affected scores rather than failing.

Rollback: delete the entire scratch output directory to undo all effects.

Non-converged result: if the report cannot be generated at all, the skill returns a text description of the failure reason without creating any files.

## Output
A self-contained report.html in the scratch output directory: normalized 0-10 efficiency score (always), normalized 0-10 code quality score or N/A, per-category findings with evidence-cited turn excerpts, and ranked improvement suggestions with potential score impact.
