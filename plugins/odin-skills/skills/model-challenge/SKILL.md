---
name: model-challenge
description: 'Use when a user requests an independent Codex or Gemini review of uncommitted code, a branch diff, or a specific commit. Returns findings with exact locations and confidence. Don''t use for unconfirmed or unattended external review sends, or for local source mutation.'
disable-model-invocation: true
---

# Second opinion external review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User requests an independent Codex or Gemini review of uncommitted code, a branch diff, or a specific commit, optionally focused on security, performance, or error handling. |
| Authority | Human-only, external, irreversible. Requires explicit user invocation. Preview the target and consequence before credentials, data-at-rest changes, paid actions, publishing, deployment, remote bulk mutation, or irreversible deletion. |
| Side effect | Sends the selected code diff and optional project guidance to Codex and/or Gemini. Codex is read-only sandboxed. Gemini headless invocation may auto-approve extension tool calls and therefore requires explicit user-authorized invocation. |
| Done | The chosen external reviewer runs on the complete selected diff or is explicitly reported unavailable. Findings include exact locations and confidence where supported. Multiple-reviewer agreements and disagreements are summarized. Empty or oversized scopes are handled before invocation. |

## Inputs

1. Code diff or commit reference (required) — uncommitted changes, a branch diff, or a specific commit SHA.
2. Reviewer selection (required) — Codex, Gemini, or both.
3. Focus area (optional) — security, performance, error handling, or general.
4. Project guidance (optional) — context about the codebase or review priorities to include in the reviewer prompt.

## Procedure

1. Resolve the code diff from the supplied reference. If uncommitted changes, capture the working-tree diff. If a commit or branch diff, resolve the full diff against the merge base. Done when: a single diff string is in hand whose range matches the supplied reference, or the reference could not be resolved and the stop is reported.
2. Validate scope. If the diff is empty, stop and report nothing to review. If the diff exceeds the selected reviewer's context window, report the size and ask the user to narrow scope before proceeding. Done when: the diff is non-empty and within the selected reviewer's context window, or an empty or oversized scope is reported and no data was sent.
3. Collect optional focus area and project guidance from the user. Done when: the focus area and project guidance are recorded or confirmed absent, so the reviewer prompt can be assembled without another round-trip.
4. Before sending anything external, present the user with a preview: which reviewer(s) will be invoked, what diff content will be sent, and that this is a paid external action with data leaving the local environment. Obtain explicit confirmation to proceed. Done when: the user has explicitly confirmed the preview, or the user declined and no data was sent.
5. Invoke the selected reviewer(s):
   - Codex: Send the diff and focus guidance to the Codex API. Codex runs in a read-only sandboxed environment. Collect the structured findings response.
   - Gemini: Send the diff and focus guidance to the Gemini API. Warn the user that Gemini headless invocation may auto-approve extension tool calls. Collect the structured findings response.
   Done when: each selected reviewer returned a structured findings response, or returned an error that step 6 will handle.
6. If a reviewer is unavailable or returns an error, report the failure for that reviewer explicitly. Do not substitute another reviewer without user approval. Done when: every selected reviewer has either a findings response or an explicit failure report, and no reviewer was silently substituted.
7. If multiple reviewers ran, synthesize findings: identify agreements (both reviewers flag the same issue) and disagreements (one flags, the other does not). Present the synthesis alongside per-reviewer detail. Done when: agreements and disagreements are each listed with the per-reviewer findings that support them, or only one reviewer ran and this step is skipped.
8. Compile the final report with per-reviewer findings (exact file paths, line numbers, confidence levels where supported), the multi-reviewer synthesis if applicable, and notes on any unavailable reviewers or scope limitations. Done when: the report contains a section per reviewer that ran, a synthesis section when more than one ran, and an explicit note for each reviewer that was unavailable.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Empty diff | Stop before invocation. Report that there is nothing to review. |
| Oversized diff | Stop before invocation. Report the diff size and ask the user to narrow scope. |
| Reviewer unavailable | Report the specific reviewer as unavailable. Do not silently substitute. If both are unavailable, report both and stop. |
| User declines preview | Stop. Do not send any data externally. |
| Reviewer returns error | Report the error for that reviewer. If another reviewer succeeded, include its findings and note the failure. |
| Partial results | Report whatever was returned. Never suppress partial findings or pretend the review completed fully. |

No rollback is needed because this skill is read-only on local state. The only mutation is sending data to an external reviewer, which cannot be undone once confirmed by the user.

## Output

A structured review report containing:
- Per-reviewer findings with exact file paths, line numbers, and confidence levels where supported.
- Multi-reviewer synthesis (agreements and disagreements) when more than one reviewer ran.
- Notes on unavailable reviewers, scope limitations, or partial results.
