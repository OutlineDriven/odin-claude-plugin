---
name: session-share
description: 'Use when the user asks to beam, publish, or share the current local coding session to an authenticated remote receiver. Not for viewing a transcript locally: use session-viewer.'
disable-model-invocation: true
---

# Session share

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User explicitly asks to beam, publish, or share the current local coding session with an authenticated remote receiver. |
| Authority | Remote: uploads a redacted, size-bounded JSON payload to a configured endpoint over HTTPS with authentication; requires explicit human invocation. Previews the payload size and destination before sending. No model-autonomous invocation. |
| Side effect | A redacted, size-bounded JSON payload is uploaded to a configured endpoint over HTTPS with authentication; a shareable URL is returned. No raw JSONL, reasoning traces, or credentials are sent. |
| Done | The returned URL is valid and the payload contains only visible user/assistant messages and aggregate tool counts. |

## Not for

- Viewing or exporting a session transcript locally; use session-viewer.

## Inputs

- Required: the current local coding session transcript (visible user and assistant messages, tool-call metadata).
- Required: target endpoint URL (HTTPS). The user must supply or have configured it.
- Required: authentication credentials for the endpoint. The user must supply or have configured them; the skill never invents credentials.
- Optional: a session-end hook configuration that may invoke sharing automatically at session end. Synchronization is opt-in and off by default.

## Payload contract

The payload is a single JSON object:

```json
{
  "messages": [
    {"role": "user", "text": "..."},
    {"role": "assistant", "text": "..."}
  ],
  "tool_counts": {"tool_name": integer, ...},
  "size_bytes": integer
}
```

- `messages`: visible user and assistant messages only. Exclude raw JSONL, reasoning or thinking traces, tool result bodies, and any credential- or secret-bearing content.
- `tool_counts`: aggregate invocations per tool name (total count), not individual tool inputs or outputs.
- `size_bytes`: the serialized payload size in bytes, measured before upload.

The size limit is 5 MB (5,242,880 bytes). If the serialized payload exceeds this limit, drop the oldest non-essential messages while preserving `tool_counts` until the payload is at or below the limit. If the payload still exceeds 5 MB after dropping all non-essential messages, stop and report the measured size; do not upload.

## HTTP contract

Upload is a single POST request:

- Method: POST
- URL: the configured endpoint URL (must be HTTPS)
- Header: `Authorization: Bearer <token>` or the credential format the endpoint requires
- Header: `Content-Type: application/json`
- Body: the serialized payload JSON

The endpoint response is JSON. The skill reads the shareable URL from the response body. The expected response shape:

```json
{"url": "https://...", ...}
```

If the response is not valid JSON, or the `url` field is absent or not a valid HTTPS URL, the upload failed; report the response status and body excerpt.

## Procedure

1. Confirm the user explicitly requested sharing this session. If the request is ambiguous or model-initiated, stop and ask for explicit human confirmation. **Done when:** explicit human intent is confirmed.
2. Extract visible user and assistant messages from the transcript. Exclude raw JSONL, reasoning traces, tool result bodies, and credential-bearing content. Aggregate tool-call counts (total invocations per tool name). **Done when:** only visible messages and aggregate counts are selected.
3. Serialize the payload JSON and measure its size. If it exceeds 5 MB, drop the oldest non-essential messages while preserving `tool_counts` until it is at or below 5 MB. If it still exceeds 5 MB, stop and report the measured size. **Done when:** the payload is within the 5 MB limit or the blocked result is reported.
4. Preview the payload to the user: state the byte size, the message count, the destination endpoint URL, and that a redacted JSON payload will be uploaded over HTTPS. Wait for an explicit yes. **Done when:** the user confirms after seeing the preview, or the user declines and the run stops.
5. Validate that authentication credentials are available for the endpoint. **Done when:** credentials are confirmed present, or the missing prerequisite is reported and no payload is sent.
6. POST the payload to the endpoint over HTTPS with the authentication header and `Content-Type: application/json`. **Done when:** the upload completes with an HTTP response, or the network or HTTP error is reported.
7. Parse the response JSON and extract the `url` field. Validate that it is a well-formed HTTPS URL. **Done when:** the URL is validated, or the response failure is reported.
8. Optional session-end hook: if the user has configured a session-end hook command (configuration example only), it may invoke this procedure automatically at session end; synchronization remains opt-in and is off by default. **Done when:** the hook configuration is noted or confirmed absent.

## Failure and recovery

- Ambiguous or model-initiated request: stop, do not upload, ask for explicit human confirmation.
- Missing credentials: stop before any upload; report that endpoint credentials are not configured; no payload is sent.
- Human rejects preview: no upload occurs. The run stops. Report that the user declined.
- Payload exceeds 5 MB after dropping non-essential messages: report a blocked result with the measured size; do not upload an oversized payload.
- Upload failure (network timeout, DNS failure, TLS error): report the exact error and the blocked result; no URL is returned. Do not retry blindly.
- HTTP error (4xx or 5xx): report the status code and a short response body excerpt; no URL is returned. Do not retry blindly.
- Response lacks valid URL: report the response status and body excerpt; no URL is returned.
- Redaction leak detected (reasoning, credentials, or raw JSONL present in the payload): abort before upload; report the leak; do not publish.
- Non-mutation rule: publishing is irreversible once the URL is returned; the only protection is to never upload a payload that fails the redaction contract.

## Output

On success, a valid shareable URL plus confirmation that the published payload contains only visible user/assistant messages and aggregate tool counts. On failure, a blocked result naming the failure class with no URL published.
