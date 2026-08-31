---
name: webapp-testing
description: 'Use when asked to verify frontend functionality, debug UI behavior, or capture browser screenshots and console logs against a local dev server. Generates a Playwright assertion script, executes it, and classifies PASS or FAIL from the exit code. Not for read-only browser inspection (use browser-testing) or remote, credential, publish, or deploy changes.'
---

# Webapp testing

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Verify frontend functionality, debug UI behavior, capture browser screenshots, or inspect browser logs |
| Authority | Write only to named local artifacts: Playwright scripts, screenshots, console logs, and verification results. Rollback any persistent state the skill introduced. |
| Side effect | Local file writes of test scripts, screenshots, console logs, and structured results. No remote or credential mutation. |
| Done | The generated Playwright script exits zero; screenshots and console logs are captured evidence, never an alternative pass oracle. |

## Inputs

- URL: required. The web application URL to test.
- Assertions: required. Concrete UI or behavioral assertions the test must verify.
- Evidence types: required. Evidence to capture: `screenshot`, `console log`, or both.
- Script path: optional. Override the default location for the generated Playwright script. Defaults to `playwright_test_<timestamp>.py`.
- Server command: optional. Command to start the local dev server. If absent, the human must start the server before the skill runs Playwright.

## Procedure

1. Confirm `playwright` is installed and `playwright install chromium` has been run. Done when: playwright and chromium are confirmed installed, or the step has stopped with `No playwright-chromium`.
2. If `server command` is supplied, start the server. If the server fails to start within 30 seconds, stop with `Server failed to start`. If `server command` is absent, confirm the human has started the server; if not confirmed, stop with `No Server`. Then probe the URL with an HTTP GET and a 10-second timeout; on failure stop with `Server unreachable`. Done when: server is running and reachable, or the step has stopped with the named failure class.
3. Write the Playwright script to the designated path. Use `playwright.sync_api.sync_playwright()` and open the URL with `page.goto(url, wait_until='networkidle')`. When `console log` is requested, capture console output via `page.on('console', ...)`. When `screenshot` is requested, save screenshots to `<slug>-<timestamp>.png`. Include the supplied assertions as explicit `page.expect()` or `assert` checks. Done when: script is written with assertions and evidence capture.
4. Execute the script. Collect exit code, stdout, stderr, and any captured screenshots or console logs. Done when: script execution completes with exit code and evidence collected.
5. If the script exits non-zero, save evidence and stop with `Test assertion failed`. The script itself is rollback-eligible generated content and may be deleted. Done when: failure is recorded with evidence saved, or the step is skipped because exit code is zero.
6. If the script exits zero, the pass verdict holds. Screenshots and console logs are evidence, not an alternative oracle. Proceed to the Output section. Done when: pass verdict is confirmed by the zero exit code.

## Failure and recovery
| Failure class | Condition | Result |
|---|---|---|
| `No playwright-chromium` | `playwright install chromium` not run | Stop. Install Playwright and retry. |
| `No Server` | Server not running and no `server command` supplied | Stop. Start the server and retry. |
| `Server failed to start` | Server process exited or timed out within 30 seconds | Stop. Fix the server command and retry. |
| `Server unreachable` | HTTP GET probe to the URL fails within 10 seconds | Stop. Confirm the server is running and reachable, then retry. |

Partial-result rule: if evidence was captured before the failure, surface it in the output. Do not suppress or rename failure classes. Do not report done when the script exited non-zero.

## Output
Test exit code with stdout/stderr summary, screenshot file paths and console log output if captured, and a verdict: `PASS` (script exited zero) or `FAIL` with evidence file paths (non-zero).
