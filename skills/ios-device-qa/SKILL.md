---
name: ios-device-qa
description: 'Use when the user runs /ios-device-qa to drive a real iPhone over USB through a debug-bridge daemon and return a device QA report with verified interactions. Do not use for remote, credential, publish, deploy, or irreversible changes.'
---

# iOS device QA

## Contract

| Field | Bound contract |
|---|---|
| Trigger | the user runs /ios-device-qa on an iOS app |
| Authority | reversible-local: wire a Debug-only SPM bridge into the app build, deploy to a USB-connected iPhone, capture screenshots and session logs; remove the wiring before a Release build |
| Side effect | debug-bridge wiring in the app build plus screenshots and session logs under ~/.gstack/ |
| Done | a device QA report with verified interactions is produced |

## Inputs

- `--source <dir>`: the app source directory on disk. Required.
- USB-connected, paired, trusted iPhone; macOS host with Xcode and Swift >= 5.9.
- App manifest is SwiftPM (`Package.swift`); at least one file-scope `@Observable` class with `// @Snapshotable`-marked writable instance `var` fields of JSON-native types.
- Optional `--tailnet`: expose the device to remote agents over Tailscale (requires `tailscaled` running and `/var/run/tailscale.sock` readable).
- Optional `--recording`: render an "AGENT DEMO" watermark on screencasts.
- Optional demo request ("demo", "show me", "I want to see it working"): drive every action through visible UI only.

## Procedure

1. Verify bridge compatibility before mutating the app. The generator supports file-scope `@Observable` classes only; `ObservableObject`, `@StateObject`, and other observation models produce no accessors. The documented dependency wiring assumes a SwiftPM manifest; for an `.xcodeproj` or `.xcworkspace` do not invent package or target wiring. If either requirement is unmet, stop the bridge bootstrap without modifying the app. Preserve any installed production or TestFlight build; when a separate QA build is needed, use an isolated bundle identifier and non-production entitlements so it coexists with the production app. Report fixture-driven state, provider UI, and actual external-provider success as distinct evidence tiers.
2. Walk `--source` and identify every file-scope `@Observable` class. A property immediately preceded by the marker comment `// @Snapshotable` is snapshot-eligible: it must be a writable instance `var` with an explicit type and an internal or public setter, of a JSON-native scalar (`String`, `Bool`, integer widths, `Float`, `Double`, `CGFloat`), array, String-keyed dictionary, or Optional composition. Keys must be unique across observable classes. Stop with a source diagnostic instead of emitting a broken or lossy harness when any constraint is violated.
3. Show the accessor list and ask the user whether to install the DebugBridge SPM dependency into `Package.swift`.
4. Generate the local bridge package, typed accessors, and installed version marker with one deterministic command: `gstack-ios-qa-regen --app-source "<source-dir>" --bridge-dir "<source-dir>/DebugBridge"`. The regenerator also removes the obsolete flat-file set from older ios-sync versions so no stale second harness remains in the app target.
5. Add the generated `DebugBridge` local SPM dependency to `Package.swift`. It ships three Debug-config-only products: `DebugBridgeCore` (StateServer + bridge protocols), `DebugBridgeTouch` (in-process touch synthesis with iOS 18+ `_UIHitTestContext` SwiftUI hit-testing), and `DebugBridgeUI` (screenshot, elements, and mutation bridges). The app target depends on `DebugBridgeUI` with `.when(configuration: .debug)`, transitively pulling in Core and Touch; Release builds refuse to link these targets.
6. Wire the bridges from the `@main` App init, gated on `#if DEBUG`: call `DebugBridgeUIWiring.installAll()` before the StateServer opens its listener, then `DebugBridgeManager.shared.start(appState: appState, register: AppStateAccessor.register)` with the type discovered in step 2.
7. Build and deploy: `xcodebuild -scheme <SchemeName> -destination 'platform=iOS,id=<UDID>' build install`. Launch via `devicectl device process launch --device <UDID> --console <bundle-id>` and capture the boot token printed to `os_log` on first run.
8. Spawn the Mac-side daemon `gstack-ios-qa-daemon`. It acquires an exclusive flock on `~/.gstack/ios-qa-daemon.pid`; a second invocation discovers the live daemon's port and connects rather than double-binding. The daemon immediately calls `POST /auth/rotate` on the iOS StateServer with a fresh in-memory-only token, so the boot token becomes useless ~5s later and anything scraping `os_log` past this point sees a dead credential. If a fresh daemon finds the app running after another daemon consumed that one-use token, it verifies the bundle owner, relaunches the target once, waits for the new token, verifies ownership again, then rotates. The app's StateServer binds loopback only (`::1` + `127.0.0.1`); tailnet ingress is exclusively the daemon's job.
9. Run the vision-driven agent loop. Each iteration: `GET /screenshot` and save the PNG; `GET /elements` for the accessibility tree; `GET /state/snapshot` for only the `// @Snapshotable` fields; decide the next action against the test goal; `POST /session/acquire` to grab the device lock; execute `POST /tap`, `/swipe`, `/type`, or `POST /state/<key>` write; re-screenshot and compare; record a finding if buggy; `POST /session/release` once the iteration is done.
10. In demo mode, drive every action through visible UI (`/tap`, `/swipe`, `/type`) and never use `POST /state/*` writes to skip steps; bump the screencap rate to 4fps so the recording shows each action as it happens. This override takes precedence over all other rules; viewers see the agent type every key and tap every button.
11. In tailnet mode (`--tailnet`), the daemon also binds the Tailscale interface (never `0.0.0.0`), fails closed if `/var/run/tailscale.sock` is missing, permission-denied, or returns an unparseable WhoIs response, and mints short-lived session tokens (default 1h, max 24h) for allowlisted remote identities. Capability tiers are ordered observe < interact < mutate < restore; granting `restore` implies all lower tiers. Observe covers `/screenshot`, `/elements`, `GET /state/*`, `/healthz`, `/session/heartbeat`; interact adds `/tap`, `/swipe`, `/type`; mutate adds `POST /state/<key>`; restore adds `POST /state/restore`. Every authenticated mutating tailnet request writes an audit row to `~/.gstack/security/ios-qa-audit.jsonl`; rejections write to `attemp…
12. Before a Release build, remove the DebugBridge SPM dependency and all `#if DEBUG` wiring. The structural guard (`.when(configuration: .debug)` plus a CI `swift build -c release` check) is the safety-critical path; this cleanup is a convenience flow.

## Failure and recovery
- `curl: connection refused` to the daemon: the daemon crashed. Re-run `/ios-device-qa`; the spawn-race lock fails closed rather than double-binding.
- `403 identity_not_allowed` from `/auth/mint`: the identity is missing from the allowlist. Run `gstack-ios-qa-mint --remote <identity>` on the Mac.
- `409 schema_mismatch` on `/state/restore`: the snapshot is from an older app build. Discard the snapshot and re-capture from the current build.
- `503 device_disconnected` from the proxy: the USB route dropped or the app relaunched. The daemon invalidates the stale tunnel and retries one fresh bootstrap; reconnect and unlock the iPhone if it persists.
- `429 rate_limited` from `/auth/mint`: more than 10 mints/min from one identity. Wait 60s and check the audit log for anomalies.
- `413 body_too_large` on `/state/restore`: the snapshot exceeds 1MB. Increase `--max-body` or trim the snapshot.
- A claimed limitation or requirement is a material claim: state it only with the verbatim error, the documented statement, or a live probe in hand. Run a cheap probe before asking the user or declaring a step blocked.
- Partial-result rule: never swallow an error or pretend the done predicate holds. If the loop cannot verify an interaction, record it as unverified in the report with the failing symptom. The bridge wiring is reversible; do not widen scope or invent evidence when a step fails. Stop and report BLOCKED with the blocker and what was tried rather than fabricating a green result.

## Output
A device QA report containing: the accessor list generated; each verified interaction with its before/after screenshots and the state delta; any bugs found with reproduction steps; unverified interactions with their failure symptom; and the evidence tier (fixture-driven state, provider UI, or actual external-provider success) for each finding. Screenshots and session logs are written under `~/.gstack/`.
