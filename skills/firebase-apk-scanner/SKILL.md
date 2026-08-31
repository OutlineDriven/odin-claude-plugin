---
name: firebase-apk-scanner
description: 'Use when an authorized user needs to extract Firebase configuration from Android APKs and probe the corresponding Firebase endpoints for misconfiguration. Returns a per-APK classification with evidence and remediation.'
disable-model-invocation: true
---

# Firebase APK scanner

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Authorized user needs to extract Firebase configuration from Android APKs and probe the corresponding Firebase endpoints for misconfiguration. |
| Authority | Human-only. Runs only on explicit human invocation. Before any probe that mutates remote state, present the target endpoints and the exact probe mutations and get operator confirmation. Do not test any APK or Firebase project without written authorization for it. |
| Side effect | Remote mutation of Firebase authentication, Realtime Database, Firestore, Storage, Cloud Functions, and Remote Config endpoints derived from the APKs — limited to one small, uniquely named probe artifact per test that is deleted before reporting. No bulk writes and no deletion of pre-existing data. |
| Done | Every APK is classified as tested, failed, or no-config; every created probe artifact is deleted and verified gone; findings include evidence and remediation. |

## Inputs

- One or more APK paths (a single `.apk` file or a directory of `.apk` files) — required.
- Written authorization covering each APK and the Firebase project(s) it references — required before any probe; an APK without it is not scanned.
- Local tools `apktool`, `curl`, `jq`, `grep`, `unzip`, and `strings` (binutils) — required; `sed`/`awk` helpful.
- A working directory for decompiled output — optional; removed at the end unless the operator asks to keep it.
- Known function names or collection names to prioritize — optional.

## Procedure

1. Validate input at the trust boundary. Confirm each path exists; expand a directory argument to its `.apk` list; if the list is empty, ask the operator for a path and stop. For each APK, confirm written authorization for the app and its Firebase project. An APK missing authorization is classified `failed` with reason `not-authorized` and skipped — no probe runs for it. Done when: every APK path is confirmed, authorization is verified, and unauthorized APKs are classified `failed`.
2. Decompile each authorized APK: `apktool d -f -o <workdir>/<apk-basename> <apk>`. If decompile fails, classify the APK `failed` with the error and continue with the rest. Done when: every authorized APK is decompiled or classified `failed` with the error.
3. Extract every Firebase configuration from all sources and test all configurations found — an app may embed several projects:
   - `google-services.json` (jq: `project_info.project_id`, `project_info.firebase_url`, `project_info.storage_bucket`, `client[].api_key[].current_key`, `project_info.project_number`).
   - `res/values*/**.xml` and `AndroidManifest.xml`: `https://<id>.firebaseio.com`, `<id>.appspot.com`, `AIza[A-Za-z0-9_-]{35}`, `<id>.firebaseapp.com`, `gcm_defaultSenderId`.
   - `assets/**` (React Native, Flutter, and Cordova bundles; `firebase_config.json`, `config.json`, `firebaseConfig.js`): the same patterns plus `gs://<bucket>` and `<region>.cloudfunctions.net/<name>` for function names and `projectId` references.
   - Raw DEX: `unzip` each `*.dex`, run `strings`, and grep the same patterns; also scan `res/raw/**`.
   Collect, per project: `project_id`, database URL (given or `https://<project_id>.firebaseio.com`), storage bucket (`<project_id>.appspot.com`), API key, auth domain, and any function names. If no `project_id`/API key is recoverable from any source, classify the APK `no-config` — meaning the app may not use Firebase or its config is obfuscated or packed beyond extraction — and run no probes. Done when: all configs are extracted from all sources, or the APK is classified `no-config`.
4. Preview and confirm scope. List every endpoint about to be probed and the exact probe mutation (one test account, one uniquely named database node, one Firestore document, one storage object). Get operator confirmation before the first write probe. This is the human-only gate. Done when: operator confirmation is obtained for every endpoint and probe mutation.
5. Probe authentication (Identity Toolkit, `https://identitytoolkit.googleapis.com/v1`, `?key=<api_key>`):
   - Open signup: `POST accounts:signUp` with `{"email":"firebasescanner_test_<timestamp>@test-domain-nonexistent.com","password":"TestPassword123!","returnSecureToken":true}`. A returned `idToken` is a CRITICAL finding (open signup). `ADMIN_ONLY_OPERATION` or `OPERATION_NOT_ALLOWED` means restricted and is not a finding. If a test account was created, delete it immediately with `POST accounts:delete` `{"idToken":"<idToken>"}` and record the deletion.
   - Anonymous auth: `POST accounts:signUp` `{"returnSecureToken":true}`. A returned `idToken` is a HIGH finding; save the token for authenticated-bypass testing in step 6, then delete the anonymous account the same way.
   - Email enumeration: `POST accounts:createAuthUri` with a known-registered address and a random one. If the `registered`/`signinMethods` fields differ between them, it is a MEDIUM finding.
   Done when: auth probes are complete, findings are recorded, and test accounts are deleted.
6. Probe Realtime Database and Firestore:
   - RTDB unauthenticated read: `GET <db_url>/.json`, `GET <db_url>/.json?shallow=true`, and common paths (`users`, `messages`, `orders`, `config`, `admin`). Any non-error body is a CRITICAL finding; capture the exposed data as evidence.
   - RTDB write: `PUT <db_url>/_firebase_security_test_<timestamp>.json` with `{"security_test":"<timestamp>"}`. If the echo contains `security_test`, it is a CRITICAL finding; then `DELETE <db_url>/_firebase_security_test_<timestamp>.json` and verify the delete.
   - Authenticated bypass: for a read denied unauthenticated, retry with `?auth=<anonymous idToken from step 5>`. A successful read is a HIGH finding — `auth != null` rules are satisfied by anonymous tokens.
   - Firestore read: `GET https://firestore.googleapis.com/v1/projects/<project_id>/databases/(default)/documents` and the same common collection names. Exposed documents are a CRITICAL finding.
   - Firestore write: `POST .../documents/<collection>` with `{"fields":{"security_test":{"stringValue":"<timestamp>"}}}`. If created, it is a CRITICAL finding; read the returned `.name`, `DELETE https://firestore.googleapis.com/v1/<name>`, and verify.
   Done when: database probes are complete, findings are recorded, and probe artifacts are deleted.
7. Probe Storage: `GET https://firebasestorage.googleapis.com/v0/b/<bucket>/o` (list both `<project_id>.appspot.com` and any raw bucket). A returned `items[]` is a HIGH finding; note sensitive file types (`sql`, `pdf`, `json`, `env`). Upload probe: `POST .../o?uploadType=media&name=_firebase_security_test_<timestamp>.txt` with `Content-Type: text/plain`. If the response contains `"name"`, it is a CRITICAL finding; `DELETE .../o/_firebase_security_test_<timestamp>.txt` (URL-encode the name) and verify. Done when: storage probes are complete, findings are recorded, and probe artifacts are deleted.
8. Probe Cloud Functions: enumerate candidate names from APK strings plus common names (`login`, `signup`, `createUser`, `processPayment`, `sendNotification`, `generateToken`, `admin`, `debug`, `healthcheck`). For each, test `https://<region>-<project_id>.cloudfunctions.net/<name>` with `GET` and `POST {"data":{}}`, across regions present in the APK strings first, then `us-central1`, `europe-west1`, `asia-east1`. Interpret codes: `404` absent, `401`/`403` exists and protected, `200` accessible — a MEDIUM finding. No write probes here. Done when: function probes are complete and findings are recorded.
9. Probe Remote Config: `GET https://firebaseremoteconfig.googleapis.com/v1/projects/<project_id>/remoteConfig` with header `x-goog-api-key: <api_key>`. A body returning `parameters` is a MEDIUM finding; capture exposed values (internal endpoints, feature flags, keys) as evidence. Done when: the Remote Config probe is complete and findings are recorded.
10. Clean up every created probe artifact before reporting: test auth accounts (deleted in step 5), the RTDB node, the Firestore document, and the storage object. For each, issue the delete and then a follow-up `GET` to confirm it is gone. If a deletion fails, retry once; if it still fails, record the leftover path in the report and do not claim it cleaned. Remove the local decompiled directory unless the operator asked to keep it. Done when: every probe artifact is deleted and verified gone, or recorded as uncleaned.
11. Classify each APK and compile the report. Apply the severity ladder and the anti-downplaying rules exactly. Done when: every APK is classified and the report is compiled with the severity ladder and anti-downplaying rules applied.

## Failure and recovery
- Missing tool or decompile failure → classify the APK `failed` with the error; continue other APKs; no probe runs for it.
- No recoverable config → classify `no-config`; run no probes; state the obfuscation/packing caveat.
- Endpoint unreachable or returns an error → record the error for that endpoint in the report; do not infer open or closed from an error. The APK stays `tested` if at least one probe executed, otherwise `failed`.
- Authorization absent or withdrawn mid-scan → stop probing immediately, run cleanup for everything already created, and classify the remaining unprobed APKs `failed` with reason `not-authorized`.
- Partial result → report every finding gathered so far, but run cleanup before reporting and never mark `done` until every created artifact is deleted or explicitly recorded as uncleaned.
- Cleanup failure → the report lists each leftover artifact path and the exact delete command; the done predicate is not claimed for that artifact.
- Scope limit → probe only endpoints derived from the APK configurations; never brute-force unrelated projects or enumerate beyond the named common collections and functions. Never swallow an error or report an endpoint clean when its probe errored.

## Output
A report with, per APK, a classification of `tested`, `failed`, or `no-config` — `failed` and `no-config` are reported explicitly because they are neither vulnerable nor clean — plus:
- Summary: APKs scanned, vulnerable, failed, no-config, total issues.
- Extracted configuration table: project ID, database URL, storage bucket, API key, auth domain (per discovered project).
- Findings table: severity, issue, evidence (the probe request and response excerpt).
- Remediation per finding with the secure configuration: restrict signup to the Admin SDK, require `auth.token.email_verified` and `auth.provider !== 'anonymous'`, deny-by-default database/Firestore/storage rules keyed on `auth.uid`, authenticate Cloud Functions with `onCall` plus `context.auth`, and restrict Remote Config.
- Any uncleaned probe artifact paths with the delete command to run.

Severity ladder: CRITICAL — unauthenticated database read or write, storage upload, open signup on a private app. HIGH — anonymous authentication enabled, storage bucket listing, Firestore collection enumeration, authenticated bypass of `auth != null` rules. MEDIUM — email enumeration, accessible Cloud Functions, Remote Config exposure. LOW — information disclosure without sensitive data.

Anti-downplaying rules, applied when classifying: a read-only database is still a CRITICAL data-exposure finding; an anonymous token satisfies `auth != null` and is not "just anonymous"; a public API key never justifies open rules; rules are vulnerable regardless of what data sits behind them now; "internal" APKs are reversible from any device; pre-launch findings are still documented.

## Provenance

Adapted from the Trail of Bits `skills` repository, plugin `firebase-apk-scanner` (`/plugins/firebase-apk-scanner/skills/firebase-apk-scanner/SKILL.md`, `scanner.sh`, `references/vulnerabilities.md`), pinned revision `d1f1575cff97816e5cc08af66cd2506099c681d3` (https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3). Source license CC-BY-SA-4.0: Trail of Bits attribution and the source link are preserved, modifications are marked, adaptations are licensed ShareAlike, no trademark rights are claimed, and `trail-of-bits-mark.svg` is never used as branding. This ODIN skill is an adaptation under CC-BY-SA-4.0: the bundled scanner script and reference file are not carried over, and the workflow is restated as a manual `apktool`/`curl` procedure preserving the same extraction sources, probe set, severity ladder, and unconditional probe-data cleanup; the adaptation is licensed ShareAlike under CC-BY-SA-4.0.
