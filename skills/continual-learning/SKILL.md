---
name: continual-learning
description: 'Use when asked to mine prior chats on a scheduled or watcher tick and maintain project memory; emit deduplicated high-signal memory updates or an explicit no-update result. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Continual learning

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A scheduled tick or watcher event fires to mine prior chats and maintain project memory. |
| Authority | Reversible local writes only to AGENTS.md and the continual-learning index; no VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Updates AGENTS.md and the continual-learning index with deduplicated high-signal memory entries. |
| Done | Deduplicated high-signal memory updates are written, or an explicit no-update result is returned. |

## Inputs

- Prior chat transcripts or session logs accessible in the local workspace (required).
- Existing AGENTS.md and continual-learning index contents (required, read before mutation).
- Update scope or focus filter (optional).

## Procedure

1. On a scheduled tick or watcher event, enumerate accessible prior chat transcripts and session logs in the local workspace.
2. Read the current AGENTS.md and continual-learning index to establish the existing memory baseline.
3. Extract candidate memory facts from the transcripts: decisions, conventions, constraints, resolved problems, and project-specific knowledge.
4. Deduplicate each candidate against the existing baseline; drop entries that duplicate, contradict without new evidence, or restate lower-signal information already recorded.
5. For each surviving candidate, classify signal strength; keep only high-signal entries.
6. Apply the deduplicated high-signal updates to AGENTS.md and the continual-learning index as local writes only.
7. If no candidate survives deduplication, record an explicit no-update result.

## Failure and recovery
- Unreadable transcript or index: skip that source, continue with the rest, and report the skipped source in the result.
- Conflicting evidence between a candidate and an existing entry: do not overwrite; surface the conflict and leave the existing entry unchanged.
- Partial-result rule: write only the deduplicated subset that resolved cleanly; never write unverified or low-signal entries to meet a quota.
- Rollback: changes are local writes to AGENTS.md and the index; revert via the workspace version control or by discarding the uncommitted update.
- Blocked result: if no transcripts are accessible or the index cannot be read, return a blocked result naming the missing input; do not fabricate memory.

## Output
A result stating either the deduplicated high-signal memory updates applied to AGENTS.md and the continual-learning index, or an explicit no-update result with the reason no candidate survived.

## Provenance

Origin: cursor/plugins. Pinned revision: 68836ddaf5697224520f1847d90cdb90ca8babaa. License: MIT, declared by the cursor/plugins root README and the candidate plugin manifest per the pinned source audit. Adaptation: clean-room rewrite of the continual-learning skill and its memory-updater agent workflow into a self-contained procedure preserving scheduled chat-mining and deduplicated local-write memory maintenance.
