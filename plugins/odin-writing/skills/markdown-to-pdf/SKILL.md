---
name: markdown-to-pdf
description: 'Use when the user runs /markdown-to-pdf on Markdown to render a publication-quality PDF. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Make PDF from Markdown

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs /markdown-to-pdf on a Markdown file. |
| Authority | Reversible local: writes only the rendered PDF and intermediate artifacts; rollback is deleting them. No remote mutation. |
| Side effect | Writes the output PDF and intermediate HTML/artifacts to the local filesystem; no remote, VCS, credential, or published mutation. |
| Done | A PDF is produced with the emoji, diagram, landscape, and combined gates green. |

## Inputs

- `input.md` (required): the Markdown source to render.
- `$MAKE_PDF_BIN` (required): path to the executable PDF renderer binary.
- `output.pdf` (optional): explicit output path; defaults to `/tmp/<input-basename>.pdf`.
- Rendering flags (optional): `--cover`, `--toc`, `--watermark <text>`, `--no-confidential`, `--no-chapter-breaks`, `--page-size letter|a4|legal`, `--margins <dim>`, `--strict`, `--allow-network`, `--to pdf`.

## Procedure

1. Locate the PDF renderer binary (`$P`): the only path is `$MAKE_PDF_BIN`, and it is required. If `$MAKE_PDF_BIN` is unset or not executable, stop and tell the user to set `$MAKE_PDF_BIN` to the renderer binary path; do not proceed. Done when: an executable `$P` is found or the run stops naming the missing `$MAKE_PDF_BIN`.
2. Verify the toolchain: run `$P setup` to confirm headless Chromium, the browse daemon, and `pdftotext` are available and a smoke test passes. Check that `fonts-liberation` (Helvetica/Arial metric-compatible fallback) and a color-emoji font (`fonts-noto-color-emoji` on Linux, Apple Color Emoji on macOS, Segoe UI Emoji on Windows) are installed. If either font is absent, stop and tell the user which package to install (`apt install fonts-liberation fonts-noto-color-emoji` on Debian/Ubuntu, or the platform equivalent); do not proceed and do not install fonts yourself. Done when: `$P setup` passes and both fonts are confirmed present, or the run stops naming the missing component and the install command.
3. Render the source Markdown to PDF: `$P generate <input.md> [output.pdf]`. Add `--cover --toc --author "..." --title "..."` for publication layout (each top-level H1 starts a new page unless `--no-chapter-breaks`); add `--watermark DRAFT` for a diagonal 10%-opacity watermark; add `--no-confidential` to suppress the default CONFIDENTIAL footer. The renderer uses headless Chromium with Paged.js pagination, 1in margins, Helvetica/Liberation Sans body, curly quotes and em dashes, running header and page numbers. Capture the output path from stdout (one line, the path only). Done when: the output path is captured from stdout.
4. Run the emoji gate: render a minimal Markdown containing emoji (for example `✅ done 🚀 launch`) and confirm the emoji render as color glyphs, not empty boxes (▯). The print CSS falls back through Apple Color Emoji, Segoe UI Emoji, and Noto Color Emoji. If emoji render as boxes, the color-emoji font is missing: stop and tell the user to install it (`apt install fonts-noto-color-emoji` on Debian/Ubuntu, or the platform equivalent), then retry. Do not install fonts yourself. Done when: emoji appear as color glyphs.
5. Run the diagram gate: render a Markdown with a column-0 ` ```mermaid ` fence (for example a simple flowchart) and confirm it renders as a crisp vector diagram, not raw code. Diagrams render fully offline via a vendored bundle (no CDN). Indented fences (inside lists) stay plain code blocks by design. A broken fence must produce a visible red diagnostic block with the parse error, never silent raw code. Done when: the fence renders as a diagram or a broken fence shows a red diagnostic.
6. Run the landscape gate: render a Markdown with a wide diagram image (aspect ratio ≥ 1.8, width over ~2.5× the content box, and a diagram-ish alt word such as diagram/architecture/flowchart/chart/graph) or an explicit `{page=landscape}` directive, and confirm the diagram gets its own landscape page, vertically centered. `{page=portrait}` vetoes auto-landscape; `{page=landscape}` forces it. Done when: the wide diagram occupies a landscape page.
7. Run the combined gate: render the full source document end-to-end with all features in play (cover, TOC, chapter breaks, emoji, mermaid/excalidraw diagrams, landscape pages, local images, optional watermark). Confirm the PDF is produced, copy-paste from the PDF yields clean words (never fragmented like "S a i l i n g"), local images inline capped at the content box with zero truncation, and remote images render as a visible blocked placeholder unless `--allow-network` was passed. Done when: the full document renders as a finished artifact.
8. All four gates green: report DONE with the output PDF path. If any gate is not green, do not claim success: report which gate failed and the evidence. Done when: all four gates are green and the PDF path is reported, or the failing gate and evidence are reported.

## Failure and recovery

- Binary not found: `$MAKE_PDF_BIN` is unset or not executable. Stop; tell the user to set `$MAKE_PDF_BIN` to the renderer binary path, then retry. Do not proceed without the renderer.
- Setup failure: `$P setup` reports a missing component (Chromium, browse daemon, or `pdftotext`). Stop; report the missing component and the setup output. Do not attempt to render.
- Emoji gate red: emoji render as empty boxes. The color-emoji font is missing. Stop and tell the user to install `fonts-noto-color-emoji` (or the platform equivalent), then retry. Do not claim the gate is green and do not install fonts yourself.
- Diagram gate red: a mermaid or excalidraw fence renders as raw code, or a broken fence produces no diagnostic. Check the fence is at column 0 (not indented), check the vendored diagram bundle is present, and re-render. A broken fence that silently shows raw code is a renderer defect: report it, do not work around it.
- Landscape gate red: a wide diagram does not get a landscape page. Add an explicit `{page=landscape}` directive and re-render; if it still fails, report the renderer defect.
- Combined gate red: the full document fails to render or copy-paste text is fragmented. For a Paged.js timeout, drop `--toc` (likely no headings). For blank output, check the browse daemon status. For fragmented copy-paste, remove fenced code blocks and regenerate. Re-run after the fix; do not claim success on a partial render.
- Exit codes: 0 success / 1 bad args / 2 render error / 3 Paged.js timeout / 4 browse unavailable. Map each non-zero exit to the failure class above. Never swallow a non-zero exit or pretend the done predicate holds.
- Partial-result rule: if the render succeeds but a gate is red, the PDF is a partial result. Report the gate that failed and the evidence; do not present the PDF as done.
- Non-mutation rule: on any failure, no source Markdown or input file is modified. Only the output PDF and intermediate artifacts are written; delete the partial PDF if a gate is red and the user did not ask to keep it.

## Output

The rendered PDF at the output path (stdout prints the path, one line) plus a gate report: for each of the four gates (emoji, diagram, landscape, combined), green or red with the evidence used to confirm it. Terminal status: DONE with the PDF path when all four gates are green; BLOCKED with the failed gate and evidence when any gate is red or the renderer is unavailable.
