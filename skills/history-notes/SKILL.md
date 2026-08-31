---
name: history-notes
description: 'Use when the user says remember this or settles one durable fact, append one bounded redacted note as strict UTF-8 JSONL with RFC3339 time and project to the local append-only store. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# History note capture

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says remember this or settles one durable fact. |
| Authority | Reversible local write to the named append-only note store only; rollback is to delete the just-appended line. |
| Side effect | Appends one schema-validated, redacted note to the local JSONL store; no other file, VCS, credential, or remote mutation. |
| Done | One bounded self-contained fact is strict UTF-8 JSONL with RFC3339 time, project, and optional tags; it is redacted, indexed, and recallable; transcript and code-obvious content is rejected. |

## Inputs

- Required: the durable fact text the user supplied, and the project identifier.
- Optional: tags.
- The local append-only note store path.

## Procedure

1. Identify the durable fact from the user's remember-this statement or settled fact. Bound scope to one self-contained fact; if several were supplied, capture the first and stop, or ask once for the single item to capture.
2. Reject the fact if it is verbatim transcript content, conversation echo, or obvious from the current code (restates a function signature, file path, or visible state). Stop with rejected-content; do not append.
3. Redact secrets and PII from the fact text: replace credentials, API keys, paths under the user home, email addresses, and numeric identifiers with a redaction marker. If redaction would erase the fact's meaning, stop with rejected-content.
4. Validate the redacted fact is non-empty, strict UTF-8, and bounded to one sentence or one short clause; reject paragraphs.
5. Build one JSONL object with fields time (RFC3339 UTC), project, fact (redacted), and tags (optional, omitted when none).
6. Append the line to the local append-only note store at the configured path; create the file if absent. Do not overwrite or edit prior lines.
7. Index the new line by project and tags so it is recallable by later search.
8. Confirm recallability: read the store back and locate the appended line by its time and project.

## Failure and recovery
- rejected-content: the fact is transcript, code-obvious, or redaction-erased; no append; return the rejection reason.
- schema-invalid: the built object fails strict UTF-8 JSONL or is missing a required field; no append; return the offending field.
- store-unavailable: the note store path is not writable or the disk is full; no append; return the path and error.
- Partial-result rule: the store is append-only; on any failure after a successful append, the appended line stands and the failure reason is returned.
- Rollback: the only reversible mutation is deleting the just-appended line when a post-append check (recallability or index) fails and the line is confirmed to be the last line; prior lines are never touched.
- Blocked/non-converged: if the fact cannot be reduced to one bounded self-contained item after one clarification, return blocked with the reason; do not widen scope or append partial content.

## Output
- One appended strict UTF-8 JSONL line in the local note store, with RFC3339 time, project, optional tags, and a redacted fact, indexed and recallable.
- A terminal report: the appended line, its index key, and a recall confirmation; or a rejected-content, schema-invalid, store-unavailable, or blocked classification with reason and no mutation.

## Provenance

- Origin: https://github.com/vshulcz/deja-vu (cmd/deja/main.go runRemember, internal/sources/notes.go, cmd/deja/mcp.go remember tool, docs/ARCHITECTURE.md Notes source).
- Pinned revision: 6f766fd4716edcaf24662c794368e420e5058f47.
- License: MIT (LICENSE); Copyright (c) 2026 Vladislav Shulcz. Mechanisms rewritten in ODIN style; no third-party expression copied.
- Adaptation: append-only local note capture preserved with redaction and transcript/code-obvious rejection rules; routed to odin-research; model+human invocation.
