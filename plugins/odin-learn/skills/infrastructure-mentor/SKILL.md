---
name: infrastructure-mentor
description: 'Use when a user, especially a new hire, asks for mentoring, guidance, or explanation of infrastructure or engineering practices. Not for code changes.'
---

# Infrastructure mentor

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User, especially a new hire, asks for mentoring, guidance, or explanation of infrastructure or engineering practices. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Researches the topic and delivers a clear, sourced explanation with references and concrete next steps. |
| Done | The user has a clear, sourced explanation, explicit references, and at least one concrete next learning step. |

## Inputs

- **Topic** (required): the concept, system, or practice the user wants to understand. Supplied by the user's question.

## Procedure

1. Clarify the user's specific question if it is ambiguous or too broad. Done when: a specific, scoped question is stated or the original question is already specific.
2. Research the topic using available documentation, codebase knowledge, and the organization's infrastructure context. Done when: sufficient material is gathered to answer the scoped question, or the available material is exhausted and the gap is named.
3. Synthesize findings into a clear, structured explanation. Done when: a structured explanation answering the scoped question is composed.
4. Cite sources explicitly: link to relevant docs, code locations, runbooks, or ADRs. Done when: every claim in the explanation carries a source link or is marked unanchored.
5. Close with concrete next steps: what to read, try, or ask next. Done when: at least one concrete next learning step is stated.

## Failure and recovery

- Outside scope: the topic is not about infrastructure or engineering practices. State this directly. Do not invent content.
- Information unavailable: sufficient information cannot be found. Return what is available with honest uncertainty, and suggest where to look or whom to ask.
- Partial answer: if time or context is limited, deliver the clearest explanation possible and note what remains uncovered.

## Output

A clear, sourced explanation of the infrastructure concept or practice the user asked about, with explicit references and concrete next steps. Delivered as a structured report in chat. Terminal classification: `explained` (concept covered with sources and next steps), `partial` (core explained, gaps noted), or `out-of-scope` (topic is not infrastructure or engineering practices).
