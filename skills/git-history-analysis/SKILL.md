---
name: git-history-analysis
description: 'Use when the user asks about recent engineering work, what the team is working on, or is preparing planning or roadmap material. Summarizes recent git history into a categorized report with commit breakdown, active branches, key insights, risks, and follow-up questions. Don''t use for remote mutation, Slack posting, or any irreversible change without explicit human confirmation.'
disable-model-invocation: true
---

# Git history analysis

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks about recent engineering work, what the team is working on, or planning or roadmap preparation. |
| Authority | Human-only. Reads git history from the target repository and writes a report under reports/git_history_analysis/. The optional Slack post is a human-gated branch that requires explicit confirmation before any remote mutation. No force-push, PR creation, or other remote mutation runs without explicit human invocation. |
| Side effect | Writes a categorized commit-breakdown report to reports/git_history_analysis/. Optionally posts a summary to Slack only on explicit human confirmation. |
| Done | Report saved with commit breakdown, active branches, key insights, risks, and follow-up questions. |

## Inputs

- Repository path: required. Defaults to the current working directory when omitted. Only analyze the user's application repositories; do not analyze this agent's own repository.
- Time period: optional. Defaults to the last 2 weeks (14 days).
- Filters: optional path or branch filters to narrow the scope.

## Procedure

1. Bind scope before mutation: confirm the repository path and time period. If the path is ambiguous or absent and no default is acceptable, stop and ask; do not guess.
2. Verify the path is a git repository with commits in the requested range. If not, stop and report the blocker; do not write a partial report.
3. Collect commit history from the repository root, adjusting `--since` to the requested period:
   ```bash
   git --no-pager log --since="2 weeks ago" --pretty=format:"%h|%ad|%s" --date=short --stat
   ```
4. Collect active branches (work in progress), sorted by most recent commit:
   ```bash
   git --no-pager branch -r --sort=-committerdate | head -20
   ```
5. Collect recent merges to main (completed work):
   ```bash
   git --no-pager log --since="2 weeks ago" --merges --pretty=format:"%h|%ad|%s" --date=short main
   ```
6. Categorize commits by conventional-commit prefix: `feat:` features, `fix:` bug fixes, `refactor:` code improvements, `docs:` documentation, `test:` testing, `chore:` maintenance. Adapt the prefix set when the repository uses different conventions.
7. Group commits by directory or component to identify the most active areas.
8. Surface patterns: which features receive the most attention, whether any area shows high bug-fix activity, and the balance between new features and maintenance.
9. Note in-progress work from active branches not yet merged to main.
10. Do not attribute work to individuals. Omit author names from the report; describe work by branch, component, and commit type.
11. Write the report to `reports/git_history_analysis/git_analysis_YYYY-MM-DD.md` using the Output format.
12. If the user explicitly requests a Slack summary, confirm the destination and post only after explicit human confirmation. This branch is optional and is not required for the done predicate.

## Failure and recovery
- Not a git repository or no commits in range: stop, state the blocker, do not write a report. No mutation occurs.
- Ambiguous repository path or missing time period: ask the user; do not guess or widen scope.
- Incomplete or unclear data: note the gap in the report; never fabricate commits, counts, or insights.
- Slack post failure: the report remains saved and the done predicate holds for the report. State the Slack failure and do not retry without explicit human confirmation.
- Never swallow errors or claim the done predicate holds when the report is missing or incomplete.

## Output
A report file at `reports/git_history_analysis/git_analysis_YYYY-MM-DD.md` in this structure:

```
Git History Analysis: [Repository Name]
Period: [Date range]
Generated: [Current date]

TL;DR: [2-3 sentence summary of key findings]

ACTIVE FEATURES IN PROGRESS
- [Branch name]: [Description based on commits]

RECENTLY COMPLETED (merged to main)
- [Feature/PR description] — [Date merged]

COMMIT BREAKDOWN BY TYPE
- Features: [count] ([percentage]%)
- Bug fixes: [count] ([percentage]%)
- Refactoring: [count] ([percentage]%)
- Other: [count] ([percentage]%)

MOST ACTIVE AREAS
- [Directory/component]: [commit count] commits — [brief description of changes]

KEY INSIGHTS
- [Insight about development priorities or patterns]

RISKS & OBSERVATIONS
- [Concerning patterns: high bug counts, stalled branches, etc.]

QUESTIONS FOR FOLLOW-UP
- [Questions this analysis raises for product or engineering discussion]
```

Be evidence-driven: cite specific commits, branches, or metrics. Separate facts from interpretations. Focus on product-relevant insights. Note when data is incomplete or unclear.

## Provenance

- Origin: warpdotdev/competitive-intelligence-agent-oss, `.warp/skills/analyze_git_history/SKILL.md`.
- Pinned revision: 9e0363e810a14405ef876fb354562735002797fb.
- License: MIT; notice retained; mechanism adapted.
- Adaptation: clean-room rewrite for product-relevant framing with no individual attribution, a human-gated optional Slack branch, and a report-only done state. No third-party expression copied.
