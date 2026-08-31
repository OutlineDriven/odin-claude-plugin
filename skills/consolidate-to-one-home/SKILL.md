---
name: consolidate-to-one-home
description: 'Use when the same rule, constant, or definition is repeated across files and the user says "consolidate this" or "ssotize this". Folds scattered statements into one canonical home and replaces copies with pointers after explicit approval. No remote or irreversible mutation.'
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

- The fact to consolidate: the specific rule, constant, or definition. It must be one statement, not a whole document, and the user must supply it.
- The audit scope: the files or directories to enumerate. It is optional and defaults to the paths where the user saw the repetition. Widen it only with explicit approval.

## Procedure

1. Name the truth: restate the single statement being consolidated in one sentence, distinct from the surrounding documents. Done when: the statement is restated in one sentence.
2. Audit read-only. Enumerate every occurrence of the statement across the artifacts in scope, each with file and location. Done when: every occurrence is enumerated with file and location.
3. Re-enumerate by a second method (different search pattern, symbol index, or reverse direction) and confirm it surfaces nothing the first pass missed. Done when: the second method confirms the first pass was complete or surfaces missed occurrences.
4. Classify each occurrence as exact copy, paraphrase, partial, stale, or contradictory. Done when: every occurrence has a classification.
5. Pick the canonical home: the most authoritative, best-maintained location closest to where the fact actually changes. Propose creating a new home in scope if none exists. Never promote a weak copy because it is convenient. Done when: a canonical home is picked with a one-line justification.
6. Report the audit before any edit: occurrences with locations, each classification, the proposed home with a one-line justification, unique details to fold in, contradictions needing a human decision, and the exact mutation plan naming every file to change. Wait for explicit approval; no edit lands before it. Done when: the audit is reported and explicit approval is received or the skill awaits it.
7. Capture the pre-edit content of every file in the approved plan as the rollback path. Done when: every file's pre-edit content is captured.
8. Fold unique details into the canonical home first and reconcile contradictions there per the approval decisions. Done when: the canonical home holds the complete truth with contradictions reconciled.
9. Replace each duplicate with a live reference to the home. Remove now-redundant copies, leaving a one-line pointer only where deletion would leave readers without context. Done when: every duplicate is replaced with a pointer or removed.
10. Verify every pointer resolves to the home and the home alone states the complete truth. Done when: every pointer resolves and the home alone states the complete truth.

## Failure and recovery
- Undecided contradiction: report the conflicting statements and stop read-only; never guess a resolution.
- Out-of-scope occurrence found after approval: stop, re-report including the widened scope, and wait for new approval; never widen scope silently.
- Any step fails after mutation began: restore every touched file from the pre-edit capture and report the failure; never leave the home updated while a duplicate still stands or a pointer is broken.
- The audit finds nothing that genuinely improves: terminal no-op — change nothing and report that.

## Output
Consolidation report (occurrences, classifications, home, decisions) plus terminal classification: `consolidated` (home holds complete truth, every copy resolves to it), `blocked` (missing approval or decision named), or `no-op` (nothing improved, zero edits).

## Provenance

Adapted from the ODIN 1.x current skill at `skills/consolidate-to-one-home/SKILL.md` (origin `odin-1.x-current-skill`, no pinned revision, project-owned with no third-party license). Re-normalized to the ODIN 2.0 section order; the external edit-safety reference was replaced with the inline rollback-capture step and peer-skill routing was dropped as prohibited cross-skill pointing.
