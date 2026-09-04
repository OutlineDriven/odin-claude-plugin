---
name: repo-health-triage
description: 'Use when a scheduled or watcher tick requests a repository-health pass. Not for source, label, merge, or close mutation.'
---

# Repo health triage

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A scheduled or explicitly requested repository-health pass spanning CI, pull requests, issues, commits, discussions, and durable run state. |
| Authority | Reversible local: writes only the bounded report file, one append-only run-log entry, and at most one isolated-fix proposal; rollback is deleting those files. No remote mutation. No source, label, merge, or close mutation without explicit approval. |
| Side effect | Local-write to a bounded High/Watch/Noise report plus one append-only run-log entry and at most one isolated-fix proposal; no unapproved source, label, merge, or close mutation. |
| Done | Every inspected signal lands in High, Watch, or Noise with an evidence line; the report is persisted or returned and any score stays informational, never a reason to act. |

## Refusals

- **Unapproved source, label, merge, or close mutation**: rejected. No mutation without explicit approval.
- Numeric score as a reason to act: rejected. Any score is informational only and must not be cited as a reason to act.
- **Scope widening into signal classes not requested or into mutation territory**: rejected. Stop immediately and report the boundary violation.

## Inputs

- Repository path or remote URL (required).
- Optional: scope filter limiting inspection to specific signal classes (CI, PRs, issues, commits, discussions, run state). If omitted, all signal classes are inspected.
- Optional: prior run-log path for append. If omitted, a new run-log is created.

## Procedure

1. Resolve the repository target and confirm read access. If access fails, stop and report the failure class. **Done when**: read access is confirmed or the failure class is reported.
2. Enumerate open pull requests. For each, record: merge conflicts (High), CI red or no CI run (High), changes-requested review state (High), idle >14 days with no activity (Watch), and all others (Noise). Each classification carries an evidence line with the PR identifier and the specific signal. **Done when**: every open PR is classified with an evidence line.
3. Enumerate open issues. For each, record: unanswered >7 days (Watch), linked CI failure (High), and all others (Noise). Each classification carries an evidence line. **Done when**: every open issue is classified with an evidence line.
4. Enumerate recent commits on the default branch. For each, record: CI status red (High), CI status missing (Watch), and CI status green (Noise). Each classification carries an evidence line. **Done when**: every recent commit is classified with an evidence line.
5. Enumerate discussions or forum threads if the repository platform supports them. For each, record: unanswered >7 days (Watch) and all others (Noise). Each classification carries an evidence line. **Done when**: every discussion is classified with an evidence line.
6. Inspect durable run state (workflow runs, scheduled job status). For each, record: failed run (High), stale run with no recent execution (Watch), and healthy run (Noise). Each classification carries an evidence line. **Done when**: every run-state item is classified with an evidence line.
7. Compile the bounded report: group all signals by classification (High, Watch, Noise). Each entry contains the signal source, identifier, evidence line, and classification. No signal appears in more than one bucket. **Done when**: the report is compiled with every signal in exactly one bucket.
8. Append one entry to the run-log: timestamp, repository target, signal counts per classification, and report file path. **Done when**: the run-log entry is appended.
9. If any High signal admits an isolated fix (typo in workflow file, missing CI config, stale label), propose exactly one fix with the target file, the proposed change, and the rationale. Do not apply the fix. If no isolated fix is available, skip this step. **Done when**: one fix proposal is made or the step is skipped.
10. Return or persist the report. Any numeric score derived from the classification counts is informational only and must not be cited as a reason to act. **Done when**: the report is returned or persisted.

## Failure and recovery

- Access failure: repository or API unreachable. Report the failure class and stop. No partial report is emitted.
- Partial enumeration: one signal class fails mid-inspection (rate limit, transient error). Classify the remaining signals, note the failed class in the report header with the error, and proceed. The report is valid for the inspected classes only.
- Run-log write failure: the report is still valid and returned; the run-log append is skipped with a note in the output.
- Scope widening detected: stop immediately and report the boundary violation. No partial mutations are committed.

## Output

A bounded report file with header (repository target, timestamp, scope), High/Watch/Noise sections with evidence lines, run-log entry, isolated-fix proposal if any, and informational score if computed, ordered: header, High, Watch, Noise, run-log, fix proposal, score.
