---
name: polished-web-prototype
description: 'Use when /polished-web-prototype runs or a user builds an artifact from a mockup, design plan, or brief. Not for variant galleries: use design-variants. Not for live audits: use web-design-review.'
---

# Polished web prototype

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The user runs `/polished-web-prototype` or asks to convert an approved mockup, design plan, or freeform description into a polished responsive HTML artifact. |
| Authority | Reversible local: writes only the named HTML artifact file and its finalized.json metadata under the project design directory, and (for framework-native output) the package manifest and lockfile at the project root; rollback is undo. No remote mutation. When framework-native output is chosen, the only permitted mutation beyond the artifact and metadata is adding the Pretext dependency using the detected package manager. |
| Side effect | The HTML artifact, finalized.json, and, for framework output, the manifest and lockfile dependency addition. A local HTTP preview server runs during refinement and is stopped at finalization. |
| Done | The user accepted the artifact or chose to finalize at the 10-iteration gate; finalized.json is written with every listed field; the preview server is stopped. |

## Inputs

- A design source: an approved mockup image (PNG), a written product or design plan, or a freeform user description. At least one must be supplied; if none exists, ask the user which source to start from.
- Optional: a repo-root DESIGN.md carrying design tokens (brand colors, font family, spacing scale). Its values override any extracted defaults for system-level properties.
- Optional: the target frontend framework (React, Svelte, Vue, Solid, Preact). If a package.json declares one, ask whether output should be a self-contained vanilla HTML file or a framework-native component.

## Procedure

1. Detect the design source and extract the implementation spec. Look for an approved mockup image, a product or design plan, and a repo-root DESIGN.md. If none are found, ask the user to supply a freeform description or a PNG path. Record the mode: approved-mockup, plan-driven, freeform, or evolve (a prior finalized HTML exists and the user chooses to iterate on it). Build the spec: colors (hex), fonts (family and weights), spacing scale, component list, and layout type, extracted from the mockup image, the plan prose, or the freeform description. DESIGN.md tokens override extracted system-level values. Generate real content from the source; never use lorem ipsum or placeholder text. Apply the UX doctrine below to every layout and visual decision before generating any markup. The doctrine is observed user behavior, not preference:
   - Every page is self-evident; if a user must think "what do I click," the design failed.
   - Three mindless clicks beat one thoughtful one; each step is an obvious choice.
   - Omit half the words, then half of what remains; happy talk and instructions must die.
   - Users scan, satisfice, and muddle through; design for scanning with visual hierarchy, grouped related items, and the right choice made most visible.
   - Use web conventions (logo top-left, nav top/left, search icon) unless a known better idea exists.
   - Visual hierarchy is everything: more important is more prominent; if everything shouts, nothing is heard.
   - Make clickable things obviously clickable without hover (shape, location, color, underlining); mobile has no hover.
   - Eliminate noise by removal, not addition.
   - Clarity trumps consistency.
   - Persistent navigation answers: what site, what page, what sections, what options, where am I, how to search.
   - Every friction point depletes a finite goodwill reservoir; replenish by making the user's goal obvious and recovery easy.
   - Mobile raises the stakes: 44px minimum touch targets, visible affordances, ruthless prioritization.

   Done when: exactly one source mode is recorded (or the user has been asked for one), the spec lists colors, fonts, spacing, components, and layout with every value sourced from the input, and each layout and visual decision traces to a named doctrine line.

2. Generate the artifact with the appropriate Pretext tier. Classify the design into a tier and state the chosen APIs:
   - Simple layout or card/grid: prepare() + layout() for resize-aware heights and self-sizing cards.
   - Chat/messaging: prepareWithSegments() + walkLineRanges() for tight-fit bubbles and minimum width.
   - Content-heavy editorial: prepareWithSegments() + layoutNextLine() for text around obstacles.
   - Complex editorial: full engine + layoutWithLines() for manual line rendering.

   The Pretext API:
   - prepare(text, font) returns a handle; call once after document.fonts.ready. Font is a CSS shorthand like '16px Inter'.
   - layout(handle, maxWidth, lineHeight) returns { height, lineCount }; call on every resize; sub-millisecond.
   - prepareWithSegments(text, font) enables line-level APIs.
   - layoutWithLines(segs, maxWidth, lineHeight) returns { lines: [{text, width, x, y}], height } for Canvas/SVG rendering.
   - walkLineRanges(segs, maxWidth, onLine) calls back per layout to find the minimum width for a line count (tight-fit containers).
   - layoutNextLine(segs, state, maxWidth, lineHeight) iterates lines with per-line width (text around obstacles); pass null initially; returns null when exhausted.
   - clearCache() clears measurement caches; setLocale(locale?) retargets the word segmenter.

   The basic pattern: prepare all [data-pretext] elements after fonts load, store handles in a Map, run layout to set element heights, observe resize with ResizeObserver to relayout, and re-prepare on contenteditable changes with a MutationObserver.

   If a framework was detected and the user chose framework output, add @chenglou/pretext to the project dependencies using the detected package manager (this edits the package manifest and lockfile, the only mutation this skill may make beyond the artifact and metadata) and use standard imports in the component. Otherwise produce a self-contained vanilla HTML file; inline the vendored Pretext bundle in a script tag if available and fall back to a CDN module import if the bundle is missing.

   Write one artifact file. Always include: the Pretext source (inlined or CDN), CSS custom properties for the design tokens, Google Fonts via a link tag plus a document.fonts.ready gate before the first prepare(), semantic HTML5 elements, responsive behavior driven by Pretext relayout with breakpoint adjustments at 375px, 768px, 1024px, 1440px, ARIA attributes and heading hierarchy and focus-visible states, contenteditable text elements with a MutationObserver to re-prepare and relayout on edit, a ResizeObserver to relayout on resize, prefers-color-scheme for dark mode, prefers-reduced-motion for animation respect, and real content from the source. Never include AI-slop defaults: purple/blue gradients, generic 3-column feature grids, center-everything layouts, decorative blobs or waves not in the source, stock-photo placeholder divs, generic "Get Started"/"Learn More" CTAs, rounded-corner drop-shadow cards as the default component, emoji as visual elements, generic testimonial sections, or cookie-cutter hero-with-left-text-right-image sections.

   Done when: one tier is named with its API set, the tier's API calls are wired with resize and edit observers in place, Pretext is importable in the chosen output form, and the single artifact file contains every required inclusion and no named AI-slop default.

3. Serve the artifact for live preview. Start a local HTTP server in the output directory; fall back to opening the file directly if no server is available. Tell the user the preview URL. Done when: the user has a reachable preview URL.

4. Run the refinement loop for a maximum of 10 iterations. When an approved mockup exists, show it alongside the live HTML for comparison. Ask the user what needs to change. On "done"/"ship it"/"looks good"/"perfect", exit to step 5. Otherwise, apply surgical edits with a targeted edit tool; never regenerate the whole file because the user may have made manual contenteditable edits to preserve. Give a 2-3 line change summary. If a screenshot tool is available, re-verify at 375px, 768px, and 1440px viewports, checking for text overflow, layout collapse, and responsive breakage. After 10 iterations without acceptance, ask whether to continue or finalize. Done when: the user signals acceptance or the 10-iteration gate asks continue-or-finalize.

5. Finalize and exit. Save finalized.json metadata alongside the artifact with the source mockup path or null, source plan path or null, mode, html file path, pretext tier, framework, iteration count, ISO 8601 date, screen name, and current branch. If no repo-root DESIGN.md exists, offer to create one from the generated HTML's tokens. Stop the preview server. Done when: finalized.json is written with all listed fields and the preview server is stopped.

## Failure and recovery

- No design source and the user supplies none: stop and ask for a freeform description or PNG path; do not invent content.
- Pretext bundle missing and CDN unreachable: the artifact cannot compute layout. State the blocker, write the HTML with the CDN import and a comment marking the blocked fallback, and tell the user the layout will not compute until Pretext loads.
- **Refinement loop exhausts 10 iterations without acceptance**: ask the user whether to continue or finalize; never silently declare done.
- A surgical edit breaks the layout: revert that edit and re-apply a corrected one; never regenerate the whole file over the user's manual edits.
- Partial result rule: the artifact file is the single deliverable; if generation stops mid-file, the file is incomplete and not done. Rollback is deleting the incomplete artifact and metadata files and reverting any manifest and lockfile edit.

## Output

One polished, responsive, self-contained Pretext-native HTML artifact (or framework-native component) plus a finalized.json metadata file under the project design directory, ordered detect-source, generate, preview, refine, finalize, computing text layout on resize and matching the approved mockup or accepted freeform design.
