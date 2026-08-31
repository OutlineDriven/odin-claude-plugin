---
name: principle-experience-first
description: 'Use when scoping a product or feature set, resolve tradeoffs by prioritizing fewer fully-polished experiences over many partially-built ones. Every retained feature earns its place through a concrete quality guarantee. Don''t use for tasks that require source or remote-system changes.'
---

# Principle experience first

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Resolve product or UX scope tradeoffs. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Constrains feature scope only. No state change. |
| Done | Every retained feature earns its place. |

## Inputs

- The candidate feature list or scope proposal under evaluation.
- The quality bar: what polish, completeness, or UX standard each feature must meet to ship.
- Resource constraints: team size, timeline, or budget that bound how many features can reach the quality bar.

All three inputs must be supplied. If the quality bar is absent, define the minimum shippable standard for the product context before proceeding.

## Procedure

1. Name the product context and the audience. State what problem the product solves for that audience.
2. List every candidate feature in the current scope proposal.
3. For each feature, answer: can this feature reach the defined quality bar within the available resources? Classify each as **full**, **partial**, or **stub**.
4. Remove every feature classified as **stub**. A stub feature is one that would ship in a visibly incomplete or unpolished state.
5. For each remaining **partial** feature, ask: does cutting this feature harm the core experience defined in step 1? If no, cut it.
6. Count the features that survive steps 4 and 5. If the count exceeds what the resources in step 3 can fully polish, cut from the bottom of the list until the remaining set fits.
7. For each surviving feature, write one sentence stating the quality guarantee: what the user will experience when the feature is complete.
8. Confirm that no surviving feature lacks a quality guarantee from step 7. If any do, return to step 3 for that feature.

## Failure and recovery
- **Scope exceeds resources**: Cut features from the bottom of the priority list. Do not reduce the quality bar to fit more features.
- **Quality bar is vague**: Use the simplest version that delivers the core value of the product context from step 1. Do not defer the definition.
- **Stakeholder insists on keeping stubs**: Present the tradeoff explicitly: fewer polished experiences versus many incomplete ones. The principle resolves in favor of polish. If the stakeholder overrides, document the override and its expected cost.
- **Non-convergence**: If three passes through steps 3-6 do not produce a stable set, the product context from step 1 is under-specified. Stop and request clarification of the core problem before continuing.

## Output
A reduced feature set where every item has a written quality guarantee. A scope document listing retained features, cut features with the reason for each cut, and the quality guarantee per retained feature.

## Provenance

Adapted from pstack/skills/principle-experience-first/SKILL.md (cursor/plugins, revision 68836ddaf5697224520f1847d90cdb90ca8babaa). Licensed MIT per pstack/LICENSE blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25. Clean-room adaptation: procedure rewritten for ODIN 2.0 self-contained execution; no third-party expression retained.
