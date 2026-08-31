---
name: nodejs-hanging-test-diagnosis
description: 'Use when asked to diagnose Node.js tests that hang after the runner reports completion. Finds and closes the leaked resource so the isolated test passes repeatedly and the full suite exits 0. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Node.js hanging test diagnosis

## Contract

| Field | Bound contract |
|---|---|
| Trigger | node --test hangs, flaky tests, 'process did not exit', CI timeout after tests done, 'open handles', passes-alone-hangs-in-suite. |
| Authority | Reversible local diagnosis and edits: run test binaries under timeouts and reporters; edit test and teardown code in this repository. Revert all edits on request. |
| Side effect | Runs test binaries with timeouts/reporters; edits test and teardown code. |
| Done | Isolated test passes repeatedly and the full suite exits 0; the previously leaked resource no longer keeps the process alive after the tests finish. |

## Inputs

- The hanging test command or file (required).
- package.json or the test script (optional; confirms the Node version and runner invocation).
- A shell with `timeout` (Linux) or `gtimeout` (macOS via coreutils) (optional; if absent, interrupt the process manually).

## Procedure

1. Record the runtime: `node --version`. The remaining steps assume Node 24 `node:test` runner semantics (some flags differ on older versions). Done when: the Node version is recorded.
2. Reproduce and bound the hang: run the full suite or the suspected file under an external timeout.
   ~~~bash
   timeout 120 node --test <file-or-directory>
   ~~~
   If `timeout` exits `124`, the runner did not finish before the cutoff. If the last printed lines are test results (not a current test name), the hang is after the runner finished: an active handle keeps the event loop alive. Done when: the hang is reproduced and bounded as before-summary or after-summary.
3. Convert the hang into named evidence: run with `--test-timeout` so tests that exceed the limit fail with a name rather than hang the suite.
   ~~~bash
   timeout 120 node --test --test-timeout 5000 <target>
   ~~~
   If the hang now occurs after all named tests have reported, the leaked resource is outside the test bodies: module-level code, a hook that never completes, or a server/connection/timer left open. Done when: the hang is converted to a named failure or confirmed as post-completion.
4. Confirm the post-completion handle: run with `--test-force-exit`.
   ~~~bash
   timeout 30 node --test --test-force-exit <target>
   ~~~
   If the previous step hung and this one exits promptly, an active handle kept the process alive. Use `--test-force-exit` for diagnosis only; it masks the leak, so do not ship it as the fix. Done when: the post-completion handle is confirmed or ruled out.
5. Isolate the source: run each suspect file alone, then narrow to one test with `--test-name-pattern`.
   ~~~bash
   timeout 60 node --test --test-name-pattern 'substring|other' <file>
   ~~~
   For `passes-alone-hangs-in-suite`, run the file alone to confirm it passes, then run the suite with `--test-isolation=none` to expose shared-process ordering, or bisect the suite until a pair of files reproduces the interaction. Done when: the leaking test or file pair is isolated.
6. Name the leaked resource using observable process evidence while the minimal reproduction still hangs:
   - On Linux, read `/proc/<pid>/fd` to list open file descriptors (sockets, pipes, inotify, epoll, temp files).
   - On macOS, use `lsof -p <pid>` for the same list.
   - Match what is observed against resources the suspect code creates: `http.createServer().listen()`, `net.connect()`, `fs.watch()`, `worker_threads.Worker`, `child_process.spawn()` without `kill()`, and `setTimeout`/`setInterval` without clear.
   The Node `node:test` runner does not provide an open-handle dump; these are the available zero-dependency channels. Done when: the leaked resource is named from descriptor evidence and code review.
7. Review the `node:test` hooks at the top level and inside `describe`: `before`, `after`, `beforeEach`, and `afterEach`. Ensure each created resource is torn down in the matching hook. For HTTP/HTTPS keep-alive connections, `await server.close()` and then `server.closeAllConnections()` to release active sockets. For timers, use `clearTimeout`/`clearInterval`. For servers, await `close()`. Do not add `.unref()` as a fix: it only stops the handle from keeping the event loop alive, leaving the resource open. Done when: every created resource has a matching teardown in the correct hook.
8. Fix the root cause by adding the missing teardown. Never call `process.exit()` in a test or hook to end the suite; it discards pending results and hides the leak. Done when: the missing teardown is added and no `process.exit` workaround is introduced.
9. Verify the fix: run the isolated target with `--test-timeout` three consecutive times and confirm it passes; then run the full suite without `--test-force-exit` and confirm it exits `0`. Done when: three consecutive isolated passes and full-suite exit 0 are confirmed.
10. If the handle cannot be named from reporter output, `/proc`/`lsof` descriptors, and code review, stop. Report `blocked` with the evidence collected and state that naming the handle requires an `async_hooks` probe or a dedicated handle-dump tool that is not available here. Do not substitute `--test-force-exit` or `process.exit` for the missing evidence. Done when: `blocked` is returned with evidence, or the fix is verified.

## Failure and recovery

If the hang is in a dependency or native addon, return partial findings with the handle type and the code that creates it; do not widen scope to unrelated code or edit node_modules. If the hang does not reproduce in three isolation runs, report the reproduction attempts and the clean exit; do not invent a cause. If the root cause cannot be fixed, return the diagnostic report up to the last confirmed finding. If an edit worsens the result, revert all edits before returning. Do not edit production source code outside the test file unless the user explicitly confirms in the same session. A blocked result is a terminal classification naming the missing tool and the evidence that was gathered; the done predicate does not hold.

## Output

One terminal or file report: reproduction command and timeout exit code, stop point, open-descriptor observations, root cause with file and line (or blocked), fix applied (or unresolved/blocked), confirmation results.
