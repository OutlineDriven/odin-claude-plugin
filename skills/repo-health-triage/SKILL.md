---
name: repo-health-triage
description: 'Use when a scheduled or watcher tick requests a repository-health pass; the skill inspects CI, pull requests, issues, commits, discussions, and run state, then classifies every signal into High, Watch, or Noise with an evidence line and persists a bounded report plus one run-log entry. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Repo health triage

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A scheduled or explicitly requested repository-health pass spanning CI, pull requests, issues, commits, discussions, and durable run state |
| Authority | Reversible-local: write only the bounded report file, one append-only run-log entry, and at most one isolated-fix proposal; no source, label, merge, or close mutation without explicit approval |
| Side effect | Local-write to a bounded High/Watch/Noise report plus one append-only run-log entry and at most one isolated-fix proposal; no unapproved source, label, merge, or close mutation |
| Done | Every inspected signal lands in High, Watch, or Noise with an evidence line (conflicts, CI red, no CI, blocked, changes-requested, unanswered >7d, idle >14d); the report is persisted or returned and any score stays informational, never a reason to act |

## Inputs

- Repository path or remote URL (required).
- Optional: scope filter limiting inspection to specific signal classes (CI, PRs, issues, commits, discussions, run state). If omitted, all signal classes are inspected.
- Optional: prior run-log path for append. If omitted, a new run-log is created.

## Procedure

1. Resolve the repository target and confirm read access. If access fails, stop and report the failure class.
2. Enumerate open pull requests. For each, record: merge conflicts (High), CI red or no CI run (High), changes-requested review state (High), idle >14 days with no activity (Watch), and all others (Noise). Each classification carries an evidence line with the PR identifier and the specific signal.
3. Enumerate open issues. For each, record: unanswered >7 days (Watch), linked CI failure (High), and all others (Noise). Each classification carries an evidence line.
4. Enumerate recent commits on the default branch. For each, record: CI status red (High), CI status missing (Watch), and CI status green (Noise). Each classification carries an evidence line.
5. Enumerate discussions or forum threads if the repository platform supports them. For each, record: unanswered >7 days (Watch) and all others (Noise). Each classification carries an evidence line.
6. Inspect durable run state (workflow runs, scheduled job status). For each, record: failed run (High), stale run with no recent execution (Watch), and healthy run (Noise). Each classification carries an evidence line.
7. Compile the bounded report: group all signals by classification (High, Watch, Noise). Each entry contains the signal source, identifier, evidence line, and classification. No signal appears in more than one bucket.
8. Append one entry to the run-log: timestamp, repository target, signal counts per classification, and report file path.
9. If any High signal admits an isolated fix (typo in workflow file, missing CI config, stale label), propose exactly one fix with the target file, the proposed change, and the rationale. Do not apply the fix. If no isolated fix is available, skip this step.
10. Return or persist the report. Any numeric score derived from the classification counts is informational only and must not be cited as a reason to act.

## Failure and recovery
- **Access failure**: repository or API unreachable. Report the failure class and stop. No partial report is emitted.
- **Partial enumeration**: one signal class fails mid-inspection (rate limit, transient error). Classify the remaining signals, note the failed class in the report header with the error, and proceed. The report is valid for the inspected classes only.
- **Run-log write failure**: the report is still valid and returned; the run-log append is skipped with a note in the output.
- **Scope widening detected**: if inspection drifts into signal classes not requested or into mutation territory, stop immediately and report the boundary violation. No partial mutations are committed.

## Output
A bounded report file containing:
- Header: repository target, inspection timestamp, scope.
- High section: every High signal with evidence line.
- Watch section: every Watch signal with evidence line.
- Noise section: every Noise signal with evidence line.
- Run-log entry: appended to the designated run-log file.
- Isolated-fix proposal (if any): target file, proposed change, rationale.
- Informational score (if computed): classification counts only, explicitly marked as non-authoritative.

## Provenance

Origin: cobusgreyling/loop-engineering, patterns/daily-triage.md and related files. Pinned revision: d03dcb92cc1e0efb59789a2557131c6ad5897ccc. License: MIT. Adaptation: clean-room rewrite for ODIN 2.0 odin-run module; source mechanism (scheduled triage sweep with evidence-backed classification) preserved, execution adapted to local-write authority and bounded report contract.
