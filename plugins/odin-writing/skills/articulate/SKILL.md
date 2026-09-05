---
name: articulate
description: 'Use when the user knows what they mean but cannot express it completely or clearly. Not for discovery, ideation, or style-only editing: use unslop for style.'
---

# Articulate

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user has an intended thought but cannot yet express it completely or clearly. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. Uses only supplied material and confirmed conversation context. |
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

## Failure and recovery

- No invariant core can be stated: the thought is too fragmentary to articulate. Ask the user for one more sentence of context; do not invent the core.
- Invented goal or fact detected: remove it and mark the gap as a blank. Do not substitute a plausible-sounding rationale.
- Scope drifted during expression: restate the original scope, discard the drift, and recheck every sentence against the supplied material.
- Unsupported choice hidden as certainty: downgrade to an explicit blank or alternative set. Do not present an unsupported choice as settled.

## Output

Return the completed statement, followed only when needed by `Unresolved:` and the remaining explicit blanks or alternatives.

## Routing boundaries

- Requirements or intent must be discovered: use the planning owner.
- Several possible ideas are wanted: use `brainstorm` (mode ideate).
- A reusable rule must be inferred from examples or material: use `generalize`.
- An external concept must be taught: use `paced-explanation`.
- Meaning is already complete and only voice or polish changes: use `unslop`.
