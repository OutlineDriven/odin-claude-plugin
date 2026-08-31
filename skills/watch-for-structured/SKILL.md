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

1. Validate the watch surface is reachable. Done when: surface is confirmed reachable, or the step has stopped and reported the surface as inaccessible.
2. Read the current state of the watch surface. Done when: current state is read.
3. Compare the observed state against the severity rules. Classify the observation into exactly one severity level. Done when: observation is classified into one severity level, or the step has stopped on ambiguous classification.
4. If the severity level has no matching entry in the routing table, stop and report the classification with a missing-route flag. Done when: routing match is confirmed or missing-route is reported.
5. Look up the routing targets for the classified severity level. Done when: routing targets are identified.
6. If the on-call policy requires paging for this severity level: confirm the paging API endpoint is supplied and reachable; construct the page payload with severity, watch surface identity, observation summary, and routing targets; send the page to the on-call API; record the paging confirmation or failure. Done when: page is sent and confirmation or failure is recorded, or paging is not required for this severity.
7. Assemble the structured report containing: watch surface, observed state, classified severity, routing targets, on-call disposition (paged, escalated, acknowledged, or not-applicable), and timestamps. Done when: structured report is assembled.
8. Return the structured report. Done when: report is returned.

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
A structured report containing watch surface identity, observed state snapshot, classified severity level, routing targets, on-call disposition (paged/escalated/acknowledged/not-applicable/page-failed/page-rejected), observation timestamp, and paging confirmation timestamp when applicable.
