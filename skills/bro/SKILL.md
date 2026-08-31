---
name: bro
description: 'Use when asked to restate the last response in plain language. Returns a concise restatement without jargon. Not for source or remote-system changes.'
---

# Bro

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The human asks to restate the last response in plain language. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | None. |
| Done | A concise restatement of the last response is returned, without jargon. |

## Inputs

- The last assistant response in the current conversation. Required; if no prior response exists, stop and report that there is nothing to restate.

## Procedure

1. Identify the last assistant response in the conversation. Done when: the target response is located or confirmed absent.
2. If no prior assistant response exists, stop and report that there is nothing to restate. Done when: the absence is reported and no restatement is produced.
3. Restate that response concisely in plain language without jargon. Done when: the restatement covers the original meaning in plain language.
4. Preserve the original meaning; do not add new claims, opinions, or information not present in the source response. Done when: the restatement adds nothing beyond the source.

## Failure and recovery
- No prior response: stop without producing a restatement; report that there is nothing to restate. Do not fabricate a prior response.
- Restatement drifts from the source meaning: discard it and restate again against the original response only.
- No mutation or partial result is written anywhere; the only output is the restatement text returned to the human.

## Output
A plain-language restatement of the last response, concise and without jargon, returned as the reply.

## Provenance

Origin: cursor/plugins pstack/skills/bro/SKILL.md at revision 68836ddaf5697224520f1847d90cdb90ca8babaa. License: MIT (pstack authored by Lauren Tan (poteto); LICENSE blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25). Adaptation: clean-room rewrite of the plain-language restatement behavior into the ODIN 2.0 contract format; no third-party expression copied.
