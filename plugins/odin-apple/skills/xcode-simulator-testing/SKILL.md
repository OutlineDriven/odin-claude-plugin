---
name: xcode-simulator-testing
description: 'Use when asked to run /xcode-simulator-testing with a scheme name or current to build and launch an iOS app in a simulator and capture per-surface evidence. Not for project regeneration — use xcode-project-sync.'
---

# Xcode simulator test

## Contract

| Field | Bound contract |
|---|---|
| Trigger | /xcode-simulator-testing [scheme name or 'current' to use default] |
| Authority | Reversible local: build, install, and launch the app in a local iOS simulator, capture logs and screenshots, and boot or shut a simulator created for this run. No project source, VCS, credential, or remote mutation. |
| Side effect | Builds and launches the iOS app in a simulator, captures logs and screenshots, and reports evidence. |
| Done | A completed run reports overall PASS, FAIL, or PARTIAL with per-surface evidence and residual failures. |

## Inputs

- Scheme argument (optional): empty or `current` selects the default or last-used scheme; a named argument selects that scheme. Ask only when the scheme cannot be resolved or project discovery is materially ambiguous.
- The user's request and the changed iOS surface define the screens and flows to exercise.
- Required environment, which this skill does not install or configure: XcodeBuildMCP connected as an MCP server, Xcode and its command-line tools, a valid project or workspace, and an available iOS simulator.

## Procedure

1. Run the availability gate. Confirm that the active harness exposes XcodeBuildMCP's simulator-listing capability and that the call succeeds; host-specific MCP tool prefixes are adapters, not the contract. If the capability is absent or errors, stop before discovery or build. Report that XcodeBuildMCP must be installed and connected, give the user these setup options to run: `brew tap getsentry/xcodebuildmcp && brew install xcodebuildmcp` or `pnpm dlx xcodebuildmcp@latest mcp`, and tell the user to add XcodeBuildMCP as an MCP server and restart the agent. Also stop and report a missing prerequisite when Xcode, its command-line tools, a valid project or workspace, or an iOS simulator is unavailable. Done when: all prerequisites are confirmed available and XcodeBuildMCP's simulator-listing capability succeeds.
2. Discover projects and workspaces, then list schemes for the selected project. Resolve the scheme from the argument. List simulators; reuse a compatible booted simulator when practical, otherwise prefer an available iPhone 15 Pro and boot it by UUID, and wait until it is ready. Done when: the project, scheme, and simulator are resolved and the simulator is booted and ready.
3. Build the simulator app with the selected project or workspace and scheme. On failure, report the relevant build errors and stop; do not install or launch a missing artifact. Done when: the simulator app is built successfully.
4. From the successful build result, retain the app path and bundle identifier. Install the app, launch it, and start simulator log capture for that bundle. Retain the project or workspace, scheme, simulator identity, app identity, and log-capture handle. Any failure before the app is visibly launched with log capture running is a setup blocker: preserve its evidence, report it, and stop later stages. Done when: the app is installed, launched, and log capture is running.
5. Derive the key screens and flows from the user's request and the changed iOS surface. For each one, navigate through the running app and record what you exercised. Capture a descriptively named screenshot of the resulting state. Check that the expected content and controls render without visible errors or broken layout. Read the captured simulator logs for crashes, exceptions, error-level messages, and failed network requests attributable to the flow. A simulated action reporting success does not prove the expected state change; verify the visible result or logs. Done when: every key screen and flow is exercised with a screenshot and log review.
6. SwiftUI inline `Text` links: simulated taps do not trigger gesture recognizers on SwiftUI `Text` views with inline `AttributedString` links because the link is not exposed as a separate accessibility element. When such a tap reports success but has no visible effect, ask the user to tap the link manually in the simulator. If the target URL is known, fall back to `xcrun simctl openurl <device-uuid> <URL>`. Record which fallback supplied the verification; do not report the automated tap itself as a pass. Done when: the inline-link interaction is verified via manual tap or `simctl openurl` fallback.
7. Pause for human-only verification only when the scoped flow requires interaction that the available simulator automation cannot complete: Sign in with Apple, push delivery, a sandbox purchase, camera or photos permission, location permission, or the inline-link case. State the exact action and expected observation, then ask whether it worked. Derive status from evidence, not the user's next-action choice: `PASS` requires a completed passing outcome, `FAIL` records a completed failing outcome, and `SKIP` applies only to a check with no completed outcome. An unanswered check is `SKIP` for that surface. Never silently mark an unanswered or failed check as passed. Done when: every human-only verification is asked with its exact action and expected observation, and status is derived from the response.
8. Derive per-surface status from evidence: `PASS` requires completed passing evidence; `FAIL` records observed failing evidence until a completed retest replaces it; `SKIP` means the check has no completed outcome. Roll up the overall result: `FAIL` while any failure remains, `PARTIAL` when no failure remains but a scoped check is skipped, and otherwise `PASS`. Done when: per-surface status and overall result are derived from evidence.
9. Stop the log capture started by this run. Leave a simulator that was already booted as found; a simulator booted only for this run may be shut down after evidence is saved. Done when: log capture is stopped and simulator state is handled.

## Failure and recovery
- Setup blocker: any failure before the app launches with log capture running stops later stages. Report an actionable setup blocker with its evidence.
- Failed screen or flow: preserve its screenshot, relevant logs, and reproduction steps. Ask whether to investigate now or continue testing the remaining scope without investigation; that routing choice does not change the observed `FAIL`.
  - Investigate now: pause this run and hand the failure evidence and simulator reproduction context back. Any diagnosis or fix proceeds under separate authority narrowed to no commit, push, or PR. Only an applied fix triggers rebuild and retest; derive any replacement status from the completed retest evidence, and until that evidence exists retain `FAIL` and continue the remaining scoped checks.
  - Continue without investigation: retain `FAIL`, preserve the observed failure evidence, and proceed with the rest of the scoped checks.
- **Non-mutation**: this skill does not modify project source, commit, push, or open a PR. Simulator state it creates is reversible by shutting the simulator and uninstalling the app.
- Never swallow errors or pretend the done predicate holds. The blocked or non-converged result is the summary with residual `FAIL` or `SKIP` preserved.

## Output
Xcode test report — fields in order: project or workspace, scheme, simulator, build result, screens tested, per-surface PASS/FAIL/SKIP evidence, console errors, human verifications, residual failures, overall PASS/FAIL/PARTIAL result.
