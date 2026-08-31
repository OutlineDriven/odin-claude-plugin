---
name: wait-what
description: 'Use when the user says "wait, what", "the explanation is unclear", or "say that again", re-pitch the previous explanation with the missing frame supplied, in plain English and the project''s ubiquitous language. Don''t use for tasks that require source or remote-system changes.'
---

# Wait, what

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says 'wait, what', 'I don''t follow', or 'say that again'. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Restates the same claim without softening; nothing touches disk. |
| Done | The claim is re-pitched with the missing frame supplied, in plain English and the project''s ubiquitous language. |

## Inputs

The trigger identifies which explanation failed. No external files are required. Read `CONTEXT.md` at the repository root (or the per-context `CONTEXT.md` beside the relevant source when the project keeps a `CONTEXT-MAP.md`) to use the project''s ubiquitous language. If no glossary exists, use the names already in the code.

## Procedure

1. Identify the explanation that did not land: the last assistant message immediately before the trigger. Done when: the failed explanation is identified.
2. Restate the same claim, preserving its substance and conclusions. Do not soften, hedge, or replace it with an easier version. Done when: the claim is restated with substance and conclusions intact.
3. Re-pitch it: lead with the context the explanation assumed (one or two sentences on where the conversation is and what the message was answering — the gap is a missing frame, not a missing word); write in ISO 24495-1 English (short sentences, active voice, direct address, common words replacing jargon); use the project''s ubiquitous language. Done when: the claim is re-pitched with the missing frame supplied in plain English and ubiquitous language.

## Failure and recovery
**Non-converged:** the user signals they do not understand after one re-pitch. Stop. Do not elaborate, restate a third time, or widen scope. The user is the authority on whether the explanation landed. Report `non-converged`.

## Output
A single re-pitched message in the conversation, in plain English with the missing context supplied.

## Provenance

Origin: current-odin-skill-tree. License: project-owned. Adaptation: restructured to ODIN 2.0 SKILL.md section format; content and mechanism preserved from `skills/wait-what/SKILL.md`.
