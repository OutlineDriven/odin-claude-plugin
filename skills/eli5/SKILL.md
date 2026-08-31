---
name: eli5
description: 'Use when asked to explain for a beginner, ELI5, simplify this concept, plain language, or no AI prose; returns a plain-language explanation with one gist, one analogy, and the next action first. Don''t use for tasks that require source or remote-system changes.'
---

# Eli5

## Contract

| Field | Bound contract |
|---|---|
| Trigger | explain like I am five, ELI5, simplify this concept, plain language, no AI prose |
| Authority | Read-only; produces chat output only, no file, code, or remote mutation |
| Side effect | A plain-language explanation in chat; no code changes |
| Done | Explanation has one gist, one analogy, next action first, and no AI-isms |

## Inputs

The concept or passage to simplify. Required: the user names a concept, term, or text to explain. Optional: the audience level or a specific angle; if omitted, default to a five-year-old's vocabulary.

## Procedure

1. Name the concept from the request. If the request does not name one, stop and ask; do not invent a topic.
2. Write the gist: one sentence stating what the concept is, using only words a five-year-old would know.
3. Write one analogy that connects the concept to an everyday object or experience a child recognizes.
4. Lead the explanation with the next action the reader should take, then the gist, then the analogy.
5. Strip AI-isms: remove hedging ("it's worth noting", "importantly"), motivational framing ("let's dive in", "imagine for a moment"), list ceremony with no payload, and filler connectives. Keep only sentences that carry meaning.
6. Read the result back and check the done predicate: exactly one gist, exactly one analogy, next action first, no AI-isms. Rewrite until it holds.

## Failure and recovery
- Unspecified concept: ask the user for the concept; return nothing else.
- Concept too technical to simplify without distortion: simplify the nearest accessible layer, state plainly what was omitted, and do not fabricate detail.
- Partial result: return what simplified cleanly and name the part that could not; never present an incomplete explanation as done.

## Output
A chat explanation ordered as next action, gist, analogy, with no AI-isms and no code changes.

## Provenance

Origin: mblode/agent-skills, revision e97a3b383f5944f90d41eb92b24b4fb3b917a7f9. License: MIT (Copyright (c) 2026 Matthew Blode). Clean-room adaptation: the plain-language, no-AI-prose mechanism is re-expressed here without copying third-party expression.
