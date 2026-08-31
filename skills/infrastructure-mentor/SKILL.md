---
name: infrastructure-mentor
description: 'Use when a user, especially a new hire, asks for mentoring, guidance, or explanation of Sentry infrastructure or practices. Returns a clear, sourced explanation with references and concrete next learning steps.'
---

# Infrastructure mentor

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User, especially a new hire, asks for mentoring, guidance, or explanation of Sentry infrastructure or practices |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation |
| Side effect | Researches the topic and delivers a clear, sourced explanation with references and concrete next steps |
| Done | User understands the concept enough to explain it and has concrete next learning steps |

## Inputs

- **Topic** (required): the concept, system, or practice the user wants to understand. Supplied by the user's question.

## Procedure

1. Clarify the user's specific question if it is ambiguous or too broad.
2. Research the topic using available documentation, codebase knowledge, and Sentry infrastructure context.
3. Synthesize findings into a clear, structured explanation.
4. Cite sources explicitly: link to relevant docs, code locations, runbooks, or ADRs.
5. Close with concrete next steps: what to read, try, or ask next.

## Failure and recovery
- **Outside scope:** the topic is not about Sentry infrastructure or practices. State this directly. Do not invent Sentry content.
- **Information unavailable:** sufficient information cannot be found. Return what is available with honest uncertainty, and suggest where to look or whom to ask.
- **Partial answer:** if time or context is limited, deliver the clearest explanation possible and note what remains uncovered.

## Output
A clear, sourced explanation of the Sentry concept or practice the user asked about, with explicit references and concrete next steps. Delivered as a structured report in chat.

## Provenance

- Origin: getsentry/skills
- Revision: c2f99a5b04b4cd992ec3022d7c2c3e23e938d241
- License: Apache-2.0
- Adaptation: Clean-room rewrite for ODIN 2.0; does not copy original expression. Remapped from odin-knowledge to odin-research (common tier) per roster governance.
