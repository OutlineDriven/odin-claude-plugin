---
name: design-review
description: 'Use when asked to run /design-review with a URL to visually audit a live UI through the browser. Produces a graded findings report and fixes each finding in a screenshot-verified loop. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Design review

## Contract

| Field | Bound contract |
|---|---|
| Trigger | the user runs /design-review with a URL |
| Authority | reversible local edits to source files and a local design findings report; one atomic commit per fix |
| Side effect | writes a design findings report directory with screenshots and applies minimal source fixes |
| Done | the design fix-and-verify loop has completed: every fixable finding fixed, re-tested, and classified, with final scores computed |

## Inputs

- A target URL for the live UI to audit (required). If absent, ask the user for one.
- An optional mode flag: `--quick` (homepage plus 2 key pages), `--deep` (audit only pages affected by the current branch diff), or `--regression` (compare against a prior `design-baseline.json`). Default is full: 5-8 pages reachable from the homepage.
- A repo with source for the UI (required for the fix loop). If the URL is a remote site with no local source, run audit-only: report findings, skip the fix loop, mark every finding deferred.
- An optional `DESIGN.md` or `design-system.md` in the repo root. If present, calibrate every finding against it; deviations from the stated system are higher severity.

## Procedure

1. Create a report directory `design-audit-<YYYYMMDD>/screenshots/`.
2. Navigate to the target URL in the browser. Take a full-page desktop screenshot. Capture responsive screenshots at mobile 375, tablet 768, desktop 1024, and wide 1440. Capture console errors and performance metrics (LCP, CLS). Read each screenshot file back so it is visible inline; screenshots are evidence, not background.
3. Form a First Impression before analyzing anything: state what the site communicates at a glance, what stands out, the first three elements the eye lands on (hierarchy check against designer intent), and a one-word gut verdict.
4. Extract the Inferred Design System: fonts with usage counts (flag more than 3 families), color palette (flag more than 12 unique non-gray colors), heading scale h1-h6 (flag skipped levels and non-systematic jumps), spacing patterns (flag non-scale values).
5. Run the Trunk Test on every page: dropped on the page with no context, answer what site this is, what page is shown, what the key tasks are, where to start, whether oriented, and what the primary action is. Score PASS (6 clear) / PARTIAL (4-5) / FAIL (3 or fewer). A FAIL is a HIGH-impact finding regardless of visual polish.
6. During audit, evaluate the rendered site only, not source code. Apply the 10-category Design Audit Checklist at each page. Document each finding to the report as it is found, not batched. Prefer 5-10 well-documented findings with screenshots and specific suggestions over 20 vague observations. Each finding gets an impact rating (high / medium / polish) and a category:
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
7. Walk 2-3 key user flows and evaluate feel, not just function: response, transition quality, feedback clarity, form polish. Maintain a Goodwill Reservoir starting at 70/100. Subtract for hidden information (-15), format punishment (-10), unnecessary requests (-10), interstitials or forced tours (-15), sloppy appearance (-10), ambiguous choices (-5 each). Add for obvious top tasks (+10), upfront costs (+5), saved steps (+5 each), graceful error recovery (+10). Report the final goodwill score.
8. Compare screenshots and observations across pages for consistency: navigation bar, footer, component reuse versus one-off designs, tone, spacing rhythm.
9. Score. Each category starts at A; each High-impact finding drops one letter, each Medium drops half a letter, Polish findings are noted but do not affect grade; minimum F. Compute the weighted Design Score (Visual Hierarchy 15%, Typography 15%, Spacing & Layout 15%, Color & Contrast 10%, Interaction States 10%, Responsive 10%, Content Quality 10%, AI Slop 5%, Motion 5%, Performance 5%) and an independent AI Slop Score, both A-F. Persist a `design-baseline.json` with category grades and findings.
10. Triage all findings by impact: high first, then medium, then polish. Mark findings that cannot be fixed from source (third-party widgets, content needing copy from the team) as deferred regardless of impact.
11. Fix loop, per fixable finding in impact order:
    a. Locate the source file(s) responsible for the issue. Modify only files directly related to the finding. Prefer CSS or styling changes over structural component changes.
    b. Make the minimal fix: the smallest change that resolves the design issue. Do not refactor surrounding code, add features, or improve unrelated things.
    c. Commit atomically: one commit per fix, never bundle multiple fixes. Message format: `style(design): FINDING-NNN — short description`.
    d. Re-test: navigate to the affected URL, take an after screenshot, capture console errors. Keep a before/after screenshot pair for every fix. Read the after screenshot back inline.
    e. Classify: verified (re-test confirms the fix, no new errors), best-effort (applied but not fully verifiable, e.g. needs specific browser state), reverted (regression detected, run `git revert HEAD`, mark the finding deferred).
    f. Regression test only for fixes involving JavaScript behavior changes (broken dropdowns, animation failures, conditional rendering, interactive state). CSS-only fixes skip it. Commit format: `test(design): regression test for FINDING-NNN`.
12. Self-regulate. Every 5 fixes or after any revert, compute design-fix risk: start at 0%, each revert +15%, each CSS-only file change +0%, each component file change +5% per file, after fix 10 add +1% per additional fix, touching unrelated files +20%. If risk exceeds 20%, stop immediately and show the user what is done so far. Hard cap: 30 fixes, then stop regardless of remaining findings.
13. Final Design Audit. Re-run the audit on all affected pages. Recompute the final Design Score and AI Slop Score. If final scores are worse than baseline, warn prominently: something regressed. If a prior `design-baseline.json` exists, append a regression table with per-category grade deltas, new findings, and resolved findings.

## Failure and recovery
- No browser available: fall back to opening comparison boards via `file://` in any browser so the user views the HTML directly. Findings that need live interaction are marked best-effort.
- Site requires authentication: detect `/login`, `/signin`, `/auth`, or `/sso` in the URL. Ask the user to import browser cookies or run browser setup before continuing. Do not attempt to bypass auth.
- A fix introduces a regression: revert it with `git revert HEAD`, mark the finding deferred, continue the loop. Never leave a regressing fix in place.
- Risk exceeds 20% or the 30-fix cap is reached: stop the fix loop. Report what was done, what remains, and the risk level. Do not continue past the cap.
- No local source for the URL: run audit-only. Report all findings, skip the fix loop, mark every finding deferred. Do not invent source edits.
- Never claim the done predicate holds when findings remain unverified. Best-effort and reverted findings are reported as such, not as verified.

## Output
A report directory `design-audit-<YYYYMMDD>/` containing:
- A structured design audit report (markdown): First Impression, Inferred Design System, per-page findings (each with id, title, impact, category, specific fix suggestion, before/after screenshots), Trunk Test results, Goodwill score, dual headline scores (Design Score, AI Slop Score), per-category grades, and a Quick Wins section of the 3-5 highest-impact fixes under 30 minutes each.
- A `screenshots/` folder: first-impression, per-page annotated, responsive (mobile/tablet/desktop), and before/after pairs per fix.
- A `design-baseline.json` with category grades and findings for regression comparison.
- A findings table: id, title, impact, category, fix status (verified / best-effort / reverted / deferred), commit SHA and files changed if fixed, before/after screenshots if fixed.
- A summary: total findings, fixes applied (verified, best-effort, reverted counts), deferred findings, Design score delta (baseline to final), AI slop score delta (baseline to final).
- A one-line PR summary: "Design review found N issues, fixed M. Design score X to Y, AI slop score X to Y."

## Provenance

Origin: https://github.com/garrytan/gstack, revision 07b59e396c6be5a86619a43151cb9ed62a15ae69, file design-review/SKILL.md. License MIT, copyright (c) 2026 Garry Tan. Adapted clean-room: the visual-audit-through-browser mechanism, the 10-category checklist, the dual-score grading rule, the goodwill reservoir, and the fix-and-verify loop were re-derived in original prose; no source expression was copied wholesale. The MIT copyright and permission notice is retained.
