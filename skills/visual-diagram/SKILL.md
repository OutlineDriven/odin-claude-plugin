---
name: visual-diagram
description: 'Use when a topic, system, or architecture needs a self-contained HTML diagram opened in the browser or returned by path. Not for Excalidraw or document-embedded diagrams — use visual-argument-diagram or diagram-contract.'
---

# Visual diagram

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to diagram or visually explain a topic, system, or architecture |
| Authority | reversible-local: write only one named local HTML artifact; state the rollback path |
| Side effect | Writes one self-contained HTML file under the user diagrams directory; opens the page in a browser or reports the path |
| Done | Complete document passing the final checklist: no console errors, no horizontal overflow, dual-theme or deliberate single theme, labeled Mermaid edges, figure captions with claims |

## Inputs

Required:
- **Topic or subject**: the concept, system, or architecture the user wants visualised.
- **Diagram type**: one of architecture, flowchart, data-table, or another type the HTML template supports.

Optional:
- **Style direction**: preferred color palette, font, or layout hint from the user.

## Procedure

1. **Confirm the diagram type** from the user's request. Match it to the nearest supported template kind (architecture, flowchart, data-table). If the request does not match any supported kind, stop and report that the diagram type is not supported. **Done when:** the diagram type is matched to a supported template.
2. **Resolve the output directory**: use the user diagrams directory if one is already known; otherwise derive it from the session context or use a standard `diagrams/` folder under the project root. Create the directory if it does not exist. **Done when:** the output directory is resolved and exists.
3. **Derive the filename** from the topic. Convert to lowercase, replace spaces with hyphens, and append `.html`. **Done when:** the filename is derived.
4. **Write the HTML file** using a self-contained template:
   - Embed all CSS inline in a `<style>` block.
   - Embed all JavaScript inline in a `<script>` block.
   - If using Mermaid, include the Mermaid CDN script or embed the Mermaid library.
   - Apply a dual-theme strategy (light and dark via `prefers-color-scheme` or a manual toggle) unless the user explicitly requests a single theme.
   - Ensure no horizontal overflow by using responsive layout, flexbox, or CSS grid with overflow containment.
   - Label every Mermaid edge with a descriptive text annotation.
   - Add a `<figcaption>` or equivalent caption to each figure that states the claim it illustrates.
   **Done when:** the HTML file is written with all inline assets and features.
5. **Validate the output** against the final checklist:
   - Open the file in a headless browser or use an equivalent DOM check to confirm zero console errors.
   - Confirm that no element exceeds the viewport width (no horizontal overflow).
   - Confirm a dual theme or a documented, deliberate single theme.
   - Confirm that every Mermaid edge has a label.
   - Confirm that every figure has a caption stating a claim.
   **Done when:** every checklist item passes.
6. **Deliver the result**: open the HTML file in the default browser and report its path. If opening is not possible, report the file path and ask the user to open it. **Done when:** the file is opened or its path is reported.

## Failure and recovery
| Failure class | Condition | Result |
|---|---|---|
| `unsupported-diagram-type` | Request does not match any supported template kind | Stop; report unsupported type; do not write a file |
| `write-error` | File write fails (permissions, disk full, path not found) | Stop; report the error; do not claim the file exists |
| `console-error` | Headless DOM check detects a console error | Stop; report the error; do not open the file |
| `overflow-error` | Horizontal overflow detected | Stop; report the overflow; do not open the file |
| `missing-labels` | Unlabeled Mermaid edge or unlabelled figure caption | Stop; report the missing labels; do not open the file |

Partial-result rule: if write succeeds but validation fails, delete the written file before reporting the failure.
Rollback: `rm <written-filename>` restores the pre-invocation state.

## Output
One self-contained HTML file at `<user diagrams directory>/<derived-filename>.html`, opened in the browser or its path reported.
