---
name: fastify-production-hardening
description: 'Use when asked to prepare a Fastify service for production load and exposure. Not for building the app: use fastify-schema-first-service.'
---

# Fastify production hardening

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Preparing a Fastify service for production load and exposure: timeouts, payload limits, overload shedding, rate limiting, CORS and security headers, proxying, SIGTERM draining, performance baseline. |
| Authority | Reversible local: edit only the service's hardening config files and run load/profiling checks against a local or staging target. Roll back by reverting the edited config files to their prior VCS revision. |
| Side effect | Local writes to hardening config; runs load/profiling checks that generate traffic against the target. |
| Done | All five method stages applied and verified: base limits set, overload shedding and rate limiting active, CORS and security headers configured with conditional proxy safety, graceful shutdown drains on SIGTERM, and a performance baseline committed alongside the config. |

## Inputs

Required: a Fastify service codebase with a server entry point and its config file(s) under VCS.
Optional: a target base URL for load/profiling checks (defaults to a local instance the operator starts); expected request rate or SLO threshold for the baseline.

## Procedure

1. **Base hardening limits.** Read the current server entry point and config to inventory which hardening concerns are already set. Set `connectionTimeout`, `keepAliveTimeout`, `requestTimeout`, `bodyLimit`, and `maxParamLength` to production values. Done when: timeouts and payload limits are set in the server options.

2. **Overload shedding and rate limiting.** Register `@fastify/under-pressure` (or equivalent memory/heap shedding) with a max heap or RSS threshold that returns 503 under pressure. Register `@fastify/rate-limit` with a global max and time window, plus per-route overrides for expensive endpoints. Set `trustProxy` so the limiter and logs see the real client IP behind a reverse proxy. Done when: under-pressure shedding returns 503 under load and rate limiting is registered with global max, time window, per-route overrides, and `trustProxy` set.

3. **CORS, security headers, and proxy configuration.** Register `@fastify/cors` with an explicit origin allowlist (not wildcard) and `@fastify/helmet` with default production directives; tighten or relax directives only against the service's actual response surface. If the service fronts an upstream, register `@fastify/http-proxy` with the upstream and prefix; keep proxy path rewriting explicit and do not forward redacted headers upstream unchanged. Done when: CORS with explicit allowlist, helmet with production directives, and conditional proxy registration (present only if the service fronts an upstream) are all configured.

4. **Graceful shutdown and SIGTERM draining.** Bind `host` to the production interface, set `port` from the deployment environment, and enable graceful shutdown via the server close path so in-flight requests drain on SIGTERM. Confirm the process manager (PM2, systemd, or container) respects that signal. Done when: host, port, graceful shutdown, and process-manager signal handling are configured.

5. **Load and profiling baseline capture.** Run a load/profiling check against the target: ramp requests with an existing load tool, capture throughput, latency percentiles, and error rate, and confirm the shedding and rate-limit paths return 503 or 429 under overload rather than crashing. Record the measured baseline (throughput, p50/p95/p99 latency, error rate, shedding threshold) in a file committed alongside the config. Done when: throughput, latency percentiles, and error rate are captured, shedding and rate-limit paths return 503/429 under overload, and the baseline is committed.

## Failure and recovery

- Missing plugin: stop and report which plugin is unavailable; do not substitute an unverified alternative. Roll back by reverting config to the prior VCS revision.
- Baseline missed or stalled: the load check cannot reach the target or stalls before producing numbers. Record the config changes as applied but mark the baseline as not-measured; Done does not hold until a baseline is recorded.
- Redaction check leaked a secret: treat as a blocking defect; do not declare done. Revert the logger change and re-derive the redact paths from the actual secret fields.
- Proxy test failed: the proxy path does not forward correctly or leaks redacted headers upstream. Fix the proxy configuration and re-run; do not ship a proxy that forwards redacted headers.
- Partial result: applied config changes are reversible via VCS revert; never report done when any of the five stages is missing or unverified.

## Output

A Fastify service with production hardening config applied, conditional proxy safety and deployment shutdown behavior verified, plus a committed performance baseline report. Terminal classification: hardened-and-baselined, or blocked with the named missing stage.
