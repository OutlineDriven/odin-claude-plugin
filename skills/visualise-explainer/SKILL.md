---
name: visualise-explainer
description: 'Use when asked to create interactive HTML explainers with controls and live state for any concept, returned in a visualizer fence for sandboxed rendering. Don''t use for tasks that require source or remote-system changes.'
---

# Visualise explainer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | explain, explainer, interactive explainer, how does X work (spatial/sequential with controls), slider, live state, interactive model |
| Authority | read-only: no file, VCS, credential, paid, published, deployed, or remote mutation |
| Side effect | chat output: visualizer fence containing a self-contained HTML interactive explainer with controls and live state, rendered by the client in a sandboxed iframe |
| Done | interactive HTML explainer with working controls and live-updating state in the sandboxed iframe |

## Inputs

1. **Concept** (required) — the topic, system, algorithm, or process to explain. Extracted from the user message.
2. **Interaction model** (optional) — spatial layout, sequential steps, state machine, or parameter sweep. Infer from the concept structure when not supplied.
3. **Depth** (optional) — introductory, intermediate, or detailed. Default to introductory when not specified.

## Procedure

1. Parse the concept from the user message. Identify the core entities, relationships, and dynamics that the explainer must make visible.
2. Determine the interaction model: spatial (drag, pan, zoom), sequential (step forward/back), state machine (toggle states, observe transitions), or parameter sweep (sliders adjust variables, output updates). Select the model that best matches the concept's structure.
3. Identify the controls: for spatial models, clickable regions or draggable elements; for sequential, prev/next buttons with a step counter; for state machines, toggle buttons or dropdown selectors showing current state; for parameter sweeps, range sliders with labeled axes and numeric readouts.
4. Design the state representation: define the JavaScript variables that change, their initial values, valid ranges, and the mapping from each control to its corresponding state variable.
5. Build a single self-contained HTML document with embedded CSS and JavaScript. Include the controls panel, the visualization or explanation area, and the event handlers that update state and re-render on every interaction. Use no external dependencies, CDN links, or fetch calls.
6. Verify the controls mentally: trace at least two state transitions to confirm the model is correct, the visualization updates, and no control produces an invalid or dead state.
7. Wrap the complete HTML in a visualizer fence for sandboxed iframe rendering by the client.

## Failure and recovery
| Failure class | Detection | Recovery |
|---|---|---|
| Concept too broad or ambiguous | Multiple unrelated interpretations possible | Ask the user to narrow the scope; do not guess or produce a generic explainer |
| Interaction model cannot represent the concept | No control maps to a meaningful state change | Switch to a different model type (e.g., sequential instead of spatial) and re-derive the controls |
| HTML output fails self-containment check | External URL, CDN reference, or fetch call detected | Remove the dependency and reimplement with inline assets and pure DOM manipulation |
| Controls produce dead or invalid state | A slider, toggle, or button has no observable effect on the visualization | Fix the event handler wiring and state-to-render mapping before emitting |

Partial-result rule: never emit an explainer with non-functional controls. If any control fails, fix it or remove it and adjust the explainer scope. Never pretend the done predicate holds when controls are broken.

## Output
A self-contained HTML document with working controls and live-updating state, delivered in a visualizer fence for sandboxed iframe rendering. No external dependencies. No placeholder content.

## Provenance

- Origin: https://github.com/bentossell/visualise at revision 35cd185b58af5db2f9d0fe13d9872b544a467483
- License: MIT (README-only declaration; no dedicated LICENSE file at this revision). Preserve copyright and full MIT text.
- Adaptation: clean-room rederivation of mechanisms from upstream SKILL.md, references/design-system.md, and references/components.md. No third-party expression copied. Module remapped from odin-design to odin-create-advanced per editorial advanced-tier ruling.
