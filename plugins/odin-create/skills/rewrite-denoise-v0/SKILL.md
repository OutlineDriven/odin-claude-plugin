---
name: rewrite-denoise-v0
description: 'Use when a user asks to clean up, sync, dedupe, de-noise, or rewrite an iterated artifact. Rewrites it as a clean v0 with no patch traces, changelog scars, or source noise. Not for a sediment rewrite of prose — use rewrite-clean-v0.'
---

# Rewrite denoise V0

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to clean up/sync/dedupe/de-noise/rewrite an iterated artifact, or nearby artifacts may have drifted |
| Authority | Reversible-local: write only the named target artifact; restore from backup on failure |
| Side effect | Rewrites the target artifact in place; no new files unless explicitly asked |
| Done | Result reads as a clean v0 to fresh eyes: lighter, current, accurate; no patch traces, no changelog scars |

## Inputs

- Target artifact (required): the file path to rewrite.
- Scope hint (optional): user-supplied boundary or focus area within the artifact.

## Procedure

1. Confirm the target artifact exists on disk. If it does not, stop; report `MISS` and do not create a replacement.
2. Read the full artifact. Record its current content as the rollback snapshot.
3. Identify source noise: lines that are raw source dumps, one sentence per line where the source wrapped, or list items split across multiple lines that belong on one line.
4. Unwrap source noise: merge wrapped paragraphs into single logical lines; merge split list items into one line per item. Preserve meaning; do not paraphrase.
5. Identify sediment: patch traces, changelog scars, duplicate passages, stale deltas, historical aliases, compatibility notes, and content that no longer reflects the current state.
6. Rewrite the entire artifact from scratch as a clean v0. Do not patch the existing text; derive it fresh from the current facts. Keep only what is current, accurate, and load-bearing.
7. Apply edit-safety conventions:
   - Assert every referenced target exists before editing. Report `MISS` if not found; never silently skip.
   - Use unicode-safe operations on all text.
   - Apply changes per occurrence, never as a blanket sweep.
   - Script large structural moves as explicit steps rather than single edits.
   - When in doubt, repair from the source of truth rather than guessing.
8. Verify the result reads as a clean v0 to fresh eyes: lighter than the original, current, accurate, with no patch traces or changelog scars.
9. Write the rewritten artifact to the original path, replacing it in place.
10. If the user asked for new files (e.g., a diff or summary), produce those as well.

## Failure and recovery
- Target missing: the artifact does not exist at the given path. Stop immediately. Report `MISS`. Do not create a new file.
- Rewrite drifts from contract: the rewritten content introduces claims, structure, or scope not present in the original. Discard the rewrite. Restore from the rollback snapshot. Report what drifted.
- Verification fails: the result does not read as a clean v0: patch traces, changelog scars, or source noise remain. Do not write. Iterate the rewrite or restore from snapshot.
- Partial result: if the rewrite is interrupted after step 9, the artifact is in an unknown state. Restore from the rollback snapshot and restart.

## Output
The target artifact rewritten in place as a clean v0. Optionally, additional files if the user requested them.
