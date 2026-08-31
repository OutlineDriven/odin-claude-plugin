---
name: web-design-review
description: 'Use when the user runs /web-design-review with a URL to visually audit a live UI through the browser and fix findings in a screenshot-verified loop. Not for design direction picking; use design. Not for variant galleries; use design-variants.'
---

# Web design review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | the user runs `/web-design-review` with a URL |
| Authority | reversible local edits to source files and a local design findings report; one atomic commit per fix |
| Side effect | writes a web-design-audit report directory with screenshots and applies minimal source fixes |
| Done | the design fix-and-verify loop has completed: every fixable finding fixed, re-tested, and classified, with final scores computed |

## Inputs

- A target URL for the live UI to audit (required). If absent, ask the user for one.
- An optional mode flag: `--quick` (homepage plus 2 key pages), `--deep` (audit only pages affected by the current branch diff), or `--regression` (compare against a prior `web-design-baseline.json`). Default is full: 5-8 pages reachable from the homepage.
- A repo with source for the UI (required for the fix loop). If the URL is a remote site with no local source, run audit-only: report findings, skip the fix loop, mark every finding deferred.
- An optional `DESIGN.md` or `design-system.md` in the repo root. If present, calibrate every finding against it; deviations from the stated system are higher severity.

## Procedure

1. Create a report directory `web-design-audit-<YYYYMMDD>/screenshots/`. **Done when:** the report directory and screenshots subfolder exist.

2. Navigate to the target URL in the browser. Take a full-page desktop screenshot. Capture responsive screenshots at mobile 375, tablet 768, desktop 1024, and wide 1440. Capture console errors and performance metrics (LCP, CLS). Read each screenshot file back so it is visible inline; screenshots are evidence, not background. **Done when:** desktop plus four responsive screenshots, console errors, and LCP/CLS are captured and read back inline.

3. Form a First Impression before analyzing anything: state what the site communicates at a glance, what stands out, the first three elements the eye lands on (hierarchy check against designer intent), and a one-word gut verdict. **Done when:** the four First Impression fields are stated.

4. Extract the Inferred Design System: fonts with usage counts (flag more than 3 families), color palette (flag more than 12 unique non-gray colors), heading scale h1-h6 (flag skipped levels and non-systematic jumps), spacing patterns (flag non-scale values). **Done when:** fonts, palette, heading scale, and spacing are extracted with their flags applied.

5. Run the Trunk Test on every page: dropped on the page with no context, answer what site this is, what page is shown, what the key tasks are, where to start, whether oriented, and what the primary action is. Score PASS (6 clear) / PARTIAL (4-5) / FAIL (3 or fewer). A FAIL is a HIGH-impact finding regardless of visual polish. **Done when:** every page carries a Trunk Test score.

6. During audit, evaluate the rendered site only, not source code. Apply the 10-category Design Audit Checklist on each page. Document each finding in the report as it is found, not in a batch. Prefer 5-10 findings with screenshots and specific suggestions over 20 vague observations. Each finding gets an impact rating (high / medium / polish) and a category:
   - Visual Hierarchy & Composition: clear focal point, one primary CTA per view, natural eye flow, squint test, intentional white space.
   - Typography: font count 3 or fewer, scale ratio, line-height, measure 45-75 chars, no skipped heading levels, body 16px or larger, tabular-nums on number columns, generic-font flag (Inter/Roboto/Open Sans/Poppins as primary).
   - Color & Contrast: coherent palette, WCAG AA (body 4.5:1, large 3:1), no color-only encoding, dark mode uses elevation not lightness inversion, no red/green-only combinations.
   - Spacing & Layout: consistent grid, spacing scale on a 4px or 8px base, border-radius hierarchy, inner radius equals outer minus gap, no horizontal scroll, breakpoints at 375/768/1024/1440.
   - Interaction States: hover, focus-visible ring (never bare outline:none), active/pressed, disabled, loading skeletons matching content layout, warm empty states, specific error messages with a next step, touch targets 44px or larger, mindless-choice audit (every click obvious without thought).
   - Responsive Design: mobile layout makes design sense (not stacked desktop columns), no horizontal scroll, navigation collapses, no user-scalable=no.
   - Motion & Animation: easing direction (ease-out enter, ease-in exit), duration 50-700ms, purpose per animation, prefers-reduced-motion respected, only transform and opacity animated.
   - Content & Microcopy: specific button labels, no lorem ipsum, truncation handled, active voice, loading states end with the ellipsis character, destructive actions confirmed, happy-talk and over-long-instructions detection.
   - AI Slop Detection: purple/violet/indigo gradients, the 3-column icon-in-circle feature grid, centered everything, uniform bubbly radius, decorative blobs, emoji as design elements, colored left-border cards, generic hero copy, cookie-cutter section rhythm, system-ui as primary font.
   - Performance as Design: LCP under 2.0s (apps) or 1.5s (informational), CLS under 0.1, lazy images with dimensions, font-display swap, no visible font-swap flash.

   **Done when:** every page's findings are recorded, each with id, impact, category, screenshot, and specific suggestion; a defect-free page records zero findings with its screenshots as evidence.

7. Walk 2-3 key user flows and evaluate feel as well as function: response, transition quality, feedback clarity, form polish. Maintain a Goodwill Reservoir starting at 70/100. Subtract for hidden information (-15), format punishment (-10), unnecessary requests (-10), interstitials or forced tours (-15), sloppy appearance (-10), ambiguous choices (-5 each). Add for obvious top tasks (+10), upfront costs (+5), saved steps (+5 each), graceful error recovery (+10). Report the final goodwill score. **Done when:** 2-3 flows are walked and a numeric goodwill score is reported.

8. Compare screenshots and observations across pages for consistency: navigation bar, footer, component reuse versus one-off designs, tone, spacing rhythm. **Done when:** cross-page consistency is stated with named elements compared.

9. Score. Each category starts at A; each High-impact finding drops one letter, each Medium drops half a letter, Polish findings are noted but do not affect grade; minimum F. Compute the weighted Design Score (Visual Hierarchy 15%, Typography 15%, Spacing & Layout 15%, Color & Contrast 10%, Interaction States 10%, Responsive 10%, Content Quality 10%, AI Slop 5%, Motion 5%, Performance 5%) and an independent AI Slop Score, both A-F. Persist a `web-design-baseline.json` with category grades and findings. **Done when:** both scores are computed A-F and web-design-baseline.json is persisted.

10. Triage all findings by impact: high first, then medium, then polish. Mark findings that cannot be fixed from source (third-party widgets, content needing copy from the team) as deferred regardless of impact. **Done when:** findings are impact-ordered and each is marked fixable or deferred.

11. Fix loop, per fixable finding in impact order:
    a. Locate the source file(s) responsible for the issue. Modify only files directly related to the finding. Prefer CSS or styling changes over structural component changes.
    b. Make the minimal fix: the smallest change that resolves the design issue. Do not refactor surrounding code, add features, or improve unrelated things.
    c. Commit atomically: one commit per fix, never bundle multiple fixes. Message format: `style(design): FINDING-NNN — short description`.
    d. Re-test: navigate to the affected URL, take an after screenshot, capture console errors. Keep a before/after screenshot pair for every fix. Read the after screenshot back inline.
    e. Classify: verified (re-test confirms the fix, no new errors), best-effort (applied but not fully verifiable, e.g. needs specific browser state), reverted (regression detected, run `git revert HEAD`, mark the finding deferred).
    f. Regression test only for fixes involving JavaScript behavior changes (broken dropdowns, animation failures, conditional rendering, interactive state). CSS-only fixes skip it. Commit format: `test(design): regression test for FINDING-NNN`.

    **Done when:** every fixable finding is fixed, re-tested, and classified verified / best-effort / reverted.

12. Self-regulate. Every 5 fixes or after any revert, compute design-fix risk: start at 0%, each revert +15%, each CSS-only file change +0%, each component file change +5% per file, after fix 10 add +1% per additional fix, touching unrelated files +20%. If risk exceeds 20%, stop immediately and show the user what is done so far. Hard cap: 30 fixes, then stop regardless of remaining findings. **Done when:** risk stays at or below 20% and fix count at or below 30, or the loop is stopped at the gate.

13. Final Design Audit. Re-run the audit on all affected pages. Recompute the final Design Score and AI Slop Score. If final scores are worse than baseline, warn prominently: something regressed. If a prior `web-design-baseline.json` exists, append a regression table with per-category grade deltas, new findings, and resolved findings. **Done when:** final scores are recomputed and a regression table is appended when a prior baseline exists.

## Failure and recovery
- No browser automation available: write static comparison boards as HTML files and tell the user to open them directly; findings that need live interaction are marked best-effort.
- Site requires authentication: detect `/login`, `/signin`, `/auth`, or `/sso` in the URL. Ask the user to import browser cookies or run browser setup before continuing. Do not attempt to bypass auth.
- A fix introduces a regression: revert it with `git revert HEAD`, mark the finding deferred, continue the loop. Never leave a regressing fix in place.
- Risk exceeds 20% or the 30-fix cap is reached: stop the fix loop. Report what was done, what remains, and the risk level. Do not continue past the cap.
- No local source for the URL: run audit-only. Report all findings, skip the fix loop, mark every finding deferred. Do not invent source edits.
- Never claim the done predicate holds when findings remain unverified. Best-effort and reverted findings are reported as such, not as verified.

## Output
A report directory `web-design-audit-<YYYYMMDD>/` holding the audit report, screenshots/, web-design-baseline.json, a findings table, a summary, and a one-line PR summary, ordered capture → first-impression → inferred-system → trunk-test → checklist → flows → consistency → score → triage → fix-loop → self-regulate → final-audit, with every finding classified verified / best-effort / reverted / deferred.
