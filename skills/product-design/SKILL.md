---
name: product-design
description: 'Use when deciding what an interface should do before UI is built or audited: interaction, scope, consequence, reachable states, and accessibility. Produces product decisions, surface definitions, and routed follow-on work. Not for visual implementation — use prototype.'
---

# Product design

## Contract

| Field | Bound contract |
|---|---|
| Trigger | product design, what should this do, interface should do, before anyone builds it, product requirements |
| Authority | Read existing project files, design system artifacts, and AGENTS.md; produce no code, file mutation, credential, or remote mutation. |
| Side effect | Produces chat output only: product decisions, surface definitions, routed follow-on work. |
| Done | Report returned defining what the interface does, its surfaces, lint patterns, naming and copy decisions, and product judgment. |

## Inputs

Required:
- The user's request text.

Required when available:
- The project design system, existing UI, or AGENTS.md.
- The surface or component under design.
- Any existing spec, brief, or mockup.

Optional:
- Mode inference from the request verb.

## Procedure

1. Classify the request into one mode. Done when: the stated outcome holds.

2. Locate authority in this order: (a) the user's explicit goal and constraints, (b) verified user and product evidence, (c) project-canonical guidance in AGENTS.md and the design system, (d) this skill's product design standards. Done when: the stated outcome holds.

3. Load that mode's references (all modes load `rules.md` inline). Done when: the stated outcome holds.

4. For shape, spec, harden: write the internal brief before proposing UI. Stop and ask if the job, desired outcome, or consequence field cannot be filled. Done when: the stated outcome holds.

5. For spec and action: name the object, scope, and consequence for each action in scope. Done when: the stated outcome holds.

6. For shape, spec, harden: enumerate every reachable state and check coverage against the reachable-state checklist. Done when: the stated outcome holds.

7. Apply standards; cite a rule ID for every finding and non-mechanical decision. If no existing ID governs a decision, record a coverage gap inline (three parts: proposed slug, decision it would govern, category). Done when: the stated outcome holds.

8. For review and harden: order findings P0-P3 by user impact. Each finding carries location, verification status, rule ID, user consequence, the smallest concrete fix, and the accountable domain owner. Done when: the stated outcome holds.

9. Classify follow-on work by accountable domain: build changes belong to the implementation owner; exact wording to the copy and UX owner; passage timing to the motion owner; deep type treatment to the typography owner. Return that ownership map as data; do not invoke another skill. Done when: the stated outcome holds.

10. Run the pass self-check. Label the report `INCOMPLETE` if: a finding lacks a rule ID, a cited ID was invented, or the internal brief is missing job, desired outcome, or consequence. Done when: the stated outcome holds.

### Modes

| Mode | Dispatch when the user asks for | Load |
|---|---|---|
| shape (default) | design the flow, what control here, how should this work, a brief with no settled UI | rules.md inline, product-judgment.md inline |
| spec | spec the right interaction, define the expected states | rules.md inline, surfaces.md inline, naming-and-copy.md inline, product-judgment.md inline; mark implementation as a separate accountable domain |
| review | review this flow for product correctness, is this the right interaction | rules.md inline, interface-quality.md inline |
| action | what should this action affect, which object or scope, action reversibility unsettled | rules.md inline, naming-and-copy.md inline; classify wording polish under copy and UX ownership |
| harden | make this resilient, what breaks here | rules.md inline, surfaces.md inline, interface-quality.md inline, product-judgment.md inline |

rules.md loads in every mode; it is inlined below.

review mode is about the product decision, not rendered-artifact quality. For a component or UI audit, return a complete surface-audit brief with the target, primary task, reachable states, and verified product constraints; do not perform an unrelated visual implementation review here.

Modes chain: shape leads into spec; review leads into harden.

## Failure and recovery
| Failure | Response |
|---|---|
| Cannot fill job, desired outcome, or consequence in the internal brief | Stop and ask. Do not propose UI. |
| A rule ID is invented (does not appear in rules.md inline) | Record a coverage gap instead. Never cite a made-up ID. |
| Scope is ambiguous | Ask. Do not widen scope without explicit user authorization. |
| Request spans multiple authorities | Return an ownership map by accountable domain. Finish this skill's product-decision scope and do not invoke another skill. |

Partial-result rule: emit what is complete and label the report INCOMPLETE. Do not fabricate findings to fill the template.

## Output
Product design report containing: - Mode applied. - Internal brief (shape, spec, harden): job, desired outcome, consequence, object, action scope, permissions. - Object, scope, and consequence for each action in scope (spec, action). - Reachable-state coverage checklist with each state marked reachable or not for this surface (shape, spec, harden). - Findings ordered P0-P3 by user impact, each with: location, verification status, rule ID, user consequence, smallest concrete fix, and accountable domain owner (review, harden). - Coverage gaps recorded inline with proposed slug, decision, and category. - Routing to owning skills for follow-on work. - INCOMPLETE label when any self-check fails. Output length follows the work, not the template. Drop sections a pass did not need.
