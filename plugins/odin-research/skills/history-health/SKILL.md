---
name: history-health
description: 'Use when a user asks to audit what recall fed agents. Returns a bounded event table of kind, time, session count, bytes, and empty-result flag, or a null object when absent, and refuses digest text replay. Returns an explicit error when the CLI is missing rather than conflating it with an empty log. Not for tasks that require source or remote-system changes.'
---

# History usage audit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User explicitly audits what recall fed agents. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | None. |
| Done | A bounded event table reports kind, time, session count, bytes, and empty-result flag, or a null object when absent; model-facing digest replay is refused. |

## Inputs

- `deja` CLI installed and reachable via PATH. Required; absent tool yields an explicit error object.
- `harness` filter (optional). Passed as `--harness <name>` to the CLI. A harness name string such as `"claude"` or `"cursor"`. When omitted, events from all harnesses are included.
- `limit` (optional). Passed as `--limit <n>` to the CLI. Maximum events to return, an integer >= 1. Defaults to 50 when omitted.

## Procedure

1. Verify `deja` is in PATH. Run `command -v deja`. If absent, return `{ "error": "deja CLI not found in PATH", "hint": "install or rebuild deja" }`. Do not conflate a missing CLI with an empty log. Done when: the CLI is confirmed present or the error object is returned.

2. Run `deja log --json --limit 50` with the harness filter if supplied: `deja log --json --harness <name> --limit 50`. When the user supplies a custom limit, use that value instead of 50. Done when: the command is executed.

3. Capture stdout and exit code. Done when: stdout and exit code are captured.

4. If exit code is non-zero, return `{ "error": "deja log failed", "hint": "install or rebuild deja" }`. Done when: the error is returned.

5. If stdout is the exact string `null\n`, return `null`. Done when: null is returned.

6. Parse stdout as JSON. If parse fails, return `{ "error": "malformed JSON from deja log" }`. Done when: the JSON is parsed or the error is returned.

7. The parsed value is a JSON array of event objects or `null`. Done when: the value type is determined.

8. If the parsed value is `null`, return `null`. Done when: null is returned.

9. If the parsed value is an empty array, return `null`. Done when: null is returned.

10. For each event object, extract the following fields into an audit row:
    - `t` -> `time` as the RFC3339 string from the source.
    - `kind` -> `kind`.
    - `bytes` -> `bytes` as the integer from the source.
    - `sessions` (absent -> 0) -> `sessions`.
    - `empty` (absent -> false) -> `empty`.

11. Build an array of row objects with keys `time`, `kind`, `bytes`, `sessions`, `empty`.

12. Sort the array by `time` descending (newest first) before returning. Done when: rows are sorted by time descending.

13. Digest text fields (`digest`, `policy`, `into`, `terms`, `ids`) are never read, never included in output, and never surfaced to the model. Done when: digest text exclusion is confirmed.

## Failure and recovery

| Failure class | Condition | Result |
|---|---|---|
| `tool-missing` | `deja` not in PATH | `{ "error": "deja CLI not found in PATH", "hint": "install or rebuild deja" }` |
| `command-failed` | `deja log --json` exits non-zero | `{ "error": "deja log failed" }` |
| `malformed-response` | stdout does not parse as JSON | `{ "error": "malformed JSON from deja log" }` |

Partial-result rule: if `deja log` produces a partial list (due to a cap or clock skew), return exactly what was returned. Do not extrapolate, impute, or estimate missing events. Non-mutation rule: no file, directory, index, or state is written or altered.

## Output

Newest-first event rows sorted by `time` descending, with keys `time`, `kind`, `bytes`, `sessions`, and `empty`; return `null` when the log is absent or empty; return an explicit error object when `deja` is unavailable. Never include digest text, policy, terms, session IDs, or injection targets.
