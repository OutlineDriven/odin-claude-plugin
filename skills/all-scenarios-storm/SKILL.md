---
name: all-scenarios-storm
description: 'Use when a user wants to enumerate plausible designs, configurations, scenarios, and implementation paths and diagram the finished field before choosing. Produces an exhaustive enumerated field and a diagram before any choice is made. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

The decision subject: the design, system, or problem whose solution space is being stormed. State the dimensions to enumerate (designs, configurations, scenarios, implementation paths, or a subset). Optionally supply constraints, known invariants, or excluded paths to bound the field.

## Procedure

1. State the decision subject and the enumeration dimensions the user named. If the user did not name dimensions, default to all four: designs, configurations, scenarios, and implementation paths.
2. Bound the field: list constraints, invariants, and explicitly excluded paths the user supplied. Mark anything unbounded as an assumption, not a fact.
3. Enumerate every plausible option per dimension exhaustively. For each option record a one-line description and the key tradeoff or risk that distinguishes it from its neighbors. Do not collapse options into a recommendation at this stage.
4. Cross-reference options across dimensions: note which designs enable which configurations, which scenarios stress which paths, and which combinations are mutually exclusive or reinforcing.
5. Produce a diagram of the finished field. Use a structure that shows the option set and its cross-references (a tree, matrix, or graph). Every enumerated option must appear in the diagram.
6. Present the diagrammed field to the user. Do not choose. The user selects from the enumerated, diagrammed field.

## Failure and recovery
- **Incomplete enumeration**: if a dimension has options the agent cannot enumerate without inventing evidence, stop that dimension, mark it as incomplete with the specific gap, and continue the others. Do not fabricate options to fill the gap.
- **Diagram does not match the field**: if the diagram omits any enumerated option or shows an option that was not enumerated, rebuild the diagram from the enumerated list before presenting.
- **Scope drift**: if the user asks the agent to choose or implement during enumeration, stop and restate the contract: the skill enumerates and diagrams; it does not choose. Resume only after the user confirms the enumeration-and-diagram scope.
- **Partial result**: a partial field with incomplete dimensions is deliverable only if every incomplete dimension is explicitly marked. Never present a partial field as exhaustive.

## Output
A local artifact containing the exhaustive enumerated field (one-line descriptions and tradeoffs per option, cross-references across dimensions) and a diagram of the full field. No recommendation or chosen path is produced.

## Provenance

Origin: user-curated skill idea (`project-owned:user-curated-skill-ideas`) and raw chat brief (`project-owned:user-supplied-source-brief`). The raw chat names the technique "pre-resulting" — enumerating all possible outcomes before commitment — and assigns the alias `/time-stone`, which is merged into this contract with no surviving alias. No third-party license applies; project-owned clean-room adaptation.
