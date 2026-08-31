# Observability checklist

Quick reference for instrumenting production code. Use alongside the `observability` skill.

## Table of contents

- [On-call questions (start here)](#on-call-questions-start-here)
- [Structured logging](#structured-logging)
- [Metrics](#metrics)
- [Distributed tracing](#distributed-tracing)
- [Alerting](#alerting)
- [Dashboards](#dashboards)
- [Maintained surface](#maintained-surface)
- [Verify the telemetry](#verify-the-telemetry)
- [Pre-launch gate](#pre-launch-gate)

## On-call questions (start here)

Telemetry without a question is noise. Before instrumenting anything:

- [ ] 2–4 questions an on-call engineer will ask about this feature are written down
- [ ] Every signal below maps to one of those questions
- [ ] Every signal maps to a decision an operator will act on — non-actionable signals are rejected
- [ ] Each question is matched to the right signal type: metrics say **that** something is wrong, traces say **where**, logs say **why**

## Structured logging

- [ ] Logs are structured (JSON) with stable event names — not free-form strings
- [ ] Every log line carries a correlation/request ID, generated or accepted at the system boundary
- [ ] Correlation ID is propagated on every outbound call and async boundary (HTTP headers, queue metadata)
- [ ] Log levels are consistent: `error` = invariant broken, someone may act; `warn` = degraded but handled; `info` = significant business event; `debug` = off in production
- [ ] No secrets, tokens, passwords, or unredacted PII in any log line
- [ ] Fields are allowlisted — no whole request/response bodies, no auth headers
- [ ] External service calls logged with metadata only: endpoint, status, latency, attempt count, sanitized identifiers
- [ ] Actual log output spot-checked: structured fields, not `[object Object]`

## Metrics

- [ ] **RED** instrumented for every endpoint and every external dependency: Rate, Errors, Duration
- [ ] **USE** instrumented for every resource (queues, pools, hosts): Utilization, Saturation, Errors
- [ ] Latency is a histogram; p50/p95/p99 queryable — never an average
- [ ] All labels come from small, fixed sets (route template, status class, provider name)
- [ ] No unbounded label values: no user IDs, tenant IDs, emails, raw URLs, request IDs, or error message text
- [ ] Status codes grouped by class (`5xx`, not `503`)
- [ ] Queue depth and processing duration tracked for every worker/queue

## Distributed tracing

- [ ] OpenTelemetry (or equivalent) initialized at service startup, before other imports
- [ ] Auto-instrumentation enabled for HTTP, gRPC, and DB clients
- [ ] Trace context propagated on every outbound call (W3C `traceparent`/`tracestate`) and extracted from every inbound request
- [ ] Context survives async boundaries — queue messages carry trace metadata
- [ ] Manual spans only around meaningful internal units of work, with the attributes on-call will filter by
- [ ] Span count is the minimum that reconstructs the critical request path — every span earns its place
- [ ] No secrets or PII as span attributes
- [ ] Head-based sampling at a low default rate; 100% of errors kept if tail sampling is available

## Alerting

- [ ] Every alert is symptom-based (error rate, p99 latency, queue age) — causes (CPU, disk, restarts) go to dashboards, not pagers
- [ ] Every alert is actionable; "ignore it, it self-heals" alerts are deleted
- [ ] Every alert links to a runbook — minimum three lines: what it means, first query to run, escalation path
- [ ] Thresholds and durations justified by an SLO or historical data, not guesses
- [ ] Two severities only: **page** (user-facing, act now) and **ticket** (degradation, act this week)
- [ ] Each new alert test-fired once: it reached the right channel and the runbook link works
- [ ] No alerts that fire daily and get acknowledged without action

## Dashboards

- [ ] Service health dashboard exists: error rate, latency p99, traffic, saturation
- [ ] Dependency health panel shows per-service error rates and latency
- [ ] Dashboard answers the on-call questions from the top of this checklist — not "everything except the answer"
- [ ] Default time range is sensible (1h–6h, not 30d)
- [ ] Every dashboard panel maps to a failure mode — no panel without one
- [ ] No unread panels — if no one will read a chart, omit it

## Maintained surface

- [ ] No signal, label, span, or panel duplicates an existing one
- [ ] Every surface has an owner who will keep it current
- [ ] Unowned or duplicate instrumentation removed before verification

## Verify the telemetry

Instrumentation is code; it can be wrong:

- [ ] Surface compiles, loads, and emits intended signals before any staged proof
- [ ] Forced an error in staging → found it in the logs by correlation ID
- [ ] Sent test traffic → metric series appear with expected labels and sane values
- [ ] Followed one request end-to-end in the tracing UI → no broken spans
- [ ] An induced failure was diagnosed from telemetry alone, without reading the source

## Pre-launch gate

Before a feature ships to production, all of the following are true:

- [ ] Structured logs flowing to the log aggregator
- [ ] RED metrics visible in dashboards for every new endpoint and dependency
- [ ] At least one symptom-based alert configured, with runbook, test-fired
- [ ] A request can be traced across every service it touches
- [ ] On-call knows where the runbooks are
