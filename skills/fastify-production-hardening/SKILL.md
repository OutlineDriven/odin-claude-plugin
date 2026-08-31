---
name: fastify-production-hardening
description: 'Use when asked to prepare a Fastify service for production load and exposure: performance, load shedding, CORS/security headers, rate limiting, redacted logging, proxying, and deployment config. Leaves a measured performance baseline, enabled load shedding, configured rate limiting and security headers, and redacted secrets from logs. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Fastify production hardening

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Preparing a Fastify service for production load and exposure: performance, load shedding, CORS/security headers, rate limiting, redacted logging, proxying, deployment config. |
| Authority | Reversible local: edit only the service's hardening config files and run load/profiling checks against a local or staging target. Roll back by reverting the edited config files to their prior VCS revision. |
| Side effect | Local writes to hardening config; runs load/profiling checks that generate traffic against the target. |
| Done | Load shedding enabled, rate limiting and security headers configured, secrets redacted from logs, measured performance baseline recorded. |

## Inputs

Required: a Fastify service codebase with a server entry point and its config file(s) under VCS.
Optional: a target base URL for load/profiling checks (defaults to a local instance the operator starts); expected request rate or SLO threshold for the baseline.

## Procedure

1. Read the current server entry point and config to inventory which hardening concerns are already set: connection and keep-alive timeouts, body and param limits, CORS, security headers, rate limiting, logger redaction, trustProxy, and any proxy registration.
2. Enable load shedding and performance limits in the Fastify server options: set `connectionTimeout`, `keepAliveTimeout`, `requestTimeout`, `bodyLimit`, and `maxParamLength` to production values; register `@fastify/under-pressure` (or equivalent memory/heap shedding) with a max heap or RSS threshold that returns 503 under pressure.
3. Configure rate limiting: register `@fastify/rate-limit` with a global max and time window, and per-route overrides for expensive endpoints. Set `trustProxy` so the limiter and logs see the real client IP behind a reverse proxy.
4. Configure CORS and security headers: register `@fastify/cors` with an explicit origin allowlist (not wildcard) and `@fastify/helmet` with default production directives; tighten or relax directives only against the service's actual response surface.
5. Redact secrets from logs: set the pino logger `redact` paths to cover authorization headers, cookies, tokens, passwords, and any field the service places secrets in; verify a sample request logs no secret value.
6. Configure proxying only if the service fronts an upstream: register `@fastify/http-proxy` with the upstream and prefix; keep the proxy path rewriting explicit and do not forward the redacted headers upstream unchanged.
7. Set deployment config: bind `host` to the production interface, set `port` from the deployment environment, enable graceful shutdown via the server close path so in-flight requests drain on SIGTERM, and confirm the process manager (PM2, systemd, or container) respects that signal.
8. Run a load/profiling check against the target: ramp requests with an existing load tool, capture throughput, latency percentiles, and error rate, and confirm the shedding and rate-limit paths return 503 or 429 under overload rather than crashing.
9. Record the measured performance baseline (throughput, p50/p95/p99 latency, error rate, shedding threshold) in a file or report committed alongside the config.

## Failure and recovery
- Missing plugin: stop and report which plugin is unavailable; do not substitute an unverified alternative. Roll back by reverting config to the prior VCS revision.
- Load check cannot reach the target: record the config changes as applied but mark the baseline as not-measured; the done predicate does not hold until a baseline is recorded.
- Redaction check leaks a secret: treat as a blocking defect; do not declare done. Revert the logger change and re-derive the redact paths from the actual secret fields.
- Overload check crashes the process instead of shedding: blocking defect; the shedding config is wrong, not the test. Fix the shedding threshold and re-run.
- Partial result: applied config changes are reversible via VCS revert; never report done when any of load shedding, rate limiting, security headers, redaction, or baseline is missing.

## Output
A Fastify service with production hardening config applied, plus a committed performance baseline report. Terminal classification: hardened-and-baselined, or blocked with the named missing concern.

## Provenance

Origin: mcollina/skills (skills/fastify/rules/performance.md, cors-security.md, http-proxy.md, logging.md, deployment.md). Pinned revision: 856efd268ae85482d882f3d0bed869fd020b5c06. License: MIT; notice retained, mechanism adapted. Adaptation: consolidated the five rule files into one self-contained production-hardening procedure with explicit load-shedding, redaction, and baseline steps.
