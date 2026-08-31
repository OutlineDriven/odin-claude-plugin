---
name: from-breaking-perspective
description: 'Use when a user wants an answer only from the breaking seat (stakeholders, dependencies, accounting, compatibility under destructive pressure). A breaking-perspective answer is emitted without blending. Don''t use for tasks that require source or remote-system changes.'
---

# From breaking perspective

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants an answer only from the breaking seat (stakeholders, dependencies, accounting, compatibility under destructive pressure). |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | A breaking-perspective analysis emitted as chat output. |
| Done | A breaking-perspective answer is emitted without blending. |

## Inputs

The subject to analyze (a decision, design, change, or situation). Optional: the specific destructive pressure to apply (cost, removal, dependency failure, stakeholder withdrawal). Everything else is derived from the subject.

## Procedure

1. Identify the subject and the destructive pressure the user named. If the user named none, apply the full breaking seat: stakeholders, dependencies, accounting, and compatibility under destructive pressure.
2. Answer only from the breaking seat. Treat the subject as if the destructive pressure is actually applied: which stakeholders break, which dependencies fail, what the accounting shows under loss, and what stays compatible when parts are removed.
3. Do not blend other perspectives (business, codebase, impact, career, rent-seeking, innovation, stability, moat, human, skeptic) into the answer. Each lens answers only from its named seat; lenses are compared after their independent outputs, never mid-answer.
4. Stop when the breaking-seat analysis is complete. Do not recommend a decision or reconcile with other lenses; that is a later comparison step outside this skill.

## Failure and recovery
- **Blended answer**: if the output mixes another lens, restart from step 2 and remove the non-breaking content. The done predicate requires no blending.
- **Missing subject**: if no subject is supplied, ask for one. Do not invent a subject.
- **No destructive pressure named and none derivable**: apply the full breaking seat by default; this is not a failure.

## Output
A breaking-perspective analysis covering stakeholders, dependencies, accounting, and compatibility under destructive pressure, with no content from other lenses.

## Provenance

Origin: user-curated perspective-lens framework in `project-owned:user-curated-skill-ideas`. Revision: unversioned. License: project-owned. Adaptation: clean-room restatement of the breaking-seat lens contract; no third-party expression copied.
