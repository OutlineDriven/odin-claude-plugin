---
name: promql-cli
description: 'Use when a user asks to execute or investigate PromQL or to debug latency, error, or saturation signals. Returns correct query output (table/csv/json/graph) or a debug diagnosis. Don''t use for tasks that require source or remote-system changes.'
---

# PromQL CLI

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to execute or investigate PromQL or to debug latency, error, or saturation signals. |
| Authority | Read-only — no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Evaluates PromQL queries through the promql CLI; reads metrics, writes nothing. |
| Done | Correct query output (table/csv/json/graph) or a debug diagnosis is returned. |

## Inputs

- **PromQL query** (required): the PromQL expression to evaluate.
- **Prometheus server URL** (required): the endpoint to query against.
- **Time range** (optional): start and end timestamps or duration for range queries.
- **Output format** (optional): table, csv, json, or graph; defaults to table.
- **Step interval** (optional): resolution for range queries.

## Procedure

1. Validate that the PromQL query is non-empty and syntactically plausible. Done when: the query is non-empty and syntactically plausible.
2. Confirm the Prometheus server URL is reachable; stop if connection fails. Done when: the server URL is confirmed reachable or the run stops.
3. Construct the promql CLI invocation with the query, server URL, and any optional time range, step, or format flags. Done when: the CLI invocation is constructed with all supplied parameters.
4. Execute the promql CLI read-only. Done when: the CLI has been executed.
5. Capture stdout and stderr. Done when: stdout and stderr are captured.
6. If stderr contains errors, classify the failure (see Failure and recovery). Done when: errors are classified or stderr is clean.
7. Return the output in the requested format. Done when: the output is returned in the requested format.

## Failure and recovery
- **Connection failure**: Prometheus server unreachable or DNS resolution fails. Report the URL and error; do not retry silently.
- **Query syntax error**: PromQL expression rejected by the server. Report the server error message verbatim; do not attempt to rewrite the query.
- **Empty result set**: query executed but returned no series. Report the empty result and suggest checking label selectors or time range.
- **Timeout**: query exceeded server-side timeout. Report the timeout and suggest narrowing the time range or adding label filters.
- **CLI not installed**: promql binary not found on PATH. Report the missing binary and suggest installation.
- No partial results are returned on failure. No files are written.

## Output
Return query results in the requested format (table, csv, json, or graph). On failure, return a diagnosis that names the failure class and includes the server or CLI error message.

## Provenance

Origin: samber/cc-skills, revision f9953962e135235137628ea92d06ea085688031f. License: MIT. Adapted for ODIN 2.0 literal format; source mechanisms preserved without third-party expression.
