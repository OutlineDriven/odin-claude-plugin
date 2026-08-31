---
name: answer-stub-questionnaire
description: 'Use when needed knowledge must be gathered asynchronously from another person. Produces a send-ready questionnaire of prioritised one-idea questions with answer stubs and ambiguity rationale. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Answer stub questionnaire

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Needed knowledge must be gathered asynchronously from another person. |
| Authority | Write only the questionnaire file in the current directory; delete the file to roll back. |
| Side effect | A send-ready questionnaire file in the current directory. |
| Done | The file exists and contains prioritised one-idea questions, each with an answer stub, plus ambiguity rationale where a question could be misread. |

## Inputs

Required from the user, gathered in two exchanges:
- **Recipient**: the person's role, expertise, and relationship to the user. Fixes the document's tone and how much context it must carry.
- **Needed answers**: the specific decisions or facts the user cannot resolve alone and must walk away able to do or decide.

Optional: a topic slug for the filename, derived from the topic if not supplied.

## Procedure

1. Ask, in one exchange, who the questionnaire goes to: the recipient's role, expertise, and relationship to the user. Stop when the recipient is identified and their knowledge beyond the user's is established.
2. Ask, in one exchange, what the user needs back: the concrete decisions or facts the user cannot resolve alone. Stop once a concrete list exists of what the user must walk away able to do or decide.
3. Draft questions aimed at the gap between what the recipient knows and what the user needs. Focus the interview on the send, not the subject: ask the user only about the send, never about the gap itself. Order questions most-important-first, because async may yield only one pass. Group questions under `##` headings by theme once there are more than a handful. Make every question one idea, never compound. Place an answer stub (a blank `>` blockquote line) directly beneath each question. Add a one-line _why this matters_ only where a question could be misread or invite a throwaway answer; that is the ambiguity rationale.
4. Write the questionnaire to `to-questionnaire-<slug>.md` in the current directory, using the document structure in Output. Report the path. Stop when the file exists and every item the user named in step 2 is covered by a question.

## Failure and recovery
- **Missing recipient or needed answers**: do not invent a recipient, fabricate needed answers, or write questions for items the user never named. Re-ask the missing exchange; if it is still missing, stop and report exactly what is missing.
- **Partial needed-answers list**: write the questionnaire covering only the named items and list any items the user raised that no question covers.
- **Rollback**: delete the written file. No other state is mutated.
- **Blocked result**: report the missing input and the file path not written; do not claim the done predicate holds.

## Output
A Markdown file at `to-questionnaire-<slug>.md` in the current directory, structured as:

- A header block: title, Purpose (why it exists and the decision riding on it), From (the user), To (recipient), How your answers will be used.
- `## Context`: one paragraph orienting a recipient who was not in the user's head.
- `## How to answer`: deadline and rough effort; note that partial answers and "I don't know" are useful and that the recipient should flag anything unsure rather than skip it.
- One `##` section per theme, questions most-important-first. Each question is one idea with an answer stub (`>`) directly beneath and a one-line _why this matters_ where the question could be misread.
- `## Anything else?`: a closing catch-all for things not asked.

Report the file path.

## Provenance

Origin: mattpocock/skills, path `skills/productivity/to-questionnaire/SKILL.md`. Pinned revision: `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76`. License: SPDX MIT, Copyright (c) 2026 Matt Pocock; the copyright and permission notice is retained in `licenses/NOTICE`. Adaptation: rewritten into the ODIN 2.0 contract format; the distinguishing mechanism is preserved — the questionnaire grills the sender (not the subject) and carries prioritised one-idea questions with answer stubs and ambiguity rationale.
