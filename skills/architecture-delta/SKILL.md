---
name: architecture-delta
description: 'Use when the user asks to compare two already-authored architecture snapshots and render exactly what changed between them. Every comparable authored element is deterministically classified as added, removed, changed, or unchanged into a self-contained Before/Delta/After artifact with a machine-readable receipt. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Architecture delta

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to compare two already-authored architecture snapshots and render exactly what changed between them. |
| Authority | Reversible local writes only. Write one self-contained Before/Delta/After HTML artifact and one machine-readable sidecar receipt to the working directory. A failed atomic pair commit preserves previously trusted outputs; no other file, VCS, credential, paid, published, deployed, or remote mutation is permitted. |
| Side effect | Writes one self-contained Before/Delta/After HTML artifact and a machine-readable sidecar receipt; a failed atomic pair commit preserves previously trusted outputs. |
| Done | Every comparable authored element is deterministically classified as added, removed, changed, or unchanged, incomparable inputs fail closed, the result carries an honest proof level, repeated runs over the same inputs are deterministic, and no unsupported risk or merge recommendation is asserted. |

## Inputs

- Two already-authored architecture snapshots (before and after), each a JSON document conforming to the architecture contract. Both must be supplied; neither is optional.
- A working directory path for the output artifact and sidecar receipt. Must be supplied.
- An optional label pair for the Before and After columns in the rendered artifact.

## Procedure

1. Read both architecture snapshots. Validate each independently against the architecture contract (component identity, relationship identity, required fields). If either fails validation, stop and report the validation failure; do not classify.
2. Confirm both snapshots are comparable: each component and relationship carries a stable authored identity. Pair components and relationships only by stable authored identity using conservative boundary keys (identity field plus type). Elements lacking a stable identity are incomparable; mark the run as incomparable and fail closed.
3. Classify every comparable authored element into exactly one category: added (present in after, absent in before), removed (present in before, absent in after), changed (present in both, identity matches, but one or more non-identity fields differ), or unchanged (present in both, identity and all fields match).
4. For changed elements, record the before and after field values for each differing field. Do not infer the cause, direction, or intent of a change.
5. Assign an honest proof level to the result: full when every element paired by stable identity and all fields were compared; partial when any element was incomparable and excluded. State the proof level in the output.
6. Render one self-contained Before/Delta/After HTML artifact containing three sections: Before (the before snapshot as authored), Delta (the classified additions, removals, and modifications), and After (the after snapshot as authored). Inline all CSS and JavaScript; reference no external resource.
7. Write one machine-readable sidecar receipt (JSON) recording: the input snapshot identifiers, the proof level, the per-element classification list, and a deterministic hash of the classification set.
8. Commit the HTML artifact and sidecar receipt as an atomic pair. If the commit fails, preserve previously trusted outputs and report the commit failure without overwriting them.
9. Assert no risk assessment, blast-radius estimate, runtime causality claim, or merge recommendation in any output. The result describes authored additions, removals, and modifications only.

## Failure and recovery
- Validation failure: one or both snapshots do not conform to the architecture contract. Stop before classification. Report which snapshot and which constraint failed. No artifact or receipt is written.
- Incomparable inputs: elements lack stable authored identity or conservative boundary keys cannot pair them. Fail closed. Report the incomparable element set. No classification is emitted for incomparable elements; the proof level is partial only if some elements were comparable, otherwise the run is blocked.
- Determinism violation: a second run over the same inputs produces a different classification set. Report the divergence. Do not emit a result.
- Atomic commit failure: the HTML artifact and sidecar receipt could not be committed as a pair. Preserve previously trusted outputs. Report the commit error. The artifact and receipt remain on disk but are not marked trusted.
- Partial-result rule: never emit a partial classification as a complete result. If any comparable element is unclassified, the run is blocked.
- Rollback: no mutation occurs outside the named artifact and receipt. A failed commit leaves prior trusted outputs intact.

## Output
- One self-contained Before/Delta/After HTML artifact at the working directory path.
- One machine-readable sidecar receipt (JSON) at the working directory path, recording input identifiers, proof level, per-element classification, and a deterministic classification-set hash.
- A terminal classification: every comparable authored element classified as added, removed, changed, or unchanged; incomparable inputs failed closed; honest proof level stated; no unsupported risk or merge recommendation asserted.

## Provenance

Origin: https://github.com/tt-a1i/archify, revision b36d79fdbc3aec3728744341485a7e79f03c0071, MIT license (Copyright (c) 2026 tt-a1i (Archify); Copyright (c) 2025 Cocoon AI (original "architecture-diagram-generator")). Clean-room adaptation: source expression is not copied; the workflows and mechanisms are re-derived from the observable contracts. The MIT copyright and permission notice is preserved.
