---
name: grill-the-core
description: 'Use when the user wants root-shape repair instead of a symptom-first fix, debug, or resolve; the run repairs the long-horizon root shape with full review-history context and no monkey patches until the project check set passes clean. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Grill the core

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants root-shape repair instead of symptom-first fix/debug/resolve. |
| Authority | Write only the named local source artifacts; revert via the working tree or VCS. |
| Side effect | Long-horizon root-shape fix with full review-history context and no monkey patches, limited to the named local artifacts. |
| Done | Root shape is repaired and the project check set passes with no monkey patches. |

## Inputs

- The failing symptom, test, or review finding to repair. Must be supplied.
- The project check command that defines "passes". Must be supplied or discoverable in the repo.
- Full review history for the affected surface: prior review comments, fix attempts, and reverted patches. Must be gathered from the repo and VCS before any mutation.
- The named local artifacts in scope. Must be stated before any edit.

## Procedure

1. Reject symptom-first framing. Before any edit, restate the defect as a root-shape problem: name the structural cause, not the surface symptom, and write it down.
2. Gather full review-history context for the affected surface. Read prior review comments, fix attempts, and reverted patches from the repo and VCS so the repair is not blind to history.
3. Bound scope. List the named local artifacts to be edited. Do not widen scope to unrelated code, and do not add retries, validation, telemetry, or abstraction unless they are the root-shape repair.
4. Repair the root shape. Change the structure so the defect cannot recur: eliminate the special case, fix the data model, or correct the boundary that let the symptom through.
5. After every behavioral change, run a fresh review. A reviewer that did not author the change examines it against the root-shape claim and the check set. Do not self-approve.
6. Run the project check set. Confirm it passes with no monkey patches, shims, special-cased inputs, or suppressed symptoms left in the diff.
7. If a monkey patch, shim, or symptom suppression appears, remove it and return to step 4.

## Failure and recovery
- Symptom-creep: if the repair drifts back to patching the symptom, stop, restate the root-shape problem, and restart at step 4.
- Monkey-patch detected: if the check set passes only because of a shim, special-cased input, or suppressed error, the done predicate is not met. Remove the patch and re-repair.
- Fresh-review failure: if the fresh reviewer rejects the change, address the rejection at the root shape. Do not override or silence the reviewer.
- Non-converged: if the root shape cannot be repaired within the named scope, or the check set cannot pass without a monkey patch, stop and report the blocked root-shape cause and the artifacts tried. Do not pretend the done predicate holds.
- Rollback: edits are limited to named local artifacts; revert via the working tree or VCS. Never widen scope to force convergence.

## Output
- A repaired root shape in the named local artifacts.
- A root-shape statement naming the structural cause and the structural fix.
- The fresh-review verdict for each behavioral change.
- The project check set result, with confirmation that no monkey patch, shim, or symptom suppression remains.
- On non-convergence, a blocked report naming the root-shape cause, the artifacts tried, and why the check set cannot pass without a patch.

## Provenance

- Origin: local user-curated skill idea `grill-the-core` from `project-owned:user-curated-skill-ideas`, supplemented by `project-owned:user-supplied-source-brief`.
- Revision: none pinned (local working artifact).
- License: project-owned. Clean-room adaptation of the user's curated brief; no third-party expression copied.
- Adaptation: normalized the one-line brief into a bounded, falsifiable contract, preserving the root-shape-repair mechanism, the full review-history context, the no-monkey-patch rule, and the fresh-reviewer-per-behavioral-change rule.
