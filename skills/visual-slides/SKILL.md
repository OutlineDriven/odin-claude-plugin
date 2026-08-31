---
name: visual-slides
description: 'Use when the user explicitly requests a slide deck, generate a self-contained HTML presentation in the diagrams directory, optionally exporting a static .pptx on --pptx; state fidelity limits when PPTX is requested. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

1. Confirm the slide count by enumerating the source items before writing any file. Stop if no source items are supplied.
2. Resolve the diagrams directory. Use the session diagrams directory if known; otherwise derive it from context or create `diagrams/` under the project root. Create the directory if absent.
3. Derive the output filename from the topic or title of the first slide. Lowercase, spaces to hyphens, `.html` suffix.
4. Generate the HTML deck:
   - One slide section per source item.
   - Embed all CSS inline in a `<style>` block.
   - Embed all JavaScript inline in a `<script>` block: no external CDN scripts, no `<script src>`, no `eval`, no `data:` URLs.
   - No external fonts; use system font stack.
   - Apply a short-landscape viewport budget: each slide fits within a 16:9 landscape viewport without horizontal scroll under `prefers-reduced-motion`.
   - Navigation: keyboard arrows and a visible progress indicator.
5. Write the HTML file to the diagrams directory under the derived filename.
6. If `--pptx` was in the request, attempt PPTX export:
   - Run the export script against the HTML deck.
   - If the export dependency is absent, fail softly: state the PPTX fidelity limits to the user instead of blocking.
   - Write the `.pptx` next to the HTML file.
7. Report the HTML path and, if produced, the PPTX path.

## Failure and recovery
**Named failure classes:**
- `no-source-items`: source items empty or unreadable → stop, return error.
- `directory-error`: diagrams directory cannot be created → stop, do not write.
- `write-failure`: file write returns non-zero → stop, do not report success.
- `pptx-export-failure`: export script missing or fails → fail softly; report fidelity limits; HTML deck remains the source of truth.

**Partial-result rule:** If the HTML file is not written and validated, discard all output. Do not report done.

**Rollback:** Deleting the written HTML file (and `.pptx` if present) restores the pre-invocation state. The tool does not delete pre-existing files.

**Blocked result:** The done predicate does not hold until every source item is mapped to a slide, the viewport budget check passes, and the HTML file exists in the diagrams directory.

## Output
A complete self-contained HTML slide deck in the diagrams directory. Optionally a `.pptx` beside it. Both paths reported to the user.

## Provenance

Adapted from `nicobailon/visual-explainer` (MIT) at `7163c3e10660912e0b89e1af465db9f387282b88`. Source files: `plugins/visual-explainer/commands/generate-slides.md`, `plugins/visual-explainer/templates/slide-deck.html`, `plugins/visual-explainer/references/slide-patterns.md`, `plugins/visual-explainer/references/css-patterns.md`, `plugins/visual-explainer/references/libraries.md`, `plugins/visual-explainer/pptx/export.mjs`, `plugins/visual-explainer/pptx/README.md`, `plugins/visual-explainer/SKILL.md`. MIT notice retained. Clean-room rederivation of the slide-deck generation procedure; HTML template rewritten from scratch.
