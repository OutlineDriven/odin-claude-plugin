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

1. Identify the durable fact from the user's remember-this statement or settled fact. Bound scope to one self-contained fact; if several were supplied, capture the first and stop, or ask once for the single item to capture. Done when: one self-contained fact is identified from the user statement, and if several were supplied, the first is captured and the rest are stopped or deferred with one clarification ask.
2. Reject the fact if it is verbatim transcript content, conversation echo, or obvious from the current code (restates a function signature, file path, or visible state). Stop with rejected-content; do not append. Done when: the fact is confirmed not verbatim transcript, conversation echo, or code-obvious (function signature, file path, visible state), and if it is, the run stops with rejected-content and no append.
3. Redact secrets and PII from the fact text: replace credentials, API keys, paths under the user home, email addresses, and numeric identifiers with a redaction marker. If redaction would erase the fact's meaning, stop with rejected-content. Done when: secrets and PII are replaced with redaction markers in the fact text, and if redaction would erase the fact meaning, the run stops with rejected-content and no append.
4. Validate the redacted fact is non-empty, strict UTF-8, and bounded to one sentence or one short clause; reject paragraphs. Done when: the redacted fact is confirmed non-empty, strict UTF-8, and bounded to one sentence or one short clause, and paragraphs are rejected.
5. Build one JSONL object with fields time (RFC3339 UTC), project, fact (redacted), and tags (optional, omitted when none). Done when: one JSONL object is built with fields time (RFC3339 UTC), project, fact (redacted), and tags (optional, omitted when none), and every required field is present.
6. Append the line to the local append-only note store at the configured path; create the file if absent. Do not overwrite or edit prior lines. Done when: the JSONL line is appended to the store at the configured path, the file is created if absent, and no prior line is overwritten or edited.
7. Index the new line by project and tags so it is recallable by later search. Done when: the new line is indexed by project and tags, and a search by project returns the appended line.
8. Confirm recallability: read the store back and locate the appended line by its time and project. Done when: the store is read back and the appended line is located by its time and project, confirming recallability.

## Failure and recovery
- rejected-content: the fact is transcript, code-obvious, or redaction-erased; no append; return the rejection reason.
- schema-invalid: the built object fails strict UTF-8 JSONL or is missing a required field; no append; return the offending field.
- store-unavailable: the note store path is not writable or the disk is full; no append; return the path and error.
- Partial-result rule: the store is append-only; on any failure after a successful append, the appended line stands and the failure reason is returned.
- Rollback: the only reversible mutation is deleting the just-appended line when a post-append check (recallability or index) fails and the line is confirmed to be the last line; prior lines are never touched.
- Blocked/non-converged: if the fact cannot be reduced to one bounded self-contained item after one clarification, return blocked with the reason; do not widen scope or append partial content.

## Output
One indexed, recallable strict UTF-8 JSONL line with RFC3339 time, project, optional tags, and redacted fact, followed by its index key and recall confirmation; otherwise a `rejected-content`, `schema-invalid`, `store-unavailable`, or `blocked` classification with reason and no mutation.
