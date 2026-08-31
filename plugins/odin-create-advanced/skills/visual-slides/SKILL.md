---
name: visual-slides
description: 'Use when the user explicitly requests a slide deck by command, flag, or natural language. Generates a self-contained HTML deck in the diagrams directory with embedded CSS, JavaScript, keyboard navigation, and a progress indicator. Not for PowerPoint files; use pptx.'
---

# Visual slides

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Explicit slide-deck request via command, flag, or natural language; never auto-selected |
| Authority | Reversible local: write only the named HTML file to the diagrams directory; delete the file to roll back |
| Side effect | Writes one self-contained HTML slide deck to the diagrams directory |
| Done | Every source item mapped to a slide; the deck fits within a 16:9 short-landscape viewport without horizontal scroll under prefers-reduced-motion; no external resource dependencies at runtime |

## Inputs

Required:
- **Source items**: the content to present, one item per slide. Each item is a title, body text, or diagram source.

Optional:
- **Style direction**: color palette, font, or layout hint from the user.

## Procedure

1. **Parse source items and map to slides.** Enumerate the source items before writing any file. Each item becomes one slide. Done when: slide count is confirmed from the source items, or the step has stopped with `empty-source-items`.

2. **Resolve the output filename.** Derive from the topic or title of the first slide: lowercase, spaces to hyphens, `.html` suffix. Resolve the diagrams directory: use the session diagrams directory if known, otherwise derive from context or create `diagrams/` under the project root. Create the directory if absent. Done when: filename is derived and the diagrams directory exists and is writable, or the step has stopped with `directory-not-writable`.

3. **Generate self-contained HTML with embedded assets.** One slide section per source item. Inline all CSS in a `<style>` block. Inline all JavaScript in a `<script>` block. No external CDN scripts, no `<script src>`, no `eval`, no `data:` URLs, no external fonts (use system font stack). Keyboard arrows and a visible progress indicator for navigation. Done when: the HTML deck contains one slide per source item with all assets inline.

4. **Validate short-landscape viewport budget.** Each slide must fit within a 16:9 landscape viewport without horizontal scroll under `prefers-reduced-motion`. Done when: every slide passes the viewport budget check.

5. **Write to the diagrams directory.** Write the HTML file under the derived filename. Done when: the file exists in the diagrams directory, or the step has stopped with `write-failure`.

## Failure and recovery

| Failure class | Rule |
|---|---|
| `empty-source-items` | Source items empty or unreadable. Stop, return error. |
| `directory-not-writable` | Diagrams directory cannot be created or is not writable. Stop, do not write. |
| `write-failure` | File write returns non-zero. Stop, do not report success. |

Partial-result rule: if the HTML file is not written and validated, discard all output. Rollback: delete the written HTML file. The tool does not delete pre-existing files.

## Output

A self-contained HTML slide deck in the diagrams directory, with the path reported.
