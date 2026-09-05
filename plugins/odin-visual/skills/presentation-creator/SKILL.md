---
name: presentation-creator
description: 'Use when asked to create a presentation, pitch deck, or slides from a topic and audience, or to format supplied source items into a 16:9 HTML slide deck. Not for PowerPoint files.'
---

# Presentation creator

Two modes: `originate` (default) builds the narrative, slides, and speaker notes from a topic and audience; `format` renders supplied source items directly into a 16:9 landscape HTML deck in the diagrams directory without inventing a narrative spine.

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Originate: create a complete presentation including narrative, slides, and speaker notes from a topic and audience. Format: the user supplies source items to present directly, one item per slide, and asks for a slide deck. |
| Authority | Reversible local: writes only the generated deck and supporting files (originate) or the one HTML deck in the diagrams directory (format); rollback is deleting those files. No remote mutation. |
| Side effect | Originate: a deck as markdown or web-deck HTML, plus supporting files in the working directory. Format: one self-contained HTML slide deck in the diagrams directory. |
| Done | Originate: a completed presentation file at a deterministic path in the requested format, passing editorial QA with no blocking issues. Format: every source item mapped to a slide, the deck fits a 16:9 short-landscape viewport without horizontal scroll under `prefers-reduced-motion`, and no external resource dependencies exist at runtime. |

## Inputs

- Mode (optional): `originate` (default) or `format`.
- Topic or subject (required for originate): the presentation's central theme or argument.
- Audience (required for originate): who will view the deck; drives tone, depth, and vocabulary.
- Format (optional, originate): `markdown` (default) or `web-deck`. If omitted, produce markdown.
- Source material (optional, originate): existing notes, outlines, documents, or data to incorporate.
- Brand tokens (required for web-deck): palette primary and accent colors, a wordmark or logo SVG, and a font stack. None are invented.
- Chart data (optional, web-deck): real datasets only; when omitted, the deck omits charts rather than fabricating data.
- Source items (required for format): the content to present, one item per slide; each item is a title, body text, or diagram source.
- Style direction (optional, format): color palette, font, or layout hint from the user.

## Procedure

1. Select the mode. `format` when the user supplies source items to present directly; `originate` otherwise. Done when: the mode is selected and its required inputs are present or the missing input is reported.

2. Mode originate: derive the narrative spine. Establish the situation, introduce the complication, raise the turning question, deliver the resolution, and land the takeaway. Each subsequent slide group must serve this spine. If a section cannot connect to the spine, remove it rather than force a weak link. Done when: the narrative spine states situation, complication, resolution, and takeaway.

3. Mode originate: outline the slide groups. Map the spine to ordered sections: opening hook, problem or context, core content, key takeaways, closing call-to-action. For pitch decks, follow the arc: problem, solution, market, traction, team, ask. Done when: every slide group is outlined in order and each serves the spine.

4. Mode originate: write slide headlines and concise visual content. For each slide, write a headline that states the slide's single point. Keep body text to no more than four bullet points or one short paragraph. Specify any visual element (chart, diagram, image placeholder, icon). Done when: every slide has a headline, body content, and visual specification.

5. Mode originate: generate standalone speaker notes for every slide. Expand on the slide text: provide the full talking point, anticipate audience questions, include data citations or examples not shown on the slide, and mark transitions to the next slide. Notes must be usable as a standalone script. Done when: every slide has speaker notes that work as a script.

6. Mode originate: apply design template and write to the specified output path. Set a consistent color palette and typography pairing for the audience and topic. Define layout templates: title slide, content slide, visual-heavy slide, closing slide. For web-deck format, scaffold a React + Vite + Recharts project (`src/App.jsx` deck component with keyboard navigation, `src/components/Slide.jsx`, `src/components/Chart.jsx`, `src/data/` holding real data files only, `src/styles/` derived from the supplied brand tokens, `index.html`, `package.json`), then build it: on the first scaffold, run `pnpm install` once to generate the lockfile and then `pnpm run build`; on later runs, run `pnpm install --frozen-lockfile && pnpm run build`. The output is one self-contained HTML file: inline all CSS, the bundled JavaScript, and SVG assets, with no external CDN, image, or runtime fetch. Keyboard navigation covers next and previous slide (arrows, space, page keys), Home and End, and focus management that announces the active slide. Verify in a browser that slides render, navigation works, and charts show the supplied data. Write the deck to `presentation-<topic-slug>.md` (markdown) or `presentation-<topic-slug>.html` (web-deck) in the working directory. Done when: the file exists at the deterministic path with design applied, and a web-deck build passed its browser verification.

7. Mode originate: run editorial QA. Check every slide: headline accurately represents content, speaker notes exist and are complete, visual design is consistent across all slides, story spine is traceable from opening to close, no orphaned or redundant slides, no broken references, and text is free of typos and grammatical errors. Fix each issue found. If a slide's content cannot be fixed without new information from the user, flag it as a blocker. Done when: every QA check passes with no blockers, or blockers are explicitly listed.

8. Mode format: parse source items and map to slides. Enumerate the source items before writing any file; each item becomes one slide. Done when: the slide count is confirmed from the source items, or the step stops with `empty-source-items`.

9. Mode format: generate the deck as one self-contained 16:9 landscape HTML file. One slide section per source item. Inline all CSS in a `<style>` block and all JavaScript in a `<script>` block. No external CDN scripts, no `<script src>`, no `eval`, no `data:` URLs, no external fonts (use the system font stack). Keyboard arrows and a visible progress indicator for navigation. Honor a supplied style direction (palette, font, layout hint) when given. Done when: the deck contains one slide per source item with all assets inline, and every slide fits the 16:9 landscape viewport without horizontal scroll under `prefers-reduced-motion`.

10. Mode format: resolve the output filename from the topic or the first slide title (lowercase, spaces to hyphens, `.html` suffix) and the diagrams directory (the session diagrams directory when known, otherwise `diagrams/` under the project root), create the directory when absent, and write the file. Done when: the file exists in the diagrams directory, or the step stops with `directory-not-writable` or `write-failure`.

## Failure and recovery

- Missing required inputs: stop immediately. Report which inputs are missing. Do not proceed with defaults or invented content.
- Story spine does not connect (originate): report the broken links and ask the user whether to remove disconnected sections or supply additional material.
- Design QA fails (originate): return a partial blocked result naming the blockers. Do not silently degrade the format. If web-deck tooling is unavailable, report the failure and ask the user whether to accept markdown instead; do not fall back without confirmation.
- Web-deck build fails (originate): on a dependency error, retry `pnpm install --frozen-lockfile`; on a corrupted or absent lockfile, regenerate it once with `pnpm install`, then return to the frozen form. On a code error, fix and rebuild. Report persistent failures.
- No real data for charts (originate): produce text-only slides. Never fabricate placeholder datasets.
- `empty-source-items` (format): source items empty or unreadable. Stop and report the error.
- `directory-not-writable` (format): the diagrams directory cannot be created or is not writable. Stop; do not write.
- `write-failure` (format): the file write returns non-zero. Stop; do not report success.
- Partial result rule: a deck with unresolved QA blockers is a partial result, not a successful delivery; label it explicitly. In format mode, if the HTML file is not written and validated, discard all output; rollback is deleting the written HTML file, and pre-existing files are never deleted.

## Output

Originate: a completed presentation file at `presentation-<topic-slug>.md` or `presentation-<topic-slug>.html` in the working directory, containing the full slide deck, a story spine summary, speaker notes for every slide, visual design specifications, and QA pass results. Format: the self-contained HTML slide deck in the diagrams directory, with the path reported.
