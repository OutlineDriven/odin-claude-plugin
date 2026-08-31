---
name: genealogical-proof
description: 'Use when a genealogical identity or relationship needs correlation, conflict, and negative-search proof. Classifies the identity proposition as proved, disproved, likely, or possible. Stops at declared success, non-success, or bound.'
---

# Genealogical proof

## Contract

| Field | Bound contract |
|---|---|
| Trigger | A genealogical identity or relationship needs correlation, conflict, and negative-search proof. |
| Authority | READ_ONLY_WITH_PAID_OR_LIVING_DATA_ASK; approval: A1 for paid access or living-person data One harness ask/question call before the run starts; prose consent, invocation consent, prior-run consent, and post-start discovery do not approve an effect. |
| Side effect | Genealogical proof finding. |
| Done | The identity proposition is classified proved, disproved, likely, or possible with a proof note. |
| Stop | conflicting; unresolved; blocked. Bound: One proof question, approved repositories, date range, and pass cap. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Not for

- Non-genealogical identity proof — the domain is genealogical records and relationships.
- Evaluation without a proof question — stop and request one.

## Procedure

1. Bind the declared bound and freeze it before mutation. Done when: the bound is frozen and no further scope drift is accepted.
2. If authority.approval is not null, collect start approval with the harness question tool once using the A1 sealed_fields list; end the run on scope drift. Done when: approval is collected or confirmed absent.
3. Execute the genealogical proof finding inside the bound. Done when: the identity proposition is classified proved, disproved, likely, or possible with a proof note, or a terminal class applies.
4. Stop at outcome.success, any outcome.non_success, or outcome.bound. Done when: a terminal class is reached and recorded.
5. Persist per profiles.persistence.P1 (durable_location .outline/loops/<slug>/<run_id>/ when durable; emit receipt.json before return). Done when: receipt.json is emitted with every K11 field and outcome.success holds or a named non_success/bound terminal applies.

## Failure and recovery

- **Conflicting evidence**: emit a conflicting receipt naming the conflict; do not force a classification.
- **Unresolved**: emit an unresolved receipt naming the missing evidence; do not guess.
- **Blocked**: a repository or data source is inaccessible; emit a blocked receipt naming the missing access.

## Output

An immutable K11 receipt with every K11 field, recording the terminal class (success, capped, stalled, blocked, exhausted, or pending) and the proof classification (proved, disproved, likely, or possible) with its proof note.
