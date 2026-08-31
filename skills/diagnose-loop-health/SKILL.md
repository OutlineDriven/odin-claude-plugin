---
name: diagnose-loop-health
description: 'Use when a configured loop misbehaves or its setup soundness is questioned, classify loop health as healthy, warning, or blocked with at most three prioritized actions. Don''t use for tasks that require source or remote-system changes.'
---

# Diagnose loop health

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A configured loop misbehaves, or the user asks whether the loop setup is sound |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation |
| Side effect | A severity report with at most three prioritized actions and a nonzero exit on blocked; no file mutation |
| Done | Severity is healthy, warning, or blocked with exit 0, 1, or 2, and each finding names the exact missing or stale charter, state, gate, or budget file |

## Inputs

The loop directory under inspection must be supplied by the user. No file is created or written. The doctor reads four file classes from that directory: the charter file, the state file, the gate file, and the budget file. If the directory is not named, ask for it and stop until it is supplied.

## Procedure

1. Obtain the loop directory from the user. If absent, stop and ask; do not infer or create one.
2. Bound scope to read-only inspection of that directory. Do not write, create, rename, delete, or move any file.
3. Locate and read the loop's charter file, state file, gate file, and budget file. For each, record presence and freshness: missing if absent; stale if its content does not match the loop's declared cadence, gate thresholds, or budget limits.
4. Classify severity on the ladder: healthy if all four files are present and current; warning if any file is missing or stale but the loop can still run; blocked if a required charter or state file is absent or unreadable.
5. For warning or blocked, emit at most three prioritized actions ordered by impact, each naming the exact missing or stale file by path and class.
6. Exit 0 for healthy, 1 for warning, 2 for blocked.

## Failure and recovery
- Missing loop directory: report blocked naming the absent directory, exit 2; do not create it.
- Unreadable file (permission denied or parse error): report blocked naming the file and the error, exit 2; do not mutate or skip it silently.
- Ambiguous severity where both warning and blocked conditions hold: classify as the higher severity, blocked, and exit 2.
- Partial result is forbidden: if any required file cannot be read, escalate to blocked rather than emit a warning or healthy verdict.
- Never swallow an error or assert the done predicate when a file is unreadable.

## Output
A severity report carrying one of healthy, warning, or blocked, the matching exit code 0, 1, or 2, and zero to three prioritized actions. Each action names the exact missing or stale charter, state, gate, or budget file by path and class.

## Provenance

Adapted from cobusgreyling/loop-engineering (MIT), revision d03dcb92cc1e0efb59789a2557131c6ad5897ccc, files /tools/loop/src/doctor.ts, /tools/loop/src/status.ts, /tools/loop/README.md, /docs/loop-design-checklist.md. Clean-room adaptation: the healthy/warning/blocked severity ladder, the 0/1/2 exit-code mapping, the at-most-three prioritized actions limit, and the four-file health model are preserved; no source expression is copied.
