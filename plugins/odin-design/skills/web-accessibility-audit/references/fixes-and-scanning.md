# Automated scanning options

Branch-specific automated scanning details for `web-accessibility-audit`. Run only with tooling already present in the project; install nothing.

- React/JSX: when `eslint` with `eslint-plugin-jsx-a11y` is in the project dependencies, run `pnpm exec eslint --format json .`, with `.jsx` and `.tsx` targeting and ignore overrides expressed in the flat config `files` and `ignores`, read its stdout, and fold each `jsx-a11y` hit into the matching inspection class.
- Deployed or staging URL: when Lighthouse is already available, run `pnpm exec lighthouse <url> --only-categories=accessibility --output=json` and read stdout.
- Read `package.json` for existing `axe-core` or `@axe-core` integrations and note their presence in the report's automated-coverage line.
- Absent tooling is recorded as absent; never install, never fetch, never write result files.

# Canonical fixes

Write each fix as before/after code taken from the actual file.

- Alt text: `<img src="chart.png">` becomes `<img src="chart.png" alt="Bar chart showing 40% increase in Q3 sales">`; purely decorative images get `alt=""`.
- Keyboard: a click-only `div` becomes a real `<button onClick={handleClick}>`; where a custom element is unavoidable, add a `keydown` handler that calls the same action for `Enter` and `Space` with `preventDefault`.
- Focus: `*:focus { outline: none; }` becomes `:focus-visible { outline: 2px solid <theme color>; outline-offset: 2px; }`.
- Labels: a placeholder-only input becomes `<label for="email">Email address</label>` with `<input type="email" id="email" autocomplete="email">`; hints via `aria-describedby`; errors via `aria-invalid="true"` plus `aria-describedby` pointing at a `role="alert"` message.
- ARIA: native HTML first (`button`, `a`, `nav`, `main`); ARIA only for what HTML lacks: tabs (`role="tablist"`/`tab`/`tabpanel` with `aria-selected`, `aria-controls`, roving `tabindex`), dialogs (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`), live regions (`aria-live="polite"` for status, `role="alert"` for errors), and icon buttons (`aria-label`, or an `aria-hidden` icon plus visually-hidden text).
- Skip link: first focusable element linking to `#main-content`, visually hidden until focused, with `<main id="main-content" tabindex="-1">`.
- Contrast: replace the failing color pair with values that meet the threshold and state the resulting ratio.

# Severity tiers

Prioritize every confirmed finding by user impact:

- Critical, fix immediately: keyboard traps; no visible focus indicators; missing form labels; missing alt text on functional images; insufficient contrast on interactive elements.
- Serious, fix before launch: missing page language; improper heading structure; non-descriptive link text; missing skip links; auto-playing media.
- Moderate, fix soon: missing ARIA labels on icon-only controls; inconsistent navigation; missing error identification; missing landmark regions.
- Minor: all remaining findings, including AAA-only gaps.

# Manual testing recommendations

Include these in every report. Automated tools catch roughly 30-57% of issues; these manual passes are mandatory, not optional advice.

- Keyboard-only pass: Tab reaches and activates everything in visual order, no traps, and the skip link works.
- Screen reader pass: VoiceOver, NVDA, or JAWS announces labels; headings and landmarks are navigable; dynamic updates are announced.
- Visual pass: the interface remains usable at 200% zoom, reflows at 320px width without horizontal scroll, and works in high-contrast mode.
- Motion pass: `prefers-reduced-motion: reduce` is honored, and nothing flashes more than three times per second.
