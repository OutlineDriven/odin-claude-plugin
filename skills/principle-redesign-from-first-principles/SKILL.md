---
name: principle-redesign-from-first-principles
description: 'Use when asked to integrate a requirement without bolting it on. Propagate structural edits so the design remains coherent. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Principle redesign from first principles

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Integrate a requirement without bolting it on. |
| Authority | Write only named local artifacts; state the rollback path. |
| Side effect | Propagates redesign across affected structures. |
| Done | Coherent design incorporating the requirement. |

## Inputs

- **Requirement**: The new constraint, property, or behavior to integrate. Must be supplied.
- **Target scope**: The codebase region, module, or design surface affected. Must be supplied or derivable from the requirement.
- **Design context**: Existing architecture, invariants, and conventions. Optional; discovered from the codebase if not supplied.

## Procedure

1. **Bound scope.** Identify every artifact the requirement touches: types, interfaces, modules, tests, configuration. List them explicitly before any mutation.
2. **Extract first principles.** From the existing design, name the invariants, constraints, and structural decisions that define coherence. Write them as explicit claims.
3. **Evaluate requirement against principles.** For each principle, determine whether the requirement reinforces, conflicts with, or is orthogonal to it. Document conflicts explicitly.
4. **Resolve conflicts.** When the requirement conflicts with a principle, either revise the principle (with justification) or reshape the requirement to preserve coherence. Never suppress a conflict.
5. **Propagate structural edits.** Apply changes that maintain the revised principle set across all affected artifacts. Each edit must be traceable to a principle or conflict resolution.
6. **Verify coherence.** Confirm that the revised design set is internally consistent: no orphaned references, no contradictory invariants, no partial migrations.
7. **State rollback path.** For each modified artifact, record the original state or the VCS revision that restores it.

## Failure and recovery
| Failure class | Behavior |
|---|---|
| Scope exceeds local artifacts | Stop. Report the boundary. Do not widen scope. |
| Conflicting principles with no resolution | Stop. Report the conflict. Do not suppress or choose arbitrarily. |
| Partial propagation detected | Stop. Report which artifacts are inconsistent. Do not declare done. |
| Rollback path missing | Stop. Record the missing path. Do not proceed without recovery evidence. |

On any failure, leave modified artifacts in their current state and report the exact blocker. Do not pretend the done predicate holds.

## Output
- Modified artifacts with structural edits propagated.
- Rollback path for each artifact.
- Coherence report confirming no orphaned references, contradictory invariants, or partial migrations.

## Provenance

- Origin: cursor/plugins, pstack/skills/principle-redesign-from-first-principles/SKILL.md
- Revision: 68836ddaf5697224520f1847d90cdb90ca8babaa
- License: MIT (pstack/LICENSE blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25; authored by Lauren Tan (poteto))
- Adaptation: Clean-room adaptation for ODIN 2.0 odin-code-advanced module. Source mechanism preserved: day-one redesign principle propagating structural edits.
