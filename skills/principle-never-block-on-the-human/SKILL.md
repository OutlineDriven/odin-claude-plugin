---
name: principle-never-block-on-the-human
description: 'Use when deciding whether reversible work needs a question before proceeding. Keeps asynchronous progress on reversible work and parks irreversible work behind one concrete question. Don''t use for tasks that require source or remote-system changes.'
---

# Principle: never block on the human

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Decide whether reversible work needs a question. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. The only effect is the agent's own execution posture. |
| Side effect | None. Changes execution posture only: which items proceed unattended and which await a human decision. |
| Done | Asynchronous progress without unsafe assumptions: reversible items proceed, and every irreversible item is parked behind exactly one concrete question. |

## Inputs

- Required: the list of work items that would run while the human is unavailable, enumerable from the current task state. If none can be enumerated, stop: there is nothing to decide.
- Optional: known irreversibility constraints (publish targets, data-at-rest effects, paid or credentialed surfaces). Without them, classify conservatively as irreversible.

## Procedure

1. Enumerate the pending work items from the current task state. Do not invent items; do not accept a set that cannot be pointed at in the session.
2. Classify each item at its trust boundary. Reversible means the effect can be undone locally with no human-held credential, no publication, no data-at-rest change, no remote bulk mutation, and no irreversible deletion. Everything else, including anything uncertain, is irreversible.
3. Change posture: proceed asynchronously on every reversible item, and keep the per-item reversibility rationale for the final report.
4. Park every irreversible item: do not execute it, and prepare exactly one question per item naming the target, the consequence, and one recommended option.
5. Treat silence, timeouts, or an absent human as non-consent. Never execute a parked item on an assumption, and never stage consent the human did not give.
6. Bound scope to the enumerated items. An item entering the queue during the run gets the same classification before any execution; widening beyond this is a stop condition, not a decision.

## Failure and recovery
- Ambiguous classification: an item cannot be shown reversible; classify it irreversible and park it with its question. Never guess reversible.
- No enumerable work: report that there is nothing to decide; the done predicate holds only when the pending set is genuinely empty, never because items were dropped.
- Human unreachable: reversible items keep progressing; irreversible items stay parked with their questions ready. Do not claim the done predicate while any parked item lacks its question.
- Scope pressure: an actor demands items outside the enumerated set; stop rather than widen.
- Non-mutation rule: read-only authority means nothing was mutated, so there is nothing to roll back; a failure leaves the posture decision unreported rather than partially applied.

## Output
A posture decision report in the reply: the proceed list with per-item reversibility rationale, the parked list with one question each (target, consequence, recommended option), and an explicit statement that no irreversible item ran on an assumption. Terminal state: reversible work continues unattended; irreversible work waits for an explicit human answer.

## Provenance

- Origin: `cursor/plugins`, path `pstack/skills/principle-never-block-on-the-human/SKILL.md`, pinned revision `68836ddaf5697224520f1847d90cdb90ca8babaa`.
- License: MIT — pstack/LICENSE blob `6b5400237fdf6545be0b8fae370d6f2fcff8fb25` (1067 bytes); pstack authored by Lauren Tan (poteto) under MIT per audit license block.
- Adaptation: the proceed-on-reversible / confirm-irreversible posture mechanism is retained; the expression was rewritten as an original ODIN 2.0 procedure and no third-party text is copied.
