---
name: rewrite-clean-v0
description: 'Use when a document or file has been edited piecemeal and reads as sediment. Not for re-deriving a code subsystem contract: use breaking-driven.'
---

# Rewrite clean V0

## Contract

| Field | Bound contract |
|---|---|
| Trigger | artifact edited piecemeal and reads as sediment / rewrite properly / start it over / re0 this |
| Authority | Reversible local: writes only named local artifacts; version-control is the rollback path |
| Side effect | rewrites the target artifact in place; version-control recoverable, no file removal |
| Done | artifact reads as a clean v0 to fresh eyes, with removed/kept reported |

## Inputs

- **Target artifact** (required): the file or document to rewrite. Identified from the request or the active context.

## Procedure

1. **Pin the target.** Identify the artifact from the request or the active context. Read it end to end. Name any nearby artifacts that must stay aligned.
2. **Strip the noise.** Remove scaffolding residue, stale deltas, duplicated process noise, deprecated information, and over-specific history. A log of what changed stays out of the artifact unless the artifact is a changelog.
3. **Fold in what lasted.** Move durable lessons into the place they should have lived from the start, not as an appended note.
4. **Rewrite, do not append.** Start the artifact fresh from what is true now. Keep its useful voice and structure; cut everything else.
5. **Smooth the prose.** Fold a parenthetical that interrupts a sentence into its own clause or cut it. Keep a repeated word or point once within reach. Unwrap a hard line break that splits a sentence mid-flow so each paragraph or list item lives on one source line. Make a plain-text pointer to a section or file followable.
6. **Cut again.** Re-read the result cold and tighten what remains.

## Failure and recovery
- Cannot pin target: stop; return blocked.
- Nothing to improve: change nothing; return unchanged.
- External reference unreachable: stop; do not continue with an unverified pointer.

Partial-result rule: if rewrite is interrupted, the on-disk artifact is left in whatever state the last completed step left it. Version-control history is the rollback path.

## Output
The rewritten artifact on disk. A report listing what was removed and what was kept. A pass that finds nothing to genuinely improve changes nothing.
