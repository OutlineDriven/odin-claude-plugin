---
name: document-collaboration
description: 'Publishes, reads, comments on, and edits Proof documents via the Proof API or typed MCP tools. Not for local documentation files — use docs-writing; not for generating new docs — use document-generate.'
disable-model-invocation: true
---

# Document collaboration

## Contract

| Field | Bound contract |
|---|---|
| Trigger | `/document-collaboration [Proof link, publish request, or read/comment/suggest/edit request]` |
| Authority | Human-only. Runs only on an explicit `/document-collaboration` invocation. Before publishing, editing, or deleting, state the target (local file or doc slug) and the consequence of the operation. Never publish, mutate, or delete remote Proof state without that explicit ask. |
| Side effect | Reads, creates, comments on, suggests on, or edits Proof documents through the Proof API or typed MCP tools. Deletes only with owner authority and an explicit user ask. |
| Done | The operation is confirmed at its own level and the user receives the result plus a short summary. |

## Inputs

- A publish request needs one local markdown file path; a title is optional and may arrive together with the path. Ask which file only when the request is ambiguous.
- A read, comment, suggest, edit, pull, title, or delete request needs the Proof document URL `https://www.proofeditor.ai/d/<slug>?token=...`; the `?token=` value is the credential for edits and presence on docs the signed-in user does not own.
- A delete needs the `ownerSecret` captured at create time; it cannot be recovered after the doc is claimed.
- Optional: a caller-supplied identity pair (a `by` machine ID plus a display `name`) when a distinct sub-agent should own the doc.

## Procedure

1. Classify the request: publish a local file, read, review op (comment, reply, resolve, unresolve, suggest, accept, reject, modify suggestion), content edit, title change, pull to a local file, or delete. Stop anything outside this set. Done when: the request is classified into one named operation or stopped as out-of-set.
2. Resolve the target before any call. From a Proof URL take the slug and the `?token=` value and use that token as the `accessToken` (and as `shareToken` in MCP mode). For a publish, resolve the single local markdown file. Done when: the slug, accessToken, and (for publish) local file path are resolved.
3. Prefer typed `proof_*` MCP tools (`proof_share_markdown`, `proof_v3_document`, `proof_v3_edit`, `proof_presence`, `proof_document_title`, `proof_document_delete`, `proof_report_bug`) when the harness exposes them; otherwise use HTTP against `https://www.proofeditor.ai`. In MCP mode the server injects `by`, `X-Agent-Id`, and presence identity. Done when: the transport (MCP or HTTP) is selected.
4. Attribute every op with the fixed identity: `by: ai:odin` and header `X-Agent-Id: ai:odin`. Set presence once per doc session with `POST /api/agent/<slug>/presence` and `name: "ODIN"`. Apply a caller-supplied identity pair to both fields instead; never improvise a variant such as `ai:compound`. Done when: identity headers and presence are set.
5. Publish: read the local file in full and post its exact bytes:
   ```bash
   jq -n --arg title "$TITLE" --rawfile md "$SRC" --arg by "ai:odin" '{title:$title,markdown:$md,by:$by}' \
     | curl -sS -X POST https://www.proofeditor.ai/share/markdown \
       -H 'Content-Type: application/json' -H 'X-Agent-Id: ai:odin' -d @-
   ```
   Never hand-write or placeholder the body. From the response keep `slug`, `tokenUrl`, `accessToken`, and `ownerSecret`; hold `ownerSecret` in session shell vars only, never in repo-tracked files, commits, durable logs, or user-facing copy. Hand the user the `tokenUrl`, never a bare `/d/<slug>`: the editor token doubles as claim capability on ownerless docs. Publish only markdown; for an HTML unified plan return its local open path instead, and label a unified plan title by readiness when known (`Plan: <title> (requirements-only)` or `Plan: <title> (implementation-ready)`). The local file stays canonical; nothing syncs back to disk. After a publish handoff, surface the URL and return control. Done when: the `tokenUrl` is surfaced to the user and `ownerSecret` is held in session vars only.
6. Read the doc as the source of truth with `GET /api/agent/<slug>/v3/document` (`Authorization: Bearer <accessToken>`, `X-Agent-Id`). The response carries `revision`, `title`, `markdown`, `comments[]`, `suggestions[]`, and `mutationReady?`; read it before every edit. When `mutationReady` is `false`, `revision` may be `null`; omit `baseRevision` and re-read shortly. Done when: the full document state is read and `revision` is captured.
7. Mutate with `POST /api/agent/<slug>/v3/edit` and body `{by, baseRevision?, operations[]}`; take `baseRevision` from the last read as the optional conflict guard and set an `Idempotency-Key` header for important writes and retries. Targets are visible text in `markdown`, never raw markdown syntax or block refs. Choose the narrowest op: scoped `replace`/`insert`/`delete` for prose, `suggest` (`kind: insert|delete|replace`) for tracked changes, `set_document` only on an explicit whole-doc request or when nothing narrower expresses the change. At most 100 operations per request; `set_document` accepts at most 2 MiB of markdown. Done when: the mutation is sent with the narrowest op and an `Idempotency-Key`.
8. Perform review ops by id from the last read: `reply`, `resolve`, `unresolve` on comment ids; `accept`, `reject`, `modify_suggestion` on suggestion ids. v3 has no delete-comment op. A comment with `orphaned: true` stays readable and replyable, but its old quote is no longer a live anchor. Done when: each review op is performed by id from the last read.
9. Confirm every mutation at its own level. A settled `200` with `ok: true` confirms; verify the intended text, comment, or suggestion before chaining. A `202`/`PENDING`, or `ok: false` with `partial: true`, means the write may have committed; re-read `v3/document` before chaining or reporting, then retry only the failed op (a repeated `Idempotency-Key` replays safely). Done when: every mutation is confirmed at op level or re-read resolves the pending state.
10. Pull to a local file: fetch a fresh `v3/document` read and stream `.markdown` with `jq -jr` into a temp file, then `mv` it over the target path (atomic; trailing newlines survive). The pull overwrites the local file; confirm the path first when the pull is a side effect rather than the ask. Done when: the local file is atomically overwritten with the fresh markdown.
11. Change a title with `PUT /api/documents/<slug>/title`. Delete with `DELETE /api/documents/<slug>` and `Authorization: Bearer <ownerSecret>`; editor `accessToken` values cannot delete. Delete only when the user asks, or when finishing an explicitly ephemeral scratch doc; review docs linger after a publish handoff. Done when: the title is changed or the delete is confirmed with `ownerSecret` authority.
12. Hold the content boundary: never place secrets, credentials, API keys, private tokens, or sensitive personal data into a Proof doc without explicit user approval, and never silently replace a repo-tracked project doc with a Proof link. Done when: no secrets or sensitive data are placed without approval and no repo doc was silently replaced.

## Failure and recovery
- Unconfirmed write (`202`/`PENDING` or `partial: true`): treat the doc state as unknown until a fresh `v3/document` read resolves it; retry only the failed op with the same `Idempotency-Key`. Never report success without op-level confirmation.
- `TARGET_AMBIGUOUS`: nothing changed. Disambiguate with `occurrence` (`"first"`, `"last"`, or a 0-based index) or `before`/`after` from `error.candidates`; never assume silent first-match and never blind-retry a comment.
- `retryable: false`: fix the request; do not retry. `retryable: true` with `error.current`: re-resolve targets against `current`, then retry once.
- `CONFLICT`: retryable on a structural suggestion means a connected editor is on an older suggestion reader; retry after it reconnects. Non-retryable means the op crosses frontmatter, raw HTML, or unknown content; use a whole-block op or leave the passage unchanged.
- `accept` still failing with `SUGGESTION_OWNERSHIP_MISSING` after a fresh read: the suggestion is wedged. `reject` it (always allowed) and recreate instead of retrying `accept`.
- Delete authority: `403` with `code: "DOCUMENT_DELETE_FORBIDDEN"` and `reason: "CREDENTIAL_NOT_OWNER"`, or `401` while presenting the creation `ownerSecret`, means the doc was claimed and the secret revoked. Stop using the secret; deletion then needs the owner's Every session, so ask the owner. `reason: "DOCUMENT_HAS_NO_OWNER"` is the opposite: the doc is unclaimed, only the original `ownerSecret` can delete it, and the owner's session cannot.
- Privacy: emptying the markdown, including `set_document` to blank, does not scrub comment marks; quotes and commentary stay readable to anyone with the share credential. A content wipe is not a privacy cleanup; delete the document per the delete-authority rules instead.
- `AUTH` or `NOT_FOUND`: the token or slug is wrong. Re-check both against the Proof URL and stop rather than retry. `BUSY`: brief backoff, then retry. `TOO_LARGE`: split the operations across requests within the 100-op and 2 MiB limits.
- Broken loop: a mutation still failing after a fresh read and one safe retry is a bug. `POST https://www.proofeditor.ai/api/bridge/report_bug` with the failing request ID, slug, and raw response (ask before including the user's name or email), then stop; do not loop.

## Output
The confirmed operation result — `tokenUrl` for publish, content for read/pull, `revision` for edit/review/title, or `shareState: "DELETED"` for delete — plus a short summary.

## Provenance

Adapted from the `ce-proof` skill in Every's compound-engineering plugin (https://github.com/EveryInc/compound-engineering-plugin), pinned at revision `a1f601f17137f648be439965f8fdd9123303de5d`, licensed MIT (LICENSE, Copyright (c) 2025 Every). Mechanisms are extracted and rewritten in ODIN style rather than copied verbatim; attribution is preserved in this section and in the root provenance ledger.
