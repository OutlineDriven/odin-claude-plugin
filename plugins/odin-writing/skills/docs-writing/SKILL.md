---
name: docs-writing
description: 'Use when asked to write, restructure, or audit documentation with Diataxis types, or to draft a feature docs page or diagram source. Not for ADRs or architectural rationale.'
---

# Docs writing

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Write docs, audit docs, restructure documentation, draft a feature docs page, draft documentation or diagram source, Diataxis, API reference, tutorial, how-to guide |
| Authority | Reversible local: writes only documentation files or diagram sources in the named target set inside the working repository, rejecting paths outside it or protected files; rollback is version control. No remote mutation. |
| Side effect | Drafts, audits, and writes or restructures docs or diagram sources in the target directory. Presents the draft to the human for review before writing. |
| Done | Docs follow Diataxis types, pass the rule-based audit with no unmet criteria, are reviewed by the human, and are saved at the target path. |

## Inputs

Required: the target documentation directory or file set to write, restructure, or audit; the intent (write new docs, audit existing docs, restructure, or draft feature docs); the documentation subject; the intended audience; and the output format (markdown, plain text, or a diagram source).

For feature docs drafting, also required: the feature specification or PRD, and the codebase path where the feature is implemented.

Optional: an existing Diataxis map of the doc set; a scope limit naming which files are in bounds; existing documentation to update; diagram type; and length limit.

## Procedure

1. Bound the target set. Record the target directory, file set, subject, audience, and format. Reject the request if the target path is outside the working repository or would overwrite a protected file. Refuse to write outside the named set. Done when: the target directory, file set, subject, audience, and format are recorded and the target path is in-bounds.
2. Classify each doc into one Diataxis type: tutorial (learning-oriented, guided path), how-to guide (goal-oriented, steps to achieve a task), reference (information-oriented, API or fact lookup), or explanation (understanding-oriented, context and background). Split or retitle a doc that mixes types until each doc serves one type. Done when: every doc in scope is classified into exactly one Diataxis type.
3. Draft the documentation prose or diagram source for the named subject and audience, using the structure required by the requested format. Re-derive the wording; do not copy source expression from upstream material. If a diagram requires rendering, write its source and state the render command without executing it unless asked. For feature docs, use the section structure: Overview, Prerequisites, Usage, API Reference, Configuration, Troubleshooting. Populate each section using only information verified in the spec and codebase; include code examples drawn from actual source or tests. Do not invent APIs, flags, defaults, or behaviors not present in the code. Done when: a draft exists for the named subject and audience in the requested format.
4. Apply the structure audit to every doc: lead with the bottom line; put conditions before the action they gate; one idea per section; no filler sections; tutorials include a quick start and a procedures section; every doc ends with next steps; the first heading gives an overview of the doc. Done when: every doc passes the structure audit.
5. Apply the clarity audit to prose: one idea per sentence; avoid Latin abbreviations and nominalizations; use the serial comma. Done when: every prose passage passes the clarity audit.
6. Apply the code-example audit: examples are runnable, use named functions and realistic example names, show error descriptions, and move from isolated snippets to full context; keep a sane code-to-context ratio; handle multiple languages when relevant. Done when: every code example passes the code-example audit.
7. Apply the format audit: sentence-case headings; bold UI elements and code-font where appropriate; descriptive link text; image alt text; lowercase filenames; periods inside quotes; semantic HTML. Done when: every doc passes the format audit.
8. Apply the voice audit: no anthropomorphism; no unexplained jargon; use requirements language. Done when: every doc passes the voice audit.
9. Apply the hygiene audit: delete outdated content; keep a docs directory; no temporal language; label experimental and retconned content; update metadata. Done when: every doc passes the hygiene audit.
10. Apply the navigation audit: every doc is linked; relative paths; searchable headings; breadcrumbs give context; no repeated nav; limit layer depth. Done when: every doc passes the navigation audit.
11. Apply the review and scan audit: verify links resolve; API reference uses a three-column layout. Done when: every doc passes the review and scan audit.
12. Run the Diataxis type validation for each document against its type predicate: tutorial (a beginner completes it unaided, each step yields a visible result), how-to (an experienced user completes it without backtracking), reference (a fact is findable in under 30 seconds, each entry uses the format name then type then default then description then example), explanation (the reader can restate the why). Add cross-links between types: a tutorial links to the how-to and reference it prepares for; a how-to links to the reference and explanation behind it; reference and explanation link back to the practical types. Done when: every document passes its type predicate and cross-links connect each type to its related types.
13. For feature docs, capture or request screenshots of the feature in action. Embed each screenshot with descriptive alt text and a caption identifying the UI state shown. If the runtime environment cannot produce screenshots, mark the slot with `<!-- screenshot: pending -->` and note the gap in the output. Done when: every screenshot is embedded or marked pending with a reason.
14. Record every unmet criterion. Fix in-bounds docs until no criterion is unmet, or stop and report the blocked set. Done when: no criterion is unmet or the blocked set is reported.
15. Present the audited draft to the human for review before writing any file. Revise against feedback and re-present; do not save until approved. Done when: the draft is presented and human review is received.
16. After human approval, write the documentation file or diagram source to the target path. On partial write failure, delete any partial file written at the target path and report the rollback. Done when: the file exists at the target path.
17. Confirm the saved file exists at the target path and report the path. Done when: the file existence is confirmed and the path is reported.

## Failure and recovery

- Unmet criterion that cannot be fixed within scope: stop, leave the doc set in its last consistent state, and report the unmet criterion and the file it blocks. Do not mark done.
- Ambiguous Diataxis type for a doc that cannot be split: report it as blocked rather than guessing a type.
- Diataxis type validation failure: keep the document at its classified type and fix the failing predicate. Never reclassify to dodge a failed check.
- Link verification that cannot run (no resolver available): record the criterion as unverified, which counts as not met.
- Partial result: never claim the done predicate holds while any criterion is unmet or unverified.
- Missing subject, audience, or format: stop and request the missing input; write nothing.
- Target outside the working repository or protected: stop before writing; report the rejected path.
- Human review rejects the draft: revise against the feedback and re-present; do not save until approved.
- Generation produces empty or invalid output: discard the draft, report the failure, write nothing.
- Partial write failure: delete any partial file written at the target path and report the rollback.
- Codebase mismatch (feature docs): if the code contradicts the spec, document the discrepancy in a note block and flag it for review. Do not silently align the docs to one side.

## Output

The rewritten, restructured, or newly written documentation files or diagram sources in the target directory, plus a report listing each doc's Diataxis type, the audit result (pass, unmet criterion, or blocked), and each saved path.
