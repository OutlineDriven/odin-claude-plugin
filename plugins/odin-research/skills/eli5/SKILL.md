---
name: eli5
description: 'Use when asked for ELI5, beginner language, or a simpler explanation. Returns one plain-language gist, one analogy, and the next action first. Not for scaffolded practice — use drill; not for multi-angle explanations — use explain-concept.'
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

Required: a concept, term, or passage to simplify. Optional: the audience level or a specific angle. If omitted, use a five-year-old's vocabulary.

## Procedure

1. Name the concept from the request. If the request does not name one, stop and ask; do not invent a topic. Done when: the concept is named from the request or the run stopped to ask.
2. Write the gist: one sentence stating what the concept is, using only words a five-year-old would know. Done when: one gist sentence exists in five-year-old vocabulary.
3. Write one analogy that connects the concept to an everyday object or experience a child recognizes. Done when: one analogy connects the concept to a child-recognized object or experience.
4. Lead the explanation with the next action the reader should take, then the gist, then the analogy. Done when: the explanation is ordered as next action, gist, analogy.
5. Strip AI-isms: remove hedging ("it's worth noting", "importantly"), motivational framing ("let's dive in", "imagine for a moment"), list ceremony with no payload, and filler connectives. Keep only sentences that carry meaning. Done when: no AI-isms remain and every sentence carries meaning.

## Failure and recovery
- Unspecified concept: ask the user for the concept; return nothing else.
- Concept too technical to simplify without distortion: simplify the nearest accessible layer, state plainly what was omitted, and do not fabricate detail.
- Partial result: return what simplified cleanly and name the part that could not; never present an incomplete explanation as done.

## Output
A chat explanation ordered as next action, gist, analogy, with no AI-isms and no code changes.
