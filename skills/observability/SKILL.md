---
name: observability
description: 'Use when adding telemetry, reviewing alerting rules, shipping a production feature, or diagnosing an opaque production issue. Instrument structured logs with a correlation ID, RED or USE metrics, distributed tracing, and symptom-based alerts, then verify the telemetry against an induced staging failure until every check passes. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Observability

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Adding telemetry, reviewing alerting rules, shipping a production feature, or diagnosing an opaque production issue. Not for diagnosing a failure happening right now, profiling measured slowness, or launch-day runbooks. |
| Authority | Reversible-local: write only instrumentation code and local telemetry configuration in the working tree; every change is rolled back by discarding the edits. No credentials, paid services, publishing, deployment, or remote mutation. |
| Side effect | Adds instrumentation — structured log calls, metric instruments, tracer setup, alert definitions — to the target code, and nothing else. |
| Done | Structured logs carry a correlation ID, RED metrics exist with bounded labels, one request traces end-to-end without broken spans, symptom-based alerts are test-fired, and an induced staging failure is located via telemetry alone. |

## Inputs

Required: the target source files or endpoints to instrument, and their runtime (language and framework).
Optional: existing logging, metrics, or tracing libraries; a pinned metrics or tracing backend; SLOs or historical latency and error data for threshold justification; the alert delivery channel and runbook location.
When no backend is pinned, write against the vendor-neutral OpenTelemetry APIs so the exporter can be configured later.

## Procedure

1. Read the named target code and confirm its runtime and write surface. If the target cannot be identified, stop without writing.
2. Write down 2-4 on-call questions for the feature (for example: what fraction of attempts succeed on the first try; why does a permanent failure happen; is the provider slower than usual). Every signal added below must answer one of these questions. If no question can be named, stop and report; do not instrument.
3. Map each question to one signal: how often or how fast in aggregate → metric; where time goes across services → trace; what happened in one specific case → log. Instrument RED (rate, errors, duration) on every request-driven endpoint and external dependency; instrument USE (utilization, saturation, errors) on queues, pools, and hosts.
4. Add structured logging: every line is a JSON object with a stable event name and machine-readable fields (IDs, provider, error code, attempt count). Never interpolate values into prose strings. Use levels consistently: `error` for broken invariants needing investigation, `warn` for degraded but handled, `info` for significant business events, `debug` off in production by default.
5. Generate or accept a request ID at the system boundary (for example the `x-request-id` header, else a UUID), attach it to every log line, span, and outbound call, and echo it on the response. Without it a single request cannot be reconstructed from interleaved logs.
6. Never log secrets, tokens, passwords, or unredacted PII. Allowlist logged fields; never log whole request bodies. Telemetry pipelines are a classic data-leak path.
7. Add metrics: a latency histogram per endpoint and dependency (for example `http_request_duration_seconds`, buckets spanning roughly 0.05s-5s, labels `method`, route template, and `status_class` holding `2xx`/`5xx` classes, never the raw status code). Read p50/p95/p99, never averages — an average hides the worst 1% of requests. Labels come only from small fixed sets (route template, status class, provider name); never user IDs, emails, request IDs, full URLs, or error message text — every unique label combination is a separate time series, and unbounded values belong in logs and traces.
8. Add tracing: enable OpenTelemetry auto-instrumentation for HTTP, gRPC, and database clients, initialized before application code, with the service name set. Add manual spans only around meaningful internal units of work, carrying the attributes on-call will filter by. Propagate context across every async boundary — HTTP headers, queue message metadata — or the trace dies at the gap. Sample head-based at a low rate; keep all errors via tail sampling when the backend supports it.
9. Add alerts on symptoms users feel — sustained error rate over a small percentage, p99 latency over seconds, queue age over minutes — never on causes like CPU, pod restarts, or disk usage; cause-based alerts fire when nothing is wrong and miss failures not predicted. Each alert must be actionable (if the response is to ignore it, delete it), link a runbook stating its meaning, first query, and escalation path, carry a threshold and duration justified by the SLO or historical data — never a guess — and use exactly two severities: `page` (user-facing, act now) and `ticket` (degradation, act this week); a third tier trains people to ignore everything.
10. Verify the telemetry itself in a staging-like environment: force an error and find it in the logs by request ID with structured fields intact (no `[object Object]`); send test traffic and confirm the metric series appear with expected labels and sane values; follow one request end-to-end in the tracing UI with no broken spans; temporarily lower each new alert threshold, fire it once, and confirm it reaches the right channel with a working runbook link; then locate the induced failure using telemetry alone, without reading the source.

## Failure and recovery
- On-call questions cannot be named (step 2): no mutation; report that the feature needs defined questions before instrumentation. This is the stop gate against logging everything and learning nothing.
- Target or runtime not identifiable (step 1): stop before any write; terminal classification `blocked`.
- No SLO or historical data justifies an alert threshold: do not guess a number. Record the alert with its query and mark its threshold unjustified; the done predicate is not met for that alert.
- A verification check fails — unstructured log output, missing or mislabeled metric series, broken spans, undelivered alert, failure not locatable from telemetry: treat it as an instrumentation bug, fix the instrumentation, and re-run the failed checks. Never report done with a failing or unexecuted check.
- No staging or verification environment exists: the mutations stand, but done is not reached; terminal classification `blocked` with telemetry unverified.
- Partial result: keep the parts that pass instrumented and list every check as pass or fail in the report. Never swallow errors or claim the done predicate holds.
- Rollback: all changes are local working-tree edits; discard or revert them to restore the pre-instrumentation state.

## Output
Modified target source files carrying structured logs, metrics, tracing setup, and alert definitions; the written on-call questions; the alert list with runbook links; and a verification report marking each check pass or fail. Terminal classification: done (all checks pass) or `blocked` (the named failing, unjustified, or unverifiable item).

## Provenance

Adapted from the odin-current skill at `skills/observability/SKILL.md` (project-owned, no external license). Absorbs the merged candidate `skills/observability-and-instrumentation/SKILL.md` from addyosmani/agent-skills at pinned revision d2c37ef6225dd8726cdd369a8030307f48592d26, SPDX MIT, Copyright (c) 2025 Addy Osmani — an exact contract duplicate whose mechanisms this file carries; derived distributions retain that copyright notice and the MIT permission text. Rewritten to this self-contained, semantic-minimum ODIN skill contract.
