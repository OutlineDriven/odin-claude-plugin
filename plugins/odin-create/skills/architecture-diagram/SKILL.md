---
name: architecture-diagram
description: 'Use when the user asks to visualize an architecture as a self-contained HTML artifact with a hash-bound receipt. Also handles delta mode: comparing two snapshots, rendering what changed when both are supplied. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Architecture diagram

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to visualize an architecture as a self-contained HTML artifact with a hash-bound receipt, or supplies two architecture snapshots for delta comparison. |
| Authority | Reversible local writes to the HTML artifact and JSON receipt or sidecar. No remote, credential, publish, deploy, or irreversible mutation. |
| Side effect | One HTML artifact and one JSON receipt or sidecar written to disk. |
| Done | Single: frozen schema-validated specification, self-contained interactive HTML artifact, and evidence receipt with all showcase checks passing. Delta: every comparable element classified into exactly one category, self-contained Before/Delta/After HTML artifact, and sidecar receipt written. |

## Mode

Two render modes, discriminated by input count:

- Single (default): one architecture question or scope → schema-validated specification + interactive HTML artifact + evidence receipt.
- Delta: two already-authored architecture snapshots → classify every comparable element as added, removed, changed, or unchanged; render a Before/Delta/After HTML artifact + machine-readable sidecar receipt.

Pick delta when the user supplies both a before and an after snapshot and asks what changed. Otherwise single.

## Refusals

- No remote, credential, publish, deploy, or irreversible mutation in either mode.
- No risk assessment, blast-radius estimate, runtime causality claim, or merge recommendation in delta output — the delta describes authored additions, removals, and modifications only.
- No partial artifact delivered as complete; a non-converged run returns blocked with the failing check named.
- No inferred or fabricated repository evidence in single mode; unverified claims are discarded or requested, never assumed.

## Inputs

- Single mode: the user's architecture question or scope, any supplied facts, and an optional repository path or checkout.
- Delta mode: two already-authored architecture snapshots (before and after), each a JSON document conforming to the architecture contract; a working directory path for the output artifact and sidecar receipt; an optional label pair for the Before and After columns.
- The architecture schema and common schema that authoritatively type the intermediate specification are part of the workflow, not external skills.

## Procedure — single mode

1. Receive the user's question and any supplied facts. If a repository is named, bound scope to it before any mutation. Done when: scope is bounded or confirmed unbounded by user intent.
2. For every repository-backed claim, verify it against the repository: entrypoints, runtime boundaries, transports, storage, deployment configuration; record origin, revision, blob identifiers, and cited lines. Discard any unverified claim. Done when: every claim is proven or discarded, none inferred.
3. Build the typed architecture specification as JSON conforming to the architecture and common schemas. Done when: every component, boundary, relationship, and label is schema-valid.
4. Freeze the specification and compute its hash. Done when: hash is recorded.
5. Render one self-contained interactive HTML artifact from the frozen specification — all styles, scripts, and data inline, no external network reference, renders with network access unavailable. Done when: artifact is self-contained.
6. Run the nine showcase checks: architecture-schema validation, common-schema validation, self-containment, no-network render, component coverage, relationship coverage, zero composition errors, zero composition warnings, receipt binds hashes. Done when: all nine pass.
7. If any check fails, stop and report the failing check; do not widen scope or relax a check. Done when: failure is named or all checks pass.
8. Optionally capture bounded visual-check screenshots and a contact sheet; report visual-review status truthfully. Done when: visual-review status is reported.
9. Write the JSON evidence receipt binding specification hash, artifact hash, check results, and visual-review status. Done when: receipt is written.

## Procedure — delta mode

1. Read both snapshots. Validate each independently against the architecture contract (component identity, relationship identity, required fields). Done when: both validate, or the failing snapshot and constraint are named.
2. Confirm comparability: each component and relationship carries a stable authored identity. Pair only by stable identity using conservative boundary keys (identity field plus type). Elements lacking stable identity are incomparable; fail closed. Done when: every element is paired or marked incomparable.
3. Classify every comparable element into exactly one category: added (after-only), removed (before-only), changed (both, identity matches, ≥1 non-identity field differs), unchanged (both, all fields match). Done when: every comparable element has exactly one classification.
4. For changed elements, record before and after field values per differing field. Do not infer cause, direction, or intent. Done when: field-level diffs recorded without inference.
5. Assign an honest proof level: full when every element paired by stable identity and all fields compared; partial when any element was incomparable and excluded. State it in the output. Done when: proof level is stated.
6. Render one self-contained Before/Delta/After HTML artifact — three sections (Before as authored, Delta as classified, After as authored), all CSS and JavaScript inlined, no external resource. Done when: artifact is self-contained with three sections.
7. Write one machine-readable sidecar receipt (JSON): input snapshot identifiers, proof level, per-element classification list, deterministic hash of the classification set. Done when: receipt is written.
8. Commit the HTML artifact and sidecar receipt as an atomic pair. If the commit fails, preserve previously trusted outputs and report the commit failure without overwriting them. Done when: pair is committed or failure is reported with prior outputs preserved.
9. Assert no risk assessment, blast-radius estimate, runtime causality claim, or merge recommendation in any output. Done when: output describes authored additions, removals, and modifications only.

## Failure and recovery

- Schema validation failure (either mode): do not emit the artifact; report the offending field and constraint. Roll back by discarding in-progress work and deleting files already written.
- Composition error or warning (single): re-derive layout from the frozen specification and re-run showcase checks; do not freeze a degraded delivery.
- Unverified repository claim (single): discard the claim or stop and request evidence; never infer or fabricate.
- Self-containment failure (either): re-inline the resource or stop; never declare self-contained when it is not.
- Showcase-check failure (single): stop with the blocked result naming the failing check; do not relax checks or widen scope.
- Incomparable inputs (delta): elements lack stable authored identity or boundary keys cannot pair them. Fail closed; report the incomparable element set. No classification emitted for incomparable elements; proof level is partial only if some elements were comparable, otherwise blocked.
- Determinism violation (delta): a second run over the same inputs produces a different classification set. Report the divergence; do not emit a result.
- Atomic commit failure (delta): preserve previously trusted outputs; report the commit error. Artifact and receipt remain on disk but are not marked trusted.
- Partial-result rule (either): no partial artifact or classification is delivered as complete; a non-converged run returns blocked.

## Output

Single mode: a frozen schema-validated architecture JSON specification; one self-contained interactive HTML artifact; optionally bounded visual-check screenshots and a contact sheet; a JSON evidence receipt binding specification hash, artifact hash, nine showcase-check results, and truthful visual-review status. Terminal classification: delivered or blocked.

Delta mode: one self-contained Before/Delta/After HTML artifact; one machine-readable sidecar receipt (JSON) recording input identifiers, proof level, per-element classification, and a deterministic classification-set hash. Terminal classification: every comparable element classified, incomparable inputs failed closed, honest proof level stated, no unsupported risk or merge recommendation asserted.
