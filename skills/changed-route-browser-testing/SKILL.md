---
name: changed-route-browser-testing
description: 'Use when asked to run browser tests for pages affected by a PR or branch. The summary reports every affected route as Pass, Fail, or Skip with reasons, or reports the preflight blocker. Don''t use for tasks that require source or remote-system changes.'
---

# Changed route browser testing

## Contract

| Field | Bound contract |
|---|---|
| Trigger | /changed-route-browser-testing [PR number, branch name, 'current', or --port PORT] |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Fixes are only requested from the user, never applied. |
| Side effect | Selects an approved browser driver, exercises affected routes against the local dev server, and may ask the user to fix failures. |
| Done | The summary reports every affected route as Pass, Fail, or Skip with reasons, or reports the preflight blocker and what would clear it. |

## Inputs

- A target: a PR number, a branch name, the literal `current`, or omitted (treated as `current`). Optional `--port PORT` overrides dev-server port detection.
- A git repository with changes to test is required.
- A running local dev server is required before any route is exercised; the run stops at preflight if none is reachable.

## Procedure

1. Select the browser driver before the first browser action and use one driver for the entire run:
   - Prefer a host-native integrated browser embedded in or owned by the active harness when it can navigate local URLs, inspect rendered and interactive state, click/fill/press, capture screenshots, and inspect console errors. Load and follow that capability's own instructions before browser work.
   - Otherwise fall back to the `agent-browser` CLI. Verify it is installed (`command -v agent-browser`); if missing, stop and report that `agent-browser` is not installed. A selected host-native driver may fall back to `agent-browser` only if initialization fails before the first route is tested.
   - Never install or substitute standalone Playwright, Puppeteer, a separately configured browser extension or MCP, or other ad hoc browser automation. A Playwright API exposed inside the selected host-native browser remains host-native.
2. Determine test scope from the argument: a PR number -> `gh pr view [number] --json files -q '.files[].path'`; `current` or empty -> `git diff --name-only main...HEAD`; a branch name -> `git diff --name-only main...[branch]`.
3. Map each changed file to the route(s) that render it and build the URL list. Apply judgment for the project layout; common starting points: `app/views/users/*` -> `/users`, `/users/:id`, `/users/new`; `app/controllers/settings_controller.rb` -> `/settings`; `app/javascript/controllers/*_controller.js` -> pages using that controller; `app/components/*` -> pages rendering that component; `app/views/layouts/*` -> all pages (test homepage at minimum); `app/assets/stylesheets/*` -> visual regression on key pages; `app/helpers/*_helper.rb` -> pages using that helper; `src/app/*` (Next.js) -> corresponding routes; `src/components/*` -> pages using those components.
4. Determine the dev server port: an explicit `--port` argument; else a `--port` flag in a `package.json` dev/start script; else `PORT=` in `.env`, `.env.local`, or `.env.development`; else `3000`. Do not grep instruction or doc files for a port; prose mentions are unreliable and false-positive-prone while config files and `.env` are trustworthy. Use the port as-is; the user controls their own server, so do not scan for alternatives.
5. Verify the dev server is running on the port (`lsof -i ":${PORT}" -sTCP:LISTEN -t`). If not running, stop and report the preflight blocker with the start command for the detected stack (Rails: `bin/dev` or `rails server -p ${PORT}`; Node/Next.js: `pnpm run dev`).
6. Set visibility, then verify the root. For a host-native integrated browser, keep its normal integrated surface visible and non-blocking so the user can watch progress; do not repeatedly steal focus as routes change. For the `agent-browser` fallback, ask the user whether to run headed or headless using the host's blocking question tool already in the current tool list (match by capability, not a host-specific name); presence in the current tool list is proof the tool exists, so never call a question tool to discover whether it exists. If no such tool is listed or a real question call errors, present options on the host's user-visible chat surface. Never silently skip the question. Then navigate to `http://localhost:<port>`, capture its rendered or interactive state, and confirm the root is served before iterating.
7. Test each affected page: navigate, capture fresh rendered or interactive state, verify key elements (page title/heading present, primary content rendered, no error messages visible, forms have expected fields, no new console errors attributable to the tested flow), and exercise critical interactions using locators derived from the latest inspected state; never guess selectors or reuse stale references. Capture viewport and full-page screenshots when the driver supports it.
8. Human verification where a flow needs external interaction (OAuth, email, payments, SMS, third-party APIs): pause and ask the user to complete and confirm the flow. Ask with the host's question tool, or present numbered options and wait.
9. Handle failures by capturing the error state and the exact reproduction steps, then asking the user whether to fix now or skip. If "fix now", investigate and propose a fix but do not apply it; request the fix from the user. If "skip", log as skipped with the reason and continue.
10. Report the summary in the Output format.

## Failure and recovery
- **No git repository or no changes to test:** stop and report the preflight blocker; no routes are tested.
- **Dev server not running:** stop at preflight and report the blocker plus the start command that would clear it. Do not start the server.
- **`agent-browser` not installed:** stop and report that the fallback driver is missing; do not install it.
- **Driver initialization fails before the first route:** a host-native driver may fall back to `agent-browser` once; after the first route is tested, do not switch drivers, mix sessions, element references, screenshots, or authentication state.
- **A route cannot be reached:** mark it Skip with the reason; never drop a route from the summary because nobody could reach it.
- **Partial results:** continue testing remaining routes after a failure or skip; the summary must still account for every affected route.
- **Non-mutation:** no file, VCS, credential, or server state is changed; fixes are requested, not applied. Reaching neither a complete summary nor a preflight blocker report is the failure this bar exists to prevent.

## Output
A markdown summary in this format:

```
### Browser test results

**Test Scope:** PR #[number] / [branch name]
**Server:** http://localhost:<port>

### Pages tested: [count]

| Route | Status | Notes |
|-------|--------|-------|
| `/users` | Pass | |
| `/dashboard` | Fail | Console error: [msg] |
| `/checkout` | Skip | Requires payment credentials |

### Console errors: [count]
- [List any errors found]

### Human verifications: [count]
- OAuth flow: Confirmed

### Failures: [count]
- `/dashboard` - [issue description]

### Result: [PASS / FAIL / PARTIAL]
```

Every affected route appears as Pass, Fail, or Skip with a reason. When a preflight blocker stops testing before any route can be exercised, the output is the blocker and what would clear it.

## Provenance

Origin: https://github.com/EveryInc/compound-engineering-plugin, revision a1f601f17137f648be439965f8fdd9123303de5d, file skills/ce-test-browser/SKILL.md. License: MIT (Copyright (c) 2025 Every). Mechanisms extracted and rewritten in ODIN style, not copied verbatim; the obligation reduces to preserving attribution in the root provenance ledger.
