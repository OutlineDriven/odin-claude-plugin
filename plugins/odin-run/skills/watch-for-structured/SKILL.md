---
name: watch-for-structured
description: 'Use when the user wants to classify a surface state and page an on-call API when triggered. Not for read-only anomaly watching without paging: use watch-for.'
---

# Single-snapshot alert

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to classify a surface state and page an on-call API when triggered. |
| Authority | Remote: sends pages through the alerting API when a snapshot classifies as triggering; requires explicit human invocation, and previews the target and consequence before any paging or credential use. Surface observation itself is read-only. |
| Side effect | On-call or alerting API and routing destinations when the classification decides to page. |
| Done | A structured report with severity, routing, and on-call disposition is produced and paging is confirmed when triggered. |

## Inputs

1. **Watch surface state** (required): the resource, endpoint, log stream, or metric to observe. Must be a reachable, named target.
2. **Severity rules** (required): classification criteria that map observed anomalies to severity levels. Each level must name the threshold or pattern that triggers it.
3. **Routing table** (required): mapping from each severity level to one or more destinations (channel, team, person, or endpoint).
4. **On-call policy** (required): escalation chain, acknowledgement timeout, and paging method for each severity level.
5. **Paging API endpoint** (required): remote alerting or on-call API base URL.

## Procedure

1. Read the current state of the watch surface. Done when: the current state is read, or the surface is reported as unreachable.
2. Compare the observed state against the severity rules. Classify the observation into exactly one severity level. Done when: the observation is classified into one severity level, or the classification is reported as ambiguous.
3. Look up the routing targets for the classified severity level. If no matching entry exists in the routing table, stop and report the classification with a missing-route flag. Done when: routing targets are identified or missing-route is reported.
4. If the on-call policy requires paging for this severity level: confirm the paging API endpoint is reachable; construct the page payload with severity, watch surface identity, observation summary, and routing targets; send the page to the paging API; record the paging confirmation or failure. Done when: the page is sent and confirmation or failure is recorded, or paging is not required for this severity.
5. Assemble and return the structured report containing: watch surface, observed state, classified severity, routing targets, on-call disposition (paged, escalated, acknowledged, or not-applicable), and timestamps. Done when: the structured report is returned.

## Failure and recovery
| Failure class | Behavior |
|---|---|
| Surface unreachable | Report surface identity and error. No page sent. Severity unclassified. |
| Severity classification ambiguous | Report the observation with all candidate severity levels flagged. No page sent. Require human resolution. |
| Routing target missing | Report classification with missing-route flag. No page sent. |
| Paging API unreachable | Report classification and routing. Set on-call disposition to page-failed. Do not retry automatically. |
| Paging API rejects payload | Report the API error. Set on-call disposition to page-rejected. Do not retry automatically. |

Partial results are always returned. No failure class suppresses the structured report. No automatic retry or scope widening occurs.

## Output
A structured report containing watch surface identity, observed state snapshot, classified severity level, routing targets, on-call disposition (paged/escalated/acknowledged/not-applicable/page-failed/page-rejected), observation timestamp, and paging confirmation timestamp when applicable.
