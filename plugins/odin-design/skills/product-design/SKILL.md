---
name: product-design
description: 'Use when deciding what an interface should do before UI is built or audited: interaction consequences, action scope, reachable states, naming, and accessibility of the product decision. Read-only analysis; produces a chat report with findings and routed follow-on work. Not for visual implementation; use prototype.'
---

# Product design

## Contract

| Field | Bound contract |
|---|---|
| Trigger | product design, what should this do, interface should do, before anyone builds it, product requirements |
| Authority | Read-only analysis of the user request, existing project files, design system artifacts, and AGENTS.md. No code, no file mutation, no credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only: product decisions, surface definitions, findings, and routed follow-on work. |
| Done | A report is returned defining what the interface does, its surfaces and reachable states, scope and consequence per action, findings with rule IDs, and routed follow-on work; or the report is labeled INCOMPLETE with the blocking gap named. |

## Inputs

Required:
- The user's request text.

Required when available:
- The project design system, existing UI, or AGENTS.md.
- The surface or component under design.
- Any existing spec, brief, or mockup.

## Procedure

1. Classify the request into one mode. Pick exactly one from the mode table below; when the verb is ambiguous, shape is the default. Modes chain: shape leads into spec; review leads into harden. Done when: one mode is named.

2. Locate authority in this order: (a) the user's explicit goal and constraints, (b) verified user and product evidence, (c) project-canonical guidance in AGENTS.md and the design system, (d) this skill's standards. Load `references/rules.md` plus the mode's other reference files as listed in the mode table; rules.md loads in every mode. Every rule ID cited later must appear in a loaded file. Done when: the authority order is resolved and the mode's references are loaded.

3. Write the internal brief (shape, spec, harden) before proposing UI: job, desired outcome, consequence, object, action scope, permissions, as defined in rules.md. If job, desired outcome, or consequence cannot be filled, stop and ask; do not propose UI. For spec and action, name the object, scope, and consequence for each action in scope. For shape, spec, and harden, enumerate every reachable state per surface against the checklist in surfaces.md and mark each reachable or unreachable with a reason. Done when: the brief is complete, per-action scope and consequence are named where required, and the reachable-state checklist is walked where required.

4. Name scope and consequences and apply the loaded standards. Cite a rule ID for every finding and every non-mechanical decision. If no loaded rule governs a decision, record a coverage gap inline (three parts: proposed slug, the decision it would govern, category); never cite an invented ID. For review and harden, order findings P0-P3 by user impact; each finding carries location, verification status, rule ID, user consequence, the smallest concrete fix, and the accountable domain owner. Done when: every finding and non-mechanical decision carries a rule ID or a coverage gap, and review/harden findings are P0-P3 ordered with all six fields.

5. Report findings and route follow-on work. Classify follow-on work by accountable domain: build changes belong to the implementation owner; exact wording to the copy and UX owner; passage timing to the motion owner; deep type treatment to the typography owner. Return that ownership map as data; do not invoke another skill. Then run the pass self-check: label the report `INCOMPLETE` if a finding lacks a rule ID, a cited ID was invented, or the internal brief is missing job, desired outcome, or consequence. Done when: the ownership map is returned and the self-check has run.

### Modes

| Mode | Dispatch when the user asks for | Load |
|---|---|---|
| shape (default) | design the flow, what control here, how should this work, a brief with no settled UI | rules.md, product-judgment.md |
| spec | spec the right interaction, define the expected states | rules.md, surfaces.md, naming-and-copy.md, product-judgment.md; mark implementation as a separate accountable domain |
| review | review this flow for product correctness, is this the right interaction | rules.md, interface-quality.md |
| action | what should this action affect, which object or scope, action reversibility unsettled | rules.md, naming-and-copy.md; classify wording polish under copy and UX ownership |
| harden | make this resilient, what breaks here | rules.md, surfaces.md, interface-quality.md, product-judgment.md |

All paths are relative to this skill's `references/` directory.

review mode judges the product decision, not rendered-artifact quality. For a component or UI audit, return a complete surface-audit brief with the target, primary task, reachable states, and verified product constraints; do not perform an unrelated visual implementation review here.

## Failure and recovery

| Failure | Response |
|---|---|
| Cannot fill job, desired outcome, or consequence in the internal brief | Stop and ask. Do not propose UI. |
| A rule ID is invented (does not appear in the loaded references) | Record a coverage gap instead. Never cite a made-up ID. |
| Scope is ambiguous | Ask. Do not widen scope without explicit user authorization. |
| Request spans multiple authorities | Return an ownership map by accountable domain. Finish this skill's product-decision scope and do not invoke another skill. |

Partial-result rule: emit what is complete and label the report INCOMPLETE. Do not fabricate findings to fill the template.

## Output

Product design report containing: the mode applied; the internal brief (shape, spec, harden): job, desired outcome, consequence, object, action scope, permissions; object, scope, and consequence for each action in scope (spec, action); the reachable-state checklist with each state marked reachable or not for this surface (shape, spec, harden); findings ordered P0-P3 by user impact, each with location, verification status, rule ID, user consequence, smallest concrete fix, and accountable domain owner (review, harden); coverage gaps recorded inline with proposed slug, decision, and category; the ownership map routing follow-on work to accountable domains; and the INCOMPLETE label when any self-check fails. Output length follows the work, not the template. Drop sections a pass did not need.
