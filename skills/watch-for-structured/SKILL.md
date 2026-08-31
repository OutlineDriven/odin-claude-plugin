---
name: watch-for-structured
description: 'Use when the user wants a watcher that adds severity, routing, and on-call policy to a watch surface. Produces a structured report and pages an on-call API when triggered. Don''t use for read-only anomaly watching without paging (use watch-for) or non-alerting observation.'
disable-model-invocation: true
---

# Structured watch

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants a watcher that adds severity, routing, and on-call policy to a watch surface. |
| Authority | Human-only. Requires explicit human invocation. Preview target and consequence before any paging, credential use, or remote alerting API call. |
| Side effect | On-call/alerting API and routing destinations when the watcher decides to page. |
| Done | A structured report with severity, routing, and on-call disposition is produced and paging is confirmed when triggered. |

## Inputs

1. **Watch surface** (required): the resource, endpoint, log stream, or metric to observe. Must be a reachable, named target.
2. **Severity rules** (required): classification criteria that map observed anomalies to severity levels (e.g., critical, warning, info). Each level must name the threshold or pattern that triggers it.
3. **Routing table** (required): mapping from each severity level to one or more destinations (channel, team, person, or endpoint).
4. **On-call policy** (required): escalation chain, acknowledgement timeout, and paging method for each severity level.
5. **Paging API endpoint** (optional): remote alerting or on-call API base URL. Required when the on-call policy specifies external paging.
6. **Escalation timeout** (optional): minutes before unacknowledged alerts escalate. Defaults to the on-call policy's stated value.

## Procedure

1. Validate the watch surface is reachable. If unreachable, stop and report the surface as inaccessible.
2. Read the current state of the watch surface.
3. Compare the observed state against the severity rules. Classify the observation into exactly one severity level.
4. If the severity level has no matching entry in the routing table, stop and report the classification with a missing-route flag.
5. Look up the routing targets for the classified severity level.
6. If the on-call policy requires paging for this severity level:
   a. Confirm the paging API endpoint is supplied and reachable.
   b. Construct the page payload with severity, watch surface identity, observation summary, and routing targets.
   c. Send the page to the on-call API.
   d. Record the paging confirmation or failure.
7. Assemble the structured report containing: watch surface, observed state, classified severity, routing targets, on-call disposition (paged, escalated, acknowledged, or not-applicable), and timestamps.
8. Return the structured report.

## Failure and recovery
| Failure class | Behavior |
|---|---|
| Watch surface unreachable | Report surface identity and error. No page sent. Severity unclassified. |
| Severity classification ambiguous | Report the observation with all candidate severity levels flagged. No page sent. Require human resolution. |
| Routing target missing | Report classification with missing-route flag. No page sent. |
| Paging API unreachable | Report classification and routing. Set on-call disposition to page-failed. Do not retry automatically. |
| Paging API rejects payload | Report the API error. Set on-call disposition to page-rejected. Do not retry automatically. |

Partial results are always returned. No failure class suppresses the structured report. No automatic retry or scope widening occurs.

## Output
A structured report containing:
- Watch surface identity
- Observed state snapshot
- Classified severity level
- Routing targets
- On-call disposition (paged, escalated, acknowledged, not-applicable, page-failed, or page-rejected)
- Observation timestamp
- Paging confirmation timestamp (when applicable)

## Provenance

- Origin: curated:curated-ideas:curated-032 from project-owned:user-curated-skill-ideas
- Revision: null (no pinned source revision)
- License: project-owned (clean-room adaptation of the watch-for pattern with structured severity, routing, and on-call paging)
- Adaptation: extends the watch-for observation pattern with severity classification, routing table lookup, and on-call paging. Distinct from watch-for because it may page an on-call API. Authority is human-only because paging is an external, irreversible action.
