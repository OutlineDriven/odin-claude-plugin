---
name: web-accessibility-audit
description: 'Use when the user requests an accessibility audit, a11y check, or WCAG compliance review. Returns a prioritized WCAG findings report with file and line locations, before and after code fixes, and manual testing recommendations. Don''t use for tasks that require source or remote-system changes.'
---

# Web accessibility audit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Accessibility audit, a11y check, or WCAG compliance review |
| Authority | Read-only: read project files and run only analysis tools already installed in the project; create, modify, or delete no file; no VCS, credential, paid, publishing, deployment, or remote mutation; install no package |
| Side effect | None: the only artifact is the accessibility report returned in the conversation |
| Done | Report contains prioritized WCAG findings with file/line locations, before/after code, and manual testing recommendations |

## Inputs

- Audit scope: directories, files, or a running URL named by the user. When none is named, the audit targets the web/UI source rooted at the current working directory, the scope the underlying inspection commands use.
- Target WCAG level, optional: A, AA, or AAA as named by the user. When none is named, findings are scored against Level A (must pass) and Level AA (should pass; legal baseline in many jurisdictions), and the report states that basis.
- Nothing is installed or configured; every step runs on present source and, where available, already-installed tooling.

## Procedure

1. Bound the scope before inspecting: enumerate the target directories and files, or the single URL, and reject anything outside it. Read-only throughout: never write a file, never redirect tool output to disk, never install.
2. Static inspection. For each class below, search the in-scope markup, components, and styles, open every hit at its location to confirm it, and record confirmed violations as `path:line`:
   1. Color contrast (1.4.3, 1.4.11): collect `color` and `background` declarations with their hex (`#RGB`, `#RRGGBB`, `#RRGGBBAA`) and `rgb()`/`rgba()` values, pair each foreground with its actual background, and compute ratios. AA thresholds: normal text 4.5:1, large text (24px, or 18.66px bold) 3:1, UI components and boundaries 3:1. AAA text thresholds: 7:1 normal, 4.5:1 large.
   2. Alt text (1.1.1): every `img` needs `alt=`. Flag missing `alt`, redundant values ("image", "picture", "photo", "img"), and empty `alt=""` on images that convey information; empty alt is correct only for purely decorative images.
   3. Name, role, value (4.1.2): interactive elements without accessible names; custom widgets without correct roles, states, or required ARIA attributes.
   4. Keyboard access (2.1.1, 2.1.2): `onClick` on elements that are not `button` or `a` and carry no key handler (`onKeyDown`, `onKeyPress`, `onKeyUp`); positive `tabIndex` values; anything that can take focus and not release it via Escape or Tab.
   5. Form labels (1.3.1, 3.3.2): `input`, `select`, and `textarea` without an associated `label` (`for`/`id`), `aria-label`, or `aria-labelledby`; labels present visually but not programmatically associated.
   6. Language (3.1.1, 3.1.2): `html` without `lang=`; foreign-language passages not marked with `lang`.
   7. Heading structure (1.3.1, 2.4.6): all `h1`-`h6`; skipped levels, zero or multiple `h1`, empty headings.
   8. Link purpose (2.4.4): link text "click here", "here", "read more", "learn more"; empty or icon-only links without accessible names.
   9. Focus visible (2.4.7): `outline: none` or `outline: 0` on focus states with no replacement indicator.
   10. ARIA misuse (4.1.2): ARIA duplicating native HTML (`<button role="button">`, a clickable `div` given `role="button"` instead of using `button`); attributes invalid for the role; missing required states such as `aria-expanded` or `aria-selected`.
   11. Data tables (1.3.1): tables without `th` header cells; missing `scope` or `headers` associations.
   12. Media alternatives (1.2.1, 1.2.2, 1.4.2): `video` without a caption `track`; `audio` without a transcript reference; media that autoplays without pause or stop.
3. Automated scanning, only with tooling already present in the project:
   - React/JSX: when `eslint` with `eslint-plugin-jsx-a11y` is in the project dependencies, run `pnpm exec eslint --format json .`, with `.jsx` and `.tsx` targeting and ignore overrides expressed in the flat config `files` and `ignores`, read its stdout, and fold each `jsx-a11y` hit into the matching class above.
   - Deployed or staging URL: when Lighthouse is already available, run `pnpm exec lighthouse <url> --only-categories=accessibility --output=json` and read stdout.
   - Read `package.json` for existing `axe-core` or `@axe-core` integrations and note their presence in the report's automated-coverage line.
   - Absent tooling is recorded as absent; never install, never fetch, never write result files.
4. Prioritize every confirmed finding by user impact:
   - Critical, fix immediately: keyboard traps; no visible focus indicators; missing form labels; missing alt text on functional images; insufficient contrast on interactive elements.
   - Serious, fix before launch: missing page language; improper heading structure; non-descriptive link text; missing skip links; auto-playing media.
   - Moderate, fix soon: missing ARIA labels on icon-only controls; inconsistent navigation; missing error identification; missing landmark regions.
   - Minor: all remaining findings, including AAA-only gaps.
5. Write each fix as before/after code taken from the actual file. Canonical fixes:
   - Alt text: `<img src="chart.png">` becomes `<img src="chart.png" alt="Bar chart showing 40% increase in Q3 sales">`; purely decorative images get `alt=""`.
   - Keyboard: a click-only `div` becomes a real `<button onClick={handleClick}>`; where a custom element is unavoidable, add a `keydown` handler that calls the same action for `Enter` and `Space` with `preventDefault`.
   - Focus: `*:focus { outline: none; }` becomes `:focus-visible { outline: 2px solid <theme color>; outline-offset: 2px; }`.
   - Labels: a placeholder-only input becomes `<label for="email">Email address</label>` with `<input type="email" id="email" autocomplete="email">`; hints via `aria-describedby`; errors via `aria-invalid="true"` plus `aria-describedby` pointing at a `role="alert"` message.
   - ARIA: native HTML first (`button`, `a`, `nav`, `main`); ARIA only for what HTML lacks: tabs (`role="tablist"`/`tab`/`tabpanel` with `aria-selected`, `aria-controls`, roving `tabindex`), dialogs (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`), live regions (`aria-live="polite"` for status, `role="alert"` for errors), and icon buttons (`aria-label`, or an `aria-hidden` icon plus visually-hidden text).
   - Skip link: first focusable element linking to `#main-content`, visually hidden until focused, with `<main id="main-content" tabindex="-1">`.
   - Contrast: replace the failing color pair with values that meet the threshold and state the resulting ratio.
6. Include manual testing recommendations in every report: keyboard-only pass (Tab reaches and activates everything in visual order, no traps, skip link works); screen reader pass (VoiceOver, NVDA, or JAWS: labels announced, headings and landmarks navigable, dynamic updates announced); visual pass (usable at 200% zoom, reflows at 320px width without horizontal scroll, works in high-contrast mode); motion pass (`prefers-reduced-motion: reduce` honored, nothing flashes more than three times per second). Automated tools catch roughly 30-57% of issues; the manual passes are mandatory, not optional advice.

## Failure and recovery
- Scope missing or target is not web/UI source: stop and request a scope; never scan unrelated trees.
- Tooling absent (no eslint/jsx-a11y, no Lighthouse): install nothing; set the summary's automated-coverage line to "none (tooling not installed)" and complete the audit by static inspection. The done predicate still holds: static findings with file/line locations, before/after code, and manual testing recommendations are present.
- A tool run fails or exits without usable output: record the failure and its error in the summary's failed-checks line; never swallow it and never report the check as passed.
- Contrast not computable (dynamic theming, images of text, gradients): list the exact color pairs or elements as open items for manual verification; never guess a ratio.
- Scope too large to finish: return the report explicitly labeled with the classes and paths not yet inspected; presenting a partial audit as complete violates the done predicate.
- Non-mutation: nothing is written at any point, so there is nothing to roll back; if a step could only proceed by writing a file, skip that step and say so in the report.

## Output
Return the report in the conversation; create no files. Structure:

```markdown
# Accessibility audit report

### Summary
- Scope: <paths or URL audited>
- Target WCAG level: <level, and basis when the user named none>
- Total issues: X (Critical: X | Serious: X | Moderate: X | Minor: X)
- Automated coverage: <tools run> or "none (tooling not installed)"
- Failed checks: <tool errors, or "none">

### Findings

Sections in severity order: Critical (fix immediately), Serious (fix before launch), Moderate (fix soon), Minor. Every finding uses this format:

### <N>. <Issue name> — WCAG <X.X.X>
- Severity: <tier>
- Impact: <who is affected and how>
- Locations: `path:line`, `path:line`
- Problem: <what violates the criterion>
- Fix:
  // before
  <actual current code>
  // after
  <corrected code>
- Why: <accessibility principle>

### Manual testing recommendations
1. Keyboard: Tab, Enter, Space, Escape; focus order and skip link
2. Screen reader: VoiceOver, NVDA, or JAWS; labels, headings, landmarks, live updates
3. Visual: 200% zoom, 320px reflow, high-contrast mode
4. Motion: prefers-reduced-motion; flash rate

### Next steps
<prioritized action items>
```

Every emitted finding carries its WCAG success criterion, its file/line locations, before/after code from the actual source, and the fix rationale.

## Provenance

- Origin: https://github.com/warpdotdev/oz-skills, `.agents/skills/web-accessibility-audit/` (`SKILL.md`, `references/WCAG-criteria.md`, `references/grep-patterns.md`, `references/ARIA-patterns.md`, `references/screen-reader-guide.md`, `scripts/run-eslint.sh`).
- Pinned revision: 6c08c49fc6c51b8f768bf8c53c041bc06a160765.
- License: MIT per the repository root `LICENSE` (Copyright 2026 Warp). The repository's Apache-2.0 sub-license carve-outs cover only `.agents/skills/mcp-builder/` and `.agents/skills/webapp-testing/` and do not apply to this skill.
- Adaptation: restructured into the ODIN skill format; the reference documents and the ESLint helper script were reduced to their load-bearing mechanisms and inlined; the source's result-file writes (eslint and Lighthouse output under `.claude/skills/a11y-auditor/`) were removed to hold read-only authority; the violation classes, severity tiers, contrast thresholds, per-finding report format, and manual-testing coverage are preserved from the pinned revision.
