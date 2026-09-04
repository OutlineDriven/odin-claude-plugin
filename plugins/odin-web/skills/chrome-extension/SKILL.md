---
name: chrome-extension
description: 'Use when the user explicitly asks to build, modify, or publish a Manifest V3 Chrome extension. Not for store submission without human-gated credentials.'
disable-model-invocation: true
---

# Chrome extension

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User works on a Chrome extension: manifest, service worker, content scripts, messaging, or publishing. |
| Authority | Human-gated: asks before store submission or publication; otherwise reversible local: writes only extension project files under the working directory; rollback is version control. Store submission requires explicit human invocation and human-supplied credentials; never initiated autonomously. |
| Side effect | Writes extension project files under the working directory. Only on explicit human invocation, may submit or publish the extension to a browser store. |
| Done | A loadable MV3 extension exists with manifest, service worker, content scripts, messaging, storage, permissions, CSP, and UI surfaces verified, or a store submission is initiated with human-supplied credentials. |

## Inputs

- Required: the extension's purpose and target surfaces (which pages it acts on, which UI it shows).
- Required for publishing: store account credentials and listing assets, supplied by the human; never inferred, generated, or stored by the skill.
- Optional: existing manifest or source to extend; TypeScript/build preference; target Chrome version.

## Procedure

1. Bound scope: confirm with the human whether this is a new extension, an edit to an existing one, or a store submission. Do not begin store submission unless explicitly invoked for it. **Done when:** the scope is confirmed as new, edit, or submission.
2. Validate inputs at their trust boundary: the required purpose and surfaces are present; any publishing credentials are human-supplied and never inferred. Stop rather than widen scope or invent evidence. **Done when:** required inputs are present and validated, or the missing ones are named and the run stopped.
3. Author or edit `manifest.json` to Manifest V3: set `manifest_version: 3`, `name`, `version`, and the minimal permissions for the declared surfaces. Manifest V2 is not produced. **Done when:** manifest.json is valid MV3 with minimal permissions.
4. Add a service worker via `background.service_worker` for lifecycle and event handling. Keep it stateless across suspension: persist durable state in `chrome.storage`, never in module-level variables. **Done when:** the service worker is stateless and durable state is in chrome.storage.
5. Add content scripts scoped to the declared page matches via `content_scripts.matches`; inject only the CSS and JS each surface needs. **Done when:** content scripts are scoped to declared matches with minimal injected assets.
6. Add UI surfaces as needed: action popup (`action.default_popup`), options page (`options_ui`), side panel, or devtools panel. Each surface is a separate HTML document with its own script. **Done when:** each needed UI surface is a separate HTML document with its own script.
7. Wire messaging with `chrome.runtime.sendMessage` / `chrome.runtime.onMessage` for popup-to-service-worker and `chrome.tabs.sendMessage` for service-worker-to-content-script. Treat every message as untrusted: validate shape and origin before acting. **Done when:** messaging is wired and every message is validated for shape and origin.
8. Choose storage by durability: `chrome.storage.local` for extension data, `chrome.storage.session` for service-worker runtime state, `chrome.storage.sync` for user settings. Never store secrets in `chrome.storage`. **Done when:** storage is chosen by durability and no secrets are stored.
9. Request the narrowest permissions that satisfy the surfaces; prefer optional permissions requested via `chrome.permissions.request` at the point of use over broad manifest-time grants. **Done when:** permissions are minimal, with optional permissions preferred over broad grants.
10. Enforce network and CSP: remote code is banned under MV3, so all scripts must be packaged. Declare `host_permissions` only for the origins the extension actually fetches. **Done when:** all scripts are packaged and host_permissions are scoped to actual fetch origins.
11. Mark resources the page or web context must reach (injected images, frames, or assets) under `web_accessible_resources`, scoped to the matching origins. **Done when:** web-accessible resources are declared and scoped.
12. Respect execution contexts: the service worker, the content script (page-isolated), and the page DOM are separate. Never share live objects across them; serialize through messages. **Done when:** execution contexts are separated and objects are serialized through messages.
13. If TypeScript is preferred, configure a build (`tsc` or a bundler) that emits the JS paths the manifest references; the manifest always points at built output, not source. **Done when:** the build emits JS paths the manifest references.
14. Debug with `chrome://extensions` load-unpacked and the service-worker DevTools. Check `chrome.runtime.lastError` after every async API call; surface `lastError` rather than swallowing it. **Done when:** the extension loads unpacked and lastError is surfaced after every async call.
15. To publish, only on explicit human invocation, package the extension by zipping the built output. Then submit it through the Chrome Web Store developer dashboard using human-supplied credentials and listing assets. The model never enters credentials or triggers the upload autonomously. **Done when:** the extension is packaged and submitted with human-supplied credentials, or the run stops for lack of explicit invocation.

## Failure and recovery
- MV2 requested: stop; MV2 is not produced. Ask the human to confirm MV3.
- Permission over-broad: narrow to the minimal set before proceeding; do not ship broad grants to satisfy a quick test.
- Remote-code or CSP violation: stop; MV3 bans remote scripts. Package the script locally.
- Service-worker state loss: do not rely on in-memory state; move durable state to `chrome.storage` and re-read on the next event.
- Store submission blocked: if the human has not explicitly invoked publishing, do not attempt it. If submission fails (authentication, listing rejection), report the store error verbatim and stop; never retry with inferred credentials.
- Partial result: a loadable unpacked extension that fails a surface is reported with the failing surface named; do not claim the done predicate holds.
- Non-mutation: never delete or overwrite existing project files outside the extension directory without explicit human confirmation.

## Output
A loadable MV3 extension under the working directory (manifest, service worker, content scripts, UI surfaces, and build config as needed), or, when publishing is explicitly invoked, a store submission initiated with human-supplied credentials, plus a report listing the surfaces built, the permissions requested, and any failing surface.
