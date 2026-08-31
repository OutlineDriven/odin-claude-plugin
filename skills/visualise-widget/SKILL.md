---
name: visualise-widget
description: 'Use when a user requests a comparison table, data record, metric card, stepper, or mockup widget. The model returns a self-contained HTML fragment in a visualizer fence for sandboxed iframe rendering. Don''t use for tasks that require source or remote-system changes.'
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

- **Required:** Natural-language description of the comparison, data record, metric, process, or mockup to visualise.
- **Optional:** Specific data values, labels, or layout preferences. When absent, the model generates representative placeholder content that matches the requested pattern.

## Procedure

1. Parse the user description to identify the widget pattern: comparison table, data record, metric card, stepper, or mockup.
2. Map the request to the matching pattern structure:
   - **Comparison table:** Two or more columns with row-aligned attributes; highlight differences.
   - **Data record:** Card or profile layout with labeled fields and optional avatar or icon.
   - **Metric card:** Large numeric value with label, optional trend indicator or sparkline.
   - **Stepper:** Numbered or icon-labeled steps in a horizontal or vertical cycle with active-step highlight.
   - **Mockup:** Device frame (mobile, chat bubble, modal dialog) containing placeholder UI elements.
3. Generate a single self-contained HTML fragment using semantic elements, inline CSS, and accessible attributes (role, aria-label, alt text where applicable). No external stylesheet, script, image URL, or font import.
4. Apply the design-system color palette, spacing scale, and typography tokens from the references. Use only CSS custom properties or inline values that resolve without network access.
5. Validate the fragment: well-formed HTML, no unclosed tags, no script elements, no event handlers beyond structural attributes, all text content present.
6. Return the fragment inside a visualizer fence. No surrounding commentary, explanation, or alternative versions.

## Failure and recovery
- **Unsupported pattern:** If the user request does not map to any of the five patterns, return a single sentence naming the supported patterns and ask the user to rephrase. Do not guess or generate a closest-match widget.
- **Malformed HTML:** If the generated fragment fails well-formedness validation (step 5), regenerate once from the same pattern specification. If the second attempt still fails, return an error message naming the specific structural issue. Do not return partial or broken HTML.
- **Scope violation:** If the procedure would require writing a file, making a network call, invoking a tool, or modifying repository state, stop immediately and return a refusal naming the violated authority boundary. No partial result.
- **Non-converged:** After two regeneration attempts the result is blocked. Return the error; do not widen scope or substitute a different pattern.

## Output
A visualizer fence containing one valid, self-contained HTML fragment that renders the requested widget pattern in a sandboxed iframe. No additional text, metadata, or follow-up.

## Provenance

- Origin: https://github.com/bentossell/visualise at revision 35cd185b58af5db2f9d0fe13d9872b544a467483
- License: MIT (README-only declaration; no dedicated LICENSE file at this revision). Preserve copyright and full MIT text. Clean-room rederived layout snippets; source expression not copied.
- Paths referenced: SKILL.md, references/design-system.md, references/components.md
- Adaptation: Module remapped from odin-design to odin-create per editorial common-tier ruling. Expression clean-room rederived from upstream mechanisms.
