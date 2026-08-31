---
name: respond-to-slack-thread
description: 'Use when the user asks to reply to or follow up on a Slack thread. Posts one reply and returns its permalink. Don''t use for top-level (non-thread) messages, deleting messages, or composing the reply text.'
disable-model-invocation: true
---

# Respond to Slack thread

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to reply to or follow up on a Slack thread. |
| Authority | Human-only execution: remote mutation of Slack is irreversible; requires explicit human invocation with all required inputs present. |
| Side effect | Posts one reply to the specified Slack channel and thread. |
| Done | The reply is posted and its permalink is returned. |

## Inputs

| Input | Required | Description |
|---|---|---|
| `reply_text` | Yes | The exact reply text to post. Do not synthesize or extend beyond what the user supplied. |
| `thread_identifier` | Yes | Channel ID and thread timestamp (`channel_id`, `thread_ts`) or a thread permalink. |

Credentials (`SLACK_BOT_TOKEN`, channel configuration) are ambient operator-managed capabilities. Do not ask the user to supply, paste, reveal, or log a token or secret.

## Procedure

1. **Validate authority.** Confirm the user has explicitly asked to post a reply to this specific thread with reply text present. Do not proceed on a vague or indirect signal.
2. **Validate required inputs.** Reject if `reply_text` or `thread_identifier` is absent or empty.
3. **Fetch thread context (read-only).** Call `conversations.replies` using ambient credentials to read the existing thread messages. Stop and report the error class on any API failure.
4. **Post reply.** Call `chat.postMessage` using ambient credentials, passing `channel`, `thread_ts`, and `text`. Stop and report on any API failure; do not retry silently.
5. **Return result.** Extract `ts` and `permalink` from the response. Return the permalink to the user.

## Failure and recovery
| Failure class | Condition | Partial-result rule |
|---|---|---|
| `missing-required-input` | `reply_text` or `thread_identifier` is absent | Stop; do not call any Slack API. |
| `slack-api-error` | Any Slack API call returns a non-2xx response | Stop; report error class and HTTP status. Do not retry silently. |
| `permission-denied` | Slack returns `channel_not_found` or `not_in_channel` | Stop; surface the error so the user resolves channel access. |
| `empty-reply` | `reply_text` is empty or whitespace-only | Stop; do not post an empty message. |

Rollback: Slack messages cannot be deleted by this skill. Recovery, if needed, is manual deletion by the user.

## Output
```json
{
  "ok": true,
  "ts": "1234567890.123456",
  "permalink": "https://workspace.slack.com/archives/CHANNEL/p1234567890123456?thread_ts=111222333.444555&cid=CHANNEL"
}
```

On failure, the output contains `ok: false` and an `error` field describing the failure class and API detail.

## Provenance

**Origin:** Warp client-release-agent-oss — https://github.com/warpdotdev/client-release-agent-oss
**Revision:** `9c1394804c5148820a9bab6c01802fde4330d725`
**License:** MIT — https://opensource.org/licenses/MIT

MIT requires the copyright notice and permission notice in all copies or substantial portions; adapted SKILL.md and script files must retain the license and attribution.

**Adaptation statement:** Adapted from Warp client-release-agent-oss for the ODIN skill catalog. Thread-reply mechanism preserved; scoped to one Slack API call for one reply. Authority classified as `human-only-external-or-irreversible` per ODIN Q14. Credentials are treated as ambient operator-managed capabilities — no token or secret is ever requested from or exposed to the user. No third-party expression copied; clean-room adaptation from the documented API interaction pattern.
