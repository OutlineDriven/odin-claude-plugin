---
name: post-to-slack
description: 'Use when the user explicitly asks to share a message on Slack through an incoming webhook. Not for posting without an explicit request or for retrying an ambiguous delivery.'
disable-model-invocation: true
---

# Post to Slack

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user explicitly asks to share a message on Slack; a suggestion to post is advisory and does not supply authority. |
| Authority | Remote: posts one Slack message through the webhook credential; requires explicit human invocation and a preview of the destination and consequence. |
| Side effect | Send one JSON message payload to the supplied Slack incoming webhook; do not modify any other remote resource. |
| Done | Slack accepts the request, and the posted-message result is reported without exposing the webhook URL. |

## Inputs

- Required: the exact message text to post.
- Required: a Slack incoming webhook URL supplied directly or through the configured environment.
- Optional: a human-readable channel or destination label for the preview. The webhook controls the actual destination; do not claim a channel that cannot be established from supplied information.

## Procedure

1. Confirm that the user explicitly requested this post and preserve the supplied message text without adding unsupported facts. Done when: the explicit request is confirmed and the message text is preserved.
2. Parse the webhook URL before making any request. Require HTTPS, the exact host `hooks.slack.com`, and a non-empty path; reject credentials, query parameters, fragments, redirects, and every other host. Done when: the webhook URL is validated against all boundary requirements.
3. Preview the destination as the supplied label when available, otherwise as the configured Slack webhook destination, and show the exact message plus the consequence that one remote Slack message will be created. Do not display the webhook URL or any part of its secret path. Done when: the preview is presented with destination, message, and consequence, without exposing the URL.
4. After the preview, send exactly one HTTP POST to the validated URL with `Content-Type: application/json` and the JSON object `{"text":"<message>"}`, where `<message>` is encoded as a JSON string. Done when: one HTTP POST is sent with the correct content type and JSON body.
5. Do not follow redirects or retry automatically. Treat only an HTTP 200 response whose body is exactly `ok` after trimming surrounding whitespace as confirmation. Done when: the response is classified as confirmed (HTTP 200 `ok`) or not confirmed.
6. Report the confirmed post. If confirmation is absent, stop with the applicable failure result and do not claim that the message was posted. Done when: the post is reported as confirmed or the failure result is returned.

## Failure and recovery
- Missing authority or input: do not access the credential or send a request; report `blocked` and name the missing explicit request, message, or webhook configuration.
- Invalid webhook boundary: do not send a request; report `blocked` with the failed URL requirement while redacting the full URL and secret path.
- Transport, redirect, HTTP, or Slack rejection: do not retry; report `failed`, the safe status or error, and whether the server may have received the request. Redact credentials and response details that reproduce the webhook URL.
- Ambiguous result: if the request may have reached Slack but the exact success response was not observed, report `unknown`; do not resend because that could duplicate the message.
- A confirmed post has no rollback in this procedure. State that removal, if needed, requires an authorized human action in Slack rather than pretending the mutation was reversed.

## Output
The destination label when supplied, a safe message summary or the exact message when appropriate, and one terminal classification: `posted` for confirmed HTTP 200 `ok`, `blocked` before mutation, `failed` for a confirmed rejection or pre-delivery transport failure, or `unknown` when delivery cannot be determined, never including the webhook URL or secret path.
