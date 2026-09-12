---
name: show-me
description: 'Use when asked to show/diagram: comparison table, data record, metric card, stepper, mockup, numeric chart, interactive explainer. Modes: widget/chart/explainer. Not for audits: use show-me-your-work.'
---

# Show me

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user says show this, show me, or diagram this about the current topic, or requests a comparison table, data record, metric card, stepper, mockup/widget, numeric or series chart, or interactive explainer. |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Emits one (or at most two) ephemeral visuals in chat; widget, chart, or explainer mode emits a visualizer fence containing self-contained HTML rendered by the client in a sandboxed iframe. Nothing is written to disk. |
| Done | One (or at most two) smallest views carry the point, or the requested widget, chart, or explainer HTML is valid in the sandboxed iframe; explainer mode also requires working controls and live-updating state validated via local DOM trace. |

## Not for

- An auditable decision trail for unattended work: use show-me-your-work.
- A committed diagram in a document: use diagramming-code.
- A standalone interactive clickable sketch rather than an explainer: use prototype.
- Teaching a concept with explanation and examples: use explain-concept.
- A visual walk of review findings one at a time: use show-review.
- A guided multi-turn exploration: use walk-with-me.

## Inputs

- Required: the current topic from the user prompt and the point the visual must carry. When optional values, labels, layout, or other content are absent, generate representative placeholder content that matches the requested pattern.
- Optional `mode`: `widget`, `chart`, or `explainer`; absent means auto-detect, and an explicit mode always wins.
- Widget mode: a natural-language description of the comparison, data record, metric, process, mockup, data set, or concept to visualise; optional data values, labels, and layout preferences.
- Chart mode: optional numeric or series data; optional chart type (bar, line, doughnut, scatter, sparkline, or another named format), title, axis labels, legend, palette, and size constraints.
- Explainer mode: the concept and optional interaction model (spatial, sequential, state machine, or parameter sweep) and depth (introductory, intermediate, or detailed).

## Procedure

1. **Identify the concept and mode.** Identify the single concept the user asks to see. If the topic is too broad for one visual, ask the user to narrow it before producing more than two views. An explicit mode input wins; otherwise route numeric or series data to Mode chart, an interactive explainer with controls or live state to Mode explainer, and other widget requests to Mode widget. For a diagram or code-view request without a named mode, keep the survivor's minimal view selection. In widget mode identify the requested comparison table, data record, metric card, stepper, or mockup; in chart mode validate the data format at the trust boundary; in explainer mode identify the concept's core dynamics (entities, relationships, and state changes). Done when: one concept, mode, and pattern are identified, the view request is classified, or the step has stopped with `unsupported-pattern`, `INVALID_DATA`, or `ambiguous-concept`.
2. **Pick the smallest view or map the pattern structure.** For a diagram or code-view request, pick the smallest view that carries the point:

   | The point is | View |
   |---|---|
   | How something works step by step | Pseudocode |
   | Who calls what | Call tree |
   | Component hierarchy | Component tree, naming the file that owns each boundary |
   | What lives where | Shallow file tree, one comment per directory saying what it owns |
   | Relationships or flow | Diagram (Mermaid or nomnoml) |
   | The code itself | Whole block |

   In widget mode map a comparison table to two or more columns with row-aligned attributes and highlighted differences; a data record to a card or profile with labeled fields and an optional avatar or icon; a metric card to a large numeric value with a label and optional trend indicator or sparkline; a stepper to numbered or icon-labeled steps in a horizontal or vertical cycle with an active-step highlight; and a mockup to a mobile, chat-bubble, or modal device frame containing placeholder UI elements. In chart mode select an inline SVG or Canvas renderer that fits the chart type and data plan. In explainer mode select the interaction model (spatial drag/pan/zoom, sequential step forward/back, state-machine toggles, or parameter-sweep sliders) and define JavaScript state variables, initial values, valid ranges, and the mapping from each control to its state variable. Done when: the view type or pattern structure is chosen, or the step has stopped with `UNSUPPORTED_TYPE` or `unrepresentable-interaction`.
3. **Render or generate the self-contained result.** Render a diagram or code view in chat using the appropriate shape. For widget or chart mode, build one semantic HTML fragment; for explainer mode, build one semantic interactive HTML document. Add accessible attributes (`role`, `aria-label`, and `alt` text where applicable). Keep every stylesheet, script, image asset, data value, label, and configuration inline; use no external stylesheet, script, image URL, font import, CDN link, or fetch call, and include no `<iframe>`, `<object>`, or `<embed>`. Explainer mode embeds a controls panel, visualization area, and event handlers that update state and re-render on every interaction. Done when: the view is rendered or the HTML is self-contained with no external references.
4. **Apply generic placeholder styling.** For widget, chart, or explainer mode, use standard web-safe color tokens, spacing, and typography, with CSS custom properties or inline values that resolve without network access. Do not reference external design-system files, tokens, or references. Done when: styling is applied and resolves without network access.
5. **Validate the result.** For a diagram or code view, confirm that the rendered view carries the point. For widget mode, check well-formed HTML, no unclosed tags, no script elements, no event handlers beyond structural attributes, and all text content present. For chart mode, run the same checks, with the inline SVG or Canvas renderer permitted as the only script. For explainer mode, parse the HTML with a DOM library (jsdom or equivalent); verify every control has an event handler that references a defined function, every handler references declared state variables, and at least two simulated state transitions produce a visible change. On validation failure, regenerate once from the same pattern specification and re-validate; if the second attempt fails, stop with the named failure class. Done when: validation passes, or the step has stopped after one regeneration attempt with `malformed-html` or `NON_CONVERGED`.
6. **Shape and place the supporting context.** Shape diffs to match the view they change: a component diff for UI changes, a file-layout diff for file organization, a call-tree diff for call-graph changes, and a pseudocode diff for control-flow changes. Place each ordinary visual adjacent to its short supporting text, not in its own trailing block. Done when: the diff matches its view type or no diff is needed, and the visual sits beside its context.
7. **Return the result.** For widget, chart, or explainer mode, return inside a visualizer fence as the sole output, with no surrounding commentary, explanation, or alternative versions. For an ordinary view request, return the ephemeral visual inline beside its short supporting text. Done when: the applicable output form is the sole or adjacent result.

## Failure and recovery

- Rendering impossible in text format: return the concept in prose instead of a visual.
- Topic too broad for one visual: ask the user to narrow the scope before generating more than two views.
- **Request requires a committed diagram, standalone interactive sketch, concept teaching, review walk, or multi-turn exploration:** stop and name the skill that handles it (see Not for).
- Unsupported pattern: the request maps to no supported widget pattern. Return a single sentence naming comparison table, data record, metric card, stepper, mockup, chart, and explainer, and ask the user to rephrase. Do not guess or generate a closest-match widget.
- `INVALID_DATA`: malformed numeric or series data in chart mode. Return the named failure class and stop. Do not produce a chart fragment from invalid input.
- `UNSUPPORTED_TYPE`: chart type not recognized. Return the named failure class and stop. Do not invent a fallback chart type.
- `ambiguous-concept`: multiple unrelated interpretations are possible in explainer mode. Ask the user to narrow the scope. Do not guess or produce a generic explainer.
- `unrepresentable-interaction`: no control maps to a meaningful state change in any interaction model. Report that the concept cannot be represented with the available interaction models. Do not emit a non-functional explainer.
- `external-dependencies-detected`: an external URL, CDN reference, or fetch call is found in the HTML. Remove the dependency and reimplement with inline assets and pure DOM manipulation.
- Malformed HTML: the generated fragment fails well-formedness validation. Regenerate once from the same pattern specification. If the second attempt still fails, return an error message naming the specific structural issue. Do not return partial or broken HTML.
- Scope violation: the procedure would require writing a file, making a network call, invoking a tool, or modifying repository state. Stop immediately and return a refusal naming the violated authority boundary. No partial result.
- Non-converged: after two regeneration attempts the result is blocked. Return the error (chart mode: `NON_CONVERGED` with the named failure class); do not widen scope or substitute a different pattern.
- Partial-result rule (explainer mode): never emit an explainer with non-functional controls. If any control fails the DOM trace, fix it or remove it and adjust the explainer scope.

## Output

- Widget, chart, or explainer mode: a visualizer fence containing one valid, self-contained HTML fragment or document that renders the requested widget pattern, inline SVG or Canvas chart, or interactive explainer in a sandboxed iframe. The fence is the sole output.
- Ordinary view request: an ephemeral visual shown inline beside its short supporting text; the visual carries the point alone, prose supplies only context the visual cannot, and nothing is written to disk.
- Otherwise a named failure class: `unsupported-pattern`, `INVALID_DATA`, `UNSUPPORTED_TYPE`, `NON_CONVERGED`, `ambiguous-concept`, `unrepresentable-interaction`, `external-dependencies-detected`, or `malformed-html`.
