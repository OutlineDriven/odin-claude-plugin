---
name: weekly-review
description: 'Use when asked to summarize authored work over the last week or a named date range, commit range, or branch. Not for source or remote-system changes.'
---

# Weekly review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to summarize authored work from the last week, or asks what was completed in a named date range, commit range, or branch. |
| Authority | Read-only: reads git history and writes nothing; there is nothing to roll back. No remote mutation. |
| Side effect | Chat output only; no external state change. |
| Done | Mode weekly: the report includes an executive summary and work classification. Mode range: a concise dated status report is returned as chat text. |

## Inputs

- Mode: `weekly` (default) or `range`.
- `range` (required for mode range): a date range, commit range such as `<a>..<b>`, branch name, or label git accepts.
- `date_range` (optional, mode weekly): override for the `git log --since/--until` range, for example `"2024-01-01".."2024-01-07"`. When absent, use `7 days ago` to `yesterday`.

## Procedure

1. Locate the repository root with `git -C <session_cwd> rev-parse --show-toplevel`. Done when: the repo root is located, or the run aborts because the directory is not a git repository.
2. Determine the range. Mode weekly: use `date_range` when supplied, else `since = "7 days ago"` and `until = "yesterday"`. Mode range: use the supplied `range` identifier as the git revision range; for a date range, map it to `--since`/`--until`. Done when: the range is determined.
3. List commits. Mode weekly: `git log --since="<since>" --until="<until>" --pretty=format:"%h %s" --no-merges`. Mode range: `git -C <repo_root> log --oneline --date=short --format="%h %ad %s" <range>`; if the range is empty or unrecognized by git, report the empty result and stop. Done when: commit subjects are recorded or the empty result is reported.
4. Capture author counts. Mode weekly: `git shortlog -sne --since="<since>" --until="<until>" --no-merges`. Mode range: `git -C <repo_root> shortlog -sne <range>`, omitted if the command fails. Done when: per-author counts are recorded or omitted on failure.
5. Compose the report. Mode weekly: executive summary, work classification, author statistics, commit log. Mode range: the range label, commit count, each commit on its own line as `<short-hash> <date> <subject>`, and author counts when available. Done when: the report is assembled.
6. Return the report as chat output. Do not write any file. Done when: the report is returned as chat output.

## Failure and recovery

- Not a git repository: abort with "Not a git repository." in mode range, or "Weekly review requires a git repository." in mode weekly.
- Range not recognized or empty: report the empty result for that range and stop.
- No commits in range: return "No commits found in the specified date range."; do not fabricate a summary.
- Git command exits non-zero: stop with "Git command failed: <stderr excerpt>."
- Partial-result rule: return what was gathered; stop on the first failure.

## Output

- Mode weekly: a structured report with sections in order: Executive Summary (2-4 sentence overview), Work Classification (grouped by type: feature, fix, refactor, docs, test, chore), Author Statistics (from shortlog), and Commit Log (raw `git log` output).
- Mode range: chat text with a concise dated status update: the range label, commit count, per-commit lines (`<hash> <date> <subject>`), and author summary when available.
