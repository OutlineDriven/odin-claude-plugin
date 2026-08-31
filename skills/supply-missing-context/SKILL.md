---
name: supply-missing-context
description: 'Use when the prior explanation omitted context or was hard to follow. Re-pitch the explanation in plain language with the missing context supplied. Don''t use for tasks that require source or remote-system changes.'
---

# Supply missing context

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The prior explanation omitted context or was hard to follow. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | None. The re-pitch stays in chat. |
| Done | One plain-language re-pitch supplies the missing context. |

## Inputs

- **Prior explanation** (required): The explanation the user found incomplete or unclear, supplied by conversation history.
- **Confusion signal** (required): The user's indication that context was missing: a question, "wait, what", or explicit request to re-explain.

## Procedure

1. Identify the prior explanation in the conversation that the user found incomplete or unclear.
2. Determine what context was omitted: background knowledge, definitions, assumptions, causal links, or prerequisite steps the explanation skipped.
3. Re-pitch the explanation from scratch in plain language, embedding the missing context at the point where the original explanation jumped ahead.
4. Keep the re-pitch to one coherent passage. Do not add caveats, meta-commentary, or references to the original explanation's failure.

## Failure and recovery
- **No prior explanation found**: Report that no prior explanation exists to re-pitch. Do not invent one.
- **Ambiguous confusion signal**: Ask which part of the prior explanation was unclear before re-pitching.
- **Scope creep detected**: If the re-pitch would require teaching an entire prerequisite topic, state the prerequisite boundary and offer to cover it separately.

## Output
One plain-language re-pitch in chat that supplies the missing context the prior explanation omitted.

## Provenance

Adapted from mattpocock/skills `skills/productivity/wait-what/SKILL.md` at revision 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76. MIT License. Copyright (c) 2026 Matt Pocock. Retain copyright and permission notice per licenses/NOTICE. Clean-room adaptation: the mechanism is filling the omitted-context gap rather than re-pitching a claim triggered by "wait, what" phrases.
