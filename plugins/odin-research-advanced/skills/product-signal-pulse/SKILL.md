---
name: product-signal-pulse
description: 'Use when invoking /product-signal-pulse with an optional lookback window to query configured product signals. Resolves config, runs a first-run interview if unconfigured, dispatches read-only queries to analytics, tracing, and payment sources, and writes a 30-40 line pulse report under docs/pulse-reports. Not for credential, publish, deploy, or irreversible changes.'
---

# Product signal pulse

## Contract

| Field | Bound contract |
|---|---|
| Trigger | /product-signal-pulse [lookback window, default 24h] |
| Authority | Read-only queries to configured analytics, tracing, and payment sources; write only the pulse report file and pulse settings in config.local.yaml. No read-write database access; read-only replica only when explicitly enabled. |
| Side effect | Writes a pulse report under docs/pulse-reports; settings writes go only to config.local.yaml |
| Done | A 30-40 line report exists at the dated path, with headlines and the top followup surfaced in chat |

## Inputs

- Lookback window (optional): trailing time range for the pulse, e.g. `24h`, `7d`, `1h`. Defaults to `pulse_lookback_default` from config, then `24h`.
- Argument keywords (optional): `setup`, `reconfigure`, or `edit config` force the first-run interview; `daily`, `hourly`, `weekly` are schedule hints for Phase 3.
- Config files (read): `.odin/config.local.yaml` then `.odin/config.yaml` at the repo root (`git rev-parse --show-toplevel`). Missing files are skipped.
- Strategy doc (read, optional): `STRATEGY.md`, else the first of `VISION.md`, `PRODUCT.md` that exists. Seeds product name and key metrics.

## Config keys

- `pulse_product_name` -- string, report titles. Required: if unset, the skill is unconfigured.
- `pulse_lookback_default` -- `1h`, `24h`, `7d`, `30d` (default `24h`).
- `pulse_primary_event` -- string, the engagement event name.
- `pulse_value_event` -- string, the value-realization event name; may equal primary; omit if not defined.
- `pulse_completion_events` -- comma-separated, 0-3 event names; omit if none.
- `pulse_quality_scoring` -- `true` or default `false` (AI products only).
- `pulse_quality_dimension` -- string scored 1-5 when quality scoring is true; ignored otherwise.
- `pulse_analytics_source` -- string identifying the analytics provider and how to reach it (e.g. `posthog:mcp`, `mixpanel:mcp`, `custom:http`).
- `pulse_tracing_source` -- string identifying the tracing provider (e.g. `sentry:mcp`, `datadog:mcp`, `custom:http`); omit if none.
- `pulse_payments_source` -- string identifying the payments provider (e.g. `stripe:mcp`, `custom:http`); omit if not used.
- `pulse_db_enabled` -- `true` or default `false`; when true, read-only DB access is part of the pulse.
- `pulse_metric_sources` -- comma-separated `metric=source` pairs for per-strategy-metric source overrides; metrics not listed fall back to `pulse_analytics_source` and render with a `(default source)` marker.
- `pulse_pending_metrics` -- comma-separated strategy-doc metric names awaiting instrumentation; render as `no data` until instrumentation lands.
- `pulse_excluded_metrics` -- comma-separated strategy-doc metric names intentionally excluded from the pulse.

## Connector and query contract

Each source value encodes both the provider and the access method as `provider:method`. The method determines how the query is executed:

- `mcp`: search the host's MCP registry for a server matching the provider name. If found, call its query tool with the event name and time range. If no MCP server is registered for that provider, mark the source `no data (tool unavailable)`.
- `http`: construct an HTTP GET request to the provider's API endpoint using the event name and time range as query parameters. Execute read-only. If the endpoint is unreachable or returns an error, mark the source `no data (query failed)`.
- `cli`: invoke the provider's CLI tool (e.g. `posthog`, `sentry-cli`) with a read-only query command. If the CLI is not on PATH, mark the source `no data (tool unavailable)`.

For every source, construct the query from the configured event name and the resolved lookback window. Apply a 15-minute trailing buffer to the upper bound (e.g. for `24h`, query `[now - 24h - 15m, now - 15m]`). If the source's method is unavailable (no MCP server, no CLI, unreachable HTTP), record `no data` with the reason. Do not invent a number.

## Procedure

### Stage 1: resolve config

1. Resolve the repo root with `git rev-parse --show-toplevel`. Done when: the repo root is resolved.
2. Read `.odin/config.local.yaml`, then `config.yaml`. For each `pulse_*` key, the first active (non-commented) value wins; an invalid value continues to the next layer, then the skill default. For lists and maps, a present key replaces the whole key. Missing files are skipped. Done when: the config cascade is applied.
3. If `pulse_product_name` is unset after cascade, or the repo root cannot be resolved, or the argument was `setup`, `reconfigure`, or `edit config`, run Stage 2 first. Otherwise start at Stage 3. Done when: the config state is classified.

### Stage 2: first-run interview

4. Read the strategy doc (`STRATEGY.md`, else first of `VISION.md`, `PRODUCT.md`). If it exists, extract the product name from the `name` frontmatter key or the H1 title (stripping a trailing ` Strategy`), and the key metrics from `## Key metrics` or the section listing success measures by meaning. When `STRATEGY.md` carries no metrics but points to a legacy sibling doc for content it defers, read the metrics from there. Surface what was extracted and invite correction. If no strategy doc exists, note it and run from scratch. Done when: the strategy doc is read or noted absent.
5. Ask one question at a time using the host's blocking question tool (match by capability, not host-specific name; fall back to numbered options on the chat surface only when no such tool is available or a call errors). Run the interview in order: Done when: all interview questions are answered.
   1. Product name (confirm or edit the seeded value).
   2. Primary engagement event -- the single event that fires when a user is actively using the product. Apply the SMART bar: specific (named event), measurable (tool returns a count), actionable (if it moves, the team notices), relevant (ties to the product's job), timely (reads in short windows). Apply the engagement-vs-value test: engagement is earlier (they're in it), value is later (it worked); if the candidate is really value-realization, push back. One round of pushback per section max; if the second answer is not usable, capture it flagged `needs-review` and move on.
   3. Value-realization event -- the event that fires when the user gets value. May equal the engagement event. If value is a feeling not an event, ask for a proxy (completion, time-to-first-X, return rate, copy/share/export).
   4. Completions or conversions -- 0-3 events. Push back on vanity metrics: if the number swings and the team does nothing, it does not belong.
   5. Quality scoring (opt-in, AI products only) -- if opted in, capture the dimension. Apply the reviewability test: could two reviewers agree on the score? If not, push back once; if still unclear, flag `needs-review`.
   6. Data sources -- for each signal (engagement, value, completions, strategy metrics), ask which tool and what query shape. Record the source as `provider:method` per the connector contract above. Consolidate entries in the same tool. Record per-strategy-metric source overrides in `pulse_metric_sources` as `metric=source` pairs. For dual-source signals, pick one canonical source. For un-instrumented strategy metrics, offer defer (`pulse_pending_metrics`, renders `no data`) or drop (`pulse_excluded_metrics`); never silently skip. Refuse read-write database access. Offer a read-only replica or skip DB entirely. DB is optional.
   7. System performance -- recommended default: top 5 error signatures by count with one-line context, p50/p95/p99 latency vs prior window. Confirm or customize. If no tracing tool, omit the section.
   8. Default lookback window.
6. Write the captured config to `.odin/config.local.yaml` as flat `pulse_*` keys. If the file exists, merge preserving non-pulse keys. If the directory or file does not exist, create it. If `config.local.yaml` is not in `.gitignore`, offer to add the entry before writing. Show the resulting pulse block and offer one round of edits. Done when: the config is written.
7. Offer a scheduling recommendation (daily, weekly, not now, later). If yes, hand off to the host's scheduling primitive; do not schedule inline. Capture the choice. Done when: the scheduling choice is captured.

### Stage 3: dispatch read-only queries

8. If Stage 2 ran, re-apply the config cascade (local then tracked) to pick up edits. Otherwise use the Stage 1 values. Apply defaults for anything unset. Done when: the config is finalized.
9. Resolve the lookback window: use the argument if parseable; if empty, use `pulse_lookback_default`; if unset, `24h`. If unparseable, ask the user to clarify. Apply a 15-minute trailing buffer to the upper bound. Done when: the lookback window is resolved.
10. Dispatch in parallel (different tools, no shared load). For each source, resolve the connector method from the source value and execute the query per the connector contract above. Done when: all parallel queries are dispatched and results or `no data` markers are collected.
    - Product analytics query: primary event count, value-realization count, completions, conversion ratios over the window.
    - Application tracing query: error counts by category, latency distribution (p50/p95/p99), top error signatures over the window.
    - Payments query (if configured): new customers, churn, revenue delta over the window.
11. Dispatch serially after the parallel batch: read-only database queries, only when `pulse_db_enabled` is `true`. One at a time, tight scoped queries only, never full-table scans on large tables. If a query would be expensive, skip it and note "DB query skipped (estimated cost too high)". Done when: DB queries are complete or skipped.
12. If `pulse_quality_scoring` is `true`, sample up to 10 sessions or conversations from the window and score each 1-5 on `pulse_quality_dimension`. Default to 4-5 when the session looks normal; reserve 1-3 for clear failure modes. Capture a count distribution (e.g. "8x 5, 1x 4, 1x 2") and a short anonymized note on any session scored below 4. No PII in the score summary. Done when: quality scoring is complete or skipped.

### Stage 4: assemble report

13. Resolve the strategy doc (same as step 4) and re-read key metrics. For each strategy metric: if in `pulse_excluded_metrics`, omit; if in `pulse_pending_metrics`, render `no data (instrumentation pending)`; otherwise resolve the source from `pulse_metric_sources` or fall back to `pulse_analytics_source` with a `(default source)` marker, query and render with current value and delta. Four sections in order: Done when: the report is assembled.
    1. **Headlines** -- 2-3 lines summarizing the window. Lead with the most notable item.
    2. **Usage** -- primary engagement (count, delta vs prior equal-length window), value realization (count, delta, ratio vs engagement), completions (each: count, delta), strategy metrics (value, delta or `no data`), quality sample (distribution) if configured.
    3. **System performance** -- latency p50/p95/p99 with delta; top 5 errors by count descending with one-line context each. Omit the entire section if no tracing tool is configured.
    4. **Followups** -- 1-5 specific, actionable items.
14. Keep the total to 30-40 lines. If a section is thin, leave it thin; do not pad. Use real numbers, not ranges or hedges. Percent deltas compare the current window to the previous equal-length window; if no comparison is possible, omit the delta. No hardcoded thresholds; do not label "high" or "low" or color anything. No PII: no emails, account IDs, or message content. Done when: the report is 30-40 lines and follows the formatting rules.

### Stage 5: write report file

15. Write the report to `docs/pulse-reports/YYYY-MM-DD_HH-MM.md` using the local time of the run. Create `docs/pulse-reports/` if it does not exist. The filename and in-file timestamp use the same wall-clock time. Done when: the report file is written.

### Phase 3: scheduling

16. If the argument was a schedule keyword (`daily`, `hourly`, `weekly`), say this run is ad-hoc and point at the host's scheduling primitive. If no schedule is on file and this is the third or later run, mention once that scheduling is available. Do not nag on every run. Never schedule automatically; any handoff to a scheduling primitive requires explicit confirmation. Done when: the scheduling note is emitted.

## Failure and recovery

- Unparseable lookback window: ask the user to clarify; do not guess.
- Unconfigured product (pulse_product_name unset): route to Stage 2 interview; do not run queries with no config.
- Read-write database offered: refuse; offer read-only replica or skip DB. Do not capture a read-write connection under any framing.
- Data source query fails or returns no value: include the metric in the report marked `no data`; do not invent a number. Note the failure reason inline.
- Source tool unavailable (no MCP server, no CLI, unreachable HTTP): mark the source `no data (tool unavailable)` in the report. Note which method was tried.
- DB query too expensive: skip it and note "DB query skipped (estimated cost too high)" in the report.
- No tracing tool configured: omit the System performance section; the report stays Headlines / Usage / Followups.
- No strategy doc: note it in chat; run from scratch without seeded metrics.
- Partial results: write the report with available data; mark missing sections `no data`. Never pad or fabricate.
- Rollback: the only mutations are the report file and config.local.yaml. Delete the report file to discard a run; revert config.local.yaml to its prior state to undo settings. No external system is mutated.

## Output

- A 30-40 line markdown report at `docs/pulse-reports/YYYY-MM-DD_HH-MM.md` with four sections (Headlines, Usage, System performance, Followups).
- In chat: the Headlines section verbatim, the top Followup if action looks urgent, and the saved file path. Do not paste the full report into chat; the file is the artifact.
- On first run: a `pulse_*` config block written to `.odin/config.local.yaml`.
