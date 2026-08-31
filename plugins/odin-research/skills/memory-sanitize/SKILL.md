---
name: memory-sanitize
description: 'Use when the user asks to sanitize memory for sharing, redact PII, or scan memory for credentials. Scans for Tier-1 credentials first and stops before generating any copy if found; otherwise produces redacted copies with a diff for human review. Not for auditing memory — use memory-clean.'
---

# Memory sanitize

Sanitize a memory directory so it is safe to share externally.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to sanitize memory for sharing, redact PII, or scan memory for credentials. |
| Authority | Read-only on the source directory; write only to a fresh `/tmp/memory-sanitized-<timestamp>` directory. Never modify originals. |
| Side effect | Create redacted copies of top-level Markdown memory files under a new temporary directory. Rollback is deletion of that directory. |
| Done | A temporary directory containing redacted copies, a JSON report of redactions, and a user-facing diff review. If any Tier-1 credential is found in a source file, stop before generating copies and report the affected files. |

## Inputs

- **Memory directory** (required): the directory to sanitize, supplied explicitly or resolved from the current project by `scripts/resolve-paths.sh memory_dir`.
- Optional: `MEMORY_DIR` may override resolution after path validation.
- Process only top-level `*.md` files. Do not read session histories or nested Markdown files.
- Use a fresh destination named `/tmp/memory-sanitized-<timestamp>`; it must not already exist.

## Procedure

1. **Resolve source and validate destination freshness.** Resolve the source directory and reject a missing directory, control bytes, or shell metacharacters. Confirm the destination is a fresh path under `/tmp` before any write. Done when: the source resolves and the destination is confirmed fresh.
2. **Scan sources for Tier-1 credentials.** Run `scripts/sanitize-memory.sh --scan-only <memory-dir>` to check every top-level Markdown file for Tier-1 credential patterns (OpenAI, GitHub, AWS, Slack, bearer-token, ECR). If any Tier-1 credential is found, stop before generating any copies and report the affected files. The user must remediate the originals before a new run. Done when: the scan completes with zero Tier-1 hits, or the run stops with affected files reported.
3. **Generate redacted copies.** Run `scripts/sanitize-memory.sh <memory-dir> <destination>` to produce redacted copies of all top-level Markdown files. Tier-2 redactions (home paths, email addresses, session IDs, dates older than 30 days) are applied in the copies. Done when: the JSON report and redacted copies are generated.
4. **Compute and display per-file diffs.** Compare each reported source with its reported destination and show the complete diff. Verify that the report accounts for every processed top-level Markdown file and states redaction counts. Done when: every processed file has a complete diff and the report accounts for all files.
5. **Classify output as safe for human review.** Report the generated directory and ask the user to review the displayed diff before sharing. Leave originals unchanged; the generated directory is a disposable review artifact, not a replacement memory store. Done when: the generated directory is reported and the user is asked to review the diff.

## Failure and recovery

- Invalid source or destination: stop before sanitization. Report the rejected path and reason; choose a new timestamp only for a destination collision.
- Tier-1 credential detected in source: stop before generating copies. Report the affected source files and credential classes. Require manual remediation of the originals before a new run. Never approve or publish copies when a credential is present in the source.
- Sanitizer execution failure: return `blocked: sanitization or proof incomplete`, including the command failure and any generated paths. Do not infer missing results or claim done.
- Nested Markdown: report that nested files were skipped and classify the result as partial rather than claiming the directory was fully sanitized.
- Originals require no rollback because they are never written. To roll back local output, delete only the named generated `/tmp/memory-sanitized-<timestamp>` directory after preserving any report the user needs.

## Output

Return the destination path, the sanitizer JSON report, the original-to-copy diff for every processed file, warnings for skipped nested files, and one terminal classification: `sanitized for human review`, `blocked: credential detected`, or `blocked: sanitization or proof incomplete`.
