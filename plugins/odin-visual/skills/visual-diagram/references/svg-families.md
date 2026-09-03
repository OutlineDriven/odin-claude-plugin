# SVG diagram family composition rules

Branch-specific composition rules for each diagram family recognized by `visual-diagram`.

## Flowchart

Sequential steps, decision points, process walkthrough. Use when the user says "walk me through", "steps", or "process".

- Top-to-bottom or left-to-right flow with arrow markers defined in `<defs>`.
- Decision nodes use diamond polygons.
- Start/end nodes use rounded rectangles or stadium shapes.

## Structural

Components, relationships, containment, data flow between parts. Use when the user says "architecture", "where X lives", "how X connects", or "map out".

- Boxes for components, lines or arrows for relationships.
- Containment via nested `<g>` or visual grouping.
- Label every edge.

## Illustrative

Conceptual explanation of how something works, not strictly sequential or structural. Use when the user says "how does X work", "draw", or "illustrate".

- Free-form layout that best explains the concept.
- Use visual metaphor where it aids understanding.
