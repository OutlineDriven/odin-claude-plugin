---
name: diagnose-loop-health
description: 'Use when a configured loop misbehaves, produces unexpected results, or its setup soundness is questioned. Reads the charter, state, gate, and budget files, classifies health as healthy, warning, or blocked, and emits at most three prioritized actions. Not for tasks that require source or remote-system changes; not for loop design — use harness-engineering.'
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

The user must supply the loop directory to inspect. No file is created or written. The skill reads four file classes from that directory: the charter file, the state file, the gate file, and the budget file. If the directory is not named, ask for it and stop until it is supplied.

## Procedure

1. Obtain the loop directory from the user. If absent, stop and ask; do not infer or create one. **Done when:** the loop directory is supplied or the skill stops to ask.

2. Bound scope to read-only inspection of that directory. Do not write, create, rename, delete, or move any file. **Done when:** scope is bounded to read-only inspection.

3. Locate and read the loop's charter file, state file, gate file, and budget file. For each, record presence and freshness: missing if absent; stale if its content does not match the loop's declared cadence, gate thresholds, or budget limits. **Done when:** all four files are read with presence and freshness recorded.

4. Classify severity on the ladder: healthy if all four files are present and current; warning if any file is missing or stale but the loop can still run; blocked if a required charter or state file is absent or unreadable. **Done when:** severity is classified healthy, warning, or blocked.

5. For warning or blocked, emit at most three prioritized actions ordered by impact, each naming the exact missing or stale file by path and class. **Done when:** zero to three prioritized actions are emitted, each naming the file by path and class.

6. Exit 0 for healthy, 1 for warning, 2 for blocked. **Done when:** the exit code matches the severity.

## Failure and recovery
- Missing loop directory: report blocked naming the absent directory, exit 2; do not create it.
- Unreadable file (permission denied or parse error): report blocked naming the file and the error, exit 2; do not mutate or skip it silently.
- Ambiguous severity where both warning and blocked conditions hold: classify as the higher severity, blocked, and exit 2.
- Partial result is forbidden: if any required file cannot be read, escalate to blocked rather than emit a warning or healthy verdict.
- Never swallow an error or assert the done predicate when a file is unreadable.

## Output
A severity report carrying one of healthy, warning, or blocked, the matching exit code 0, 1, or 2, and zero to three prioritized actions, each naming the exact missing or stale charter, state, gate, or budget file by path and class, ordered obtain-dir → bound-scope → read-files → classify → emit-actions → exit.
