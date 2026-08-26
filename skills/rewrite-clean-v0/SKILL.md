---
name: rewrite-clean-v0
description: 'Rewrite a drifted artifact as a clean v0 instead of patching it again, re-deriving it from what is true now so stale deltas, duplicated passages, and changelog scars do not survive. Use when a document or file has been edited piecemeal across a session and reads as sediment, or the user says "rewrite this properly", "start it over", or "re0 this". For a code subsystem whose contract needs re-deriving, use breaking-driven; for sweeping a whole markdown tree, use purge-slop-docs.'
---
# Rewrite clean v0

Rewrite a drifted artifact as if it were the first clean version. Not a patch over an old draft.

## Method

1. **Pin the target.** Identify the artifact from the request or the active context. Read it end to end. Name nearby artifacts that must stay aligned.
2. **Strip the noise.** Remove scaffolding residue, stale deltas, duplicated process noise, deprecated information, and over-specific history. A log of what changed stays out of the artifact unless the artifact is a changelog.
3. **Fold in what lasted.** Move any durable lesson into the place it should have lived from the start, not as an appended note.
4. **Rewrite, do not append.** When appending would preserve sediment, start the artifact fresh from what is true now. Keep its useful voice and structure; cut everything else.
5. **Smooth the prose.** Fold a parenthetical that interrupts a sentence into its own clause or cut it. Keep a repeated word or point once within reach. Unwrap a hard line break that splits a sentence mid-flow so each paragraph or list item lives on one source line. Make a plain-text pointer to a section or file followable.
6. **Cut again.** Re-read the result cold and tighten what remains. See `../clean-and-true/references/idioms.md` for edit safety.

## Completion

The result reads as a clean v0 to fresh eyes: no trace of the older draft, no sign it was patched. Report what was removed and what was kept. A pass that finds nothing to genuinely improve changes nothing.

