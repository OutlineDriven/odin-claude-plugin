---
name: headed-browser-takeover
description: 'Use when the user asks to open or take over a visible browser session by hand, for example to solve a CAPTCHA or authenticate. Not for headless scraping or unattended automation.'
---

# Headed browser takeover

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to open or take over a visible browser session, or a step in another workflow needs human hands in the browser (CAPTCHA, login, consent screen) |
| Authority | Reversible local: writes only the automation state file, the browser profile directory, and the automation server process; rollback is undo by disconnecting, killing the server, and removing the state and lock files. No remote mutation. |
| Side effect | A visible headed browser window attached to the automation server, ready for the user to watch or drive by hand |
| Done | The user confirms the live control surface is visible and a command round-trip appears in the activity feed; the session is ready for takeover |

In headed mode, the user and the agent look at the same window. The agent drives through the automation endpoint; the user can grab the mouse and keyboard at any moment without breaking the session.

## Inputs

- The automation entry point for the browser: a local binary or script that launches and drives the session. Resolve it at runtime from the project-local install path first, then the home install path. It must exist before connecting.
- Optional: a URL to navigate to after connect. When none is supplied, use a neutral page such as `example.com` for the round-trip proof.
- A fixed bridge port the control surface connects on. Default `34567`; whatever port is chosen must match the one the control surface expects.

## Procedure

1. Resolve the automation entry point. If it is missing, tell the user a one-time build is needed and stop for consent before running the setup step. Never build without explicit consent. Done when: the entry point resolves to an existing executable, or the user has been asked for build consent.
2. Pre-flight cleanup. Read the PID from the state file, kill any stale automation server (SIGTERM, then SIGKILL if it survives), remove that state file, and delete `SingletonLock`, `SingletonSocket`, and `SingletonCookie` from the browser profile directory. This prevents false "already connected" reports and Chromium profile-lock conflicts. Done when: stale state and lock files are gone.
3. Launch the headed browser through the entry point's connect command. Use a persistent browser context so the profile, extensions, and login state survive between runs, and start the command bridge on the chosen port so the control surface can attach. Done when: connect returns and the Chromium window is on screen.
4. Confirm headed mode. Run the entry point's status command and require `Mode: headed` in the output. Anything else: share the full status output with the user and stop. Done when: status shows `Mode: headed`, or the failure is reported.
5. Hand the user the control surface. Have them open the browser's extension toolbar, pin the takeover extension, and click it to open the side panel. If the extension is not listed, instruct them to load it unpacked from the `extension/` directory beside the automation entry point. If the panel badge stays gray, have them type the bridge port in manually. Done when: the user confirms the side panel is visible.
6. Prove the round trip. Run a visible navigation to the URL from Inputs, wait two seconds, then run an interactive snapshot. Tell the user both commands should appear in the panel's activity feed in real time. Done when: the user confirms both commands appeared, or the missing feed is reported.
7. Hand over. Tell the user the panel's chat tab runs natural-language browser requests, and that `focus`, `goto <url>`, `click <selector>`, `fill <selector> <value>`, `snapshot -i`, and `disconnect` are available for direct control. Done when: the user knows the chat tab and the direct-control commands.

## Failure and recovery

- Entry point missing: stop and ask for consent to run the one-time build. Never build silently.
- Connect fails or status is not `Mode: headed`: run status, share the output, stop. Do not move on to side-panel guidance.
- Browser not visible despite healthy status: run the focus command. If that fails too, ask the user what they see and stop.
- Stale server or profile-lock conflict: repeat step 2 cleanup, then step 3 connect.
- No partial result is useful. If any step fails, the session is not ready for takeover; report BLOCKED with the failing step and the status output.
- Rollback: run the disconnect command to close the headed session. If the server is unresponsive, kill the PID from the state file, remove that file, and delete the profile Singleton files.

## Output

A user-visible headed Chromium window with the control surface attached, a live activity feed the user has seen carry a real command round trip, and confirmation of `Mode: headed` and the bridge port. The session is ready for the user to watch or take over at any moment.
