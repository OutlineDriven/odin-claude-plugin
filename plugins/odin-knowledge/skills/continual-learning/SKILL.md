---
name: continual-learning
description: 'Use when asked to mine prior chats on a scheduled or watcher tick and maintain project memory. Not for remote, credential, publish, deploy, or irreversible mutation.'
---

# Continual learning

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A scheduled tick or watcher event fires to mine prior chats and maintain project memory. |
| Authority | Reversible local: writes only AGENTS.md and the continual-learning index; rollback is version control. No remote mutation. |
| Side effect | Updates AGENTS.md and the continual-learning index with deduplicated high-signal memory entries. |
| Done | Deduplicated high-signal memory updates are written, or an explicit no-update result is returned. |

## Inputs

- Prior chat transcripts or session logs accessible in the local workspace (required).
- Existing AGENTS.md (required, read before mutation).
- The continual-learning index at `.continual-learning/index.json` (required, read before mutation). The index schema is a JSON object with an array of entries, each carrying `fact`, `source_session`, `date`, and `category` (one of `decision`, `convention`, `constraint`, `resolved-problem`, `project-knowledge`).
- Update scope or focus filter (optional).

## Procedure

1. On a scheduled tick or watcher event, enumerate accessible prior chat transcripts and session logs in the local workspace. Done when: every accessible transcript and log is enumerated.
2. Read the current AGENTS.md and `.continual-learning/index.json` to establish the existing memory baseline. Done when: the existing memory baseline is read and the current set of recorded facts is known.
3. Extract candidate memory facts from the transcripts: decisions, conventions, constraints, resolved problems, and project-specific knowledge. Done when: candidate facts are extracted from every transcript.
4. Deduplicate each candidate against the existing baseline; drop entries that duplicate, contradict without new evidence, or restate lower-signal information already recorded. Done when: every candidate is deduplicated against the baseline.
5. Apply the high-signal gate. A candidate passes when it meets one of: records a decision that changed project direction, establishes a convention or constraint that governs future work, resolves a problem that recurred or is likely to recur, or captures project-specific knowledge not derivable from the codebase. Drop candidates that restate obvious or one-off information. Done when: every surviving candidate is classified and only high-signal entries remain.
6. Capture the prior state of AGENTS.md and the index before writing, so the update can be rolled back. Apply the deduplicated high-signal updates to AGENTS.md and `.continual-learning/index.json` as local writes only. Done when: the high-signal updates are written and the prior state is captured.
7. If no candidate survives deduplication and the gate, record an explicit no-update result. Done when: a no-update result is recorded or updates are applied.

## Failure and recovery

- Unreadable transcript: skip that source, continue with the rest, and report the skipped source in the result.
- Unreadable index: return a blocked result naming the missing or corrupt index; do not write updates without a baseline.
- Conflicting evidence between a candidate and an existing entry: do not overwrite; surface the conflict and leave the existing entry unchanged.
- Partial-result rule: write only the deduplicated subset that resolved cleanly; never write unverified or low-signal entries to meet a quota.
- Rollback: the prior state captured in step 6 restores AGENTS.md and the index to their pre-update content. Revert by replacing the current files with the captured prior state.
- Blocked result: if no transcripts are accessible or the index cannot be read, return a blocked result naming the missing input; do not fabricate memory.

## Output

Statement of which deduplicated high-signal memory updates were applied to AGENTS.md and `.continual-learning/index.json`, or that no update was made and why no candidate survived the gate.
