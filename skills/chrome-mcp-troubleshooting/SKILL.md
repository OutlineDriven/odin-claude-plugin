---
name: chrome-mcp-troubleshooting
description: 'Use when Claude-in-Chrome MCP tools on macOS report a disconnected extension, time out, or fail after switching between Claude.app and Claude Code CLI hosts. Restores exactly one active native messaging host with a matching socket. Not for non-macOS or unrelated Chrome failures.'
---

# Chrome MCP troubleshooting

## Contract

| Field | Bound contract |
|---|---|
| Trigger | On macOS, Claude-in-Chrome MCP tools report a disconnected extension, time out, or fail after switching between Claude.app (Cowork) and Claude Code CLI hosts. |
| Authority | Reversible local writes: rename Chrome native-messaging config files, overwrite the Claude Code wrapper, kill the native-host process, and remove stale sockets. Rollback is renaming a `.disabled` config back and restoring a backed-up wrapper. |
| Side effect | Chrome native-messaging host selection, wrapper, process, and socket state under `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/`, `~/.claude/chrome/`, `$TMPDIR`, and `/tmp/`. |
| Done | Exactly one intended native host is active, its expected socket exists, and a restarted client connects through the Chrome extension. |

## Inputs

- macOS host (this procedure uses `osascript`, `getconf DARWIN_USER_TEMP_DIR`, and `~/Library/Application Support/`).
- Which host is intended: Claude Code CLI or Claude.app (Cowork). Both cannot run simultaneously.
- Optional: the Chrome profile that has the Claude extension installed.

## Procedure

1. Diagnose the active conflict before mutating anything:
   - `ps aux | grep chrome-native-host | grep -v grep` — Claude.app runs `/Applications/Claude.app/Contents/Helpers/chrome-native-host`; Claude Code runs `~/.local/share/claude/versions/<version> --chrome-native-host`.
   - Socket for Claude Code is a single file at `$(getconf DARWIN_USER_TEMP_DIR)/claude-mcp-browser-bridge-$USER`; Claude.app uses per-PID files under `/tmp/claude-mcp-browser-bridge-$USER/`.
   - `lsof -U | grep claude-mcp-browser-bridge` shows what holds the socket.
   - `ls ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.anthropic*.json` shows which configs are active.
   **Done when:** the active host, socket holder, and active configs are diagnosed.
2. Select exactly one host. Disable the other's native-messaging config by renaming it to `.disabled` (rollback: rename it back):
   - For Claude Code CLI: `mv .../com.anthropic.claude_browser_extension.json .../com.anthropic.claude_browser_extension.json.disabled` and confirm `com.anthropic.claude_code_browser_extension.json` is present.
   - For Claude.app (Cowork): do the inverse.
   - Both cannot be used simultaneously; one config must be active and the other `.disabled`.
   **Done when:** exactly one config is active and the other is `.disabled`.
3. If Claude Code CLI is intended, ensure the wrapper resolves the latest binary rather than a hardcoded version. Back up `~/.claude/chrome/chrome-native-host` first, then write a wrapper that runs `exec "$HOME/.local/share/claude/versions/$(ls -t ~/.local/share/claude/versions/ | head -1)" --chrome-native-host` and `chmod +x` it. Rollback: restore the backup. **Done when:** the wrapper resolves the latest binary (or Claude.app is intended and this step is skipped).
4. Clear stale state: `pkill -f chrome-native-host`, remove `/tmp/claude-mcp-browser-bridge-$USER/` and the single-file `$(getconf DARWIN_USER_TEMP_DIR)/claude-mcp-browser-bridge-$USER`. **Done when:** stale processes and sockets are cleared.
5. Restart Chrome: `osascript -e 'quit app "Google Chrome"' && sleep 2 && open -a "Google Chrome"`, then click the Claude extension icon so the native host spawns. **Done when:** Chrome is restarted and the extension icon is clicked.
6. Verify the intended native host is running (`ps aux | grep chrome-native-host`) and its expected socket exists (`ls -la` the matching location from step 1). **Done when:** the intended host is running and its socket exists.
7. Restart the MCP client (Claude Code or Claude.app). MCP connects only at startup; if the bridge was not ready when the client started, the session fails for its whole lifetime, so the client must start after Chrome and the extension are ready. **Done when:** the MCP client is restarted and connects.
8. Check secondary causes if the done predicate still fails:
   - Only one Chrome profile may have the Claude extension; each extra profile spawns a competing native host and socket.
   - Only one Claude Code session at a time; close others or use `/mcp` to reconnect.
   - `TMPDIR` must be set (`echo $TMPDIR` should equal `$(getconf DARWIN_USER_TEMP_DIR)`); if unset, export it in the shell rc.
   **Done when:** secondary causes are checked and resolved, or the done predicate holds.

## Failure and recovery
- **Wrong host still active after rename:** Chrome caches the native-messaging config until restart; repeat step 5 then re-verify. Do not leave both configs active.
- **Socket missing after restart:** the extension icon was not clicked or the wrong config is active; re-run step 1 diagnosis and confirm exactly one config is present.
- **Stale wrapper version:** a hardcoded path in `~/.claude/chrome/chrome-native-host` points at a removed `versions/<version>`; apply step 3.
- **Non-mutation rule:** if the host is not macOS, or the failure is unrelated to the Claude extension (network, Chrome install, desktop-app issues), stop without mutating configs.
- **Blocked result:** report which config is active, which binary is running, whether the socket exists, and the `$TMPDIR` value; do not claim the done predicate holds when the socket is absent or the wrong host is running.

## Output
A terminal classification stating which native host is active, whether its expected socket exists, and whether a restarted client connects, with the one active config and the one `.disabled` config named; no partial success is reported as done.
