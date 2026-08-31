---
name: research-proposal
description: 'Use when an existing research proposal needs iterative, literature-grounded strengthening to a fixed grade. Produces a literature-grounded research proposal that clears a fixed grade with a K11 receipt. Not for new proposals from scratch — supply a draft first.'
---

# Research proposal

## Contract

| Field | Bound contract |
|---|---|
| Trigger | An existing research proposal needs iterative literature-grounded strengthening to a fixed grade. |
| Authority | REVERSIBLE_LOCAL |
| Side effect | Literature-grounded research proposal that clears a fixed grade |
| Done | A fresh judge sets `verdict.pass` true without changing the frozen research intent. |
| Stop | budget exhausted; plateau; literature blocked. Bound: Frozen intent, rubric, pass grade, patience, and budget. Receipt terminal classes: success, capped, stalled, blocked, exhausted, pending. Budget exhaustion is never success unless it is the predeclared success predicate. |

## Refusals

- **Intent mutation**: rejected. The frozen research intent cannot change during strengthening.
- **Budget exhaustion as success**: rejected unless predeclared. The run stops at `exhausted`.
- **Literature blocked**: the run stops at `blocked` when no literature is accessible, not at `success`.

## Procedure

1. Bind the declared bound and freeze it before mutation. **Done when**: the frozen intent, rubric, pass grade, patience, and budget are frozen.
2. Strengthen the research proposal with literature until it clears the fixed grade or reaches the bound. **Done when**: a fresh judge sets `verdict.pass` true or a `non_success`/`bound` terminal applies.
3. Stop at `outcome.success`, any `outcome.non_success`, or `outcome.bound`. **Done when**: exactly one terminal class is assigned.
4. Persist per `profiles.persistence.P1` (durable_location `.outline/loops/<slug>/<run_id>/` when durable; emit `receipt.json` before return). **Done when**: `receipt.json` is written with every K11 field.
5. Confirm `outcome.success` holds or a named `non_success`/`bound` terminal applies. **Done when**: the terminal class is verified against the run outcome.
6. Write an immutable K11 receipt with every K11 field. **Done when**: the receipt is written and immutable.

## Output

A `receipt.json` with terminal class, bound, judge verdict, and every K11 field, ordered: bound freeze, literature strengthening, terminal assignment, persistence, receipt.

## Provenance

- Profile P-ALS: source https://github.com/gaasher/Agent-Loop-Skills. Retain the upstream MIT copyright and license notice for adapted support code or expression.
