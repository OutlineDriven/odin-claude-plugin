---
name: single-file-html-deck
description: 'Use when an explicit request asks to create a Sentry presentation, build slides, or make a deck. Scaffolds one self-contained, keyboard-navigable HTML file with real-data charts and Sentry branding. For general HTML artifacts use html; for PowerPoint use pptx.'
---

# Single-file HTML deck

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Explicit human invocation: user asks to create a presentation, build slides, make a deck, or build a Sentry presentation |
| Authority | Reversible-local: write only named local artifacts; rollback by deleting generated files or reverting to prior version |
| Side effect | Local write: scaffolds a Sentry-branded slide deck as a single self-contained HTML file |
| Done | Keyboard-navigable slide deck exists as a single HTML file with real-data charts only, Sentry branding applied, and a successful build |

## Inputs

- Topic or subject (required): the presentation's central theme or argument.
- Audience (required): who will view the deck; drives tone, depth, and vocabulary.
- Slide count (optional): target number of slides. Defaults to 8–12.
- Source material (optional): existing notes, data, or documents to incorporate.
- Chart data (optional): real datasets to visualize. If omitted, omit charts rather than fabricate placeholder data.

## Procedure

1. **Gather inputs.** Confirm topic, audience, and any source material. If topic or audience is missing, stop and request them before proceeding. Done when: topic and audience are confirmed.

2. **Scaffold the project.** Create a working directory. Initialize a React + Vite + Recharts project with the following structure:
   - `src/App.jsx`: main slide deck component with keyboard navigation.
   - `src/components/Slide.jsx`: individual slide component.
   - `src/components/Chart.jsx`: Recharts wrapper for data visualizations.
   - `src/data/`: real data files only; never fabricate placeholder data.
   - `src/styles/`: Sentry-branded styles.
   - `index.html`: entry point.
   - `package.json`: dependencies react, react-dom, vite, recharts.
   Done when: the project directory and all listed files exist.

3. **Apply Sentry branding.** Use the Sentry design system:
   - Primary color: `#362D59` (deep purple).
   - Accent color: `#FFC227` (gold).
   - Background: `#FFFFFF` (white) or `#F5F5F5` (light gray).
   - Typography: system font stack with `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
   - Logo: inline SVG of the Sentry glyph (simplified wordmark) in the header or corner of each slide.
   - Consistent spacing: 24px base unit, 16px for compact elements.
   Done when: branding colors, typography, logo, and spacing are applied.

4. **Build slide content.** For each slide:
   - Write a clear headline that states the slide's single point.
   - Keep supporting body text concise (no more than three to four bullet points or one short paragraph).
   - Include a Recharts visualization only if real data is provided; otherwise use a text-only layout.
   - Apply visual hierarchy: headline dominates, body supports, visuals reinforce.
   Done when: every slide has a headline, body, and optional real-data chart.

5. **Implement keyboard navigation.** The deck must be fully keyboard-navigable:
   - Arrow Right / Arrow Down / Space / PageDown: next slide.
   - Arrow Left / Arrow Up / PageUp: previous slide.
   - Home: first slide.
   - End: last slide.
   - Focus management: active slide receives focus; screen reader announces slide number and title.
   Done when: all keyboard bindings work and focus management is implemented.

6. **Embed all assets.** The final HTML file must be fully self-contained:
   - Inline all CSS in a `<style>` tag.
   - Inline all JavaScript (bundled by Vite).
   - Inline any SVG assets (logo, icons) directly in the markup.
   - No external CDN links, no external image URLs, no runtime fetch calls for assets.
   Done when: the HTML file has no external resource dependencies.

7. **Build and verify.** Run `pnpm install --frozen-lockfile && pnpm run build`. Confirm:
   - Build succeeds with zero errors.
   - Output is a single `dist/index.html` file (or equivalent single-file output).
   - Open the file in a browser: slides render, keyboard navigation works, charts display real data, Sentry branding is visible.
   Done when: the build succeeds and the single HTML file renders correctly in a browser.

8. **Run QA pass.** Check every slide against these criteria:
   - Headline accurately represents content.
   - Keyboard navigation works forward and backward.
   - Charts use only real data; no fabricated or placeholder datasets.
   - Sentry branding is consistent across all slides.
   - No external resource dependencies at runtime.
   - Text is free of typos and grammatical errors.
   Record any issues found. Done when: every slide passes all QA criteria or issues are recorded.

9. **Resolve QA issues.** Fix each issue found in step 8. If a slide's content cannot be fixed without new information from the user, flag it as a blocker and deliver the deck with the blocker noted rather than shipping broken content. Done when: all QA issues are fixed or flagged as blockers.

10. **Deliver output.** Copy or move the built single HTML file to the requested location. Report the file path, slide count, and QA pass results. Done when: the file is at the requested location and the report is returned.

## Failure and recovery

- Missing required inputs: stop immediately. Report which inputs are missing. Do not proceed with defaults or invented content.
- No real data for charts: if the user requests charts but provides no data, produce text-only slides. Do not fabricate placeholder datasets.
- Build fails: diagnose the error. If it is a dependency issue, retry with `pnpm install --frozen-lockfile`. If it is a code error, fix and rebuild. Report persistent failures.
- QA finds blocking issues: report each issue. Do not deliver the deck as done. Deliver it as partial with blockers listed, or wait for user resolution.
- Partial result rule: a deck with keyboard navigation, Sentry branding, and unresolved QA blockers is a partial result, not a successful delivery. Label it explicitly.

## Output
A single self-contained HTML file: full slide deck with keyboard navigation, Recharts visualizations using only real data (if provided), Sentry branding (colors, typography, logo), no external runtime dependencies, and QA pass results listing any issues and their resolution status.
