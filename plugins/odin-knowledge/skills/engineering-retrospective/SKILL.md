---
name: engineering-retrospective
description: 'Use when the user requests an engineering retrospective for a named period. Discovers repository and tracker telemetry, establishes source precedence, derives team breakdowns and evidence-backed habits, and writes a single report file. Not for an agent-environment retrospective — use agent-environment-retrospective; for a learning milestone — use learning-retrospective.'
---

# Engineering retrospective

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user requests an engineering retrospective for a named period. |
| Authority | Reversible local: write only the single report file at `reports/engineering-retrospective-<period-slug>.md`; delete that file to roll back. No VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | One local write to the authorized report file built from telemetry and review logs. |
| Done | A report file exists at the authorized path containing the period, team breakdowns, evidence-backed habits, and gap accounting. |

## Inputs

- Period: the time window named in the request. Required; the retrospective is bounded to it. Resolve it to explicit start and end dates.
- Repository telemetry for the period: commits, pull requests, CI runs. Required; gathered from the local repository.
- Connected tracker telemetry for the period: issues, tickets. Optional; gathered from connected trackers when accessible.
- Review logs for the period: code-review threads, comments, and resolution outcomes. Optional; absent logs are reported as a gap rather than inferred.

## Procedure

1. Read the period from the request and resolve it to explicit start and end dates. Stop if no period is supplied. Derive the authorized report path as `reports/engineering-retrospective-<period-slug>.md` where `<period-slug>` is the period expressed as `YYYYMM-DD` or the user's requested slug. Done when: the period is resolved to start and end dates and the report path is named.
2. Discover the repository and connected trackers. Identify the local repository root by walking up from the working directory to find `.git`. Identify connected trackers by inspecting repository configuration and project files: issue trackers linked in `.github/`, `package.json` metadata, or project configuration files. Establish source precedence for overlapping telemetry: the local repository is the primary source for commits, PRs, and CI runs; connected trackers are the primary source for issues and tickets; review logs from the repository are primary over tracker-exported review data. When two sources cover the same activity, cite the primary source and note the secondary as corroboration. Done when: the repository root is found, connected trackers are identified or marked absent, and source precedence is established.
3. Gather telemetry for the period from each discovered source. From the local repository: `git log` for commits in the period, `gh pr list` or equivalent for pull requests, CI run history for build outcomes. From connected trackers: issues or tickets created or updated in the period. From review logs: review threads, comments, and resolution outcomes. Mark each unavailable source explicitly as a gap with the reason. Done when: every discovered source is gathered for the period or marked as a gap.
4. Derive team and contributor breakdowns from the gathered evidence. Summarize activity per team or per contributor: commit count, PR count, review participation, issue resolution, and CI pass/fail rate. Attribute each breakdown to the source it was derived from. Done when: breakdowns are derived for every contributor or team with activity in the period.
5. Identify habits: recurring patterns, bottlenecks, and practices observed across the period, each tied to the evidence that shows it. Distinguish habits the evidence supports from inferences. Done when: habits are identified with evidence citations.
6. Write the assembled retrospective to the authorized report file. Include the period, source coverage and gaps, team breakdowns, habits with evidence, and a one-line summary. Done when: the report file exists at the authorized path with all sections.

## Failure and recovery

- Missing period: stop before any gather step; no file is written.
- Telemetry or review logs unavailable for the period: report the gap in the report, mark the affected breakdown or habit as unevidenced, and continue with what is evidenced. Never fabricate activity or findings.
- Partial evidence: write only the breakdowns and habits the available evidence supports; state each unsupported area as a gap.
- Rollback: the single report file is the only mutation; delete it to revert. No repository, VCS, credential, or remote state is changed.

## Output

The report file path at `reports/engineering-retrospective-<period-slug>.md` containing the period, source coverage with gaps, team breakdowns, evidence-backed habits, and a one-line summary, plus the path returned to the user.
