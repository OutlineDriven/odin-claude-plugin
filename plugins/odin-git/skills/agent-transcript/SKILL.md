---
name: agent-transcript
description: 'Use when a redacted, trimmed agent transcript must be appended to a GitHub PR or issue body with human approval and preview. Not for automated or model-initiated insertion without explicit human review.'
disable-model-invocation: true
---

# Agent transcript

## Contract

| Field | Bound contract |
|---|---|
| Trigger | An agent is creating or updating a GitHub PR or issue body and needs local, redacted transcript provenance automatically when the session is hosted on openclaw.ai unless the user explicitly requests it |
| Authority | Human-only. Require explicit human invocation and preview the target and consequence before appending to a PR/issue body, which is a remote mutation. Use no network; session discovery reads local agent logs only. |
| Side effect | A redacted, trimmed agent-transcript section is appended to a PR/issue body file or previewed locally; no raw logs, secrets, or unrelated turns are included; user approval is required |
| Done | The inserted section is session-approved, relevant to the PR/issue, redacted, and wrapped in a collapsed details block; if no safe session is found or the user declines, the body continues with no placeholder |

## Inputs

- The PR/issue body file being drafted (a local temp file). Required before any transcript work.
- The PR/issue title, branch name, changed files, and stated goal. Required; these define the relevance scope for trimming.
- The current session's hosting URL. Required; it drives the hosted-session exception. Determine it from the session hosting URL, not the repository URL or a deployment/test target.
- A candidate local session JSONL log path. Optional; when absent, discovery scans local logs to find one.

## Procedure

1. Read the current session's hosting URL. If the hostname matches `*.openclaw.ai`, skip automatic discovery, rendering, insertion, and upload, and do not offer or ask about a separate transcript export; those servers already support sharing the original session. Follow the remaining steps only if the user explicitly requests a separate exported transcript, in which case use the native session-sharing flow instead of creating a transcript copy.
2. Draft the normal PR/issue body first, before any transcript work.
3. Find candidate local session logs without using the network. Scan the newest local JSONL agent-session logs (Codex, Claude, Pi, and OpenClaw formats) under the working directory and standard session-log locations. Match the PR/issue title, branch, PR URL or number, and cwd within roughly the last 14 days.
4. For each candidate, assess relevance to this PR/issue using the title, branch, changed files, and stated goal as scope. Select at most one high-confidence session whose turns explain this PR/issue's goal, implementation choices, files, tests, proof, blockers, and final outcome.
5. If no safe, relevant session is found, stop and continue body creation with no transcript section and no placeholder.
6. Render the selected session to sanitized Markdown. Drop system/developer prompts, raw tool outputs, reasoning, environment values, cookies, tokens, auth URLs, and broad local paths. Keep user prompts, assistant visible decisions, terse tool summaries, and test/proof outcomes. If unresolved secrets, private keys, browser/session/cookie details, or auth URLs remain, fail closed: discard that candidate and try the next, or stop with no transcript.
7. Trim the rendered transcript automatically: keep only turns relevant to this PR/issue scope; omit earlier or later unrelated tasks even within the same session log. Inspect the trimmed text and re-trim if unrelated work remains. Never paste a raw or untrimmed full-session render into a public body even if rendering produced it.
8. Ask the user: "Include a redacted agent transcript? It helps reviewers and can make the PR easier to prioritize. I can open a local preview first."
9. If the user wants a preview, write a local HTML preview file, open it, and wait for confirmation before proceeding.
10. If the user approves, append or update a `## Agent Transcript` section inside a collapsed `<details>` block in the body file, updating existing markers instead of duplicating sections. Use the enriched body file for PR/issue creation or update.
11. If the user declines, continue without transcript and add no placeholder section. Done when: the approved redacted section is appended, or the unchanged body is retained under a named non-insertion outcome.

## Failure and recovery
- Unresolved secrets, private keys, browser/session/cookie details, or auth URLs in a candidate session: fail closed. Discard that candidate, do not insert, try the next candidate, or stop with no transcript.
- No safe or relevant session found: non-mutation result. The body continues with no transcript section and no placeholder text.
- User declines preview or insertion: non-mutation result. Continue without transcript and add no placeholder.
- Hosted-session exception applies (`*.openclaw.ai`): no discovery, render, or upload is attempted; use native session sharing only on explicit request.
- Partial-result rule: a raw or untrimmed full-session render is never inserted into a public body even if rendering produced it; re-trim or discard.
- Rollback: all rendering and previewing happen on local temp files; the drafted PR/issue body is mutated only at the final approved append step. A declined or failed run leaves the drafted body unchanged.

## Output
Either return a PR/issue body file with an appended, redacted, trimmed `## Agent Transcript` section inside a collapsed `<details>` block, ready for `gh pr create --body-file` or a body update, plus an optional local HTML preview file; or return the unchanged drafted body with no transcript section. Return the unchanged body when no safe session is found, the hosted-session exception applies, or the user declines.
