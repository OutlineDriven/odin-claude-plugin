---
name: paced-explanation
description: 'Use when asked to explain or teach a subsystem, module, pattern, or change in progressive layers from purpose to code depth. Grounds each layer in concrete file paths, line ranges, and symbols. Not for design rationale — use why. Not for source or remote-system changes.'
---

# Paced explanation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to teach or explain a subsystem, module, pattern, or change. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only; inline diagrams on request. |
| Done | Four layers delivered in sequence (purpose, structure, behavior, code), each grounded in concrete file paths, line ranges, or symbols from the resolved target; the explanation progresses purpose → structure → behavior → code without skipping a layer; deeper layers offered after each. |

## Inputs

- Target (required): the subsystem, module, pattern, or change to explain. Supplied as an argument, a file path, or the current conversation context.
- Depth (optional): explicit depth ceiling or focus area. Absent means begin at plain layer and offer deeper.

## Procedure

1. **Identify the target.** Resolve the target to concrete code: file paths, line ranges, and key symbols. Use `grep`, `glob`, `read`, or LSP tools. If the target cannot be resolved after one read of the conversation, stop and ask one clarifying question naming what to explain. Done when: the target is resolved to concrete file paths, line ranges, and key symbols, or one clarifying question is asked.
2. **Map the scope.** Identify the entry point, internal structure, and external interfaces of the target. Build a lightweight mental map: what the subsystem owns, what it delegates, and how it is named in the codebase. Done when: the entry point, internal structure, and external interfaces are identified.
3. **Explain in progressive layers.** Deliver the explanation as a flat sequence from surface to depth, with each layer building on the previous:
   - Layer 1 — Purpose: what the target does and why it exists in one sentence.
   - Layer 2 — Structure: how the target is organized and what the main components are.
   - Layer 3 — Behavior: how the components interact and what the key inputs and outputs are.
   - Layer 4 — Code: the key symbols, line ranges, and the logic they encode.
   Done when: all four layers are delivered in sequence from purpose to code.
4. **Offer deeper layers.** After each layer, invite the user to request more depth. Accept a focus area or continue layer by layer. Stop when the user stops. Done when: an explicit invitation to go deeper follows each delivered layer, and no layer is delivered without the offer that follows it.
5. **Render diagrams on request.** If the user asks for a diagram, render an inline diagram (ASCII, Mermaid, or HTML) showing the structure or flow. No external diagram tool required. Done when: the requested diagram is rendered inline.

## Failure and recovery

- Unresolvable target: the target cannot be identified from argument, path, or conversation context. Stop. Ask one question naming what to explain. Do not invent a target.
- Partial code context: the target resolves to a partial view of the codebase. Explain what is visible. Mark where the picture is incomplete. Do not claim the explanation is complete when it is not.
- No rollback required: this skill is read-only. No file, state, or remote resource is modified.

## Output

A single plain explanation in layered prose, starting from purpose and progressing to code depth on request. Diagrams rendered inline on explicit request. No persistent workspace, no session state, no multi-turn follow-up required.
