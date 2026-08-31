---
name: paced-explanation
description: 'Use when asked to teach a subsystem or change. Returns a plain paced explanation with deeper layers on request. Don''t use for tasks that require source or remote-system changes.'
---

# Paced explanation

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Teach a subsystem or change. |
| Authority | No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output. May render diagrams. |
| Done | Plain paced explanation with deeper layers on request. |

## Inputs

- **Target** (required): the subsystem, module, pattern, or change to explain. Supplied as an argument, a file path, or the current conversation context.
- **Depth** (optional): explicit depth ceiling or focus area. Absent means begin at plain layer and offer deeper.

## Procedure

1. **Identify the target.** Resolve the target to concrete code: file paths, line ranges, and key symbols. Use `grep`, `glob`, `read`, or LSP tools. If the target cannot be resolved after one read of the conversation, stop and ask one clarifying question naming what to explain.
2. **Map the scope.** Identify the entry point, internal structure, and external interfaces of the target. Build a lightweight mental map: what the subsystem owns, what it delegates, and how it is named in the codebase.
3. **Explain in progressive layers.** Deliver the explanation as a flat sequence from surface to depth, with each layer building on the previous:
   - Layer 1 — Purpose: what the target does and why it exists in one sentence.
   - Layer 2 — Structure: how the target is organized and what the main components are.
   - Layer 3 — Behavior: how the components interact and what the key inputs and outputs are.
   - Layer 4 — Code: the key symbols, line ranges, and the logic they encode.
4. **Offer deeper layers.** After each layer, invite the user to request more depth. Accept a focus area or continue layer by layer. Stop when the user stops.
5. **Render diagrams on request.** If the user asks for a diagram, render an inline diagram (ASCII, Mermaid, or HTML) showing the structure or flow. No external diagram tool required.

## Failure and recovery
- **Unresolvable target:** the target cannot be identified from argument, path, or conversation context. Stop. Ask one question naming what to explain. Do not invent a target.
- **Partial code context:** the target resolves to a partial view of the codebase. Explain what is visible. Mark where the picture is incomplete. Do not claim the explanation is complete when it is not.
- **No rollback required:** this skill is read-only. No file, state, or remote resource is modified.

## Output
A single plain explanation in layered prose, starting from purpose and progressing to code depth on request. Diagrams rendered inline on explicit request. No persistent workspace, no session state, no multi-turn follow-up required.

## Provenance

Origin: cursor/plugins — pstack/skills/teach/SKILL.md.
Revision: 68836ddaf5697224520f1847d90cdb90ca8babaa.
License: MIT (pstack authored by Lauren Tan; MIT license blob 6b5400237fdf6545be0b8fae370d6f2fcff8fb25).
Adaptation: read-only single-explanation workflow isolated from the workspace-building teach variant. Scope narrowed to progressive-depth single explanation with no persistent state.
