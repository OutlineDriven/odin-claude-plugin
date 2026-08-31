---
name: observability
description: 'Use when adding telemetry, composing a durable observability surface, reviewing alerting rules, shipping a production feature, or diagnosing an opaque production issue. Instruments code with structured logs, bounded metrics, and critical-path tracing, then verifies local emission. Not for diagnosing a live failure right now, profiling measured slowness, or launch-day runbooks.'
---

# Observability

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Adding telemetry, composing the smallest observability surface the system will keep, reviewing alerting rules, shipping a production feature, or diagnosing an opaque production issue. |
| Authority | Reversible local writes: instrumentation code and local telemetry configuration in the working tree. No credentials, paid services, publishing, deployment, or remote mutation. Every change is rolled back by discarding the edits. |
| Side effect | Adds instrumentation: structured log calls, metric instruments, tracer setup, alert definitions, and dashboard panels to the target code. |
| Done | Structured logs carry a correlation ID, RED metrics exist with bounded labels, one request traces end-to-end with minimum spans and no broken spans, every dashboard panel maps to a failure mode, no duplicate or unowned surface remains, the surface compiles, loads, and emits locally, symptom-based alerts are defined, and local telemetry emission is verified. |

## Inputs

Required: the target source files or endpoints to instrument, and their runtime (language and framework).
Optional: existing logging, metrics, or tracing libraries; a pinned metrics or tracing backend; SLOs or historical latency and error data for threshold justification; the alert delivery channel and runbook location.
When no backend is pinned, write against the vendor-neutral OpenTelemetry APIs so the exporter can be configured later.

## Procedure

1. Read the named target code and confirm its runtime and write surface. If the target cannot be identified, stop without writing. Done when: the target code is read and its runtime and write surface are confirmed.
2. Write down 2-4 on-call questions for the feature (for example: what fraction of attempts succeed on the first try; why does a permanent failure happen; is the provider slower than usual). Every signal added below must answer one of these questions and map to a decision an operator will act on; reject any signal that does not. If no question can be named, stop and report; do not instrument. Done when: 2-4 on-call questions are written, each mapping to at least one signal below, and every signal maps to an operator action.
3. Map each question to one signal: how often or how fast in aggregate, a metric; where time goes across services, a trace; what happened in one specific case, a log. Instrument RED (rate, errors, duration) on every request-driven endpoint and external dependency; instrument USE (utilization, saturation, errors) on queues, pools, and hosts. Done when: each question is mapped to a signal type with RED/USE coverage applied.
4. Add structured logging: every line is a JSON object with a stable event name and machine-readable fields (IDs, provider, error code, attempt count). Never interpolate values into prose strings. Use levels consistently: `error` for broken invariants needing investigation, `warn` for degraded but handled, `info` for significant business events, `debug` off in production by default. Done when: structured JSON logging is added with consistent levels and no prose interpolation.
5. Generate or accept a request ID at the system boundary (for example the `x-request-id` header, else a UUID), attach it to every log line, span, and outbound call, and echo it on the response. Without it a single request cannot be reconstructed from interleaved logs. Done when: a request ID is generated at the boundary and propagated to every log line, span, and outbound call.
6. Never log secrets, tokens, passwords, or unredacted PII. Allowlist logged fields; never log whole request bodies. Done when: secret and PII logging is prevented with an allowlist.
7. Add metrics: a latency histogram per endpoint and dependency (for example `http_request_duration_seconds`, buckets spanning roughly 0.05s to 5s, labels `method`, route template, and `status_class` holding `2xx`/`5xx` classes, never the raw status code). Read p50/p95/p99, never averages. Labels come only from small fixed sets (route template, status class, provider name); never user IDs, emails, request IDs, full URLs, or error message text. Done when: latency histograms with bounded labels are added per endpoint and dependency.
8. Add tracing: enable OpenTelemetry auto-instrumentation for HTTP, gRPC, and database clients, initialized before application code, with the service name set. Add manual spans only around meaningful internal units of work, carrying the attributes on-call will filter by. Keep span count to the minimum that reconstructs the critical request path. Propagate context across every async boundary (HTTP headers, queue message metadata) or the trace dies at the gap. Sample head-based at a low rate; keep all errors via tail sampling when the backend supports it. Done when: tracing is enabled with auto-instrumentation, minimum manual spans for the critical path, and context propagation across async boundaries.
9. Define symptom-based alerts on what users feel: sustained error rate over a small percentage, p99 latency over seconds, queue age over minutes. Never alert on causes like CPU, pod restarts, or disk usage. Each alert must be actionable (if the response is to ignore it, delete it), link a runbook stating its meaning, first query, and escalation path, carry a threshold and duration justified by the SLO or historical data, and use exactly two severities: `page` (user-facing, act now) and `ticket` (degradation, act this week). Done when: symptom-based alerts are defined with runbook links, justified thresholds, and exactly two severities.
10. Build the dashboard around the failure modes revealed by the chosen signals and traces. Every panel must map to a failure mode or an on-call question; omit charts no one will read. Done when: every dashboard panel maps to a failure mode and no unread panel remains.
11. Keep only the surface the system will maintain: remove any instrumentation, label, span, or panel that duplicates another or that no owner will keep current. Done when: no duplicate or unowned surface remains.
12. Verify the surface compiles, loads, and emits locally. Run the system or a representative test and confirm: structured logs appear as JSON with the correlation ID intact (no `[object Object]`); metric series appear with expected labels and sane values; one request traces end-to-end with no broken spans. If the system cannot be run locally, report that local emission is unverified. Done when: the surface compiles, loads, and emits locally, and every local check passes.

## Failure and recovery

- On-call questions cannot be named (step 2): no mutation; report that the feature needs defined questions before instrumentation. This is the stop gate against logging everything and learning nothing.
- Target or runtime not identifiable (step 1): stop before any write; terminal classification blocked.
- No SLO or historical data justifies an alert threshold: do not guess a number. Record the alert with its query and mark its threshold unjustified; the done predicate is not met for that alert.
- A local verification check fails (unstructured log output, missing or mislabeled metric series, broken spans): treat it as an instrumentation bug, fix the instrumentation, and re-run the failed checks. Never report done with a failing or unexecuted check.
- The system cannot be run locally: the mutations stand, but done is not reached; terminal classification blocked with telemetry unverified.
- Duplicate signal: if a new signal, label, span, or panel duplicates an existing one, reuse the existing and do not add the duplicate.
- No owner for a panel or signal: remove it; a surface no one maintains is not durable.
- Partial result: keep the parts that pass instrumented and list every check as pass or fail in the report. Never swallow errors or claim the done predicate holds.
- Rollback: all changes are local working-tree edits; discard or revert them to restore the pre-instrumentation state.

## Output

Modified target source files carrying structured logs, metrics, tracing setup, alert definitions, and dashboard panels grouped by failure mode; the written on-call questions; the alert list with runbook links; and a local verification report marking each check pass or fail. Terminal classification: done (all local checks pass) or blocked (the named failing, unjustified, or unverifiable item).
