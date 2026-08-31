---
name: weekly-review
description: 'Use when asked to summarize authored work from the last week: read-only git history analysis returns an executive summary and work classification. Don''t use for tasks that require source or remote-system changes.'
---

# Weekly review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Summarize authored work from the last week. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only. Read-only history analysis; no external state change. |
| Done | Report returned with executive summary and work classification. |

## Inputs

- `date_range` (optional): date range override for `git log --since/--until` (e.g. `"2024-01-01".."2024-01-07"`). When absent, use `7 days ago` to `yesterday`.

## Procedure

1. Determine the date range. Use the `date_range` input if provided; otherwise compute `since = "7 days ago"` and `until = "yesterday"`.
2. Run: `git log --since="<since>" --until="<until>" --pretty=format:"%h %s" --no-merges` to list non-merge commit subjects. Record the raw output.
3. Run: `git shortlog -sne --since="<since>" --until="<until>" --no-merges` to list per-author commit counts. Record the raw output.
4. Combine both outputs into a structured weekly review report.
5. Return the report as chat output.

## Failure and recovery
- `git not found or directory is not a git repository`: Stop with the message "Weekly review requires a git repository."
- `no commits in range`: Return "No commits found in the specified date range." as chat output; do not fabricate a summary.
- `git command exits non-zero`: Stop with the message "Git command failed: <stderr excerpt>."

## Output
A structured report with these sections:
- Executive Summary (2-4 sentence overview of the week's authored work)
- Work Classification (grouped by type: feature, fix, refactor, docs, test, chore)
- Author Statistics (from shortlog: author names and commit counts)
- Commit Log (the raw `git log` output)

## Provenance

Origin: cursor/plugins cursor-team-kit/skills/weekly-review/SKILL.md at 68836ddaf5697224520f1847d90cdb90ca8babaa. License: MIT. Adaptation: clean-room rewrite for ODIN 2.0 odin-research module with read-only authority and bounded-range git history analysis.
