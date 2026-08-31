---
name: interview-me
description: 'Use when a user asks to define requirements or choose between options. A structured interview surfaces every unstated assumption one question at a time and produces a user-approved decision record before any file change. Not for intent-from-data — use intent-proposal.'
---

# Interview me

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to define requirements or choose between competing options, or says "interview me" before non-trivial work. |
| Authority | Write only named local artifacts; state the rollback path. |
| Side effect | User-confirmed requirements/decision record written after the interview; nothing written during it. |
| Done | Every originally unstated assumption is confirmed or corrected and the user approves the resulting decision log before any file changes. |

## Inputs

- User's stated goal or problem: Required on invocation. The user supplies the initial intent, decision question, or ambiguity they want explored.
- Assumptions not yet stated: Collected by the agent during the dialogue. Each turn surfaces one assumption for explicit user confirmation or correction.
- **No source files required** to begin the interview.

## Procedure

1. **Acknowledge scope and boundary.** State that this is a requirements interview. Confirm whether the goal is to define requirements, resolve a decision between options, or both. Do not begin any file change, build, or investigation until the decision record is approved.

2. **Surface the first assumption.** Ask one focused question that exposes the most fundamental unstated assumption in the user's stated goal. Wait for a response before asking the next question.

3. **Record the answer.** After each user response, restate what was confirmed or corrected. Add it as a row in the running decision log.

4. **Repeat until the user indicates completeness.** After each confirmed or corrected assumption, ask: "What else is unstated or assumed in this goal?" Stop when the user says there is nothing left, explicitly declines to continue, or confirms the decision record is complete.

5. **Present the decision log.** Render the complete decision log as a plain-text artifact: each assumption, its resolution, and the final agreed scope or decision. Do not include any proposed implementation plan.

6. **Request approval.** Ask the user to approve, amend, or reject any row. Incorporate changes if the user responds. Repeat this step until the user approves the record as final.

7. **Write the approved record to disk.** Write the approved decision log to a local file named by the user or defaulting to `DECISION-LOG.md` in the current working directory.

8. **Stop.** The interview is complete. Do not initiate file changes, search, or planning beyond the written decision log.

## Failure and recovery
| Failure class | Condition | Result |
|---|---|---|
| User abandons | User stops responding or explicitly ends the interview without approving the record | Interview ends; no file is written; report "no decision recorded" |
| Unresolvable scope creep | User asks to solve or implement during the interview | Decline; redirect back to the interview until the record is approved |
| Empty goal | User provides no actionable intent on invocation | Ask for the goal before proceeding; stop if they decline to supply one |

**Rollback path (authority `reversible-local`):** If the decision log was written to disk before user approval, delete the file. The log is written only after explicit user approval.

## Output
A local file named `DECISION-LOG.md` (or a user-specified name) containing the approved decision record. Each row states one assumption, its resolution, and the final agreed scope or decision. No implementation plan, code, or action items beyond the record itself.
