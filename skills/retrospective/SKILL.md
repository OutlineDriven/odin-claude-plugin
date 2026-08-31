---
name: retrospective
description: 'Use when the user runs /retrospective for a period. Produces an engineering retrospective with team breakdowns and habits assembled from telemetry and review logs. Not for an agent-environment retrospective — use retro; for a learning milestone — use run-learning-retrospective.'
---

# Retrospective

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /retrospective for a period. |
| Authority | Reversible local: write only the single retrospective report file; delete that file to roll back. |
| Side effect | One local write to the retrospective report file built from telemetry and review logs. |
| Done | An engineering retrospective with team breakdowns and habits is produced. |

## Inputs

- Period: the time window named in the /retrospective argument. Required; the retrospective is bounded to it.
- Telemetry for the period: commit, pull-request, issue, CI, and review activity logs. Required; gathered from the local repository and its connected trackers.
- Review logs for the period: code-review threads, comments, and resolution outcomes. Optional; absent logs are reported as a gap rather than inferred.

## Procedure

1. Read the period from the /retrospective argument and bound every later step to that window. Stop if no period is supplied.
2. Gather telemetry for the period: commits, pull requests, issues, CI runs, and review activity from the local repository and connected trackers.
3. Gather review logs for the period: review threads, comments, and resolution outcomes.
4. Assemble team breakdowns: summarize activity per team or per contributor from the gathered evidence.
5. Identify habits: recurring patterns, bottlenecks, and practices observed across the period, each tied to the evidence that shows it.
6. Write the retrospective report to one local file containing the period, team breakdowns, habits, and the evidence each finding rests on.
7. Return the report file path and a one-line summary.

## Failure and recovery
- Missing period: stop before any gather step; no file is written.
- Telemetry or review logs unavailable for the period: report the gap in the report, mark the affected breakdown or habit as unevidenced, and continue only with what is evidenced. Never fabricate activity or findings.
- Partial evidence: write only the breakdowns and habits the available evidence supports; state each unsupported area as a gap.
- Rollback: the single report file is the only mutation; delete it to revert. No repository, VCS, credential, or remote state is changed.

## Output
One retrospective report file for the period, containing team breakdowns, habits, and the evidence behind each finding, plus the report file path and a one-line summary returned to the user.
