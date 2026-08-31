---
name: history-health
description: 'Use when a user asks to audit what recall fed agents; returns a bounded event table of kind, time, session count, bytes, and empty-result flag, or a null object when absent, and refuses digest text replay. Don''t use for tasks that require source or remote-system changes.'
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

- `deja` CLI installed and reachable via PATH. Required; absent tool yields null result.
- `harness` filter (optional). A harness name string such as `"claude"` or `"cursor"`. When omitted, events from all harnesses are included.
- `limit` (optional). Maximum events to return, an integer ≥ 1. Defaults to all events in the usage log.

## Procedure

1. Verify `deja` is in PATH. Run `command -v deja`. If absent, return `null`.

2. Run `deja log --json` with the harness filter and limit if supplied.

3. Capture stdout and exit code.

4. If exit code is non-zero, return `{ "error": "deja log failed", "hint": "install or rebuild deja" }`.

5. If stdout is the exact string `null\n`, return `null`.

6. Parse stdout as JSON. If parse fails, return `{ "error": "malformed JSON from deja log" }`.

7. The parsed value is a JSON array of event objects or `null`.

8. If the parsed value is `null`, return `null`.

9. If the parsed value is an empty array, return `null`.

10. For each event object, extract the following fields into an audit row:
    - `t` → `time` as the RFC3339 string from the source.
    - `kind` → `kind`.
    - `bytes` → `bytes` as the integer from the source.
    - `sessions` (absent → 0) → `sessions`.
    - `empty` (absent → false) → `empty`.

11. Build and return an array of row objects with keys `time`, `kind`, `bytes`, `sessions`, `empty`.

12. Digest text fields (`digest`, `policy`, `into`, `terms`, `ids`) are never read, never included in output, and never surfaced to the model.

## Failure and recovery
| Failure class | Condition | Result |
|---|---|---|
| `tool-missing` | `deja` not in PATH | `null` |
| `command-failed` | `deja log --json` exits non-zero | `{ "error": "deja log failed" }` |
| `malformed-response` | stdout does not parse as JSON | `{ "error": "malformed JSON from deja log" }` |

Partial-result rule: if `deja log` produces a partial list (due to a cap or clock skew), return exactly what was returned. Do not extrapolate, impute, or estimate missing events. Non-mutation rule: no file, directory, index, or state is written or altered.

## Output
An array of event rows sorted newest-first:

```json
[
  {
    "time": "2026-08-24T12:00:00Z",
    "kind": "recall",
    "bytes": 900,
    "sessions": 2,
    "empty": false
  }
]
```

Or the null object when the usage log is absent, empty, or `deja` is not installed: `null`.

No digest text, policy, terms, session IDs, or injection target fields appear in output.

## Provenance

Origin: https://github.com/vshulcz/deja-vu, revision `6f766fd4716edcaf24662c794368e420e5058f47`. License: MIT, Copyright (c) 2026 Vladislav Shulcz. Adaptation: `cmd/deja/log.go`, `internal/usage/usage.go`, and `docs/json-output.md` as the source event schema and output contract. Clean-room adaptation per MIT reuse constraints. Source mechanism: usage log event audit from `deja log --json` with digest replay refused. Module: odin-research. Authority: read-only. Invocation: model+human per roster.
