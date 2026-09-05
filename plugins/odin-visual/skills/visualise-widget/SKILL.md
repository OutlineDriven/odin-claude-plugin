---
name: visualise-widget
description: 'Use when a user requests a comparison table, data record, metric card, stepper, or mockup widget, a numeric chart, or an interactive explainer. Not for source or remote-system changes.'
---

# Visualise widget

## Contract

| Field | Bound contract |
|---|---|
| Trigger | comparison (compare X vs Y), data record (card/profile), metric card, stepper (cyclic process), mockup (mobile/chat/modal), widget/card; chart mode: chart, plot, graph, or visualise numeric or series data; explainer mode: interactive explainer, how does X work with controls, slider, live state, or interactive model |
| Authority | Read-only: writes nothing; no rollback needed. No remote mutation. |
| Side effect | chat-output only: a visualizer fence containing an HTML fragment (widget or chart) or a self-contained interactive HTML document (explainer), rendered by the client in a sandboxed iframe |
| Done | valid HTML of the requested pattern in the sandboxed iframe; explainer mode also requires working controls and live-updating state validated via local DOM trace |

## Inputs

- Required: natural-language description of the comparison, data record, metric, process, mockup, data set, or concept to visualise.
- `mode` (optional): `widget`, `chart`, or `explainer`. Absent means auto-detect from the request.
- Optional: specific data values, labels, or layout preferences; chart type (bar, line, doughnut, scatter, sparkline, or another named format), title, axis labels, legend, palette, and size constraints; explainer interaction model (spatial, sequential, state machine, parameter sweep) and depth (introductory, intermediate, detailed). When absent, the model generates representative placeholder content that matches the requested pattern.

## Procedure

1. **Select mode and parse the request.** Route by the ask: numeric or series data to chart, plot, or graph → Mode chart; an interactive explainer with controls or live state → Mode explainer; otherwise Mode widget. An explicit mode input always wins. Identify the pattern: widget mode maps to comparison table, data record, metric card, stepper, or mockup; chart mode maps to the requested chart type and validates the data format at the trust boundary; explainer mode maps to the concept's core dynamics (entities, relationships, state changes). Done when: the mode and pattern are identified, or the step has stopped with `unsupported-pattern`, `INVALID_DATA`, or `ambiguous-concept`.
2. **Map to the pattern structure.** Widget mode: comparison table (two or more columns with row-aligned attributes, highlight differences); data record (card or profile layout with labeled fields and optional avatar or icon); metric card (large numeric value with label, optional trend indicator or sparkline); stepper (numbered or icon-labeled steps in a horizontal or vertical cycle with active-step highlight); mockup (device frame: mobile, chat bubble, or modal dialog containing placeholder UI elements). Chart mode: select an inline SVG or Canvas renderer, whichever fits the chart type and data plan; all rendering logic is inline. Explainer mode: select the interaction model (spatial drag/pan/zoom, sequential step forward/back, state machine toggles, or parameter sweep sliders) and define the JavaScript state variables, their initial values, valid ranges, and the mapping from each control to its state variable. Done when: the pattern structure is mapped, or the step has stopped with `UNSUPPORTED_TYPE` or `unrepresentable-interaction`.
3. **Generate the self-contained HTML.** Build one fragment (widget, chart) or one document (explainer) with semantic elements, inline CSS, and accessible attributes (role, aria-label, alt text where applicable). No external stylesheet, script, image URL, font import, CDN link, or fetch call; no `<iframe>`, `<object>`, or `<embed>`. Chart mode embeds all data, labels, and configuration inline. Explainer mode embeds the controls panel, the visualization area, and event handlers that update state and re-render on every interaction. Done when: the HTML is self-contained with no external references.
4. **Apply generic placeholder styling** using standard web-safe color tokens, spacing, and typography. Use CSS custom properties or inline values that resolve without network access. Do not reference external design-system files, tokens, or references. Done when: styling is applied and resolves without network access.
5. **Validate.** Widget mode: well-formed HTML, no unclosed tags, no script elements, no event handlers beyond structural attributes, all text content present. Chart mode: the same checks, with the inline SVG or Canvas renderer permitted as the only script. Explainer mode: parse the HTML with a DOM library (jsdom or equivalent); verify every control has an event handler that references a defined function, every handler references declared state variables, and at least two simulated state transitions produce a visible change; fix the HTML and re-validate on any failure. Done when: validation passes, or the step has stopped after one regeneration attempt with `malformed-html` or `NON_CONVERGED`.
6. **Return inside a visualizer fence** as the sole output. No surrounding commentary, explanation, or alternative versions. Done when: the fenced fragment is the sole output.

## Failure and recovery

- Unsupported pattern: the request maps to no widget pattern. Return a single sentence naming the supported patterns and ask the user to rephrase. Do not guess or generate a closest-match widget.
- `INVALID_DATA`: malformed numeric or series data in chart mode. Return the named failure class and stop. Do not produce a chart fragment from invalid input.
- `UNSUPPORTED_TYPE`: chart type not recognized. Return the named failure class and stop. Do not invent a fallback chart type.
- `ambiguous-concept`: multiple unrelated interpretations possible in explainer mode. Ask the user to narrow the scope. Do not guess or produce a generic explainer.
- `unrepresentable-interaction`: no control maps to a meaningful state change in any interaction model. Report that the concept cannot be represented with the available interaction models. Do not emit a non-functional explainer.
- `external-dependencies-detected`: external URL, CDN reference, or fetch call found in the HTML. Remove the dependency and reimplement with inline assets and pure DOM manipulation.
- Malformed HTML: the generated fragment fails well-formedness validation. Regenerate once from the same pattern specification. If the second attempt still fails, return an error message naming the specific structural issue. Do not return partial or broken HTML.
- Scope violation: the procedure would require writing a file, making a network call, invoking a tool, or modifying repository state. Stop immediately and return a refusal naming the violated authority boundary. No partial result.
- Non-converged: after two regeneration attempts the result is blocked. Return the error (chart mode: `NON_CONVERGED` with the named failure class); do not widen scope or substitute a different pattern.
- Partial-result rule (explainer mode): never emit an explainer with non-functional controls. If any control fails the DOM trace, fix it or remove it and adjust the explainer scope.

## Output

A visualizer fence containing one valid, self-contained HTML fragment or document that renders the requested widget pattern, inline SVG or Canvas chart, or interactive explainer in a sandboxed iframe. Otherwise a named failure class: `unsupported-pattern`, `INVALID_DATA`, `UNSUPPORTED_TYPE`, `NON_CONVERGED`, `ambiguous-concept`, `unrepresentable-interaction`, `external-dependencies-detected`, or `malformed-html`.
