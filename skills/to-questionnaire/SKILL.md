---
name: to-questionnaire
description: 'Use when the user wants to turn a knowledge gap into an async questionnaire for someone else: identify the recipient and the needed answers, then write a discovery questionnaire to to-questionnaire-<slug>.md. Triggers: "turn this into a questionnaire", "questionnaire for X", "async answers from another person", async information gathering. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# To questionnaire

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants an async questionnaire for someone else, a discovery questionnaire, or a knowledge gap needs answers from outside the repository. |
| Authority | Reversible-local: model identifies recipient and needed answers, drafts the questionnaire, and writes the file. User delivers the document and follows up. |
| Side effect | Writes exactly one to-questionnaire-<slug>.md beside the current work; no issue filing and no sending. |
| Done | A minimum-answerable-question questionnaire with a return route exists for the named recipient and no repo-answerable question remains in it. |

## Inputs

Required: the topic or context of the knowledge gap. Optional: the recipient's role or name, constraints such as a deadline or format requirement.

## Procedure

1. Identify the recipient. Ask the user in one exchange: who the recipient is, their role and expertise, and what they know that the user does not. Stop when the recipient is named or scoped.

2. Identify needed answers. Ask the user in one exchange: the specific decisions or facts they cannot resolve alone. Stop when a concrete list of user-needed outcomes exists.

3. Derive the slug. Convert the topic into kebab-case for the filename. If no meaningful slug can be derived, use "questionnaire".

4. Draft the questions. Target the gap between what the recipient knows (step 1) and what the user needs back (step 2). Order questions most-important-first because async means only one pass is guaranteed. Group under `##` headings by theme once there are more than a handful.

5. Write the questionnaire. Use the template below. Output it to `to-questionnaire-<slug>.md` in the current working directory. Do not write any other file.

<questionnaire-template>

# <Questionnaire title>

- Purpose: why this questionnaire exists and the decision riding on it.
- From: <the user>
- To: <recipient>
- How your answers will be used: <where they go>

### Context

One paragraph orienting a recipient who was not in the user's head. Enough to answer well, not a page.

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

6. Confirm the file exists and that every item named in step 2 is covered by a question. Report the written path.

## Failure and recovery
- **No recipient identified**: stop before writing. Ask the user to name or describe the recipient.
- **No needed answers identified**: stop before writing. Ask the user to list what they need back.
- **File already exists**: confirm whether to overwrite before writing.
- **Slug undeterminable**: use "questionnaire" as the filename stub.

## Output
A standalone Markdown discovery questionnaire file written to `to-questionnaire-<slug>.md` in the current working directory. The user is responsible for delivering the file and acting on responses.

## Provenance

Origin: current-odin-skill-tree. Adaptation: narrowed to asynchronous elicitation artifact for named recipient; distanced from askme (direct conversation) and research (agent finds answers). No third-party content copied.
