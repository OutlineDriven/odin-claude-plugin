---
name: workflow-diagram
description: 'Use when a user asks to visualize a process, approval flow, runbook, CI/CD path, responsibility lanes, or tool calls. Produces a schema-validated spec and one self-contained interactive HTML artifact with a hash-bound receipt. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Workflow diagram

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user asks to visualize a process, approval flow, runbook, CI/CD path, responsibility lanes, tool calls, or another ordered workflow. |
| Authority | Reversible local writes only: a typed workflow JSON specification, one self-contained interactive HTML artifact, and optionally bounded visual-check screenshots, a contact sheet, and a JSON evidence receipt. Roll back by deleting the written files; no VCS, credential, paid, published, deployed, or remote mutation occurs. |
| Side effect | Writes only the named local artifacts above. No network access is required at render time. |
| Done | The workflow validates fail-closed, preserves one obvious main path and truthful relationship labels, passes all nine showcase artifact checks with no warnings or composition failures, and is delivered with hash-bound receipts and truthful visual-review status. |

## Inputs

- The user's workflow facts: phases, lanes, groups, nodes, edges, the main path, and relationship labels.
- Optional: a repository path or checkout. When supplied, verify every repository-backed claim before adding it to the specification: entrypoints, runtime boundaries, tool calls, approval gates, and cited lines.
- The workflow schema and common schema that authoritatively type the intermediate specification. These are part of the workflow, not external skills.

## Procedure

1. Receive the user's workflow facts. If a repository is named, bound scope to it before any mutation. Done when: facts are received and scope is bounded.
2. For every repository-backed claim, verify it against the repository: locate entrypoints, runtime boundaries, tool calls, and approval gates; record origin, revision, blob identifiers, and the cited lines that prove each claim. Discard any claim that cannot be verified; do not infer or fabricate evidence. Done when: every repository-backed claim is verified or discarded.
3. Build the typed workflow specification as JSON conforming to the workflow schema and the common schema. Every lane, phase, group, node, edge, main path, and relationship label must be schema-valid. Done when: specification is schema-valid.
4. Identify and preserve one obvious main path through the workflow. The main path is the primary execution flow from start to completion; it must be explicitly marked and visually distinguishable. Done when: main path is identified and marked.
5. Apply deterministic diagnostics to repair geometry: resolve overlapping nodes, fix broken edge routing, and ensure legible layout without altering the logical structure. Done when: geometry is repaired with logical structure preserved.
6. Freeze the specification and compute its hash. Done when: specification is frozen with hash computed.
7. Render one self-contained interactive HTML artifact from the frozen specification. The HTML must contain all styles, scripts, and data inline; it must not reference an external network resource and must render correctly without runtime network access. Done when: HTML artifact is rendered and self-contained.
8. Run the nine showcase checks against the frozen specification and the rendered artifact: (1) specification validates against the workflow schema; (2) specification validates against the common schema; (3) HTML artifact is self-contained with no external network references; (4) HTML renders without runtime network access; (5) every node declared in the specification appears in the rendered diagram; (6) every edge declared in the specification is rendered with truthful relationship labels; (7) the main path is visually distinguishable from secondary paths; (8) no composition errors are present (no overlapping, clipped, or broken layout elements); (9) the evidence receipt binds the specification hash and the artifact hash. Done when: all nine checks pass, or the step has stopped naming the failing check.
9. If any check fails, stop and report the failing check; do not widen scope or relax a check to pass. Done when: all checks pass or the failing check is named and the step has stopped.
10. Optionally capture bounded visual-check screenshots and a contact sheet for visual review. Report visual-review status truthfully; never claim a visual check passed when it did not. Done when: visual review is captured or skipped with truthful status reported.
11. Write the JSON evidence receipt binding the specification hash, the artifact hash, the check results, and the visual-review status. Done when: evidence receipt is written.

## Failure and recovery

- Schema validation failure: the specification is not conformant. Do not emit the artifact; report the offending field and the schema constraint. Roll back by discarding the in-progress specification; delete any files already written.
- Composition error or warning: the rendered layout is broken or degraded. Do not freeze the delivery; report the offending element. Re-derive the layout from the frozen specification and re-run the showcase checks.
- Unverified repository claim: a claim could not be proven against the repository. Discard the claim or stop and request the missing evidence; never infer, assume, or fabricate repository evidence.
- Self-containment failure: the HTML references an external network resource. Re-inline the resource or stop; never declare the artifact self-contained when it is not.
- Main path not preserved: the obvious main path is not visually distinguishable. Re-render with the main path highlighted; never claim the done predicate holds when the main path is ambiguous.
- Relationship label falsehood: an edge label does not match the user-supplied relationship. Correct the label or stop; never claim truthful labels when they are not.
- Showcase-check failure: a named check did not pass. Stop with the blocked result naming the failing check; do not relax checks, widen scope, or pretend the done predicate holds.
- Partial-result rule: no partial artifact is delivered as complete. A non-converged run returns the blocked result with the failing check named and no claim of success.

## Output
A frozen schema-validated workflow JSON specification, one self-contained interactive HTML artifact with one obvious main path and truthful relationship labels, optionally bounded visual-check screenshots and a contact sheet, and a JSON evidence receipt binding the specification hash, artifact hash, nine showcase-check results, and truthful visual-review status — with a terminal classification of delivered (all checks pass) or blocked (a named check failed).
