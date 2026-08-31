---
name: supply-missing-context
description: 'Use when the prior explanation omitted context or was hard to follow. Re-pitches the explanation in plain language with the missing context supplied. Don''t use for tasks that require source or remote-system changes.'
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

- **Prior explanation** (required): the explanation the user found incomplete or unclear, supplied by conversation history.
- **Confusion signal** (required): the user's indication that context was missing: a question, "wait, what", or explicit request to re-explain.

## Refusal

- No prior explanation found: report that no prior explanation exists to re-pitch. Do not invent one.
- Ambiguous confusion signal: ask which part of the prior explanation was unclear before re-pitching.
- Scope creep: if the re-pitch would require teaching an entire prerequisite topic, state the prerequisite boundary and offer to cover it separately.

## Procedure

1. **Identify the prior explanation** in the conversation that the user found incomplete or unclear. Done when: the specific prior explanation is located.
2. **Identify the omitted context**: background knowledge, definitions, assumptions, causal links, or prerequisite steps the explanation skipped. Done when: the missing context is named.
3. **Re-pitch the explanation from scratch in plain language**, embedding the missing context at the point where the original explanation jumped ahead. Done when: one coherent passage supplies the missing context.
4. **Keep the re-pitch clean.** Do not add caveats, meta-commentary, or references to the original explanation's failure. Done when: the re-pitch contains no meta-commentary about the prior explanation.

## Output

One plain-language re-pitch in chat that supplies the missing context the prior explanation omitted.

## Provenance

Adapted from mattpocock/skills `skills/productivity/wait-what/SKILL.md` at revision 6654f6b60cd9d5be8b54c6fafe44346dabeb3b76. MIT License. Copyright (c) 2026 Matt Pocock. Retain copyright and permission notice per licenses/NOTICE. Clean-room adaptation: the mechanism is filling the omitted-context gap rather than re-pitching a claim triggered by "wait, what" phrases.
