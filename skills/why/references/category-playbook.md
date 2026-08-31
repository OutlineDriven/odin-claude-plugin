# Evidence category playbook

Branch-specific source instructions for each of the seven evidence categories queried by `why`. These are complete source instructions, not pointers to external references. Apply inside each scout (procedure step 3).

## Source control

Inspect the relevant file history, blame/line provenance, commits, diffs, merge or pull-request discussion, tags, and nearby tests. Build a chronology from the first introduction through later reversions or fixes. Distinguish a commit message that states intent from code that merely demonstrates behavior; cite immutable commit, diff, or review links where available.

## Issue tracker

Search the scoped component, identifiers, symptoms, rejected alternatives, and decision window. Read the full issue and linked work rather than relying on titles. Extract explicit requirements, ownership, prioritization, acceptance criteria, duplicates, and close/reopen history; cite stable issue and comment links.

## Long-form docs

Search ADRs, RFCs, design docs, specifications, meeting notes, postmortems, and decision records. Capture status, author, date, alternatives, constraints, and whether the document was approved, superseded, or merely proposed. Cite a stable document or anchored section link and label retrospective explanations as hindsight.

## Real-time chat

Search the scoped terms and time window, then read enough thread context to distinguish a decision from brainstorming. Preserve timestamps, speakers or roles, explicit objections, reactions that materially indicate agreement, and links to artifacts. Cite stable message/thread permalinks; do not treat an unanswered suggestion as consensus.

## Infrastructure observability

Inspect read-only metrics, logs, traces, dashboards, deploy markers, capacity events, and alert history around the decision or incident. Record query/window, units, aggregation, baseline, and threshold. Use telemetry to establish operational conditions, not unstated human intent; cite stable snapshots or query/dashboard links when available.

## Error tracking

Inspect issue/event history, stack traces, affected releases, first/last seen, recurrence, environment, frequency, and links to fixes or regressions. Separate grouped-event evidence from root-cause claims and cite stable issue/event links without exposing sensitive payloads.

## Product analytics warehouse

Use read-only queries or saved analyses for the relevant event definition, population, segment, denominator, time window, experiment, funnel, or retention metric. Record the metric definition and query provenance, check whether instrumentation changed, and distinguish correlation from a product decision. Cite a stable saved query, notebook, dashboard, or result link when available.
