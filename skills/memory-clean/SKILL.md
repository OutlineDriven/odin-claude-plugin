---
name: memory-clean
description: 'Use when a human explicitly asks to audit memory or find stale or duplicate memories. Runs a deterministic audit, snapshots the store, and applies only confirmed repairs. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
disable-model-invocation: true
---

# Memory clean

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A human explicitly asks to audit memory or find stale or duplicate memories. |
| Authority | Human-only for external or irreversible effects: inspect the named memory store, but preview each target and consequence and obtain explicit confirmation for each repair group before changing data at rest. |
| Side effect | Create one snapshot copy, then make only confirmed edits, merges, archives, or deletions inside `$MEMORY_DIR`, which is outside version control. |
| Done | A fresh deterministic audit reports zero critical findings, and every residual warning or informational finding is reported. |

## Inputs

- Required: the project whose durable memory store is being audited, or an explicit `MEMORY_DIR` override.
- Optional: `SESSION_HISTORY_GLOB` for session-based staleness evidence and `MEMORY_CLEAN_SKILL_SCRIPTS` when the bundled scripts are installed outside the default skill directory.
- The path resolver must successfully produce an existing memory directory. Session history may be omitted, but then session-based feedback staleness cannot be assessed and must be reported as unavailable.

## Procedure

1. Resolve the bundled script directory, then run `resolve-paths.sh memory_dir` and `resolve-paths.sh session_history_glob`. Reject resolver errors, control characters, forbidden shell metacharacters, and unsafe whitespace rather than interpreting them.
2. Bound the operation to the resolved `$MEMORY_DIR`; do not create new memories, edit another store, redact suspected credentials, or widen the requested scope.
3. Before any repair, create a timestamped recursive snapshot of `$MEMORY_DIR` in `/tmp` and record its path. If the snapshot fails, stop without changing the store.
4. Run `audit-memory.sh "$MEMORY_DIR" "$SESSION_HISTORY_GLOB"` and preserve its JSON output. The deterministic audit checks index orphans and dangling links, schema and required sections, index size limits, credential patterns, fix-recipe and path-pinned content, relative dates, body-line Jaccard similarity above 0.70, missing reference targets, past project dates without historical-anchor phrases, and feedback rules contradicted by session evidence.
5. Render all findings grouped as critical, warning, and informational. For each staleness finding, include the reported session identifiers and available contradiction context. Label unavailable session evidence instead of inventing it.
6. Group proposed repairs by mechanism and show an exact preview: add an orphan to `MEMORY.md`; remove a dangling index line; merge a near-duplicate pair while naming the superseded file and index update; make a targeted structural edit; or update, archive, or delete a stale memory. Show a file's content before proposing its deletion. For a suspected credential, report the critical finding and make no redaction.
7. Obtain explicit human confirmation separately for each repair group. Unconfirmed groups remain unchanged. Confirmation for one group does not authorize another.
8. Apply only confirmed repairs within `$MEMORY_DIR`. Preserve unrelated content. If an applied repair fails partway, stop further mutation and restore every file touched by that group from the snapshot before reporting the failure.
9. Re-run the same audit against the same resolved inputs. Success requires zero critical findings. Report all residual warning and informational findings; do not claim success when the audit fails, evidence is unavailable, or critical findings remain.

## Failure and recovery
- **Invalid or missing path:** stop before snapshot or mutation and return `blocked` with the resolver diagnostic.
- **Snapshot failure:** stop without mutation and return `blocked` with the failed snapshot target.
- **Audit failure or malformed report:** retain any valid partial report, make no repairs, and return `blocked` with the diagnostic; never infer omitted findings.
- **Missing staleness evidence:** complete structural checks, mark session-based staleness unavailable, and return `blocked` rather than treating absence of evidence as freshness.
- **Confirmation absent or ambiguous:** leave that repair group unchanged and report it as unconfirmed.
- **Partial repair failure:** stop, restore that group's touched files from the recorded snapshot, and report the attempted changes and restoration result. If restoration fails, return `blocked` and identify every potentially changed file.
- **Critical findings after re-audit:** return `non-converged` with the remaining critical findings and residual warnings or information; do not widen scope or invent a fix.

## Output
Return the snapshot path, resolved audit scope, severity-grouped JSON findings, per-group previews and confirmation decisions, applied and restored file lists, fresh re-audit result, residual warnings and information, and exactly one terminal classification: `complete`, `blocked`, or `non-converged`. `complete` is valid only when the fresh audit contains zero critical findings.

## Provenance

Project-owned adaptation from `skills/memory-clean/SKILL.md` in the `odin-current` source. No source revision or license identifier was supplied. This version preserves the deterministic structural and staleness audit, snapshot-first recovery, evidence display, per-group human confirmation, and durable-store mutation boundary while making the procedure self-contained.
