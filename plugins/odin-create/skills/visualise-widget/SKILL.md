---
name: visualise-widget
description: 'Use when a user requests a comparison table, data record, metric card, stepper, or mockup widget. Returns a self-contained HTML fragment in a visualizer fence for sandboxed iframe rendering. Don''t use for tasks that require source or remote-system changes.'
---

# Visualise widget

## Contract

| Field | Bound contract |
|---|---|
| Trigger | comparison (compare X vs Y), data record (card/profile), metric card, stepper (cyclic process), mockup (mobile/chat/modal), also widget/card |
| Authority | read-only: no file, VCS, credential, paid, published, deployed, or remote mutation |
| Side effect | chat-output only: visualizer fence containing an HTML fragment, rendered by the client in a sandboxed iframe |
| Done | valid HTML widget of the requested pattern in the sandboxed iframe |

## Inputs

- Required: Natural-language description of the comparison, data record, metric, process, or mockup to visualise.
- Optional: Specific data values, labels, or layout preferences. When absent, the model generates representative placeholder content that matches the requested pattern.

## Procedure

1. Parse the user description to identify the widget pattern: comparison table, data record, metric card, stepper, or mockup. Done when: pattern is identified, or the step has stopped with `unsupported-pattern`.
2. Map the request to the matching pattern structure: comparison table (two or more columns with row-aligned attributes, highlight differences); data record (card or profile layout with labeled fields and optional avatar or icon); metric card (large numeric value with label, optional trend indicator or sparkline); stepper (numbered or icon-labeled steps in a horizontal or vertical cycle with active-step highlight); mockup (device frame: mobile, chat bubble, or modal dialog containing placeholder UI elements). Done when: pattern structure is mapped.
3. Generate a single self-contained HTML fragment using semantic elements, inline CSS, and accessible attributes (role, aria-label, alt text where applicable). No external stylesheet, script, image URL, or font import. Done when: fragment is self-contained with no external references.
4. Apply generic placeholder styling using standard web-safe color tokens, spacing, and typography. Use CSS custom properties or inline values that resolve without network access. Do not reference external design-system files, tokens, or references. Done when: styling is applied and resolves without network access.
5. Validate the fragment: well-formed HTML, no unclosed tags, no script elements, no event handlers beyond structural attributes, all text content present. Done when: fragment passes well-formedness validation, or the step has stopped with `malformed-html` after one regeneration attempt.
6. Return the fragment inside a visualizer fence. No surrounding commentary, explanation, or alternative versions. Done when: fenced fragment is the sole output.

## Failure and recovery
- Unsupported pattern: the user request does not map to any of the five patterns. Return a single sentence naming the supported patterns and ask the user to rephrase. Do not guess or generate a closest-match widget.
- Malformed HTML: the generated fragment fails well-formedness validation. Regenerate once from the same pattern specification. If the second attempt still fails, return an error message naming the specific structural issue. Do not return partial or broken HTML.
- Scope violation: the procedure would require writing a file, making a network call, invoking a tool, or modifying repository state. Stop immediately and return a refusal naming the violated authority boundary. No partial result.
- Non-converged: after two regeneration attempts the result is blocked. Return the error; do not widen scope or substitute a different pattern.

## Output
A visualizer fence containing one valid, self-contained HTML fragment that renders the requested widget pattern in a sandboxed iframe.
