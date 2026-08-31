---
name: respond-to-slack-thread
description: 'Use when the user asks to reply to or follow up on a specific Slack thread. Converts a permalink to channel and thread_ts, posts one reply, and returns its permalink. Not for top-level messages, deleting messages, or composing the reply text.'
disable-model-invocation: true
---

# Respond to Slack thread

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to reply to or follow up on a specific Slack thread. |
| Authority | Irreversible remote mutation via Slack API using operator-provided credentials. Explicit human invocation required with all required inputs present. |
| Side effect | Posts one reply to the specified Slack channel and thread. |
| Done | The reply is posted and its permalink is returned. |

## Inputs

- Reply text (required): the exact reply text to post. Do not synthesize or extend beyond what the user supplied.
- Thread identifier (required): a thread permalink, or a channel ID and thread timestamp (`channel_id`, `thread_ts`).

Credentials (`SLACK_BOT_TOKEN`, channel configuration) are ambient operator-managed capabilities. Do not ask the user to supply, paste, reveal, or log a token or secret.

## Procedure

1. Validate authority and required inputs. Confirm the user has explicitly asked to post a reply to this specific thread with reply text present. Reject if `reply_text` or `thread_identifier` is absent, empty, or whitespace-only. Do not proceed on a vague or indirect signal. Done when: authority is confirmed and both inputs are present and non-empty.
2. Convert permalink to channel and thread_ts if required. If the thread identifier is a permalink, parse it to extract the channel ID and thread timestamp. A Slack thread permalink has the form `https://<workspace>.slack.com/archives/<channel_id>/p<thread_ts>` where the `p` prefix is followed by a timestamp with periods replaced by hyphens. Convert the path segment to a thread timestamp by removing the `p` prefix and replacing hyphens with periods. If the thread identifier is already a channel ID and thread timestamp pair, use them directly. Done when: `channel` and `thread_ts` are resolved.
3. Fetch existing thread messages for context. Call `conversations.replies` using ambient credentials, passing `channel` and `thread_ts`, to read the existing thread messages. Stop and report the error class on any API failure. Done when: thread context is fetched or the API error is reported.
4. Post the reply. Call `chat.postMessage` using ambient credentials, passing `channel`, `thread_ts`, and `text`. Stop and report on any API failure. Do not retry silently. Done when: the reply is posted and the API response is received.
5. Fetch or construct the reply permalink. Extract `ts` from the `chat.postMessage` response. Construct the permalink as `https://<workspace>.slack.com/archives/<channel>/p<ts_with_periods_replaced_by_hyphens>`, or call `chat.getPermalink` with `channel` and `message_ts` to fetch it directly. Done when: the permalink is returned.

## Failure and recovery

| Failure class | Condition | Recovery |
|---|---|---|
| `missing-required-input` | `reply_text` or `thread_identifier` is absent or empty | Stop. Do not call any Slack API. |
| `invalid-permalink` | Permalink cannot be parsed into channel and thread_ts | Stop. Report the malformed permalink. Do not call any Slack API. |
| `slack-api-error` | Any Slack API call returns a non-2xx response | Stop. Report error class and HTTP status. Do not retry silently. |
| `permission-denied` | Slack returns `channel_not_found` or `not_in_channel` | Stop. Surface the error so the user resolves channel access. |
| `empty-reply` | `reply_text` is whitespace-only | Stop. Do not post an empty message. |

Rollback: Slack messages cannot be deleted by this skill. Recovery, if needed, is manual deletion by the user.

## Output

One JSON object: `ok`, `ts`, and `permalink` on success. `ok: false` plus an `error` field naming the failure class and API detail on failure.
