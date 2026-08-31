---
name: articulate
description: 'Turn a vague intended thought into a faithful, audience-ready statement. Use when the user knows what they mean but cannot express it. Preserve scope and identity; surface unsupported choices; invent no goals or facts. Don''t use for discovery, ideation, or style-only editing.'
---

# Articulate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user has an intended thought but cannot yet express it completely or clearly. |
| Authority | Read-only. Use only supplied material and confirmed conversation context. |
| Side effect | Chat output by default. Replace a supplied draft only when the user explicitly asks for an edit. |
| Done | The statement is audience-ready, every sentence is supported, the user's scope and identity are unchanged, and unresolved forks remain visible. |

## Inputs

- The thought, fragment, notes, or draft to express.
- The intended audience and medium when already known.
- Confirmed context from the current conversation.

## Procedure

1. State the thought's invariant core in one sentence. Done when: the invariant core is one sentence.
2. Collect only context already confirmed by the user. Do not research merely to fill a blank. Done when: only confirmed context is collected.
3. Mark unsupported choices as a blank, a short alternative set, or the minimum clarifying question needed to continue. Done when: every unsupported choice is marked as a blank, alternative set, or clarifying question.
4. Write the smallest complete audience-ready form that preserves the original scope, identity, confidence, and intent. Done when: the form preserves original scope, identity, confidence, and intent.
5. Compare every sentence with the supplied material. Remove invented goals, requirements, rationale, facts, or certainty. Done when: no invented goals, rationale, facts, or certainty remains.

## Output

Return the completed statement, followed only when needed by `Unresolved:` and the remaining explicit blanks or alternatives.

## Routing boundaries

- Requirements or intent must be discovered: use the planning owner.
- Several possible ideas are wanted: use `ideate`.
- A reusable rule must be inferred from examples or material: use `generalize`.
- An external concept must be taught: use `paced-explanation`.
- Meaning is already complete and only voice or polish changes: use `unslop`.
