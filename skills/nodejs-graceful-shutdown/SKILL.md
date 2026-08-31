---
name: nodejs-graceful-shutdown
description: 'Use when asked to implement or fix service termination handling: SIGTERM/SIGINT, connection draining, health-check shutdown signaling, zero-downtime deploys. Not for general service scaffolding — use nodejs-service-foundations.'
---

# Node.js graceful shutdown

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Implementing or fixing service termination handling: SIGTERM/SIGINT, connection draining, health-check shutdown signaling, zero-downtime deploys. |
| Authority | Reversible local edits to server bootstrap and shutdown code; runs a short-lived server to verify drain. |
| Side effect | Edits server bootstrap/shutdown code; runs a short-lived server to verify drain. |
| Done | On signal the service stops accepting work, drains in-flight requests within the delay, closes external connections, exits cleanly; health endpoint observed flipping to 503 shutting_down; companion test passes. |

## Inputs

- `SHUTDOWN_DELAY_MS`: integer milliseconds to wait for in-flight requests to complete before forcing exit. Required; must be positive. Default `10_000`.
- `SERVER_PORT`: TCP port for the HTTP server. Required.
- `HEALTH_ROUTE`: URL path for the health/readiness endpoint. Required.
- `SOURCES`: list of source files under `$CWD/src` or `$CWD/lib` to edit. Required; may be a single file.

## Procedure

1. Read every file in `SOURCES`. Identify the server bootstrap point: the `http.createServer` or Express/Fastify `listen` call. Identify any existing `process.on` handlers. Done when: the bootstrap point and existing signal handlers are identified.
2. If no `isShuttingDown` boolean state exists, add it as `let isShuttingDown = false` at module scope. Done when: `isShuttingDown` state exists at module scope.
3. Add or augment a `process.on('SIGTERM', shutdown)` and `process.on('SIGINT', shutdown)` handler. If the existing handler is named and registered, update it; do not register a second handler on the same signal. Done when: both SIGTERM and SIGINT are wired to a single shutdown handler.
4. Write the `shutdown` function as:
   ```
   async function shutdown(signal) {
     isShuttingDown = true
     // flip health to 503
     server.close() // stop accepting new connections
     await new Promise(resolve => setTimeout(resolve, SHUTDOWN_DELAY_MS))
     await closeExternalConnections()
     process.exit(0)
   }
   ```
   - Call `server.close()` from the variable that holds the server instance created in step 1.
   - Call `closeExternalConnections()` only for connections the application opened (database pools, Redis clients, message-queue producers). Do not modify OS-level sockets.
   - Place `process.exit(0)` last inside the `setTimeout` callback.
   Done when: the shutdown function flips health, closes the server, waits the delay, closes external connections, and exits 0.
5. Update the health endpoint handler to return:
   - `503 Service Unavailable` with body `{"status":"shutting_down"}` when `isShuttingDown === true`.
   - `200 OK` with body `{"status":"ok"}` otherwise.
   Done when: the health endpoint returns 503 shutting_down during shutdown and 200 ok otherwise.
6. Update every route handler that initiates async I/O (database calls, external HTTP) to check `if (isShuttingDown) return` and not start new work after shutdown has begun. Done when: every async-I/O route handler guards against starting work during shutdown.
7. Write a companion test file `<filename>.test.ts` that:
   - Spawns the server with `SHUTDOWN_DELAY_MS=500`.
   - Sends a `GET /<HEALTH_ROUTE>` request and asserts `200`.
   - Sends `SIGTERM` to the server process.
   - Immediately sends a second health request; asserts `503` with `shutting_down`.
   - Sends a long-running request before the signal; asserts it completes before the server exits.
   - Waits `SHUTDOWN_DELAY_MS + 200ms`; asserts the server process has exited with code `0`.
   Done when: the companion test file is written covering all five assertions.
8. Run the test with `node --test` or the project's test runner. Done when: all tests pass.

## Failure and recovery

| Failure class | Result |
|---|---|
| No `server.close()` call in shutdown | Server stops accepting connections only after the OS closes them; new requests hang. Test fails on the immediate `503` assertion. Add `server.close()` to the shutdown function. |
| In-flight connections exceed `SHUTDOWN_DELAY_MS` | `setTimeout` fires and `process.exit(0)` is called with connections still open. Test detects non-zero exit code or open handles. Increase `SHUTDOWN_DELAY_MS` or ensure the service under test does not hold connections beyond the limit. |
| `isShuttingDown` checked after I/O initiation | A request that started async work before the signal may still emit a database query or external call after `isShuttingDown` is set. Add the guard before the I/O call, not after. |
| `process.exit` omitted | Event loop drains naturally; server hangs indefinitely because open handles prevent Node from exiting. Add `process.exit(0)` as the last line inside the shutdown timeout. |
| No `closeExternalConnections()` | Database pools and Redis clients keep the event loop alive; server hangs on `process.exit(0)`. Add explicit `pool.end()`, `redis.quit()`, etc. calls inside the shutdown function before `process.exit`. |
| Health route does not reflect `isShuttingDown` | Kubernetes/load-balancer keeps routing traffic to a pod that has started draining. Health endpoint must return `503` immediately after the signal is received. |

## Output

Edited source files implementing the graceful shutdown sequence, plus a passing companion test file demonstrating the 503 health flip and clean 0 exit. No output artifact or report is emitted.

## Provenance

Origin: Matteo Collina graceful-shutdown skill collection (`mcollina/skills`), revision `856efd268ae85482d882f3d0bed869fd020b5c06`. License: MIT. Mechanism adapted for ODIN `odin-code` module; MIT notice retained. Source paths: `skills/node/rules/graceful-shutdown.md`, `skills/node/rules/assets/graceful-server.ts`, `skills/node/rules/assets/graceful-server.test.ts`, `skills/fastify/rules/deployment.md`.
