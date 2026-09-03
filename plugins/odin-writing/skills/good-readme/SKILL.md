---
name: good-readme
description: 'Use when the user asks to create, rewrite, review, or polish an open-source README into a progressively disclosed, evidence-grounded guide whose claims are sourced and whose headings alone tell the story. Also produces shop-window READMEs with section templates, badges, and a quality checklist, and enforces a house standard with pre-ship verification gates. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Good README

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to create, rewrite, review, or polish an open-source README. |
| Authority | Reversible local write to README.md only; recover by restoring the prior README.md from version control or the editor undo history. |
| Side effect | Edits README.md into a progressively disclosed, evidence-grounded project introduction, example, and getting-started guide. |
| Done | Claims are sourced, the opening explains benefit and difference, the 4–10-line example is self-explanatory, clean-machine setup works, and headings alone tell the story. |

## Inputs

- The project repository containing or awaiting a README.md. A README may not yet exist; create it.
- The user's answers for any fact not present in the repo: real differentiators from alternatives, benchmark numbers, exact file sizes, and supported platforms. Required when the repo lacks them; ask the user rather than guess.

## Procedure

1. Read the existing README.md if present, plus the repo's package manifest, source entry points, and any benchmark or size data. Record which facts (differentiators, numbers, sizes, platforms) are present and which are missing. Done when: the existing README, package manifest, source entry points, and benchmark or size data are read, and each fact is recorded as present or missing.
2. In an existing README, prefer text over badges: if a badge carries a real fact such as version or build status, state that fact in text instead. Badges are optional; when kept, each must be proven by project files and render dynamically (HTTP 200, not the shields "invalid" card). Omit any badge whose value cannot be proven. Done when: every kept badge is proven by project files and confirmed to render dynamically (HTTP 200), and every unproven badge is omitted.
3. Write the opening block first: one plain-language paragraph answering what the project does, how the user benefits, and what makes it different from alternatives. If the real differentiators are not in the repo, ask the user before writing them. Done when: the opening block is one paragraph answering what the project does, how the user benefits, and what differentiates it, with differentiators sourced from the repo or user.
4. Add a scannable facts list right after the opening: lead each bullet with 1–2 bold keywords, then back it with concrete evidence from the repo — real benchmark numbers, exact sizes, side-by-side code comparison with the closest alternative, or a screenshot or diagram that replaces a paragraph. For any number not present in the repo, ask the user or how to measure it; never estimate. Done when: the facts list is written with each bullet leading with bold keywords backed by concrete evidence from the repo, and every number is sourced from the repo or user, never estimated.
5. Add a 4–10-line self-explanatory usage example that shows its output in a comment, so the reader sees the result without running anything. The example illustrates usage; the real setup guide comes next. Done when: a 4-to-10-line usage example is written with its output shown in a comment, and the reader can see the result without running anything.
6. Add a getting-started guide: explicit, copy-pasteable commands for adding the tool to an existing project, with every step present. Validate it by following it from scratch as if the project had never been seen, and fix every gap. Done when: the getting-started guide has copy-pasteable commands for every step, and following it from scratch reaches a working install with no missing step.
7. Format for skimmers: headings for hierarchy, bold for key points, lists over dense paragraphs, horizontal rules between layers, and must-not-miss lines in blockquotes or bold. If the README exceeds roughly two screens, add a table of contents after the opening block. Confirm that skimming only headings and bold text still tells the story. Done when: headings, bold, lists, and separators format the README for skimmers, a table of contents is added when the README exceeds roughly two screens, and skimming only headings and bold text tells the story.

## Failure and recovery
- Unsourced claim: if a needed fact (differentiator, number, size, platform) is not in the repo and the user cannot supply it, omit that claim rather than estimate. Never write a number not measured or received.
- Setup gap: if the getting-started guide cannot be validated from a clean machine because a step is missing or a command fails, fix the step before finishing; if the gap cannot be resolved, mark the guide incomplete and stop.
- Non-mutation when blocked: if the opening differentiators or required facts are missing and the user does not supply them, do not fabricate them; leave the README with the sourced content written so far and report exactly which claims are blocked.
- Partial result: a README with sourced content but missing sections is a partial result; report which sections are complete and which are blocked. Never claim the done predicate holds when a checklist item fails.

## Output
An edited README.md structured as opening block, facts list, 4–10-line example with output, and getting-started guide, formatted for skimmers, with every claim sourced from the repo, the user, or a measurement. When blocked, the partial README plus a report naming the unsourced claims and the unresolved clean-machine setup gaps.

## Shop-window and section templates

For a shop-window README, draft the opening as project name, one-line tagline, one-sentence description, and a visual separator. Choose section templates from `references/section-templates.md` matching the project type (library, CLI, web app, or the general-purpose minimum). Include at minimum Installation, Quick Start, Features, Usage, Contributing, and License. Populate each section with real content derived from project files; summarize and link to source locations rather than copying code from source files. If installation instructions cannot be derived from project files, stop and report `no-install-path` with the files checked. Clarify ambiguous intent with one question about primary audience, project phase, or any emphasized section before writing; if intent cannot be clarified, stop and return `blocked: unresolvable-intent`.

## Badges

Select only badges whose repository, workflow, registry package, license, or coverage integration is proven by project files, using the URL patterns and limits in `references/badges.md`. Replace every angle-bracket variable with a derived value, place the badges below the project title and tagline, and omit any badge whose value cannot be proven. Use flat-square or flat style, keep the badge row to one line (wrap to a second only when more than five badges are proven), and use a semantic color (green for passing, red for failing). The house standard requires every badge URL to return HTTP 200 and not the shields "invalid" card; a badge that fails this gate is removed, not kept.

## Quality checklist

Evaluate the draft against every applicable item in `references/quality-checklist.md` before finalizing. Fix each failing item before proceeding; an item that does not apply to the detected project type may be omitted only when the README does not claim that surface. The checklist covers structure (project name and tagline, visual separator, Installation, Quick Start, Features, Usage, Contributing, License), content (accurate installation, copy-pasteable quick start, features describing user capability not implementation, real tested usage examples, contributing workflow, license named and linked), accuracy (no non-standard tools beyond Installation, no hardcoded paths contradicting the project, no version numbers contradicting the manifest, no claims about features the project lacks), and presentation (badge images load, no broken relative links, code blocks have language tags, no overly long paragraphs, consistent heading levels).

## House standard and verification gates

For a public README that must match the house standard, enforce a fixed section order and five pre-ship verification gates. The fixed order is: What is this, Install, Quick start, core sections, Development, License; no extra top-level sections appear before Install or after License. Per-archetype templates (CLI tool, npm library, Swift package, macOS app, web service) define which sections appear after Quick start and Development; infer the archetype from project structure (`package.json`, `go.mod`, `Package.swift`, `*.xcodeproj`, `Cargo.toml`) or from user-supplied metadata, and stop if the structure matches no known archetype and none is supplied. Run all five gates before shipping:

1. Every command in the Install and Quick start sections runs against the current project; if a command cannot run (missing binary, no network), mark it blocked and state why.
2. Every code sample typechecks or compiles against the current API.
3. Every relative link resolves to an existing file in the repo; every external link returns HTTP 200 non-404; every badge URL returns HTTP 200 and not the shields "invalid" card.
4. No hardcoded package versions, stale minimums, or "coming soon" for shipped features; compare against `package.json`, `go.mod`, `Package.swift`, or equivalent.
5. The section order matches the fixed order and no extra top-level sections appear before Install or after License.

Each gate gets a pass, fail, or blocked verdict with a concrete finding for every non-pass. Claiming done when any gate fails or is blocked is rejected; report partial passes as partial passes. If a write partially succeeds, restore the file to its pre-write state before reporting the failure. The terminal classification is `done`, `done-with-fixes`, or `non-converged`.
