# WCAG inspection classes

Branch-specific search patterns for each WCAG criterion class recognized by `web-accessibility-audit`. Search the in-scope markup, components, and styles, open every hit at its location to confirm it, and record confirmed violations as `path:line`.

1. **Color contrast (1.4.3, 1.4.11)**: collect `color` and `background` declarations with their hex (`#RGB`, `#RRGGBB`, `#RRGGBBAA`) and `rgb()`/`rgba()` values, pair each foreground with its actual background, and compute ratios. AA thresholds: normal text 4.5:1, large text (24px, or 18.66px bold) 3:1, UI components and boundaries 3:1. AAA text thresholds: 7:1 normal, 4.5:1 large.

2. **Alt text (1.1.1)**: every `img` needs `alt=`. Flag missing `alt`, redundant values ("image", "picture", "photo", "img"), and empty `alt=""` on images that convey information; empty alt is correct only for purely decorative images.

3. **Name, role, value (4.1.2)**: interactive elements without accessible names; custom widgets without correct roles, states, or required ARIA attributes.

4. **Keyboard access (2.1.1, 2.1.2)**: `onClick` on elements that are not `button` or `a` and carry no key handler (`onKeyDown`, `onKeyPress`, `onKeyUp`); positive `tabIndex` values; anything that can take focus and not release it via Escape or Tab.

5. **Form labels (1.3.1, 3.3.2)**: `input`, `select`, and `textarea` without an associated `label` (`for`/`id`), `aria-label`, or `aria-labelledby`; labels present visually but not programmatically associated.

6. **Language (3.1.1, 3.1.2)**: `html` without `lang=`; foreign-language passages not marked with `lang`.

7. **Heading structure (1.3.1, 2.4.6)**: all `h1`-`h6`; skipped levels, zero or multiple `h1`, empty headings.

8. **Link purpose (2.4.4)**: link text "click here", "here", "read more", "learn more"; empty or icon-only links without accessible names.

9. **Focus visible (2.4.7)**: `outline: none` or `outline: 0` on focus states with no replacement indicator.

10. **ARIA misuse (4.1.2)**: ARIA duplicating native HTML (`<button role="button">`, a clickable `div` given `role="button"` instead of using `button`); attributes invalid for the role; missing required states such as `aria-expanded` or `aria-selected`.

11. **Data tables (1.3.1)**: tables without `th` header cells; missing `scope` or `headers` associations.

12. **Media alternatives (1.2.1, 1.2.2, 1.4.2)**: `video` without a caption `track`; `audio` without a transcript reference; media that autoplays without pause or stop.
