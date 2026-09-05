---
name: to-questionnaire
description: 'Use when user wants an async questionnaire, a discovery questionnaire, or a knowledge gap needs answers outside the repo. Not for direct conversation: use askme. Not for agent research: use research.'
---

# To questionnaire

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants an async questionnaire for someone else, a discovery questionnaire, or a knowledge gap needs answers from outside the repository. |
| Authority | Reversible local: writes only the questionnaire file; rollback is deleting that file. No remote mutation. |
| Side effect | Writes exactly one to-questionnaire-<slug>.md beside the current work; no issue filing and no sending. |
| Done | A minimum-answerable-question questionnaire with a return route exists for the named recipient and no repo-answerable question remains in it. |

## Inputs

Required: the topic or context of the knowledge gap. Optional: the recipient's role or name, constraints such as a deadline or format requirement.

## Refusals

- Will not write a questionnaire before the recipient is identified.
- Will not write a questionnaire before the needed answers are identified.
- Will not send, file an issue, or deliver the questionnaire: the user does that.
- Will not include a question the repository itself can answer.

## Procedure

1. Identify the recipient. Ask the user in one exchange: who the recipient is, their role and expertise, and what they know that the user does not. Focus the interview on the send, not the subject: ask the user only about the send, never about the gap itself. **Done when:** the recipient is named or scoped.
2. Identify needed answers. Ask the user in one exchange: the specific decisions or facts they cannot resolve alone. **Done when:** a concrete list of user-needed outcomes exists.
3. Derive the slug. Convert the topic into kebab-case for the filename. If no meaningful slug can be derived, use "questionnaire". **Done when:** the slug is derived.
4. Draft the questions. Target the gap between what the recipient knows (step 1) and what the user needs back (step 2). Order questions by importance because only one async pass is guaranteed. Group them under `##` headings by theme once there are more than a handful. Make every question one idea, never compound. Place an answer stub (a blank `>` blockquote line) directly beneath each question. Add a one-line _why this matters_ only where a question could be misread or invite a throwaway answer; that is the ambiguity rationale. **Done when:** every needed answer from step 2 has a corresponding question with an answer stub.
5. Write the questionnaire to `to-questionnaire-<slug>.md` in the current working directory using the template below. Do not write any other file. **Done when:** the file exists on disk.

<questionnaire-template>

# <Questionnaire title>

- Purpose: why this questionnaire exists and the decision riding on it.
- From: <the user>
- To: <recipient>
- How your answers will be used: <where they go>

### Context

One paragraph of context for a recipient who has not seen the prior discussion. Include enough to answer well, but keep it brief.

### How to answer

Deadline and rough effort. Partial answers and "I don't know" are useful. Flag anything uncertain rather than skipping it.

### <Theme heading>

One `##` section per theme. Under each, its questions, most-important-first. Every question is one idea, never compound, with an answer stub directly beneath, and a one-line _why this matters_ only where the question could be misread or invite a throwaway answer.

<question-example>
### What load is the system expected to handle at launch?

_Why this matters: it decides whether we provision for burst traffic now or defer it._

>
</question-example>

### Anything else?

A closing catch-all: anything we did not ask that we should know?

</questionnaire-template>

6. Confirm the file exists and that every item named in step 2 is covered by a question. Report the written path. **Done when:** the file is verified and every needed answer has a question.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| No recipient identified | Stop before writing. Ask the user to name or describe the recipient. |
| No needed answers identified | Stop before writing. Ask the user to list what they need back. |
| Partial needed-answers list | Write the questionnaire covering only the named items and list any items the user raised that no question covers. |
| File already exists | Confirm whether to overwrite before writing. |
| Slug undeterminable | Use "questionnaire" as the filename stub. |

## Output

A standalone Markdown discovery questionnaire file at `to-questionnaire-<slug>.md` in the current working directory, with per-theme grouped questions ordered by importance, a return route, and a closing catch-all: the user delivers the file and acts on responses.
