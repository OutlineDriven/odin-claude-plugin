---
name: consolidate-to-one-home
description: 'Use when the same rule, constant, or definition is repeated across files and the user says "consolidate this", "make this the single source of truth", or "ssotize this". Folds the scattered statements into one canonical local home and replaces every former copy with a resolving pointer after explicit approval. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Consolidate to one home

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The same rule, constant, or definition is repeated across files; 'consolidate this', 'single source of truth', or 'ssotize this'. |
| Authority | Reversible-local: write only the canonical artifact and the files holding duplicates, as named in the approved plan; capture every pre-edit file content first so any step can be rolled back byte-for-byte. |
| Side effect | After approval, rewrites the canonical local artifact and removes/replaces duplicate local statements with pointers; nothing outside the named scope is touched. |
| Done | One complete authoritative home remains; every former copy resolves to it; no unique detail is lost. |

## Inputs

- The fact to consolidate: the specific rule, constant, or definition — one statement, not a whole document. Must be supplied by the user.
- The audit scope: the files or directories to enumerate. Optional; defaults to the paths where the user saw the repetition, widened only by explicit approval.

## Procedure

1. Name the truth: restate the single statement being consolidated in one sentence, distinct from the surrounding documents.
2. Audit read-only. Enumerate every occurrence of the statement across the artifacts in scope, each with file and location.
3. Re-enumerate by a second method (different search pattern, symbol index, or reverse direction) and confirm it surfaces nothing the first pass missed.
4. Classify each occurrence as exact copy, paraphrase, partial, stale, or contradictory.
5. Pick the canonical home: the most authoritative and most maintained location, closest to where the fact actually changes. Propose creating a new home in scope if none exists. Never promote a weak copy because it is convenient.
6. Report the audit before any edit: occurrences with locations, each classification, the proposed home with a one-line justification, unique details to fold in, contradictions needing a human decision, and the exact mutation plan naming every file to change. Wait for explicit approval; no edit lands before it.
7. Capture the pre-edit content of every file in the approved plan as the rollback path.
8. Fold unique details into the canonical home first and reconcile contradictions there per the approval decisions.
9. Replace each duplicate with a live reference to the home; remove now-redundant copies, leaving a one-line pointer only where outright deletion would orphan a reader.
10. Verify every pointer resolves to the home and the home alone states the complete truth.

## Failure and recovery
- Undecided contradiction: report the conflicting statements and stop read-only; never guess a resolution.
- Out-of-scope occurrence found after approval: stop, re-report including the widened scope, and wait for new approval; never widen scope silently.
- Any step fails after mutation began: restore every touched file from the pre-edit capture and report the failure; never leave the home updated while a duplicate still stands or a pointer is broken.
- The audit finds nothing that genuinely improves: terminal no-op — change nothing and report that.

## Output
The consolidation report (occurrences, classifications, home, decisions) plus one terminal classification: `consolidated` — the home holds the complete truth and every former copy resolves to it; `blocked` — with the exact missing approval or decision; `no-op` — nothing genuinely improved, zero edits made.

## Provenance

Adapted from the ODIN 1.x current skill at `skills/consolidate-to-one-home/SKILL.md` (origin `odin-1.x-current-skill`, no pinned revision, project-owned with no third-party license). Re-normalized to the ODIN 2.0 section order; the external edit-safety reference was replaced with the inline rollback-capture step and peer-skill routing was dropped as prohibited cross-skill pointing.
