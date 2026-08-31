---
name: browse
description: 'Use when asked to launch a visible headed Chromium session with the gstack sidebar extension when the user asks to open or take over the gstack browser. A user-visible browser window is ready for takeover with a live activity feed and sidebar chat. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Open gstack browser

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to open or take over the gstack browser |
| Authority | Reversible-local: write only the browse state file `.gstack/browse.json`, the Chromium profile at `~/.gstack/chromium-profile`, and the browse server process; rollback by disconnecting or killing the server and removing lock files |
| Side effect | A visible headed Chrome session attached for user takeover |
| Done | A user-visible browser session is ready for takeover |

## Inputs

- The gstack browse binary (`$B`), resolved at runtime: repo-local `.claude/skills/gstack/browse/dist/browse` first, then `$HOME/.claude/skills/gstack/browse/dist/browse`. Must exist before connect.
- Optional: a URL to navigate to after connect.

## Procedure

1. Resolve `$B`. Check the repo-local path first, then the home path. If the binary is missing, tell the user a one-time build is needed and stop for consent before running `./setup` in the skill directory. Do not build without explicit consent.
2. Pre-flight cleanup: read the PID from `.gstack/browse.json`, kill any stale browse server (SIGTERM then SIGKILL), remove that state file, and delete `SingletonLock`, `SingletonSocket`, `SingletonCookie` from `~/.gstack/chromium-profile`. This prevents "already connected" false positives and Chromium profile lock conflicts.
3. Run `$B connect` to launch headed Chromium with the gstack sidebar extension auto-loaded via `launchPersistentContext`, anti-bot stealth patches, a custom user agent, and GStack Browser branding. The extension auto-connects on port 34567.
4. Run `$B status` and confirm the output shows `Mode: headed`. If it does not, share the full status output with the user and stop.
5. Guide the user to open the side panel: click the puzzle-piece Extensions icon in the toolbar, pin the gstack browse extension, and click the pinned icon. If the extension is not listed, instruct the user to load it unpacked from the extension directory resolved alongside `$B` (the `extension/` folder in the gstack install root). If the side panel badge stays gray, tell the user to enter port 34567 manually.
6. After the user confirms the side panel is visible, run `$B goto https://news.ycombinator.com`, wait two seconds, then run `$B snapshot -i`. Tell the user the `goto` and `snapshot` commands should appear in the activity feed in real time.
7. Tell the user the side panel also has a chat tab where a sidebar agent executes natural-language requests in the browser, and that `$B focus`, `$B goto <url>`, `$B click <sel>`, `$B fill <sel> <val>`, `$B snapshot -i`, and `$B disconnect` are available for direct control.

## Failure and recovery
- **Binary missing:** stop and ask the user for consent to run the one-time `./setup` build. Do not build without consent.
- **Connect fails or mode is not headed:** run `$B status`, share the output with the user, and stop. Do not proceed to side panel guidance.
- **Browser not visible despite healthy status:** run `$B focus`. If that fails, ask the user what they see and stop.
- **Stale server or profile lock conflict:** repeat step 2 cleanup then step 3 connect.
- **Partial result:** no partial result is useful. If any step fails, the browser session is not ready for takeover; report BLOCKED with the failing step and the status output.
- **Rollback:** run `$B disconnect` to close headed Chrome and return to headless mode. If the server is unresponsive, kill its PID from `.gstack/browse.json`, remove that file, and delete the Chromium profile Singleton files.

## Output
A user-visible headed Chromium window with the gstack sidebar extension loaded, the side panel showing a live activity feed, and confirmation that `Mode: headed` and port 34567 are active. The session is ready for the user to watch or take over.

## Provenance

Origin: https://github.com/garrytan/gstack, revision 07b59e396c6be5a86619a43151cb9ed62a15ae69, file `open-gstack-browser/SKILL.md`. License: MIT, Copyright (c) 2026 Garry Tan. Clean-room adaptation: the procedure and mechanism are re-derived from the source skill's browse-connect-verify-guide flow; no source expression is copied wholesale.
