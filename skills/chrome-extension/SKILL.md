---
name: chrome-extension
description: 'Build and publish a working MV3 Chrome extension.'
disable-model-invocation: true
---

# Chrome extension

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User works on a Chrome extension: manifest, service worker, content scripts, messaging, or publishing. |
| Authority | Human only. The model may write extension project files (local, reversible). Store submission or publication is irreversible and external, so it requires explicit human invocation and is never initiated autonomously. |
| Side effect | Writes extension project files under the working directory. Only on explicit human invocation, may submit or publish the extension to a browser store. |
| Done | A working extension or store submission exists, backed by the 13-area MV3 reference coverage enumerated in the procedure. |

## Inputs

- Required: the extension's purpose and target surfaces (which pages it acts on, which UI it shows).
- Required for publishing: store account credentials and listing assets, supplied by the human; never inferred, generated, or stored by the skill.
- Optional: existing manifest or source to extend; TypeScript/build preference; target Chrome version.

## Procedure

1. Bound scope: confirm with the human whether this is a new extension, an edit to an existing one, or a store submission. Do not begin store submission unless explicitly invoked for it.
2. Validate inputs at their trust boundary: the required purpose and surfaces are present; any publishing credentials are human-supplied and never inferred. Stop rather than widen scope or invent evidence.
3. Author or edit `manifest.json` to Manifest V3: set `manifest_version: 3`, `name`, `version`, and the minimal permissions for the declared surfaces. Manifest V2 is not produced.
4. Add a service worker via `background.service_worker` for lifecycle and event handling. Keep it stateless across suspension: persist durable state in `chrome.storage`, never in module-level variables.
5. Add content scripts scoped to the declared page matches via `content_scripts.matches`; inject only the CSS and JS each surface needs.
6. Add UI surfaces as needed: action popup (`action.default_popup`), options page (`options_ui`), side panel, or devtools panel. Each surface is a separate HTML document with its own script.
7. Wire messaging with `chrome.runtime.sendMessage` / `chrome.runtime.onMessage` for popup-to-service-worker and `chrome.tabs.sendMessage` for service-worker-to-content-script. Treat every message as untrusted: validate shape and origin before acting.
8. Choose storage by durability: `chrome.storage.local` for extension data, `chrome.storage.session` for service-worker runtime state, `chrome.storage.sync` for user settings. Never store secrets in `chrome.storage`.
9. Request the narrowest permissions that satisfy the surfaces; prefer optional permissions requested via `chrome.permissions.request` at the point of use over broad manifest-time grants.
10. Enforce network and CSP: remote code is banned under MV3, so all scripts must be packaged. Declare `host_permissions` only for the origins the extension actually fetches.
11. Mark resources the page or web context must reach (injected images, frames, or assets) under `web_accessible_resources`, scoped to the matching origins.
12. Respect execution contexts: the service worker, the content script (page-isolated), and the page DOM are separate; never share live objects across them, serialize through messages.
13. If TypeScript is preferred, configure a build (`tsc` or a bundler) that emits the JS paths the manifest references; the manifest always points at built output, not source.
14. Debug via `chrome://extensions` load-unpacked, the service-worker DevTools, and a `chrome.runtime.lastError` check on every async API; surface `lastError` rather than swallowing it.
15. To publish, only on explicit human invocation: package the extension (zip the built output), then submit through the Chrome Web Store developer dashboard using human-supplied credentials and listing assets. The model never enters credentials or triggers the upload autonomously.

## Failure and recovery
- MV2 requested: stop; MV2 is not produced. Ask the human to confirm MV3.
- Permission over-broad: narrow to the minimal set before proceeding; do not ship broad grants to satisfy a quick test.
- Remote-code or CSP violation: stop; MV3 bans remote scripts. Package the script locally.
- Service-worker state loss: do not rely on in-memory state; move durable state to `chrome.storage` and re-read on the next event.
- Store submission blocked: if the human has not explicitly invoked publishing, do not attempt it. If submission fails (authentication, listing rejection), report the store error verbatim and stop; never retry with inferred credentials.
- Partial result: a loadable unpacked extension that fails a surface is reported with the failing surface named; do not claim the done predicate holds.
- Non-mutation rule: never delete or overwrite existing project files outside the extension directory without explicit human confirmation.

## Output
A loadable MV3 extension under the working directory (manifest, service worker, content scripts, UI surfaces, and build config as needed), or, when publishing is explicitly invoked, a store submission initiated with human-supplied credentials. A report listing the surfaces built, the permissions requested, and any failing surface.

## Provenance

Origin: samber/cc-skills, `skills/chrome-extension/SKILL.md`, revision `f9953962e135235137628ea92d06ea085688031f`, MIT. Clean-room adaptation: the procedure is rewritten from the described MV3 extension mechanism (manifest, service worker, content scripts, messaging, storage, permissions, CSP, publishing) without copying the source expression.
