---
name: architecture-diagram
description: 'Use when the user asks to visualize components, services, infrastructure, cloud or security boundaries, network topology, or a repository-backed system architecture. Produce a schema-validated architecture specification and one self-contained interactive HTML artifact with a hash-bound evidence receipt. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Architecture diagram

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to visualize components, services, infrastructure, cloud or security boundaries, network topology, or a repository-backed system architecture. |
| Authority | Reversible local writes only: a typed architecture JSON specification, one self-contained interactive HTML artifact, and optionally bounded visual-check screenshots, a contact sheet, and a JSON evidence receipt. Roll back by deleting the written files; no VCS, credential, paid, published, deployed, or remote mutation occurs. |
| Side effect | Writes only the named local artifacts above. No network access is required at render time. |
| Done | The frozen specification validates against the architecture and common schemas, delivery exits zero with all nine showcase checks passing, zero composition errors and warnings, the receipt binds specification and artifact hashes, the HTML works without runtime network access, and visual-review status is reported truthfully. |

## Inputs

- The user's architecture question or scope, and any required facts they supply.
- Optional: a repository path or checkout. When supplied, every repository-backed claim must be verified against the repository before it enters the specification: entrypoints, runtime boundaries, transports, storage, deployment configuration, origin, revision, blob identifiers, and cited lines.
- The architecture schema and common schema that authoritatively type the intermediate specification. These are part of the workflow, not external skills.

## Procedure

1. Receive the user's question and any supplied facts. If a repository is named, bound scope to it before any mutation.
2. For every repository-backed claim, verify it against the repository: locate entrypoints, runtime boundaries, transports, storage, and deployment configuration; record origin, revision, blob identifiers, and the cited lines that prove each claim. Discard any claim that cannot be verified; do not infer or fabricate evidence.
3. Build the typed architecture specification as JSON conforming to the architecture schema and the common schema. The schemas are authoritative for the intermediate representation; every component, boundary, relationship, and label must be schema-valid.
4. Freeze the specification and compute its hash.
5. Render one self-contained interactive HTML artifact from the frozen specification. The HTML must contain all embedded styles, scripts, and data inline; it must not reference any external network resource and must render correctly with runtime network access unavailable.
6. Run the nine showcase checks against the frozen specification and the rendered artifact:
   1. The specification validates against the architecture schema.
   2. The specification validates against the common schema.
   3. The HTML artifact is self-contained with no external network references.
   4. The HTML renders without runtime network access.
   5. Every component declared in the specification appears in the rendered diagram.
   6. Every relationship declared in the specification is rendered.
   7. No composition errors are present (no overlapping, clipped, or broken layout elements).
   8. No composition warnings are present.
   9. The evidence receipt binds the specification hash and the artifact hash.
7. If any check fails, stop and report the failing check; do not widen scope or relax a check to pass.
8. Optionally capture bounded visual-check screenshots and a contact sheet for visual review. Report visual-review status truthfully; never claim a visual check passed when it did not.
9. Write the JSON evidence receipt binding the specification hash, the artifact hash, the check results, and the visual-review status.

## Failure and recovery
- Schema validation failure: the specification is not conformant. Do not emit the artifact; report the offending field and the schema constraint. Roll back by discarding the in-progress specification; delete any files already written.
- Composition error or warning: the rendered layout is broken or degraded. Do not freeze the delivery; report the offending element. Re-derive the layout from the frozen specification and re-run the showcase checks.
- Unverified repository claim: a claim could not be proven against the repository. Discard the claim or stop and request the missing evidence; never infer, assume, or fabricate repository evidence.
- Self-containment failure: the HTML references an external network resource. Re-inline the resource or stop; never declare the artifact self-contained when it is not.
- Showcase-check failure: a named check did not pass. Stop with the blocked result naming the failing check; do not relax checks, widen scope, or pretend the done predicate holds.
- Partial-result rule: no partial artifact is delivered as complete. A non-converged run returns the blocked result with the failing check named and no claim of success.

## Output
A frozen, schema-validated architecture JSON specification; one self-contained interactive HTML artifact that renders without runtime network access; optionally bounded visual-check screenshots and a contact sheet; and a JSON evidence receipt binding the specification hash, artifact hash, nine showcase-check results, and truthful visual-review status. The terminal classification is either delivered (all checks pass) or blocked (a named check failed).

## Provenance

Origin: https://github.com/tt-a1i/archify, revision b36d79fdbc3aec3728744341485a7e79f03c0071, MIT license (LICENSE blob 4c27b7152c7e4593dfdd153761ce178177d30464). Copyright (c) 2026 tt-a1i (Archify); Copyright (c) 2025 Cocoon AI (original "architecture-diagram-generator"). Adaptation: clean-room re-derivation from the observable contracts; source expression is not copied. The MIT copyright and permission notice is preserved: the above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
