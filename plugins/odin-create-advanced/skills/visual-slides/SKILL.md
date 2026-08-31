---
name: visual-slides
description: 'Use when the user explicitly requests a slide deck by command, flag, or natural language. Generates a self-contained HTML deck in the diagrams directory; also handles .pptx export when the request contains --pptx, with stated fidelity limits. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Visual slides

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Explicit slide-deck request via command, flag, or natural language; never auto-selected |
| Authority | Reversible local: write only named local artifacts to the diagrams directory; delete the file to roll back |
| Side effect | Writes the HTML deck to the diagrams directory; on literal --pptx also writes a .pptx or fail-soft explains the missing export dependency |
| Done | Every source item mapped to a slide; viewport budget holds under reduced-motion and short-landscape delivery check; PPTX fidelity limits stated to the user |

## Inputs

Required:
- **Source items**: the content to present (one item per slide). Each item is a title, body text, or diagram source.
- **Slide count**: the number of source items determines the slide count. Derive this from the input before writing.

Optional:
- **Style direction**: color palette, font, or layout hint from the user.
- **PPTX flag**: literal `--pptx` on the request triggers PPTX export attempt.

## Procedure

1. Confirm the slide count by enumerating the source items before writing any file. Done when: slide count is confirmed, or the step has stopped with `no-source-items`.
2. Resolve the diagrams directory. Use the session diagrams directory if known; otherwise derive it from context or create `diagrams/` under the project root. Create the directory if absent. Done when: diagrams directory exists and is writable, or the step has stopped with `directory-error`.
3. Derive the output filename from the topic or title of the first slide. Lowercase, spaces to hyphens, `.html` suffix. Done when: filename is derived.
4. Generate the HTML deck: one slide section per source item; embed all CSS inline in a `<style>` block; embed all JavaScript inline in a `<script>` block (no external CDN scripts, no `<script src>`, no `eval`, no `data:` URLs); no external fonts, use system font stack; apply a short-landscape viewport budget (each slide fits within 16:9 landscape without horizontal scroll under `prefers-reduced-motion`); keyboard arrows and a visible progress indicator for navigation. Done when: HTML deck contains one slide per source item and passes the viewport budget check.
5. Write the HTML file to the diagrams directory under the derived filename. Done when: file exists in the diagrams directory, or the step has stopped with `write-failure`.
6. If the request contains literal `--pptx`, attempt PPTX export: run the export script against the HTML deck; if the export dependency is absent, fail softly (state the PPTX fidelity limits instead of blocking); write the `.pptx` next to the HTML file. Done when: `.pptx` is written or fidelity limits are stated, or the step has stopped with `pptx-export-failure`.
7. Report the HTML path and, if produced, the PPTX path. Done when: paths are in the response.

## Failure and recovery
- `no-source-items`: source items empty or unreadable → stop, return error.
- `directory-error`: diagrams directory cannot be created → stop, do not write.
- `write-failure`: file write returns non-zero → stop, do not report success.
- `pptx-export-failure`: export script missing or fails → fail softly; report fidelity limits; HTML deck remains the source of truth.

Partial-result rule: if the HTML file is not written and validated, discard all output. Rollback: delete the written HTML file (and `.pptx` if present); the tool does not delete pre-existing files.

## Output
A self-contained HTML slide deck in the diagrams directory, optionally a `.pptx` beside it, with both paths reported.
