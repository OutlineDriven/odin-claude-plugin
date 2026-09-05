---
name: load-bearing-assumption-test
description: 'Use when the user asks why a plan is wrong or says "poke holes in this". Not for tasks that require source or remote-system changes.'
---

# Load-bearing assumption test

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says "tell me why this is wrong", or "poke holes in this" about a plan, design, or claim |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only: a single root objection and first-nail recommendation as { root, first_nail }; no files written |
| Done | Root is genuinely load-bearing and the first nail is the cheapest experiment beating the plan or null when none exists |

## Inputs

The plan, design, or claim under attack, supplied by the user in the conversation. No file or remote input is required; the skill reads only what the user presents.

## Procedure

1. Pin the load-bearing assumption: identify the single thing that must hold for the whole plan to stand. Done when: one assumption is named whose failure collapses the plan.
2. Attack on whatever axes apply: a fact that may be false, confabulation, analogy mistaken for isomorphism, a future-tense suture, or the sharpest one, a principle cited but its opposite implemented. For empirical plans, also leakage and statistical power or family-wise error. Done when: every applicable axis has been tested against the pinned assumption.
3. Collapse to one root: the single objection whose failure makes the rest moot. Not a list. Done when: one root objection is selected, not a register of objections.
4. Find the first nail: the cheapest falsification available before the expensive program runs. Done when: one experiment is named that is cheaper than the plan and would prove whether root matters, or null is returned when no such experiment exists.
5. Return { root, first_nail }. Nothing else. Done when: the pair is returned and no additional objections or scaffolding are appended.

## Failure and recovery
- No load-bearing assumption found: state that the plan has no single point of failure and return the sharpest objection found, labeled as non-root. Do not fabricate a root.
- No cheaper first nail exists: return the root with first_nail set to null and state that no falsification is cheaper than running the plan. Do not invent an experiment.
- Never widen to a risk register or a list of objections; that is a different contract. If the user asks for more than one objection, stop and name the scope mismatch.
- Never swallow the absence of a root by pretending the done predicate holds.

## Output

A single { root, first_nail } pair in chat: root is one load-bearing objection whose failure makes the rest moot; first_nail is the cheapest experiment that would prove whether root matters, or null when no falsification is cheaper than the plan.
