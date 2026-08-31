---
name: firebase-apk-scanner
description: 'Use when an authorized user needs to assess mobile-backend exposure from compiled Android APKs. Extracts backend configuration from APK carriers, probes discovered endpoints for misconfiguration under written authorization, and returns a per-APK classification with evidence and verified cleanup. Covers Firebase, custom HTTP backends, and cloud function endpoints. Human-only invocation.'
disable-model-invocation: true
---

# Mobile backend APK scanner

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Authorized user needs to assess mobile-backend exposure from compiled Android APKs by extracting backend configuration and probing discovered endpoints for misconfiguration. |
| Authority | Human-only. Runs only on explicit human invocation. Before any probe that mutates remote state, present the target endpoints and the exact probe mutations and get operator confirmation. Do not test any APK or backend project without written authorization for it. |
| Side effect | Remote mutation of discovered backend endpoints (authentication, database, storage, cloud functions, remote config) limited to one small, uniquely named probe artifact per test that is deleted before reporting. No bulk writes and no deletion of pre-existing data. |
| Done | Every APK is classified as tested, failed, or no-config; every created probe artifact is deleted and verified gone; findings include evidence and remediation. |

## Inputs

- One or more APK paths (a single `.apk` file or a directory of `.apk` files). Required.
- Written authorization covering each APK and the backend project(s) it references. Required before any probe; an APK without it is not scanned.
- Local tools `apktool`, `curl`, `jq`, `grep`, `unzip`, and `strings` (binutils). Required; `sed`/`awk` helpful.
- A working directory for decompiled output. Optional; removed at the end unless the operator asks to keep it.
- Known function names or collection names to prioritize. Optional.

## Procedure

1. Validate input at the trust boundary. Confirm each path exists; expand a directory argument to its `.apk` list; if the list is empty, ask the operator for a path and stop. For each APK, confirm written authorization for the app and its backend project. An APK missing authorization is classified `failed` with reason `not-authorized` and skipped. Done when: every APK path is confirmed, authorization is verified, and unauthorized APKs are classified `failed`.

2. Decompile each authorized APK: `apktool d -f -o <workdir>/<apk-basename> <apk>`. If decompile fails, classify the APK `failed` with the error and continue with the rest. Done when: every authorized APK is decompiled or classified `failed` with the error.

3. Extract every backend configuration from all sources and test all configurations found. An app may embed several projects across different providers:
   - `google-services.json` (jq: `project_info.project_id`, `project_info.firebase_url`, `project_info.storage_bucket`, `client[].api_key[].current_key`, `project_info.project_number`).
   - `res/values*/**.xml` and `AndroidManifest.xml`: `https://<id>.firebaseio.com`, `<id>.appspot.com`, `AIza[A-Za-z0-9_-]{35}`, `<id>.firebaseapp.com`, `gcm_defaultSenderId`, custom API domains, `https://api.<domain>`, `https://<domain>/api/`.
   - `assets/**` (React Native, Flutter, and Cordova bundles; `firebase_config.json`, `config.json`, `firebaseConfig.js`, `config.js`, `env.js`): the same patterns plus `gs://<bucket>`, `<region>.cloudfunctions.net/<name>`, `projectId` references, and custom backend URLs.
   - Raw DEX: `unzip` each `*.dex`, run `strings`, and grep the same patterns; also scan `res/raw/**`.

   Collect, per project: provider type (Firebase, custom HTTP, other), project ID or base URL, database URL, storage bucket, API key, auth domain, and any function names. If no project ID, API key, or backend URL is recoverable from any source, classify the APK `no-config` (the app may not use a discoverable backend, or its config is obfuscated or packed beyond extraction) and run no probes. Done when: all configs are extracted from all sources, or the APK is classified `no-config`.

4. Preview and confirm scope. List every endpoint about to be probed and the exact probe mutation (one test account, one uniquely named database node, one document, one storage object). Get operator confirmation before the first write probe. This is the human-only gate. Done when: operator confirmation is obtained for every endpoint and probe mutation.

5. Probe authentication endpoints. For Firebase: test Identity Toolkit signup, anonymous auth, and email enumeration via `https://identitytoolkit.googleapis.com/v1` with `?key=<api_key>`. For custom HTTP backends: test signup, login, and token endpoints discovered in step 3 with the same probe pattern. A returned token from an unauthenticated signup is a CRITICAL finding. Delete any test account immediately after probing. Done when: auth probes are complete, findings are recorded, and test accounts are deleted.

6. Probe database and storage endpoints. For Firebase RTDB: `GET <db_url>/.json` and common paths for unauthenticated reads; `PUT` a uniquely named node for write tests. For Firestore: `GET .../documents` and common collections; `POST` a uniquely named document for write tests. For custom HTTP backends: `GET` discovered API endpoints without auth headers. For storage: `GET https://firebasestorage.googleapis.com/v0/b/<bucket>/o` and custom CDN URLs. Authenticated bypass: retry denied reads with an anonymous token from step 5. Delete every probe artifact after testing and verify deletion. Done when: database and storage probes are complete, findings are recorded, and probe artifacts are deleted.

7. Probe cloud functions and remote config. Enumerate candidate function names from APK strings plus common names (`login`, `signup`, `createUser`, `processPayment`, `sendNotification`, `generateToken`, `admin`, `debug`, `healthcheck`). For each, test `https://<region>-<project_id>.cloudfunctions.net/<name>` with `GET` and `POST {"data":{}}` across regions present in the APK strings first, then `us-central1`, `europe-west1`, `asia-east1`. For Firebase Remote Config: `GET https://firebaseremoteconfig.googleapis.com/v1/projects/<project_id>/remoteConfig` with header `x-goog-api-key: <api_key>`. For custom backends: test discovered function URLs. No write probes here. Done when: function and remote config probes are complete and findings are recorded.

8. Clean up every created probe artifact before reporting: test auth accounts, database nodes, documents, and storage objects. For each, issue the delete and then a follow-up `GET` to confirm it is gone. If a deletion fails, retry once; if it still fails, record the leftover path in the report and do not claim it cleaned. Remove the local decompiled directory unless the operator asked to keep it. Done when: every probe artifact is deleted and verified gone, or recorded as uncleaned.

9. Classify each APK and compile the report. Apply the severity ladder and the anti-downplaying rules. Done when: every APK is classified and the report is compiled.

## Failure and recovery

- Missing tool or decompile failure: classify the APK `failed` with the error; continue other APKs; no probe runs for it.
- No recoverable config: classify `no-config`; run no probes; state the obfuscation/packing caveat.
- Endpoint unreachable or returns an error: record the error for that endpoint; do not infer open or closed from an error. The APK stays `tested` if at least one probe executed, otherwise `failed`.
- Authorization absent or withdrawn mid-scan: stop probing immediately, run cleanup for everything already created, and classify the remaining unprobed APKs `failed` with reason `not-authorized`.
- Partial result: report every finding gathered so far, but run cleanup before reporting and never mark done until every created artifact is deleted or explicitly recorded as uncleaned.
- Cleanup failure: the report lists each leftover artifact path and the exact delete command; the done predicate is not claimed for that artifact.
- Scope limit: probe only endpoints derived from the APK configurations; never brute-force unrelated projects or enumerate beyond the named common collections and functions. Never swallow an error or report an endpoint clean when its probe errored.

## Output

A report with, per APK, a classification of `tested`, `failed`, or `no-config` (failed and no-config are reported explicitly because they are neither vulnerable nor clean), plus:

- Summary: APKs scanned, vulnerable, failed, no-config, total issues.
- Extracted configuration table: provider, project ID or base URL, database URL, storage bucket, API key, auth domain (per discovered project).
- Findings table: severity, issue, evidence (the probe request and response excerpt).
- Remediation per finding with the secure configuration for the relevant provider.
- Any uncleaned probe artifact paths with the delete command to run.

Severity ladder: CRITICAL is unauthenticated database read or write, storage upload, open signup on a private app. HIGH is anonymous authentication enabled, storage bucket listing, collection enumeration, authenticated bypass of `auth != null` rules. MEDIUM is email enumeration, accessible cloud functions, remote config exposure. LOW is information disclosure without sensitive data.

Anti-downplaying rules, applied when classifying: a read-only database is still a CRITICAL data-exposure finding; an anonymous token satisfies `auth != null` and is not just anonymous; a public API key never justifies open rules; rules are vulnerable regardless of what data sits behind them now; internal APKs are reversible from any device; pre-launch findings are still documented.
