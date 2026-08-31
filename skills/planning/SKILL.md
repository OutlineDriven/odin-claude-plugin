---
name: planning
description: 'Use when asked to create or review a plan, produce a structured plan file scored against a completeness, feasibility, scope, testability, risk, and assumptions rubric with checkable claims; iterate until the plan scores 5/5 or a blocker is named. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

1. **Gather and bound scope.** If the user supplied a feature description, extract the stated goal, constraints, and known dependencies. If information is missing, ask the user a precise clarifying question before proceeding. Do not assume scope.

2. **Write the first plan draft.** Structure the plan as:
   - **Goal**: one-sentence desired outcome
   - **Scope**: what is included and explicitly excluded
   - **Steps**: numbered, ordered, each step stating who does what and what evidence proves it done
   - **Feasibility check**: confirm each step is achievable with available tools and authority
   - **Assumptions**: list every assumption the plan relies on
   - **Risk**: name every risk with a mitigation
   - **Testability**: state how each step's success is verifiable

3. **Score the draft.** Evaluate the plan against six dimensions (1–5 each):
   - Completeness: all required parts present
   - Feasibility: each step is achievable
   - Scope: boundaries are explicit
   - Testability: each claim has a checkable outcome
   - Risk: risks are named and mitigations stated
   - Assumptions: all material assumptions are listed

4. **If any dimension scores below 5:**
   - Name the specific gap in the review report
   - Revise the plan to address that gap
   - Re-score
   - Repeat until every dimension scores 5, or a named blocker is identified that the plan cannot resolve

5. **Deliver the final plan file** with the review report stating each dimension score and what was changed in each iteration.

6. **Confirm.** Present the scored plan to the user and ask if it meets their needs or if they want to adjust scope.

## Failure and recovery
| Failure | Recovery |
|---|---|
| User provides no feature description and declines to answer clarifying questions | Stop. Output "no plan written: feature description required." Do not assume scope. |
| Plan scores below 5 and a revision introduces a new gap in a previously-scored dimension | Revert to the last fully-scored state; name the new gap in the review report. Do not widen scope. |
| Named blocker identified that is outside reversible-local authority | Name the blocker explicitly in the review report. State the plan is incomplete and what resolution is needed. Do not pretend the plan is done. |
| Iteration limit reached without 5/5 | Output the plan with current scores and name every dimension that did not reach 5. State "plan did not reach 5/5" in the review report. |

## Output
- A plan file (`PLAN.md` or named by the user) containing: goal, scope, steps, feasibility check, assumptions, risks, testability notes
- A review report containing: six-dimension scores, what changed in each iteration, any named blockers, and the final verdict (5/5 or incomplete with named gaps)
- If no plan was written due to missing input: a one-sentence refusal message naming the missing input

## Provenance

- Origin: mblode/agent-skills (MIT), revision e97a3b383f5944f90d41eb92b24b4fb3b917a7f9
- License: MIT — Copyright (c) 2026 Matthew Blode; adaptation preserves copyright and MIT license text
- Adaptation: translated from the mblode planning skill into the ODIN 2.0 SKILL.md format; authority mapped to reversible-local; procedure structured into bounded steps with explicit scoring dimensions; failure classes named with non-converged output defined; no ODIN skill, module, or system-prompt dependency introduced
