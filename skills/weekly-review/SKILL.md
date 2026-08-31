---
name: weekly-review
description: 'Use when asked to summarize authored work from the last week. Reads git history without changing it, then returns an executive summary and work classification. Don''t use for tasks that require source or remote-system changes.'
---

# Weekly review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Summarize authored work from the last week. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only. Read-only history analysis; no external state change. |
| Done | Report includes an executive summary and work classification. |

## Inputs

- `date_range` (optional): override for the `git log --since/--until` range (e.g. `"2024-01-01".."2024-01-07"`). When absent, use `7 days ago` to `yesterday`.

## Procedure

1. Determine the date range. Use the `date_range` input if provided; otherwise compute `since = "7 days ago"` and `until = "yesterday"`. Done when: date range is determined.
2. Run `git log --since="<since>" --until="<until>" --pretty=format:"%h %s" --no-merges` to list non-merge commit subjects. Record the raw output. Done when: commit subjects are recorded, or the step has stopped on git failure.
3. Run `git shortlog -sne --since="<since>" --until="<until>" --no-merges` to list per-author commit counts. Record the raw output. Done when: per-author counts are recorded.
4. Combine both outputs into a structured weekly review report. Done when: report is assembled with executive summary and work classification.
5. Return the report as chat output. Done when: report is returned as chat output.

## Failure and recovery
- `git not found or directory is not a git repository`: stop with the message "Weekly review requires a git repository."
- `no commits in range`: return "No commits found in the specified date range." as chat output; do not fabricate a summary.
- `git command exits non-zero`: stop with the message "Git command failed: <stderr excerpt>."

## Output
A structured report with sections in order: Executive Summary (2-4 sentence overview), Work Classification (grouped by type: feature, fix, refactor, docs, test, chore), Author Statistics (from shortlog), and Commit Log (raw `git log` output).
