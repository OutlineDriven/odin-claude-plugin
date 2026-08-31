---
name: planning
description: 'Use when a plan must be created or reviewed and scored for completeness, feasibility, scope, testability, risk, and assumptions until 5/5 or a named blocker. Not for a committed-direction brief — use plan; not for task breakdown — use planning-and-task-breakdown.'
---

# Planning

## Contract

| Field | Bound contract |
|---|---|
| Trigger | create a plan, plan this feature, review my plan, stress test this plan, get this plan to 5/5, unknown unknowns, blindspot pass |
| Authority | reversible-local: write only the named plan file and review report; rollback by discarding uncommitted files |
| Side effect | Writes a plan file and a review report; may ask clarifying questions |
| Done | Plan scores 5/5 on completeness, feasibility, scope, testability, risk, and assumptions with checkable claims |

## Inputs

- Feature description or existing plan (required; supplied by the user or session context)
- Any scope, appetite, or constraint signals the user supplies
- Clarifying questions may be asked before the first draft is written

## Procedure

1. **Gather and bound scope.** If the user supplied a feature description, extract the stated goal, constraints, and known dependencies. If information is missing, ask the user a precise clarifying question before proceeding. Do not assume scope. Done when: goal, constraints, and dependencies are extracted or a clarifying question is asked.
2. **Write the first plan draft.** Structure the plan as goal (one-sentence desired outcome), scope (included and explicitly excluded), steps (numbered, ordered, each stating who does what and what evidence proves it done), feasibility check, assumptions, risk (named with mitigation), and testability. Done when: the draft contains all seven structural parts.
3. **Score the draft.** Evaluate the plan against six dimensions (1–5 each): Completeness, Feasibility, Scope, Testability, Risk, Assumptions. Done when: every dimension has a numeric score.
4. **If any dimension scores below 5:** name the specific gap in the review report, revise the plan to address that gap, re-score, and repeat until every dimension scores 5 or a named blocker is identified that the plan cannot resolve. Done when: every dimension scores 5 or a named blocker is recorded.
5. **Deliver the final plan file** with the review report stating each dimension score and what was changed in each iteration. Done when: the plan file and review report are written with per-dimension scores and iteration log.
6. **Confirm.** Present the scored plan to the user and ask if it meets their needs or if they want to adjust scope. Done when: the user confirms or requests adjustment.

## Failure and recovery
| Failure | Recovery |
|---|---|
| User provides no feature description and declines to answer clarifying questions | Stop. Output "no plan written: feature description required." Do not assume scope. |
| Plan scores below 5 and a revision introduces a new gap in a previously-scored dimension | Revert to the last fully-scored state; name the new gap in the review report. Do not widen scope. |
| Named blocker identified that is outside reversible-local authority | Name the blocker explicitly in the review report. State the plan is incomplete and what resolution is needed. Do not pretend the plan is done. |
| Iteration limit reached without 5/5 | Output the plan with current scores and name every dimension that did not reach 5. State "plan did not reach 5/5" in the review report. |

## Output
A plan file (`PLAN.md` or user-named) with goal, scope, steps, feasibility, assumptions, risks, and testability notes, plus a review report with six-dimension scores, iteration changes, named blockers, and the final verdict — or a one-sentence refusal naming the missing input when no plan is written.

## Provenance

- Origin: mblode/agent-skills (MIT), revision e97a3b383f5944f90d41eb92b24b4fb3b917a7f9
- License: MIT — Copyright (c) 2026 Matthew Blode; adaptation preserves copyright and MIT license text
- Adaptation: translated from the mblode planning skill into the ODIN 2.0 SKILL.md format; authority mapped to reversible-local; procedure structured into bounded steps with explicit scoring dimensions; failure classes named with non-converged output defined; no ODIN skill, module, or system-prompt dependency introduced
