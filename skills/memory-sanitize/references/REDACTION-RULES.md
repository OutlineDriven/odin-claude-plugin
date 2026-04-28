# Redaction Rules

Reference document consumed by the `memory-sanitize` SKILL.md workflow. It is **not** scanned by `sanitize-memory.sh`. The script scans the **user's** memory directory (the path resolved by `resolve-paths.sh memory_dir`, typically `~/.claude/projects/<encoded>/memory/*.md`) — never the skill's own `references/` or `scripts/` directories.

Pattern-based; not a formal DLP tool. Review the diff before sharing. Novel token formats, obfuscated secrets, and context-embedded credentials are outside scope.

---

## Tier 1 — Critical (block sharing if present in source original)

| Name | Description | Replacement |
|------|-------------|-------------|
| OpenAI/Anthropic key | Starts with `sk-` followed by 20+ alphanumeric chars | `<OPENAI-KEY>` |
| GitHub PAT | Starts with `ghp_` followed by 36+ alphanumeric chars | `<GITHUB-PAT>` |
| AWS Access Key ID | Starts with `AKIA` followed by exactly 16 uppercase letters/digits | `<AWS-ACCESS-KEY>` |
| Slack Bot token | Starts with `xoxb-` followed by alphanumeric/hyphen chars | `<SLACK-TOKEN>` |
| HTTP Bearer credential | `Authorization: Bearer` (case-insensitive) followed by a space and 20+ non-whitespace chars | `<BEARER-TOKEN>` |
| AWS ECR endpoint | 12-digit account number followed by `.dkr.ecr.` and an AWS region | `<ECR-ENDPOINT>` |

When any Tier-1 pattern is found in a **source** file, the skill aborts the share workflow and prompts the user to remediate the original before producing any copy.

---

## Tier 2 — PII (redacted in copy, warning in report)

| Name | Description | Replacement |
|------|-------------|-------------|
| Home path | Absolute path segment containing `/home/<user>/` or `/Users/<user>/` | `<HOME>/…` (tail preserved) |
| Email address | Standard `user@domain.tld` format | `<EMAIL>` |
| Session ID | Value of `originSessionId:` frontmatter field | `<SESSION-ID>` |
| Old dates | ISO date `YYYY-MM-DD` older than 30 days | `<DATE>` |

---

## Tier 3 — Informational (flagged in report, not redacted by default)

| Item | Behavior |
|------|----------|
| Relative dates (`last week`, `next sprint`) | Flagged; not redacted — content is already vague |
| Relative paths (`./foo`, `../config`) | Flagged; not redacted — rarely identify a person |
| HTTP/HTTPS URLs | Flagged as "url not verified"; not redacted |

---

## Anti-patterns

- Do not treat all high-entropy strings as credentials — entropy heuristics produce too many false positives in notes and prose.
- Do not over-redact; the goal is share-safety, not rendering the memory useless.
- This tool is not a substitute for manually reviewing memory files before sharing with a highly trusted party.
