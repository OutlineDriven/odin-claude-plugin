---
name: articulate
description: "Turn a vague but already intended thought into a faithful, audience-ready statement. Use when the user knows what they mean but cannot yet express it clearly. Preserve scope and identity, surface unsupported choices, and do not invent goals, requirements, rationale, or facts. Don't use for requirements discovery, ideation, generalization, external concept explanation, or style-only editing."
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

1. State the thought's invariant core in one sentence.
2. Collect only context already confirmed by the user. Do not research merely to fill a blank.
3. Mark unsupported choices as a blank, a short alternative set, or the minimum clarifying question needed to continue.
4. Write the smallest complete audience-ready form that preserves the original scope, identity, confidence, and intent.
5. Compare every sentence with the supplied material. Remove invented goals, requirements, rationale, facts, or certainty.

## Output

Return the completed statement, followed only when needed by `Unresolved:` and the remaining explicit blanks or alternatives.

## Routing boundaries

- Requirements or intent must be discovered: use the planning owner.
- Several possible ideas are wanted: use ideation.
- A reusable rule must be inferred from examples or material: use `generalize`.
- An external concept must be taught: use explanation.
- Meaning is already complete and only voice or polish changes: use the writing editor.
