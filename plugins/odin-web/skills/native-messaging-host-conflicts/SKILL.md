---
name: native-messaging-host-conflicts
description: 'Use when a browser extension native messaging host fails, times out, or the wrong host spawns. Not for network, browser-install, or unrelated extension failures.'
---

# Native messaging host conflicts

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A browser extension's native messaging fails: disconnected extension, tool timeouts, or the wrong host answers after two clients for the same host name were installed or switched between. |
| Authority | Reversible local: mutates only native-messaging manifests, the host wrapper, stale host processes, and sockets; rollback is renaming the `.disabled` manifest back and restoring the backed-up wrapper. No remote mutation. |
| Side effect | Native-messaging manifest selection, host wrapper, host process, and socket state. |
| Done | Exactly one intended host is active, its expected socket exists, and a freshly restarted client connects through the extension. |

## How the mechanism breaks

A browser launches whichever binary its NativeMessagingHosts manifest names for the host id an extension requests. When two client applications ship a manifest for the same host name (a CLI and a desktop app being the common pair), the browser can spawn either, both can run, and each client can connect to the other one's socket. A client connects only at startup, so a client that starts against the wrong or absent host fails for its whole session. Reconciliation is therefore: diagnose, keep exactly one manifest active, clear stale processes and sockets, restart the browser, then restart the client.

Manifest locations for the Chrome family; other Chromium browsers use the same layout under their own user-data directory:

- macOS: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/`
- Linux: `~/.config/google-chrome/NativeMessagingHosts/`
- Windows: registry key `HKCU\Software\Google\Chrome\NativeMessagingHosts\<host-name>`, whose default value points at the manifest path.

## Inputs

- Which client is intended to own the host. Both cannot run simultaneously.
- The host name and the manifest file names each client installs, visible as distinct JSON files (often vendor-prefixed) in the manifest directory.
- Optional: the browser profile that has the extension installed.

## Procedure

1. Diagnose the active conflict before mutating anything:
   - List running host processes with `ps aux | grep <host-binary-name>` and note each binary path; a versioned install path means a wrapper may pin a stale version.
   - Find the socket. Native hosts talk over a socket in the temp dir (`$TMPDIR`; on macOS `$(getconf DARWIN_USER_TEMP_DIR)`). One client may use a single file, another per-PID files under a shared directory. `lsof -U | grep <socket-prefix>` shows the holder.
   - List active manifests with `ls <manifest-dir>/<prefix>*.json` (on Windows, read the registry key).
   Done when: the active host process, socket holder, and active manifests are named.
2. Keep exactly one host. Rename the unintended client's manifest to `<name>.json.disabled` (rollback: rename it back). Both active at once is the defect this skill fixes. Done when: exactly one manifest is active and the other is `.disabled`.
3. If the surviving wrapper pins a hardcoded versioned binary, back the wrapper up and rewrite it to exec the latest installed version (`ls -t <versions-dir> | head -1`), then `chmod +x`. Rollback: restore the backup. Done when: the wrapper resolves the latest binary, or is skipped because it is already version-independent.
4. Clear stale state: kill the host processes (`pkill -f <host-binary-name>`), then remove stale socket files and per-PID socket directories. Done when: no stale host process or socket remains.
5. Restart the browser, then trigger the extension once (open its popup or click its icon) so the intended host spawns. Done when: the browser restarted and the extension was triggered.
6. Verify the intended host process is running and its expected socket exists at the location diagnosis found. Done when: the host runs and the socket exists.
7. Restart the client last. Native-messaging clients connect at startup only; a client that starts before the bridge is ready fails for the session's whole lifetime. Done when: the restarted client connects.
8. If the failure persists, check secondary causes:
   - One extension install per browser profile; each extra profile with the extension spawns a competing host and socket.
   - One client session at a time; close other sessions or reconnect from the surviving one.
   - `TMPDIR` set and consistent with the socket path the client expects (`echo $TMPDIR`); if unset, the client looks in the wrong place, so export it in the shell rc.
   Done when: secondary causes are resolved, or the done predicate holds.

## Failure and recovery

- Wrong host still active after the rename: the browser caches manifests until restart. Repeat step 5 and re-verify. Never leave both manifests active.
- Socket missing after restart: the extension was not triggered, or the wrong manifest is active. Re-run step 1 and confirm exactly one manifest is present.
- Stale wrapper version: a hardcoded path points at a removed versioned binary. Apply step 3.
- Non-mutation rule: if the host OS is not covered by the manifest locations above, or the failure is unrelated to native messaging (network, browser install, desktop-app shell), stop without mutating anything.
- Blocked: report the active manifest, the running binary, whether the socket exists, and the `TMPDIR` value. Never report done while the socket is absent or the wrong host is running.

## Output

A terminal classification stating which host is active, whether its expected socket exists, and whether a restarted client connects, with the one active manifest and the one `.disabled` manifest named. No partial success is reported as done.
