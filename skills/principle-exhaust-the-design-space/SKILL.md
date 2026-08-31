---
name: principle-exhaust-the-design-space
description: 'Use when choosing a novel interaction or architecture. Generates and compares structurally distinct prototypes to select the best approach with evidence. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Principle: exhaust the design space

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Choose a novel interaction or architecture. |
| Authority | Reversible-local: write only local prototype artifacts and a decision record; rollback by deleting those files. |
| Side effect | Creates competing prototypes as local files. |
| Done | Evidence-backed selection among alternatives recorded in a decision record. |

## Inputs

- **Required:** A design decision to make: an interaction pattern, architectural choice, or component structure.
- **Optional:** Constraints such as target platform, performance budget, accessibility requirements, or existing patterns to respect.

## Procedure

1. State the design decision as a single sentence. Identify what must be chosen and why it matters.
2. Enumerate at least three structurally distinct alternatives. Each alternative must represent a genuinely different approach — not parameter variations of the same approach. If fewer than three distinct alternatives exist, state the boundary explicitly and proceed with what exists.
3. For each alternative, sketch a minimal prototype that demonstrates its core mechanism. The prototype must be concrete enough to evaluate but need not be complete. Use the simplest artifact that reveals the approach's shape: a component skeleton, a data-flow diagram, a state machine, or a usage example.
4. Define evaluation criteria before comparing. Derive criteria from the stated constraints and the decision's purpose. Each criterion must be measurable or observable — not aesthetic preference.
5. Evaluate each prototype against the criteria. Record observations, not judgments. Note where an alternative excels and where it fails.
6. Compare alternatives side by side. Rank them by how well they satisfy the criteria. Identify trade-offs explicitly.
7. Select the winning approach. State the selection, the evidence supporting it, and the trade-offs accepted. Record this in a decision artifact that includes the problem statement, alternatives considered, criteria, comparative evidence, and the chosen approach with rationale.

## Failure and recovery
- **Insufficient alternatives:** If the design space yields fewer than three structurally distinct approaches, state the constraint that limits the space and proceed with the alternatives found. Do not fabricate variations that are not genuinely distinct.
- **Prototype too costly:** If a prototype cannot be sketched within reasonable effort, simplify the sketch to its essential mechanism. If even that fails, document the approach as a written description with its known trade-offs and mark it as unprototyped.
- **Criteria ambiguous or conflicting:** Return to step 4. Clarify or prioritize criteria before proceeding. Do not evaluate against unclear standards.
- **No clear winner:** Document the tie explicitly. State which criteria each alternative leads on and what additional information or constraint would break the tie. Do not select arbitrarily.
- **Scope creep:** If exploration reveals the decision is larger than stated, stop. Record the finding and recommend re-scoping before continuing. Do not widen the decision boundary without explicit approval.

## Output
A decision record containing:
- The design decision as stated
- Each alternative with its prototype or description
- The evaluation criteria
- Comparative evidence from evaluation
- The selected approach with rationale and accepted trade-offs

The decision record is a local file. Prototype artifacts are local files alongside it.

## Provenance

Adapted from pstack principle-exhaust-the-design-space (cursor/plugins, revision 68836ddaf5697224520f1847d90cdb90ca8babaa). Original authored by Lauren Tan (poteto) under MIT license (pstack/LICENSE blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25). Clean-room adaptation: procedure rewritten for ODIN 2.0 self-contained execution with explicit failure classes and evaluation gates. No original expression retained.
