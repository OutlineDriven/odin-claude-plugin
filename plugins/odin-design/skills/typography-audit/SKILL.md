---
name: typography-audit
description: 'Use when asked to audit typography across a codebase. Produces a file:line report with concrete fixes ordered by impact and flags unverifiable rules. Not for building a type system or token scale.'
---

# Typography audit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User says audit my typography, fix the fonts, review my type, font pairing, type scale, or web typography |
| Authority | Human-gated: applies fixes only when the user explicitly requests them; otherwise read-only with no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output: file:line findings with concrete CSS/HTML fix suggestions, plus not-verifiable-from-source verdicts for rules that need rendered metrics |
| Done | Report covers all 10 categories; every finding is either a verified file:line violation with a concrete fix or a not-verifiable-from-source verdict naming the rendered metric that would decide it; findings are ordered by impact with no fabricated file:line violations |

## Inputs

- Project directory or file set to audit (required). Accept a path, glob, or the current working directory.
- Optional: brand guidelines, style guide, or design tokens file if available.
- Optional: specific category filter (e.g., only spacing, only font) to narrow scope.

## Procedure

1. Collect all CSS, SCSS, Less, HTML, JSX, TSX, Vue, and Svelte files in scope. Skip node_modules, dist, build, vendor, and .git directories. **Done when:** every in-scope source file is collected or reported unreadable.
2. For each file, extract font-family declarations, font-size values, line-height values, letter-spacing values, color declarations on text elements, @font-face blocks, font-feature-settings, and typographic HTML elements (h1-h6, p, blockquote, ul, ol, li, em, strong, small, sup, sub, abbr, cite, q, dl, dt, dd). **Done when:** every collected file has its typographic surface extracted.
3. Audit against the following 10-category rule set. For each violation found, record the file path, line number, rule name, severity (critical/high/medium/low), and a concrete CSS or HTML fix. When a rule's verdict depends on rendered metrics that static source cannot decide, record the finding as not-verifiable-from-source: name the rule, the files and declarations examined, and the rendered metric that would decide it. Rules that commonly need rendered facts include size-line-length (measure depends on font metrics and container width), layout-widows-orphans and layout-optical-balance (line breaking), pairing-contrast-harmony and pairing-stress-skeleton (x-height and stress need glyph or font-metric inspection), brand-dark-backgrounds (contrast when colors resolve through custom properties the scan cannot statically resolve), display-grid-breaking (baseline rhythm is rendered), and display-drop-caps (rendered cap metrics). Never force a file:line verdict for a rendered-metric rule. **Done when:** all 10 categories have been checked, with every finding either verified at file:line or recorded as not-verifiable-from-source.

### Category 1: brand identity

1. **brand-capitalization**: Check that brand names use their canonical casing. Flag all-caps or all-lowercase brand names in user-facing text.
2. **brand-color**: Verify text colors align with brand palette. Flag hardcoded colors that deviate from declared brand tokens or CSS custom properties.
3. **brand-cross-medium**: Ensure typographic choices work across screen and print. Flag pixel-only units in @media print blocks.
4. **brand-dark-backgrounds**: Check that text on dark backgrounds meets contrast requirements (WCAG AA 4.5:1 for body, 3:1 for large text). Flag insufficient contrast.
5. **brand-equity**: Verify that brand typeface is used consistently for primary headings and identity elements. Flag mixing of competing display faces.
6. **brand-identifiable-body**: Ensure the body typeface is distinct from the brand/display typeface to maintain visual hierarchy.
7. **brand-licensing**: Flag @font-face declarations that reference fonts without verifiable licensing (e.g., fonts served from unauthorized CDNs or local paths without license documentation).
8. **brand-logo-typeface**: Verify that logo text or wordmarks use the designated brand typeface or are set as SVG/images, not restyled body fonts.

### Category 2: display and headlines

1. **display-drop-caps**: Flag drop-cap implementations that use font-size alone without adjusting float, line-height, and margin. Suggest ::first-letter with proper metrics.
2. **display-grid-breaking**: Check that display text respects grid baselines. Flag headline sizes that break vertical rhythm without compensating margin.
3. **display-headline-opentype**: Verify headlines enable stylistic alternates or ligatures when the typeface provides display-specific features. Flag raw text that misses available opentype display features.
4. **display-headline-spacing**: Flag headlines with default tracking. Display text at large sizes typically needs tightened letter-spacing (e.g., -0.01em to -0.03em).
5. **display-large-type**: Check that text above 48px uses appropriate line-height (1.0-1.2) and adjusted letter-spacing. Flag body-style line-height on display text.
6. **display-lead-paragraph**: Verify lead/intro paragraphs have distinct styling (larger size, lighter weight, or increased line-height) from body text.
7. **display-swashes**: Flag swash characters or stylistic sets applied to body text. Swashes belong only in display contexts with controlled line breaks.

### Category 3: font selection and setup

1. **font-body-selection**: Verify body text uses a typeface designed for sustained reading (e.g., Georgia, Merriweather, Source Serif, Inter). Flag decorative or display faces on body text.
2. **font-condensed-extended**: Flag condensed or extended widths used for body text. These belong in display or UI contexts only.
3. **font-face-setup**: Check @font-face blocks for font-display swap or optional, correct src format ordering (woff2 before woff before ttf), and valid unicode-range subsets.
4. **font-fallbacks**: Verify every font-family stack ends with a generic family (serif, sans-serif, monospace, cursive, fantasy, system-ui). Flag stacks that end with a named font and no generic.
5. **font-monospaced**: Check that code, pre, and kbd elements use a monospaced typeface. Flag proportional fonts on code elements.
6. **font-optical-sizes**: Verify that optical size axis (opsz) is set or that the font-size range matches the typeface's intended optical size. Flag body text using a display optical size.
7. **font-quality**: Flag bitmap fonts (e.g., .bmp, .fnt), non-hinted fonts on low-res screens, or fonts below the weight/quality threshold for body use.
8. **font-rendering**: Check for -webkit-font-smoothing: antialiased on macOS, text-rendering: optimizeLegibility on headings, and font-smooth property usage.
9. **font-true-styles**: Verify that italic and bold are loaded as separate font files or axes, not synthesized via font-style: oblique or font-weight: bold on a regular face. Flag synthetic styles.
10. **font-variable-fonts**: If variable fonts are used, verify axis ranges (wght, wdth, ital, slnt, opsz) are declared correctly and that fallback @font-face blocks exist for static-font browsers.
11. **font-weight-body**: Verify body text uses weight 400 (regular) or the typeface's intended body weight. Flag light (300) or semibold (600) weights on body text.

### Category 4: hierarchy and scale

1. **hierarchy-body-first**: Verify the body text size is set before headings scale from it. Flag projects that define heading sizes without a base body size.
2. **hierarchy-caps-subheads**: Check that subheadings using all-caps have letter-spacing of at least 0.05em. Flag tight tracking on uppercase subheads.
3. **hierarchy-consistent-system**: Verify that all text sizes derive from a consistent modular scale (e.g., 1.2, 1.25, 1.333, 1.414, 1.5, or 1.618). Flag arbitrary sizes that fit no scale.
4. **hierarchy-heading-color**: Check that heading colors are distinct from body text (darker or brand-colored). Flag headings with identical color to body text when no other visual distinction exists.
5. **hierarchy-heading-levels**: Verify that h1 > h2 > h3 > h4 > h5 > h6 in size. Flag levels where a child heading is equal to or larger than its parent.
6. **hierarchy-modular-scale**: Calculate the ratio between consecutive heading levels. Flag ratios that are inconsistent (e.g., h1-to-h2 is 1.618 but h2-to-h3 is 1.1).
7. **hierarchy-size-contrast**: Verify at least 20% size difference between heading levels. Flag adjacent levels with less than 15% difference.
8. **hierarchy-weight-contrast**: Check that headings use a weight at least one step above body text (e.g., 600 or 700 vs 400). Flag headings at body weight with no other visual distinction.

### Category 5: layout and composition

1. **layout-center-alignment**: Flag center-aligned body text (text-align: center on paragraphs or multi-line blocks). Center alignment is reserved for short display text.
2. **layout-justified-text**: Flag justified text (text-align: justify) without hyphenation (hyphens: auto or manual soft hyphens). Justified text without hyphens creates uneven word spacing.
3. **layout-lists**: Check that lists have consistent indentation, appropriate marker style, and that nested lists reduce in size or change marker.
4. **layout-optical-balance**: Verify that text blocks have balanced rag (for left-aligned text) and that line breaks avoid single-word orphans on the last line.
5. **layout-proximity-dividers**: Flag horizontal rules or borders used between closely related content where whitespace alone would communicate grouping. Suggest margin/padding instead.
6. **layout-widows-orphans**: Check for orphan words (single word on the last line of a paragraph) and widow lines (single line of a paragraph at the top of a column). Flag and suggest CSS fixes (e.g., text-wrap: balance, or manual break adjustments).

### Category 6: OpenType features

1. **opentype-body-features**: Verify that body text enables common OpenType features: kerning (kern), standard ligatures (liga), and contextual alternates (calt). Flag text with font-feature-settings: normal.
2. **opentype-kerning**: Check that kerning is enabled via font-kerning: normal or font-feature-settings: 'kern'. Flag font-kerning: none on body text.
3. **opentype-ligatures**: Verify standard ligatures (liga) are enabled for body text. Flag disabled ligatures unless intentional (e.g., code editors where ligature display is optional).
4. **opentype-monoscript-kerning**: For monospaced fonts, verify kerning is disabled (font-kerning: none) since monospaced fonts have fixed-width metrics.
5. **opentype-oldstyle-figures**: Check that body text uses oldstyle figures (onum) for running text and tabular figures (tnum) for tables. Flag tabular figures in prose.
6. **opentype-small-caps**: Verify small caps use font-variant-caps: small-caps or the smcp feature, not font-size reduction with text-transform: uppercase. Flag fake small caps.
7. **opentype-tabular-figures**: Check that numerical data in tables uses tabular figures (tnum) or font-variant-numeric: tabular-nums. Flag proportional figures in data tables.

### Category 7: font pairing

1. **pairing-contrast-harmony**: Verify paired typefaces have contrast in structure (serif + sans-serif) or weight but harmony in proportion and x-height. Flag pairings with no clear contrast or clashing x-heights.
2. **pairing-limit-typefaces**: Flag projects using more than 3 typeface families. Two is ideal; three is the practical maximum.
3. **pairing-stress-skeleton**: Check that paired typefaces share similar stress angle or skeleton structure. Flag pairings where one has vertical stress and the other diagonal.
4. **pairing-superfamilies**: Verify that when a superfamily is used (e.g., Roboto, Source, IBM Plex), the paired weights and widths maintain visual coherence.
5. **pairing-ui-fonts**: Check that UI elements (buttons, inputs, labels, navigation) use a legible, neutral typeface at appropriate sizes (14-16px). Flag decorative fonts on UI elements.

### Category 8: punctuation and symbols

1. **punct-abbreviations**: Check that abbreviations use proper markup (abbr with title attribute) and that e.g., and i.e., are followed by commas.
2. **punct-ampersands**: Flag bare ampersands (&) in running text. Use the HTML entity &amp; or the word "and" unless the ampersand is part of a brand name.
3. **punct-case-rules**: Check sentence case vs title case consistency in headings and UI labels. Flag mixed conventions within the same interface.
4. **punct-daggers**: Verify daggers (†, ‡) are used only in footnotes and academic contexts, not as decorative elements.
5. **punct-dashes**: Check that hyphens (-), en dashes (–), and em dashes (—) are used correctly: hyphens for compounds, en dashes for ranges, em dashes for breaks. Flag incorrect usage.
6. **punct-diacritics**: Verify proper diacritical marks on loanwords (e.g., café, naïve, résumé). Flag missing diacritics.
7. **punct-fractions**: Check that common fractions use Unicode fraction characters (½, ¼, ¾) or OpenType frac feature, not stacked digits with slash.
8. **punct-midpoints**: Verify midpoints (·) are used for abbreviations (e.g., S·O·S) and decimal separators in some locales, not as decorative separators.
9. **punct-primes**: Flag straight quotes (', ") used for measurements (feet, inches, minutes, seconds). Use prime (′) and double prime (″) symbols.
10. **punct-single-space**: Check for double spaces after periods. Flag and fix to single space.
11. **punct-smart-quotes**: Verify curly quotes (\u2018, \u2019, \u201c, \u201d) are used in prose instead of straight quotes (' , "). Flag straight quotes in running text.
12. **punct-symbols**: Check that symbols (©, ®, ™, §, ¶) are used correctly and rendered as Unicode characters, not image replacements.

### Category 9: size and proportions

1. **size-body-text**: Verify body text is 16-18px (1-1.125rem) on desktop and at least 14px on mobile. Flag text below these thresholds.
2. **size-emphasis**: Check that em/strong elements produce visible emphasis (italic or weight change), rather than color change alone. Flag color-only emphasis.
3. **size-hanging-punctuation**: Verify blockquotes and lists use hanging punctuation (text-indent: -0.5em or hanging punctuation CSS property) where supported.
4. **size-line-height**: Check that body line-height is 1.4-1.6 and heading line-height is 1.0-1.3. Flag line-height below 1.2 for body text or above 1.5 for headings.
5. **size-line-length**: Verify body text measures 45-75 characters per line (roughly 60-70ch or equivalent max-width). Flag lines exceeding 80 characters.
6. **size-responsive**: Check that text sizes use relative units (rem, em, clamp, vw) rather than fixed px for responsive behavior. Flag fixed px sizes on body text and headings.

### Category 10: spacing and rhythm

1. **spacing-hair-thin-spaces**: Verify hair spaces (\u200A) or thin spaces (\u2009) are used between numbers and units (e.g., 100 px → 100\u2009px), around em dashes, and between initials.
2. **spacing-letterspacing-body**: Check that body text has default (normal) letter-spacing. Flag any letter-spacing set on body text that is not zero or normal.
3. **spacing-letterspacing-uppercase**: Verify uppercase text has letter-spacing of at least 0.05em. Flag tight tracking on uppercase text.
4. **spacing-nav-items**: Check that navigation items have consistent spacing and that letter-spacing is adjusted for uppercase nav labels.
5. **spacing-paragraph-indent**: Verify that indented paragraphs (text-indent > 0) are not used after headings, blockquotes, or list items. First paragraphs after a break should not be indented.
6. **spacing-paragraph-margins**: Check that paragraph margins create consistent vertical rhythm. Flag inconsistent margin-top/margin-bottom values across paragraph styles.
7. **spacing-paragraph-separation**: Verify that paragraph separation uses either margin-bottom or margin-top consistently, not both. Flag mixed approaches.
8. **spacing-subhead-proximity**: Check that subheadings are closer to the text they introduce than to the text that precedes them (proximity principle). Flag subheadings with equal or greater margin-top than margin-bottom.

4. Classify each finding by severity:
   - Critical: Breaks readability, fails WCAG contrast, or uses an unauthorized font.
   - High: Violates a core typographic principle (wrong scale, missing fallback, broken hierarchy).
   - Medium: Degrades quality but does not break readability (suboptimal tracking, missing opentype features).
   - Low: Polish-level improvement (hair spaces, hanging punctuation, swash usage).
   A not-verifiable-from-source finding carries no severity; it records a measurement gap, not a violation. **Done when:** every verified finding has one severity and every not-verifiable-from-source finding is recorded without one.
5. Sort findings by severity (critical first), then by category order. **Done when:** the ordering is deterministic.
6. For each finding, produce a concrete fix:
   - CSS fix: the exact property and value to change, with the selector.
   - HTML fix: the exact markup correction.
   - Example: `h1 { letter-spacing: -0.02em; }` or replace `<font>` with `<span class="heading">`.
   **Done when:** every finding has an exact CSS or HTML fix.
7. Compile the report grouped by category, with a summary count per category and an overall severity distribution. Include a count of not-verifiable-from-source findings. **Done when:** category, severity, and not-verifiable counts reconcile with the findings.
8. If the user requests fixes to be applied, generate the minimal CSS patch or HTML edit for each finding. Apply only the requested fixes; do not widen scope. **Done when:** requested fixes are applied or the read-only report is complete.

## Failure and recovery
- No files found: Return a message stating no CSS/HTML/JSX files exist in scope. Do not fabricate findings.
- Rendered-metric rule cannot be decided from source: record not-verifiable-from-source with the metric that would decide it. Never fabricate a file:line violation to complete a category.
- No violations found: Return a clean report stating all 10 categories passed with zero findings.
- Partial scan: If some files are unreadable (binary, encoding errors), list them as skipped and continue with remaining files. Report the skip count.
- Scope exceeded: If the user requests fixes beyond the audit findings, decline and state the audit boundary.
- Non-convergent fix: If applying a fix introduces a new violation in the same category, stop that fix, report the conflict, and continue with other findings.

## Output
A report with sections in order: summary, per-category findings table (File, Line, Rule, Severity, Description, Fix), severity-ordered fix list, and a not-verifiable-from-source list naming each undecidable rule and the rendered metric it needs, plus an optional consolidated CSS patch when fixes were requested.
