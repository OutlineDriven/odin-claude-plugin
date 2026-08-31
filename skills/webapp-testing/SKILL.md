---
name: webapp-testing
description: 'Use when asked to verify frontend functionality, debug UI behavior, capture browser screenshots, or inspect browser logs. Run Playwright test scripts, capture evidence, and verify UI behavior locally. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Webapp testing

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Verify frontend functionality, debug UI behavior, capture browser screenshots, or inspect browser logs |
| Authority | Write only to named local artifacts: Playwright scripts, screenshots, console logs, and verification results. Rollback any persistent state the skill introduced. |
| Side effect | Local file writes of test scripts, screenshots, console logs, and structured results. No remote or credential mutation. |
| Done | Test script passes or expected UI behavior is verified via screenshots/logs |

## Inputs

- **URL** — required. The web application URL to test.
- **Assertions** — required. Concrete UI or behavioral assertions the test must verify.
- **Evidence types** — required. Which evidence to capture: `screenshot`, `console log`, or both.
- **Script path** — optional. Override the default location for the generated Playwright script. Defaults to `playwright_test_<timestamp>.py`.
- **Server command** — optional. Command to start the local dev server. If absent, the human must start the server before the skill runs Playwright.

## Procedure

1. Confirm `playwright` is installed and `playwright install chromium` has been run. If absent, stop with failure class `No playwright-chromium`.
2. If `server command` is supplied, start the server. If the server fails to start within 30 seconds, stop with failure class `Server failed to start`. If `server command` is absent, confirm the human has started the server; if not confirmed, stop with failure class `No Server`.
3. Write the Playwright script to the designated path. Use `playwright.sync_api.sync_playwright()` and open the URL with `page.goto(url, wait_until='networkidle')`. Inject console-capture via `page.on('console', ...)` when `console log` is requested. Inject screenshot capture when `screenshot` is requested, saving to `<slug>-<timestamp>.png`. Include the supplied assertions as explicit `page.expect()` or `assert` checks.
4. Execute the script. Collect exit code, stdout, stderr, and any captured screenshots or console logs.
5. If the script exits non-zero, save evidence and stop with failure class `Test assertion failed`. The script itself is rollback-eligible generated content and may be deleted.
6. If the script exits zero, the done predicate holds. Proceed to Output.

## Failure and recovery
| Failure class | Condition | Result |
|---|---|---|
| `No playwright-chromium` | `playwright install chromium` not run | Stop. Install Playwright and retry. |
| `No Server` | Server not running and no `server command` supplied | Stop. Start the server and retry. |
| `Server failed to start` | Server process exited or timed out within 30 seconds | Stop. Fix the server command and retry. |
| `Test assertion failed` | Script exit code non-zero | Save screenshots/logs as evidence. The generated script may be deleted. Stop. |

Partial-result rule: If evidence was captured before the failure, surface it in the Output section. Do not suppress or rename failure classes. Do not report done when the script exited non-zero.

## Output
- Test exit code and stdout/stderr summary.
- File paths of any captured screenshots.
- Captured console log output, if requested.
- Verdict: `PASS` if script exited zero; `FAIL` with evidence file paths if non-zero.

## Provenance

- Origin: https://github.com/warpdotdev/oz-skills
- Revision: 6c08c49fc6c51b8f768bf8c53c041bc06a160765
- License: Apache-2.0 (attribution notices preserved; not relicensed under MIT)
- Adaptation: Clean-room adaptation of the warpdotdev/oz-skills webapp-testing source into an ODIN 2.0 skill for the odin-code module. Front-matter description, contract table, procedure steps, failure classes, and output section are original expressions derived from the source mechanism. No third-party expression copied.
