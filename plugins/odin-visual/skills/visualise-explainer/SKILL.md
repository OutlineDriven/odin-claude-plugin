---
name: visualise-explainer
description: 'Use when asked to create an interactive HTML concept explainer with controls and live state, returned in a visualizer fence for sandboxed rendering. Validates controls via a local DOM trace, not a mental trace. Not for tasks that require source or remote-system changes.'
---

# Visualise explainer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks for an interactive explainer, how does X work (with controls), slider, live state, or interactive model |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation |
| Side effect | Chat output: visualizer fence containing a self-contained HTML interactive explainer with controls and live state, rendered by the client in a sandboxed iframe |
| Done | Visualizer fence containing a functional interactive explainer with working controls and live-updating state, validated via local DOM trace |

## Inputs

- Concept (required): the topic, system, algorithm, or process to explain. Extracted from the user message.
- Interaction model (optional): spatial layout, sequential steps, state machine, or parameter sweep. Inferred from the concept structure when not supplied.
- Depth (optional): introductory, intermediate, or detailed. Defaults to introductory.

## Procedure

1. **Extract concept core dynamics.** Identify the entities, relationships, and state changes the explainer must make visible. Done when: the core dynamics are identified.

2. **Select interaction model and map state.** Choose spatial (drag, pan, zoom), sequential (step forward/back), state machine (toggle states, observe transitions), or parameter sweep (sliders adjust variables). Define the JavaScript state variables, their initial values, valid ranges, and the mapping from each control to its state variable. Done when: the model is selected and state is mapped.

3. **Generate HTML with inline event handlers.** Build a single self-contained HTML document with embedded CSS and JavaScript. Include the controls panel, the visualization area, and event handlers that update state and re-render on every interaction. No external dependencies, CDN links, or fetch calls. Done when: the HTML document is self-contained with all controls and event handlers.

4. **Validate controls via local DOM trace.** Parse the generated HTML with a DOM library (jsdom or equivalent). For every control element, verify it has an event handler that references a defined function. For every event handler, verify the state variables it references are declared. Simulate at least two state transitions programmatically: trigger the handler, read the resulting state, and confirm the visualization output changed. If any control has no handler, any handler references an undefined function, or any simulated transition produces no visible change, fix the HTML and re-validate. Done when: all controls have working handlers and two simulated transitions produce visible state changes.

5. **Wrap in visualizer fence.** Enclose the validated HTML in a visualizer fence for sandboxed iframe rendering by the client. Done when: the HTML is wrapped in the visualizer fence.

## Failure and recovery

| Failure class | Detection | Recovery |
|---|---|---|
| `ambiguous-concept` | Multiple unrelated interpretations possible | Ask the user to narrow the scope. Do not guess or produce a generic explainer. |
| `unrepresentable-interaction` | No control maps to a meaningful state change in any model | Report that the concept cannot be represented with the available interaction models. Do not emit a non-functional explainer. |
| `external-dependencies-detected` | External URL, CDN reference, or fetch call found in the HTML | Remove the dependency and reimplement with inline assets and pure DOM manipulation. |

Partial-result rule: never emit an explainer with non-functional controls. If any control fails the DOM trace, fix it or remove it and adjust the explainer scope.

## Output

A visualizer fence containing a self-contained HTML document with working controls and live-updating state, validated via local DOM trace.
