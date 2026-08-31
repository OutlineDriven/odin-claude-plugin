---
name: all-scenarios-storm
description: 'Use when a user wants to enumerate plausible designs, configurations, scenarios, and paths and diagram the field before choosing. Produces an exhaustive enumerated field and a diagram before any choice. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# All scenarios storm

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to enumerate plausible designs, configurations, scenarios, and implementation paths and diagram the finished field before choosing. |
| Authority | Reversible local write only. Produce the enumerated field and diagram as local artifacts. Do not mutate version control, credentials, deployed state, or remote systems. |
| Side effect | An exhaustive field of designs/configs/scenarios/paths and a diagram. |
| Done | An exhaustive field is enumerated and diagrammed before a choice is made. |

## Inputs

- Decision subject: the design, system, or problem whose solution space is being stormed.
- Enumeration dimensions: designs, configurations, scenarios, implementation paths, or a subset.
- **Bounds** (optional): constraints, known invariants, or excluded paths.

## Procedure

1. State the decision subject and the dimensions the user named. If the user did not name any, default to all four: designs, configurations, scenarios, and implementation paths. Done when: the subject and dimensions are named.
2. Bound the field. List the constraints, invariants, and explicitly excluded paths the user supplied. Mark anything unbounded as an assumption, not a fact. Done when: constraints and excluded paths are listed; unbounded items are marked as assumptions.
3. Exhaustively enumerate every plausible option in each dimension. For every option, record a one-line description and the key tradeoff or risk that distinguishes it from neighboring options. Do not turn the options into a recommendation at this stage. Done when: every plausible option has a one-line description and tradeoff.
4. Cross-reference the dimensions. Note which designs enable which configurations, which scenarios stress which paths, and which combinations are mutually exclusive or reinforcing. Done when: enabling, stressing, exclusive, and reinforcing combinations are noted.
5. Diagram the finished field as a tree, matrix, or graph that shows the option set and its cross-references. Every enumerated option must appear in the diagram. Done when: every enumerated option appears in the diagram.
6. Present the diagrammed field to the user without choosing. The user selects from the enumerated, diagrammed field. Done when: the field is presented without choosing.

## Failure and recovery
- Incomplete enumeration: if you cannot enumerate a dimension without inventing evidence, stop work on that dimension, mark it incomplete with the specific gap, and continue with the others. Do not fabricate options to fill the gap.
- Diagram does not match the field: if the diagram omits an enumerated option or shows an option that was not enumerated, rebuild it from the enumerated list before presenting it.
- Scope drift: if the user asks you to choose or implement during enumeration, stop and restate the contract: the skill enumerates and diagrams; it does not choose. Resume only after the user confirms the enumeration-and-diagram scope.
- Partial result: a partial field with incomplete dimensions is deliverable only when every incomplete dimension is explicitly marked. Never present a partial field as exhaustive.

## Output
A local artifact containing the exhaustive enumerated field (one-line descriptions and tradeoffs per option, cross-references across dimensions) and a diagram of the full field. No recommendation or chosen path is produced.
