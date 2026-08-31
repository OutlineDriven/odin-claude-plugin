---
name: sequence-diagram
description: 'Use when a user asks to visualize a time-ordered interaction, write a typed sequence JSON spec and a self-contained interactive HTML artifact. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Sequence diagram

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to visualize an API call chain, request lifecycle, asynchronous exchange, cache miss, return path, or another time-ordered interaction. |
| Authority | reversible-local: write only the named local artifacts (typed sequence JSON spec and self-contained HTML artifact); rollback to zero state if any step fails. |
| Side effect | Writes a typed sequence JSON specification and one self-contained interactive HTML artifact, with optional bounded visual-evidence sidecars. No other file, VCS, credential, paid, published, deployed, or remote mutation. |
| Done | Every participant and authored message is represented in source order, the specification validates fail-closed, the artifact passes the complete showcase and delivery gates, and the final receipt and visual-review status are truthful. |

## Inputs

Must be supplied:
- The user's natural-language description of the interaction to visualize (participant names, message names, direction, sequence, optional activations or variants).

Optional:
- Explicit request for bounded visual-evidence sidecars alongside the HTML artifact.

The skill self-contains all schema governance. No reference to another skill, AGENTS.md, system prompt, rule file, or session history.

## Procedure

1. **Extract interaction facts.** Parse the user's description to identify participant names, message names, direction (caller → callee), sequence order, and any optional activations or variants. Bound the fact set before mutation.
2. **Validate fact bounds.** Reject if fewer than 2 participants or fewer than 1 message. Stop rather than widen scope.
3. **Construct typed sequence JSON.** Author the JSON with this inlined structure:
   - `title`: string — the diagram title.
   - `participants`: array of objects in source order, each with `name` (string) and optional `type` (string).
   - `messages`: array of objects in source order, each with `from` (participant name), `to` (participant name), `label` (string), `order` (integer, 1-based), and optional `direction` (one of `"request"`, `"response"`, `"self"`).
   - `activations` (optional): array of objects with `participant` (name), `startOrder` (integer), `endOrder` (integer).
   - `variants` (optional): array of objects with `label` (string), `messageOrders` (array of integers referencing message `order` values).
   Do not copy source expression; re-derive from the observable contracts.
4. **Write spec file.** Perform a reversible local write of the sequence JSON spec to `*.sequence.json`. Rollback the write if a subsequent step fails.
5. **Validate specification.** Load the written spec and validate fail-closed against the inlined structure from step 3: every `from` and `to` value must match a participant `name`; every `order` value must be unique and sequential; every activation `startOrder` and `endOrder` must reference existing message orders; every variant `messageOrders` entry must reference an existing message order. Stop on any validation error.
6. **Generate HTML artifact.** Author self-contained interactive HTML that renders the sequence diagram: all participants on horizontal lanes, messages as labeled arrows in source order, activations as stacked bars, variants as labeled branches. The artifact must not fetch external resources. Interactive hover or click states are permitted.
7. **Write HTML artifact.** Perform a reversible local write of the HTML artifact to `*.sequence.html`. Rollback on failure.
8. **Deliver optional sidecars.** If the user explicitly requests visual-evidence sidecars, write them as additional local files bounded to the same session scope. Do not invent sidecar content.
9. **Run showcase gate.** Visually review the HTML artifact via browser tool or render simulation. Verify all named participants are present, all messages appear in the correct source order, arrows are labeled, and the layout is legible. Stop if any participant or message is missing, misordered, or unlabeled.
10. **Run delivery gate.** Confirm both the JSON spec file and the HTML artifact file exist on disk and are non-empty. Stop if either is absent or empty.
11. **Emit receipt.** Record the final paths of the spec and artifact. Mark visual-review status as truthful pass or fail. Do not emit a pass receipt if any gate failed.

## Failure and recovery
| Class | Result |
|---|---|
| Schema validation failure | BLOCKED with the exact validation error message. No receipt. |
| Showcase gate failure | NON_CONVERGED. Artifact does not represent all participants or messages in source order. Re-author and re-run the gate. |
| Delivery gate failure | NON_CONVERGED. Spec or artifact file absent or empty. Roll back any partial writes. |
| HTML render failure | BLOCKED. Stop. Do not emit a pass receipt. |

Partial-result rule: if any step fails, roll back reversible writes before returning. Do not leave a partial artifact on disk without a failure report.

## Output
- `*.sequence.json`: the typed sequence JSON specification.
- `*.sequence.html`: the self-contained interactive HTML artifact.
- Receipt: final paths, spec validation status, showcase gate pass/fail, delivery gate pass/fail, visual-review status.

## Provenance

Origin: https://github.com/tt-a1i/archify, revision b36d79fdbc3aec3728744341485a7e79f03c0071.

License: MIT. Copyright (c) 2026 tt-a1i (Archify). Copyright (c) 2025 Cocoon AI (original "architecture-diagram-generator"). The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

Adaptation: clean-room re-derivation. Source expression is not copied. Workflows and mechanisms are re-derived from the observable contracts of the sequence schema, the rendering interaction, and the validation gates. Reuse is compatible with clean-room adaptation requirements.
