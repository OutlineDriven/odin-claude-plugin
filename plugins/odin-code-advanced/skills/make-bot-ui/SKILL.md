---
name: make-bot-ui
description: 'Use when a human invokes this skill to build a webhook UI that wakes a bot with server-side secret isolation and an end-to-end probe. Not for unpreviewed or unapproved credential, host, Tailscale, deployment, remote, paid, or irreversible changes.'
disable-model-invocation: true
---

# Make bot UI

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A human explicitly invokes this skill to build a webhook UI that wakes a bot. |
| Authority | Require explicit human invocation, then preview the exact files, server endpoint, credential storage, network exposure, and any host-level Tailscale installation before changing them. Do not perform an unpreviewed credential, data-at-rest, deployment, remote, paid, or irreversible action. |
| Side effect | Create or modify only the previewed webhook server and browser UI; optionally install and configure Tailscale node support only when the human explicitly requests that installation after seeing its host and network consequences. |
| Done | The UI is working and has been exercised through the real server-to-webhook path, the bot wake request succeeds, and neither browser-delivered code nor browser-visible traffic contains the webhook secret. |

## Inputs

Required: the target project and run command; the bot webhook URL and its required request contract; the secret's approved server-side source, supplied without placing its value in browser code or chat output; and the UI action and fields that should wake the bot.

Optional: an existing server route to extend, UI constraints, the local or remote probe target, and a request to expose the server through Tailscale. A Tailscale request must identify the host and intended audience; installation or host configuration requires a separate preview of the exact host-level and network changes before execution.

## Procedure

1. Inspect the named project and identify its existing server, routing, configuration, and UI conventions. Bound the change to the files, endpoint, credential location, and network exposure needed for the requested wake action. Done when: the change boundary is stated and no out-of-scope file is queued.
2. Present the bounded change set and consequences before mutation. Include every credential or data-at-rest change and, when requested, the exact Tailscale package, host, service, listener, and exposure change. Stop unless the human's explicit invocation covers the previewed external or irreversible work. Done when: the human confirms the preview or the run stops without mutation.
3. Validate the webhook URL, required method, headers, payload fields, and expected success response at the server trust boundary. Validate and constrain every browser-supplied field before using it in the outbound request. Do not infer missing webhook semantics or secret values. Done when: every webhook contract field is validated or the run stops naming the missing field.
4. Read the webhook secret only in server-side code from the approved server environment or credential store. Keep the secret out of HTML, browser JavaScript, serialized page state, URLs, logs, errors, and server responses. Make the server construct and authenticate the outbound webhook request. Done when: the secret is confined to server-side code and no browser-visible surface can contain it.
5. Implement the smallest server route and UI needed for the wake action. The browser sends only validated non-secret inputs to the server; the server invokes the bot webhook and returns a bounded success or failure result that does not echo credentials or sensitive upstream content. Done when: the server route and UI exist and the browser sends only non-secret inputs.
6. If Tailscale exposure was explicitly requested and approved after preview, install or configure only the named node support and expose only the approved listener to the approved audience. Otherwise, leave host packages and network configuration unchanged. Done when: the Tailscale configuration matches the approved preview or host state is unchanged.
7. Launch the actual server and UI. Exercise the UI through the real browser-to-server-to-webhook path with an approved safe probe, and record the observed response and bot wake result. Inspect the browser-delivered assets, page state, URL, and browser-visible request and response data for the secret; treat any occurrence as failure and remove it before probing again. Done when: the end-to-end probe succeeds and the browser-side secret inspection is clean.
8. Compare the observed state with the done predicate. Report success only when the wake request works and the browser-side secret inspection is clean; do not widen scope or invent probe evidence to obtain a passing result. Done when: the done predicate is confirmed or the failing observation is reported.

## Failure and recovery

- Missing or invalid input: do not mutate. Return `blocked` with the missing webhook contract, target, approved secret source, or host/exposure decision named exactly.
- Authorization not established: do not perform the credential, data-at-rest, host installation, deployment, remote, paid, or irreversible action. Return `blocked` with the unapproved preview item.
- Secret exposure: stop the probe, remove the secret from browser-delivered and browser-visible surfaces, invalidate or rotate it through the human's approved credential process if it may have escaped the local boundary, then repeat the complete probe. Never print the secret in the result.
- Implementation, installation, network, or webhook failure: preserve the original error without credential material. Revert files changed by this execution to their pre-execution contents and undo only host or Tailscale changes made by this execution when that rollback is safe and was included in the preview; otherwise stop and identify the exact manual recovery action.
- Partial result: a rendered UI, a running server, or a successful isolated webhook call is not success without the end-to-end probe and clean browser-side secret inspection. Return `blocked` with completed changes, remaining state, rollback performed, and the failing observation.

## Output

Return the exact created or modified files and any approved host or Tailscale state changes, the command and target used for the end-to-end probe, the observed wake result, and a credential-redacted account of the browser-side secret inspection. End with `success` only when the done predicate holds; otherwise end with `blocked` and the applicable recovery state.
