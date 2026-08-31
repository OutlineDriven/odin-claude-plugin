---
name: nodejs-graceful-shutdown
description: 'Use when asked to implement or fix service termination handling: SIGTERM or SIGINT, connection draining, health-check shutdown signaling, zero-downtime deploys. Not for general service scaffolding; use nodejs-service-foundations.'
---

# Node.js graceful shutdown

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Implementing or fixing service termination handling: SIGTERM or SIGINT, connection draining, health-check shutdown signaling, zero-downtime deploys. |
| Authority | Reversible local edits to the service shutdown handler; writes a companion test. |
| Side effect | Edits server shutdown code; runs a short-lived server to verify drain. |
| Done | On signal the service stops accepting new connections, drains active requests within the deadline, closes external dependencies, exits with code 0 on success or non-zero on deadline, and the companion test passes. |

## Inputs

- `DRAIN_TIMEOUT_MS`: integer milliseconds to wait for in-flight requests to complete before forcing exit. Required; must be positive. Default `10000`.
- `SERVER_PORT`: TCP port for the HTTP server. Required.
- `HEALTH_ROUTE`: URL path for the health or readiness endpoint. Required.
- `SOURCES`: list of source files under `$CWD/src` or `$CWD/lib` to edit. Required; may be a single file.
- `EXTERNAL_DEPENDENCIES`: list of external connections the application opens (database pools, Redis clients, message-queue producers). Required; may be empty.

## Procedure

1. **Install SIGTERM and SIGINT handlers.** Read every file in `SOURCES`. Identify the server bootstrap point: the `http.createServer` or Express or Fastify `listen` call. Identify any existing `process.on` handlers. If no `isShuttingDown` boolean state exists, add it as `let isShuttingDown = false` at module scope. Add or augment `process.on('SIGTERM', shutdown)` and `process.on('SIGINT', shutdown)`; if the existing handler is named and registered, update it, do not register a second handler on the same signal. Done when: both SIGTERM and SIGINT are wired to a single shutdown handler and `isShuttingDown` state exists at module scope.

2. **Flip health check to 503 and verify it responds.** Write the `shutdown` function so that the first action is setting `isShuttingDown = true`, then update the health endpoint handler to return `503 Service Unavailable` with body `{"status":"shutting_down"}` when `isShuttingDown === true`, and `200 OK` with body `{"status":"ok"}` otherwise. The health flip must happen before `server.close()` so the 503 observation is reliable. Verify by sending a health request immediately after the signal: it must return 503. Done when: the health endpoint returns 503 shutting_down during shutdown and 200 ok otherwise, and the 503 is observable before the server stops accepting connections.

3. **Call server.close() and drain active requests.** After the health flip, call `server.close()` from the variable that holds the server instance. This stops accepting new connections and resolves when all active connections close. Await `server.close()` with a deadline: race it against a timeout of `DRAIN_TIMEOUT_MS`. If `server.close()` resolves first, the drain succeeded gracefully. If the timeout wins, active requests are still in flight and the exit must be non-zero. Do not use a fixed sleep; await the actual close promise. Done when: `server.close()` is called and awaited with a deadline, and the drain outcome (success or timeout) is distinguishable.

4. **Close external dependencies.** Call `closeExternalConnections()` for every connection in `EXTERNAL_DEPENDENCIES`: `pool.end()` for database pools, `redis.quit()` for Redis clients, `producer.disconnect()` for message-queue producers. Do not modify OS-level sockets. Await all close calls; if any dependency is unresponsive, record it and proceed to exit. Done when: every external dependency in the list has a close call in the shutdown function.

5. **Exit with code 0 on success or non-zero on deadline.** If `server.close()` resolved before the timeout and all dependencies closed, call `process.exit(0)`. If the timeout won (drain did not complete in time), call `process.exit(1)`. If a dependency was unresponsive, call `process.exit(1)`. The exit code must distinguish a graceful drain from a deadline-forced termination. Done when: the exit code is 0 on graceful success and non-zero on deadline or partial cleanup.

6. **Write a companion test.** Create `<filename>.test.ts` that:
   - Spawns the server with `DRAIN_TIMEOUT_MS=500`.
   - Sends a `GET /<HEALTH_ROUTE>` request and asserts `200`.
   - Sends `SIGTERM` to the server process.
   - Immediately sends a second health request; asserts `503` with `shutting_down`.
   - Sends a long-running request before the signal; asserts it completes before the server exits.
   - Waits for the process to exit; asserts exit code `0` when the long-running request completes within the deadline.
   - Runs a second scenario where the long-running request exceeds `DRAIN_TIMEOUT_MS`; asserts exit code is non-zero.
   Done when: the companion test file is written covering all assertions.

7. **Run the test.** Run with `node --test` or the project's test runner. Done when: all tests pass.

## Failure and recovery

| Failure class | Result |
|---|---|
| Unresponsive dependency | `closeExternalConnections()` hangs. Record which dependency did not close. Exit with code 1. The test detects the non-zero exit. Add a timeout on each dependency close call. |
| Drain timeout | Active requests exceed `DRAIN_TIMEOUT_MS`. The timeout wins the race against `server.close()`. Exit with code 1. The test detects the non-zero exit. Increase `DRAIN_TIMEOUT_MS` or ensure the service under test does not hold connections beyond the limit. |
| Partial cleanup | Some dependencies closed, others did not. Record which closed and which did not. Exit with code 1. The test detects the non-zero exit. Add the missing dependency to `EXTERNAL_DEPENDENCIES`. |
| `isShuttingDown` checked after I/O initiation | A request that started async work before the signal may still emit a database query after `isShuttingDown` is set. Add the guard before the I/O call, not after. |
| Health route does not reflect `isShuttingDown` | The load balancer keeps routing traffic to a pod that has started draining. The health endpoint must return 503 immediately after the signal, before `server.close()`. |

## Output

Edited source files implementing the graceful shutdown sequence, plus a passing companion test demonstrating the 503 health flip, clean drain, and exit code that distinguishes graceful from deadline-forced termination.
