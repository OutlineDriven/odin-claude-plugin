---
name: history-recall
description: 'Use when a user requests the reasoning behind one matched session by query or handle. Not for peer transfer: use history-sync. Not for store registration: use history-source-registry.'
---

# History session brief

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User explicitly requests the reasoning behind one matched session by query or opaque handle. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Reads the local session index and transcripts only. |
| Side effect | None. |
| Done | One capped typed record reports problem category, decisions, outcome, touched-file handles, lifecycle, spawn edges, and message-count buckets plus an opaque handle; no prose digest or raw text. |

## Inputs

- `query` (required unless `handle` is supplied): an exact token, error string, function name, flag, or file path: matches strongest; otherwise the question in the user's own words, ranked as a fallback when nothing matches exactly.
- `handle` (optional): an opaque session handle returned by a prior brief; when supplied, open that session directly instead of searching.
- `harness` (optional): filter the search to one harness.
- `byte_budget` (required): the maximum output size in bytes. Defaults to 4096 when the caller does not supply one. The record is trimmed to fit; the cap is paid out of the budget, not added to it.
- `trust_policy` (required): path to the trust policy file that governs which imported sessions are withheld or demoted. Defaults to `$HISTORY_DIR/trust-policy.json` when present.
- `handle_registry` (required): path to the handle registry that maps opaque handles to session files. Defaults to `$HISTORY_DIR/handle-registry.jsonl` when present.

## Procedure

1. Resolve the target session. If `handle` is supplied, open the session it names directly. Otherwise search the local index with `query`, trying exact tokens first and falling back to ranked matches when nothing matches exactly; take the single best-matching session.
2. Upgrade the matched hit to the whole session. A hit carries only the messages that matched the query, so the decision, usually worded nothing like the query: is not among them. Read the whole session before extracting any field.
3. Apply the trust policy. Keep withheld imported sessions out of the record and do not leak a session the policy excludes. Attach lifecycle state to imported promoted notes and demote rejected ones, so a session a reader rejected does not surface as authoritative.
4. Extract the typed fields from the whole session: problem category (the user's opening problem statement, noise-filtered), decisions (assistant conclusions worded as choices), outcome (whether the session reports backing out or finishing), touched-file handles (the few files the session worked on most), lifecycle (accepted, rejected, superseded, or stale for imported notes), spawn edges (parent session, agent name, and kind where the harness records the edge, never inferred), and message-count buckets (user and assistant turn counts).
5. Cap the record to the byte budget. When the record is trimmed, set a `capped` flag and keep the opaque handle so the caller can re-open the whole session; the cap is paid out of the budget, not added to it. Never emit raw transcript text or a prose digest.
6. Return one typed record plus the opaque handle.

## Failure and recovery
- No match: return an empty record with the handle absent and a `tier` of `none` when no query matched any session, or `relevance` when matches existed but were filtered by the trust policy; do not fabricate a session.
- Index unreadable or rebuild required: return a blocked result naming the index state; do not mutate the index.
- Policy withheld every match: return an empty record with a `policy_withheld` count; do not bypass the policy.
- Partial result: the record is atomic; a field that cannot be extracted is omitted, never guessed.
- Non-mutation: no file, index, or transcript is written; a failed run leaves the store unchanged.

## Output
One typed record: `handle`, `harness`, `project`, `tier`, `capped`, `problem_category`, `decisions`, `outcome`, `touched_files`, `lifecycle`, `spawn_edges`, `message_counts`. No prose digest and no raw text. The opaque handle re-opens the whole session on a later call.
