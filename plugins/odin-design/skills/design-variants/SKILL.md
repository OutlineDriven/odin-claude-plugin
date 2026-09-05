---
name: design-variants
description: 'Use when /design-variants generates distinct design directions and a gallery for selection. Not for one polished artifact: use polished-web-prototype. Not for token-system picking: use design.'
---

# Design variants

## Contract

| Field | Bound contract |
|---|---|
| Trigger | the user runs /design-variants |
| Authority | Reversible local: writes only design variant pages and files under a per-project design directory; rollback is deleting that directory. No remote mutation. |
| Side effect | local-write to a design directory; no project source, VCS, credential, or remote mutation |
| Done | A variant gallery is ready, an approved record is saved to the design directory, and the taste record is updated |

## Inputs

Required: a screen or surface to explore, named by the user or inferred from the request.

When optional context is absent, gather it across five dimensions: who the design is for, the job to be done on that screen, what already exists in the codebase, the user flow in and out, and edge cases (long names, zero results, error states, mobile, first-time vs power user). A project design-system document, if present, is the default visual constraint unless the user says otherwise. Prior approved designs for the project, if present, bias generation toward demonstrated taste.

## Procedure

1. Bound the output directory before any generation: a per-project design folder that persists across branches and conversations. Never write variants to project source, a context cache, a docs tree, or a system temp directory. **Done when:** the output directory is named and bounded.

2. Gather context across the five dimensions. Auto-read any project design-system document and list existing components and pages first; pre-fill what was inferred, then ask only for the gaps in one combined question. Stop gathering after two rounds and proceed with stated assumptions. **Done when:** the five dimensions are filled or two gather rounds have elapsed with stated assumptions.

3. Read prior approved-design records for the project. If they exist, extract the strongest taste signals (fonts, colors, layouts, aesthetics the user approved and rejected) and bias generation toward them. If a current request contradicts a strong prior signal, flag the conflict and ask whether to update the taste record or treat this as a one-off before proceeding. **Done when:** taste signals are extracted and any conflict is flagged and resolved.

4. Generate N text concepts (default 3, up to 8 for important screens), each a distinct creative direction. Apply the anti-convergence rule: every variant must use a different font family, color palette, and layout approach. Test by swapping the headline text between two variants; if the swap goes unnoticed, they are too similar and the weaker one must be regenerated in a deliberately different direction. Every direction must satisfy self-evident hierarchy, scannable layout, obviously clickable affordances, and eliminated noise. **Done when:** N concepts are produced, each passing the headline-swap test and the four quality checks.

5. Present the concepts as a lettered list and confirm with the user before generating visuals: generate all, change some, add more, or drop some. Re-present after each adjustment, max two rounds. **Done when:** the user confirms which concepts to render.

6. Generate the confirmed variants in parallel, each to a temporary location then copied into the design directory. Each generation retries on rate-limit failure up to three times and verifies its output file exists and is non-empty before reporting done. **Done when:** every confirmed variant file exists and is non-empty.

7. Display every generated variant inline so the user sees them immediately, then build a comparison gallery that presents all variants side-by-side with rating, comment, and remix controls. **Done when:** all variants are shown inline and the comparison gallery is built.

8. Wait for the user's selection. The gallery is the chooser. If the user submits a final choice, proceed; if the user requests regenerate or remix, read the requested action, generate new variants from the updated brief, rebuild and reload the gallery, and wait again. Repeat until a final choice is submitted. **Done when:** the user submits a final choice.

9. Summarize the understood feedback (preferred variant, per-variant ratings, comments, overall direction) and confirm with the user before saving. **Done when:** the feedback summary is confirmed by the user.

10. Save an approved record to the design directory containing the chosen variant, the feedback, the date, the screen name, and the current branch. Update the taste record with the approved and explicitly rejected variants. **Done when:** the approved record and taste record are written.

## Failure and recovery
- Rate limit or generation error: retry the failing variant up to three times with a short wait. If all parallel attempts fail, fall back to sequential generation one variant at a time, showing each as it lands.
- Zero variants succeeded after retry and sequential fallback: stop and report which variants failed and the errors; do not present an empty gallery as done.
- Comparison gallery cannot be served: show each variant inline and ask the user's preference directly; this is a degraded path, not a silent substitute.
- User request contradicts a strong taste signal: flag it and ask before proceeding; never silently override recorded taste.
- Rollback: the design directory is the only mutation target. To discard a session, delete that directory. No project source, VCS state, credential, or remote resource is touched, so recovery is deletion of the directory.
- Never swallow a generation failure or present a gallery as ready when variants are missing.

## Output
A variant gallery inline and side-by-side for selection, then an approved record in the design directory naming the chosen variant, per-variant ratings, comments, overall direction, date, screen, and branch, plus an updated taste record, ordered bound → gather → read-taste → generate → confirm → render → gallery → select → summarize → save.
