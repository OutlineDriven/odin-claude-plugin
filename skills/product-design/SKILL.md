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

## Provenance

Origin: mblode/agent-skills, skills/product-design/SKILL.md and references/ (e97a3b383f5944f90d41eb92b24b4fb3b917a7f9).
License: MIT. Copyright (c) 2026 Matthew Blode. Adaptation: rules.md inline per skill-foundry contract; support references inlined under semantic-minimum; cross-skill routing replaced with accountable-domain labels and complete data handoffs.

---

### rules.md (inline)

Stable rule IDs cited in every pass. Cite an ID exactly as written. Never invent one. If a needed rule is missing, record a coverage gap.

### Interaction and control selection

- `rule/control-matches-cardinality`: 2–3 static mutually exclusive options use radio or segmented control, not a select.
- `rule/navigation-vs-action`: use a link for navigation, a button for an action. Do not style one as the other.
- `rule/inline-before-modal`: prefer inline disclosure (expand, popover) over a modal.
- `rule/smallest-intervention`: before adding UI, evaluate a better default, a behavior change, or reuse of an existing pattern.
- `rule/no-nested-modals`: never open a modal from within a modal.

### Action naming and consequence

- `rule/name-object-scope-consequence`: state the object (what), scope (how many, whose), and consequence (reversible or not) before the user commits.
- `rule/destructive-names-action`: destructive CTAs use Verb plus Noun. Never `Confirm`, `OK`, `Yes`.
- `rule/destructive-proportional`: make friction proportional to impact; offer undo when honest.
- `rule/preserve-user-input`: preserve input through validation failures and recoverable errors.

### State coverage

- `rule/cover-reachable-states`: design every state the surface can actually enter. A happy-path-only design is incomplete.
- `rule/empty-state-action`: empty states name the object and offer the first action.
- `rule/error-states-recovery`: error states explain and offer recovery; never raw exception text.
- `rule/loading-stable-labels`: keep the control label stable while busy.

### Accessibility as a product concern

- `rule/accessible-name-required`: every interactive control has an accessible name.
- `rule/keyboard-complete-flow`: the primary flow is completable by keyboard alone.
- `rule/no-custom-focus-bypass`: do not remove the shared focus ring.

### Hierarchy and structure

- `rule/one-primary-action`: at most one primary action per surface.
- `rule/structure-before-containers`: group with hierarchy and spacing before adding borders or cards.
- `rule/preserve-mental-model`: preserve user context unless changing it solves a verified problem.
- `rule/value-before-interruption`: reach the core value moment before any secondary interruption.

### Copy rule IDs (applied in naming-and-copy.md below)

`rule/destructive-names-action`, `rule/no-confirm-ok-labels`, `rule/canonical-verb`, `rule/error-states-recovery`, `rule/success-state-specific`, `rule/empty-state-action`, `rule/loading-state-specific`, `rule/permission-benefit-first`, `rule/reads-without-seeing`.

---

### surfaces.md (inline)

Load in shape, spec, harden modes.

### Reachable-state checklist

For each surface, mark each state reachable or not:

- Loading (initial and per-action busy)
- Empty (no data yet)
- Sparse (one or a few items)
- Populated (success case)
- Partial or stale (some pending or outdated)
- Validation (inline, before submit)
- Error (action or load failed)
- Permission-denied
- Disabled (and why)
- Optimistic (shown before server confirms)
- Destructive-in-progress (confirm, pending, undo window)
- Responsive (compact and wide; long content; large values)

Map only reachable states. Invent no permission-denied state for a surface everyone reaches.

### Loading

Keep the trigger label stable while busy. Distinguish initial load from per-action busy. Prefer specific copy over "Loading...". A load that can hang must resolve into error, not hang forever.

### Empty

Name the object and offer the first action. Distinguish never-had-any from filtered-to-zero. No dead ends.

### Error

State what happened, why when known, and the recovery action. Never raw exception text. Preserve every field the user entered on failure.

### Destructive

Name the object and consequence. Offer undo when the system can honestly support it. Design in-progress and post-action states.

### Overlays

Never nest modals. Long content must not push confirm and cancel out of reach. Focus moves into the overlay on open and returns to the trigger on close.

---

### product-judgment.md (inline)

Load in shape mode and for any material product or flow decision.

### Internal brief (required before proposing UI in shape, spec, harden)

- User: who is acting.
- Job: what they want, in their words.
- Current behavior: what happens today and where it fails.
- Desired outcome: the behavior that solves the job.
- Success signal: how success will be known.
- Non-goals: what this explicitly does not do.
- Object: the product noun being acted on.
- Action, scope, consequence: what changes, how much, reversible or not.
- Permissions: who can do this and the unprivileged path.
- Open decisions: unresolved product questions.

Stop and ask if job, desired outcome, or consequence cannot be filled.

### Control selection

| The choice is | Use | Avoid |
|---|---|---|
| 2–3 static mutually exclusive options | Radio or segmented control | Select that hides options |
| Many or dynamic options | Select or combobox | Long radio list |
| Binary on/off applied immediately | Switch | Checkbox needing a save |
| Binary agreement saved with a form | Checkbox | Switch |
| Navigation to a location | Link | Button that pushes history |

When two controls both fit, choose the one keeping options visible and reversible.

### Smallest coherent intervention

Before adding UI: (1) better default, (2) behavior change, (3) reuse of existing pattern, (4) new UI only when the above do not solve the job.

### Decision checklist

For each non-mechanical change, answer: what user problem does this solve, why this component, what consequence must the interface communicate, which evidence supports the decision, what is the smallest coherent change.

---

### naming-and-copy.md (inline)

Load in action mode and whenever an action's object, scope, consequence, or reversibility is unsettled.

### Verb disambiguation

| If the action | Use | Not |
|---|---|---|
| Permanently destroys the object | Delete | Remove |
| Detaches without destroying | Remove | Delete |
| Reversibly hides | Archive | Delete |
| Abandons an in-progress flow | Cancel | Discard |
| Drops unsaved edits | Discard | Cancel |
| Adds an existing thing | Add | Create |
| Makes a new thing | Create | Add |

### Action naming

- Destructive and primary CTAs: Verb plus Noun. `rule/destructive-names-action`.
- Never `Confirm`, `OK`, `Yes`, `Submit`, or bare verb on a destructive action.
- Canonical verb consistent across the product. `rule/canonical-verb`.

Classify exact wording, multiple strings, tone, persuasion, and AI-ism removal under copy and UX ownership. Return the affected strings, constraints, and rule IDs as a complete handoff envelope; do not invoke another skill.

---

### interface-quality.md (inline)

Load in review and harden modes.

### Severity rubric

- P0: blocks the primary task, severe accessibility failure, or unrecoverable user harm.
- P1: likely task failure, misleading consequence, missing critical state, or major accessibility defect.
- P2: meaningful friction, inconsistency, or recoverability issue not blocking the task.
- P3: minor craft or consistency improvement.

Each finding carries: location, verification status, rule ID, user consequence, smallest concrete fix, and accountable domain owner.

### Accessibility as a product concern

Own whether a user can complete the task with assistive technology at the product-decision level. Record rendered-markup verification as a separate surface requirement with exact target locations and expected accessible behavior; do not invoke another skill.

---

### lint-patterns.md (inline)

Deterministic, structural, single-file checks belong in a linter. Judgment that needs product context stays in this skill.

### Lint decision tree

```
Can code identify the failure from one file's AST, without rendering?
  No  -> agent guidance (this skill).
  Yes -> Can the rule avoid likely false positives?
           No  -> agent guidance.
           Yes -> Does the violation have a concrete, mechanical fix?
                    Yes -> a lint rule.
                    No  -> a warning, or agent guidance.
```

Needs product or codebase context? -> agent guidance.
Establishes a new standard or product policy? -> human decision first.

Three deterministic rules worth encoding as lint (point at project components):

| Rule | Rule ID | Catches |
|---|---|---|
| prefer-radio-for-few-options | `rule/control-matches-cardinality` | A select with 2–3 static options |
| no-nested-modals | `rule/no-nested-modals` | A modal opened inside another modal |
| icon-button-accessible-name | `rule/accessible-name-required` | An icon-only button with no accessible name |
