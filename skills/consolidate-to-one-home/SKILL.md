---
name: consolidate-to-one-home
description: 'Fold a scattered fact into a single home and point the rest at it. Use when the same rule, constant, or definition is restated in several files, or the user says "consolidate this", "make this the single source of truth", or "ssotize this". The consolidation is proposed and approved before any edit lands. To deduplicate a skills or prompt tree, use dedup-skills; for doc-versus-code drift, use sync-docs.'
---
# Consolidate to one home

Find where one truth lives, get approval for the consolidation plan, then collapse it into one canonical home.

## Method

1. **Name the truth** - the specific fact or value being tracked, not the whole document.
2. **Audit read-only.** Enumerate every occurrence across the artifacts in scope.
3. **Re-enumerate by a second method** and confirm it surfaces nothing the first pass missed.
4. **Classify each occurrence** as exact copy, paraphrase, partial, stale, or contradictory.
5. **Pick the canonical home** - the most authoritative and most maintained location, closest to where the fact actually changes. Extract a new home if none exists. Never promote a weak copy because it is convenient.
6. **Report the audit** before any edit: occurrences, kinds, actions, the proposed home with a one-line justification, unique details to fold in, contradictions needing a decision, and the exact mutation plan. Wait for explicit approval. See `../clean-and-true/references/idioms.md` for edit safety.
7. **Fold in unique detail** and reconcile contradictions in the canonical home first.
8. **Replace each duplicate** with a live reference to the home. Remove the now-redundant copies, leaving a one-line pointer where a deletion would orphan a reader.

## Completion

The audit was reported and approved before mutation, or the run stayed read-only. The canonical home holds the complete truth. Every former copy references it and resolves. No unique detail was lost. A pass that finds nothing to genuinely improve changes nothing.

