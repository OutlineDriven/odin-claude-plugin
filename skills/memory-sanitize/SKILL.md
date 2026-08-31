---
name: memory-sanitize
description: 'Use when the user asks to sanitize memory for sharing, redact PII, or scan memory for credentials. Create redacted copies, show their diff, and report any credential-bearing source without changing originals. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Memory sanitize

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to sanitize memory for sharing, redact PII, or scan memory for credentials. |
| Authority | Read the selected memory directory and write only a new local `/tmp/memory-sanitized-<timestamp>` directory; never modify originals, credentials, version control, or remote state. |
| Side effect | Create redacted copies of top-level Markdown memory files under the new temporary directory. The rollback path is deletion of that generated directory. |
| Done | Return the sanitizer report and show the diff from every original to its copy; if any Tier-1 credential remains present in a copy, stop with a critical warning and do not approve sharing. |

## Inputs

- Required: the memory directory to sanitize, supplied explicitly or resolved from the current project by `scripts/resolve-paths.sh memory_dir`.
- Optional: `MEMORY_DIR` may override resolution after path validation.
- Process only top-level `*.md` files. Do not read session histories or nested Markdown files.
- Use a fresh destination named `/tmp/memory-sanitized-<timestamp>`; it must not already exist.

## Procedure

1. Resolve the source directory and reject a missing directory, control bytes, or shell metacharacters accepted by neither the resolver nor this contract. Confirm the destination is a fresh path under `/tmp` before any write.
2. Run `scripts/sanitize-memory.sh <memory-dir> <destination>` while preserving its JSON stdout and exit status. The sanitizer detects Tier-1 OpenAI, GitHub, AWS, Slack, bearer-token, and ECR credential patterns without replacing them; it replaces Tier-2 home paths, email addresses, session IDs, and dates older than 30 days in the copies.
3. Treat exit `0` as a completed scan, exit `2` as a credential stop, and any other nonzero status as failure. Do not discard the JSON report or generated copies on exit `2`, because they are required to identify credential sources and show the unsafe diff.
4. Compare each reported source with its reported destination and show the complete diff. Verify that the report accounts for every processed top-level Markdown file and states redaction counts, credential-hit classes, credential-bearing source files, and total redactions.
5. If any credential hit is reported or visible unredacted in a copy, issue a critical warning, name the affected source and copy, abort approval for sharing, and require manual remediation of the original before a new run. Pattern matching is not proof that unrecognized or obfuscated sensitive data is absent.
6. Otherwise, report the generated directory and ask the user to review the displayed diff before sharing. Leave originals unchanged; the generated directory is a disposable review artifact, not a replacement memory store.

## Failure and recovery
- **Invalid source or destination:** stop before sanitization. Report the rejected path and reason; choose a new timestamp only for a destination collision.
- **Nested Markdown:** report that nested files were skipped and classify the result as partial rather than claiming the directory was fully sanitized.
- **Credential stop (exit 2):** retain the copies and report solely for review, show the diff, emit the critical warning, and return `blocked: credential detected`; never approve or publish the copies.
- **Sanitizer or diff failure:** return `blocked: sanitization or proof incomplete`, including the command failure and any generated paths. Do not infer missing results or claim the done predicate.
- Originals require no rollback because they are never written. To roll back local output, delete only the named generated `/tmp/memory-sanitized-<timestamp>` directory after preserving any report the user needs.

## Output
Return the destination path, the sanitizer JSON report, the original-to-copy diff for every processed file, warnings for skipped nested files, and one terminal classification: `sanitized for human review`, `blocked: credential detected`, or `blocked: sanitization or proof incomplete`.

## Provenance

Project-owned adaptation of `skills/memory-sanitize/SKILL.md` from the `odin-current` source. No source revision or license identifier was supplied. This version preserves the tiered regex redaction, credential-detection exit status, copy-only boundary, diff review, and credential-abort mechanism while rewriting the procedure for the ODIN 2.0 contract.
