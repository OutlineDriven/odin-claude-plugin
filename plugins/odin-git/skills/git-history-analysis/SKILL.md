---
name: git-history-analysis
description: 'Use when the user asks about recent engineering work or what the team is working on, or is preparing planning or roadmap material. Also handles an optional Slack summary when the user explicitly requests it. Not for remote mutation or any irreversible change.'
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

1. Bind scope before mutation: confirm the repository path and time period. If the path is ambiguous or absent and no default is acceptable, stop and ask; do not guess. Done when: the repository path and time period are confirmed, or the run stopped to ask.
2. Verify the path is a git repository with commits in the requested range. If not, stop and report the blocker; do not write a partial report. Done when: the path is a git repository with commits in range, or the run stopped with the blocker reported.
3. Collect commit history from the repository root, adjusting `--since` to the requested period and appending `-- <filters>` when path filters are specified:
   ```bash
   git --no-pager log --since="2 weeks ago" --pretty=format:"%h|%ad|%s" --date=short --stat -- <filters>
   ```
   Omit `-- <filters>` when no path filters are supplied. Done when: commit history collected for the requested period from the repository root.
4. Collect active branches (work in progress), filtering out merged branches and dynamically resolving the default branch instead of hardcoding `main`:
   ```bash
   default_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo main)
   git --no-pager branch -r --no-merged origin/$default_branch --sort=-committerdate | head -20 -- <filters>
   ```
   Omit `-- <filters>` when no path filters are supplied. Done when: active unmerged branches listed, sorted by most recent commit.
5. Collect recent merges to the default branch (completed work), dynamically resolving the default branch and appending `-- <filters>` when path filters are specified:
   ```bash
   default_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo main)
   git --no-pager log --since="2 weeks ago" --merges --pretty=format:"%h|%ad|%s" --date=short origin/$default_branch -- <filters>
   ```
   Omit `-- <filters>` when no path filters are supplied. Done when: recent merges to the default branch collected for the requested period.
6. Categorize commits by conventional-commit prefix: `feat:` features, `fix:` bug fixes, `refactor:` code improvements, `docs:` documentation, `test:` testing, `chore:` maintenance. Adapt the prefix set when the repository uses different conventions. Done when: every commit is categorized by prefix (adapted to the repo's conventions).
7. Group commits by directory or component to identify the most active areas. Done when: commits grouped by directory/component with active areas identified.
8. Surface patterns: which features receive the most attention, whether any area shows high bug-fix activity, and the balance between new features and maintenance. Done when: patterns surfaced across features, bug-fix activity, and feature/maintenance balance.
9. Note in-progress work from active branches not yet merged to the default branch. Done when: in-progress work from unmerged active branches noted.
10. Do not attribute work to individuals. Omit author names from the report; describe work by branch, component, and commit type. Done when: the report contains no author names; work described by branch, component, and commit type.
11. Write the report to `reports/git_history_analysis/git_analysis_YYYY-MM-DD.md` using the Output format. Done when: the report file exists at the dated path using the Output structure.
12. If the user explicitly requests a Slack summary, confirm the destination and post only after explicit human confirmation. This branch is optional and is not required for the done predicate. Done when: a Slack summary is posted only after explicit human confirmation, or the branch is skipped.

## Failure and recovery

- Not a git repository or no commits in range: stop, state the blocker, do not write a report. No mutation occurs.
- Ambiguous repository path or missing time period: ask the user; do not guess or widen scope.
- Incomplete or unclear data: note the gap in the report; never fabricate commits, counts, or insights.
- Slack post failure: the report remains saved and the done predicate holds for the report. State the Slack failure and do not retry without explicit human confirmation.
- Never swallow errors or claim the done predicate holds when the report is missing or incomplete.

## Output

A report at `reports/git_history_analysis/git_analysis_YYYY-MM-DD.md` ordered: title and period header, TL;DR, active features in progress, recently completed (merged to the default branch), commit breakdown by type, most active areas, key insights, risks and observations, follow-up questions. Evidence-driven — cite specific commits, branches, or metrics; separate facts from interpretations; note incomplete data. No author attribution.
