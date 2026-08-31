---
name: sequence-diagram
description: 'Use when a user asks to visualize a time-ordered interaction. Authors a typed sequence JSON spec and a self-contained interactive HTML artifact named by the user. Not for static architecture diagrams.'
---

# Sequence diagram

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to visualize an API call chain, request lifecycle, asynchronous exchange, cache miss, return path, or another time-ordered interaction. |
| Authority | Reversible-local: write only the two named artifacts (`<name>.sequence.json` and `<name>.sequence.html`) and explicitly requested sidecars. Rollback deletes any partial write. |
| Side effect | Writes a typed sequence JSON specification and one self-contained interactive HTML artifact, with optional bounded visual-evidence sidecars. No other file, VCS, credential, paid, published, deployed, or remote mutation. |
| Done | Every participant and authored message is represented in source order, the specification validates fail-closed, the artifact passes the showcase and delivery gates, and the receipt records truthful status. |

## Not for

- Static architecture or component diagrams.

## Inputs

- Required: the natural-language description of the interaction to visualize (participant names, message names, direction, sequence, optional activations or variants).
- Required: a diagram name. Ask for it when absent. The name determines the exact output paths `<name>.sequence.json` and `<name>.sequence.html`. Collision policy: if either target file already exists, stop and ask the user to confirm overwrite or supply a different name.
- Optional: explicit request for bounded visual-evidence sidecars alongside the HTML artifact.

## Procedure

1. Extract and bound the fact set. Parse the user's description to identify participant names, message names, direction (caller to callee), sequence order, and any optional activations or variants. Bound the fact set before mutation. Reject if fewer than 2 participants or fewer than 1 message. Done when: the fact set is bounded and passes the minimum-size check, or the rejection is reported.

2. Author the typed JSON against a fully closed schema. Construct the JSON with this structure:
   - `title`: string, the diagram title.
   - `participants`: array of objects in source order, each with `name` (nonempty string, unique across all participants) and optional `type` (string).
   - `messages`: array of objects in source order, each with `from` (participant name matching a participant), `to` (participant name matching a participant), `label` (string), `order` (integer, 1-based, unique and sequential across all messages), and optional `direction` (one of `"request"`, `"response"`, `"self"`).
   - `activations` (optional): array of objects with `participant` (name matching a participant), `startOrder` (integer referencing an existing message order), `endOrder` (integer referencing an existing message order, must be greater than or equal to `startOrder`).
   - `variants` (optional): array of objects with `label` (string), `messageOrders` (array of integers each referencing an existing message order).
   - Additional properties are rejected at every level. All integers must be positive and bounded by the message count. Done when: the JSON is authored with all fields populated against the closed schema.

3. Write the spec to the resolved path, then validate the written file fail-closed against the schema. Write `<name>.sequence.json`. Load the written file and validate: every `from` and `to` value matches a participant `name`; every `order` value is unique and sequential from 1; every activation `startOrder` is less than or equal to `endOrder` and both reference existing message orders; every variant `messageOrders` entry references an existing message order; no additional properties exist at any level. Stop on any validation error and delete the partial write. Done when: the spec file is written and validates fail-closed, or the validation error is reported with the partial write rolled back.

4. Author and write the self-contained HTML rendering. Generate interactive HTML that renders all participants on horizontal lanes, messages as labeled arrows in source order, activations as stacked bars, and variants as labeled branches. The artifact must not fetch external resources. Interactive hover or click states are permitted. Write `<name>.sequence.html`. Done when: the HTML file is written to disk.

5. Run the showcase gate and the delivery gate, then emit a truthful receipt. Showcase gate: visually review the HTML artifact via browser tool or render simulation. Verify all named participants are present, all messages appear in the correct source order, arrows are labeled, and the layout is legible. Delivery gate: confirm both the JSON spec file and the HTML artifact file exist on disk and are non-empty. Emit a receipt recording the final paths, spec validation status, showcase gate pass/fail, delivery gate pass/fail, and visual-review status. Do not emit a pass receipt if any gate failed. Roll back any partial writes on gate failure. Done when: both gates are run and the receipt is emitted with truthful status.

## Failure and recovery

| Class | Result |
|---|---|
| Schema validation failure | BLOCKED with the exact validation error. No receipt. Partial write deleted. |
| Showcase gate failure | NON_CONVERGED. Artifact does not represent all participants or messages in source order. Re-author and re-run the gate. |
| Delivery gate failure | NON_CONVERGED. Spec or artifact file absent or empty. Roll back any partial writes. |
| HTML render failure | BLOCKED. Stop. Do not emit a pass receipt. |
| Name collision | BLOCKED. Ask the user to confirm overwrite or supply a different name. |

Partial-result rule: if any step fails, roll back reversible writes before returning. Do not leave a partial artifact on disk without a failure report.

## Output

`<name>.sequence.json` (typed sequence JSON specification) and `<name>.sequence.html` (self-contained interactive HTML artifact), plus a receipt with final paths, spec validation status, showcase gate pass/fail, delivery gate pass/fail, and visual-review status.
