---
name: browser-cookie-store
description: 'Use when the user runs /browser-cookie-store to populate the session cookie store from installed browsers. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
disable-model-invocation: true
---

# Setup browser cookies

## Contract

| Field | Bound contract |
|---|---|
| Trigger | the user runs /browser-cookie-store |
| Authority | human-only; the operator performs every browser-cookie extraction and store write on the local machine, and no credential is transmitted off the host |
| Side effect | the skill session cookie store, populated from locally installed browsers; no remote, paid, published, or deployed mutation |
| Done | the session cookie store holds imported session cookies and authenticated browsing is ready |

## Inputs

- Installed browsers on the local machine (optional which browsers are present, but at least one must be available).
- The skill session cookie store path (supplied by the harness).

## Procedure

1. Enumerate installed browsers on the local machine; stop if none are present.
2. For each installed browser, read its local cookie database and extract session cookies only.
3. Write the extracted session cookies into the skill session cookie store.
4. Keep every read and write on the local host; never transmit cookies to any remote endpoint.
5. Verify the store contains the imported cookies and report ready.

## Failure and recovery
- No installed browser: stop, report not-ready, do not write the store.
- Browser cookie database locked or unreadable: skip that browser, continue with the rest, and report which browsers were skipped.
- No session cookies found in any browser: stop, report not-ready, and leave the store unmodified.
- Partial result: write only cookies from browsers whose extraction succeeded and report the per-browser outcome.
- Never swallow an error and never claim ready when the store is empty.
- Rollback: a failed extraction for a browser leaves the store unmodified for that browser; the store is written only after at least one browser's cookies are extracted.

## Output
A populated skill session cookie store ready for authenticated browsing, plus a per-browser import report naming each browser as imported or skipped.

## Provenance

- Origin: https://github.com/garrytan/gstack, path setup-browser-cookies/SKILL.md.
- Revision: 07b59e396c6be5a86619a43151cb9ed62a15ae69.
- License: MIT, Copyright (c) 2026 Garry Tan; retain the copyright and permission notice in copies.
- Adaptation: clean-room re-derivation of the cookie-import procedure; no third-party expressive prose copied.
