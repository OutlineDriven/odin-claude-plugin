---
name: promql-cli
description: 'Use when asked to execute or investigate a PromQL expression against a Prometheus server. Read-only HTTP queries only. No source or remote-system changes.'
---

# PromQL CLI

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to execute or investigate PromQL, or to debug latency, error, or saturation signals against a Prometheus server. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. HTTP GET queries to the Prometheus HTTP API only. |
| Side effect | Evaluates PromQL queries through the Prometheus HTTP API. Reads metrics, writes nothing. |
| Done | Query results in the requested format, or a classified failure diagnosis, are returned to the user. |

## Inputs

- PromQL query (required): the PromQL expression to evaluate.
- Prometheus server URL (required): the base endpoint to query against, e.g. `http://prometheus:9090`.
- Time range (optional): start and end timestamps or duration for range queries. Instant queries omit this.
- Output format (optional): table, csv, json, or graph. Defaults to table.
- Step interval (optional): resolution for range queries, e.g. `15s`, `1m`.

## Procedure

1. Validate that the PromQL query is non-empty and the server URL is well-formed (scheme, host, and port present). If either is invalid, return a validation failure naming the missing or malformed field. Done when: the query and URL pass validation.
2. Construct the HTTP API request. For an instant query, use `GET <server_url>/api/v1/query?query=<urlencoded_query>`, appending `&time=<unix_time>` only when a time value is supplied. For a range query, first choose `step` as the supplied step interval or `15s` when one is not supplied; the step interval is required for range queries. Then use `GET <server_url>/api/v1/query_range?query=<urlencoded_query>&start=<unix_start>&end=<unix_end>&step=<step>`. Set the `Accept` header to `application/json`. Do not send credentials unless the user supplies them explicitly. Done when: the HTTP request is constructed with all supplied parameters.
3. Execute the request using the host's HTTP client. Apply a 30-second timeout. If the server requires authentication, use the credentials the user supplied; do not invent or store credentials. Done when: the HTTP response is received or the request fails.
4. Classify the result. If the HTTP status is 200 and the response body has `status: "success"`, extract the `data.result` array and render it in the requested format. If the HTTP status is 200 and `status: "error"`, extract `errorType` and `error` from the response body. If the HTTP status is non-200, classify by status code. If the request timed out or the connection failed, classify accordingly. Done when: the result is classified as success or a named failure class.

## Failure and recovery

On connection failure, the server is unreachable or DNS resolution fails; report the URL and the connection error, and do not retry silently. On a query syntax error, the Prometheus API returns `status: "error"` with `errorType: "bad_data"`; report the `error` field verbatim and do not attempt to rewrite the query. On an empty result set, the query executed successfully but returned no series; report the empty result and suggest checking label selectors or the time range. On timeout, the request exceeded the 30-second client timeout or the server returned a timeout error; report the timeout and suggest narrowing the time range or adding label filters. On authentication failure, the server returned 401 or 403; report that credentials are required or invalid, and do not retry with different credentials. On a server error, the server returned 5xx; report the status code and response body, and suggest retrying after the server recovers.

No partial results are returned on failure. No files are written.

## Output

Query results in the requested format (table, csv, json, or graph). On failure, a diagnosis that names the failure class and includes the server error message or connection error. The output is chat-only; no file or remote state is modified.
