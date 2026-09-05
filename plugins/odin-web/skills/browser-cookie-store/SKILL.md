---
name: browser-cookie-store
description: 'Use when the user runs /browser-cookie-store to populate the session cookie store from installed browsers. Not for remote, credential, publish, deploy, or irreversible changes.'
disable-model-invocation: true
---

# Browser cookie store

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /browser-cookie-store to populate the session cookie store from installed browsers. |
| Authority | Reversible local: writes only the session cookie store from locally installed browser profiles; rollback is undo. No remote mutation; no credential is transmitted off the host. |
| Side effect | The session cookie store, populated from locally installed browser profiles. No remote, paid, published, or deployed mutation. |
| Done | The destination store holds extracted session cookies conforming to its schema and authenticated browsing is ready. |

## Inputs

- Installed browsers on the local machine. The user may specify which browsers are present, but at least one must be available.
- The destination cookie store path (supplied by the harness) and its schema (JSON, SQLite, Netscape, or whatever the harness documents).
- Optional: specific browser profiles to include or exclude.

## Procedure

1. Discover installed browser profiles. Enumerate browsers present on the local machine and locate each one's profile directory. Chromium-based browsers store profiles under `<user-data-dir>/Default`, `<user-data-dir>/Profile 1`, and so on; Firefox stores them under `~/.mozilla/firefox/*.default*`. Stop if no browser is installed. Done when: the browser and profile list is confirmed non-empty or the stop is reported.
2. Read and decrypt each browser's local cookie database. Chromium stores cookies in a SQLite file (`Cookies`) within the profile directory, encrypted with an OS keychain secret (Keychain on macOS, DPAPI on Windows, kwallet/gnome-keyring on Linux). Firefox stores cookies in `cookies.sqlite`, unencrypted. If a database is locked or the decryption key is unavailable, skip that browser and continue. Done when: each available browser's cookie database is read or marked skipped with the reason.
3. Extract session cookies only. Filter for cookies whose attributes indicate active sessions: non-expiring or long-lived `HttpOnly` cookies carrying authentication tokens. Discard tracking, analytics, and short-lived cookies. Done when: session cookies are extracted from each readable browser or the browser is marked skipped.
4. Write the extracted session cookies to the destination store conforming to its schema. Map each cookie's name, value, domain, path, secure, httpOnly, sameSite, and expiry attributes into the store's expected format. Write only after at least one browser's cookies are extracted. Done when: the store holds the extracted cookies in the correct schema.
5. Keep every read and write on the local host. Never transmit cookies to any remote endpoint. Done when: no network transmission occurred during extraction or write.
6. Verify the store contains the imported cookies and report ready. Done when: the store is verified and the ready report is emitted.

## Failure and recovery

- No installed browser: stop, report not-ready, do not write the store.
- Cookie database locked or unreadable: skip that browser, continue with the rest, and report which browsers were skipped and why (locked SQLite, missing decryption key, corrupted file).
- No session cookies found in any browser: stop, report not-ready, and leave the store unmodified.
- Schema mismatch: if a cookie attribute has no destination field, drop that attribute and note it in the report; do not invent a mapping.
- Partial result: write only cookies from browsers whose extraction succeeded and report the per-browser outcome.
- Never swallow an error and never claim ready when the store is empty.
- Rollback: a failed extraction for a browser leaves the store unmodified for that browser; the store is written only after at least one browser's cookies are extracted.

## Output

A populated session cookie store ready for authenticated browsing, plus a per-browser import report naming each browser as imported or skipped with the skip reason. The report lists the cookie count per browser and any schema-mapped attributes that were dropped.
