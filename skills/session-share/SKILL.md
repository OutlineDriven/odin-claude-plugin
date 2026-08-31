---
name: session-share
description: 'Beam a redacted session payload and return a shareable URL. Not for viewing a transcript locally — use session-viewer.'
disable-model-invocation: true
---

# Session share

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User explicitly asks to beam, publish, or share the current local coding session with an authenticated OpenClaw receiver. |
| Authority | Human-only. Require explicit human invocation; preview the upload target and consequence before publishing. No model-autonomous invocation. |
| Side effect | A redacted, size-bounded JSON payload is uploaded to a Beam endpoint over HTTPS with authentication; a shareable URL is returned. No raw JSONL, reasoning traces, or credentials are sent. |
| Done | The returned Beam URL is valid and the payload contains only visible user/assistant messages and aggregate tool counts. |

## Not for

- Viewing or exporting a session transcript locally — use session-viewer.

## Inputs

- Required: the current local coding session transcript (visible user and assistant messages, tool-call metadata).
- Required: authenticated Beam endpoint credentials over HTTPS. The user must supply or have configured authentication; the skill never invents credentials.
- Optional: a session-end hook configuration, kept as a configuration example, that may invoke beaming automatically at session end. Synchronization is opt-in and off by default.

## Procedure

1. Confirm the user explicitly requested beaming, publishing, or sharing this session. If the request is ambiguous or model-initiated, stop and ask for explicit human confirmation. **Done when:** explicit human intent is confirmed.
2. Preview the upload target and consequence to the user: state that a redacted, size-bounded JSON payload will be uploaded to the authenticated Beam endpoint over HTTPS and that a shareable URL will be returned. **Done when:** the user confirms after seeing the preview.
3. Target the transcript: select only visible user and assistant messages. Exclude raw JSONL, reasoning or thinking traces, tool result bodies, and any credential- or secret-bearing content. **Done when:** only visible messages are selected.
4. Build the redacted payload: include the selected messages plus aggregate tool-call counts only (total invocations per tool name), not individual tool inputs or outputs. **Done when:** the payload contains only messages and aggregate counts.
5. Enforce a size bound on the payload before upload; if the bound is exceeded, drop oldest non-essential messages while preserving the aggregate counts. **Done when:** the payload is within the size bound.
6. Validate that authentication is available for the Beam endpoint over HTTPS. **Done when:** credentials are confirmed present or the missing prerequisite is reported.
7. Upload the redacted, size-bounded payload to the Beam endpoint over HTTPS with authentication. **Done when:** the upload completes or the error is reported.
8. Receive the returned shareable URL. Validate that the URL is well-formed and reachable. **Done when:** the URL is validated or the failure is reported.
9. Optional session-end hook: if the user has configured a session-end hook command (configuration example only), it may invoke this procedure automatically at session end; synchronization remains opt-in and is off by default. **Done when:** the hook configuration is noted or confirmed absent.

## Failure and recovery

- **Ambiguous or model-initiated request:** stop, do not upload, ask for explicit human confirmation.
- **Missing authentication:** stop before any upload; report that Beam credentials are not configured; no payload is sent.
- **Payload exceeds size bound after dropping non-essential messages:** report a blocked result with the measured size; do not upload an oversized payload.
- **Upload failure (network, HTTP error, authentication rejected):** do not retry blindly; report the exact error and the blocked result; no partial URL is returned.
- **Redaction leak detected (reasoning, credentials, or raw JSONL present in the payload):** abort before upload; report the leak; do not publish.
- **Non-mutation rule:** publishing is irreversible once the URL is returned; the only protection is to never upload a payload that fails the redaction contract.

## Output

On success, a valid shareable Beam URL plus confirmation that the published payload contains only visible user/assistant messages and aggregate tool counts; on failure, a blocked result naming the failure class with no URL published.

## Provenance

- Origin: https://github.com/openclaw/agent-skills, revision ae75f60e8d454f1cf44ec4613e10ec9ea7f2ade7, MIT license (LICENSE).
- Adaptation: clean-room adaptation preserving transcript targeting rules, the redaction contract, HTTPS/authentication, and session-end hook commands as configuration examples; synchronization opt-in preserved. No third-party expression copied.
