---
name: docs-writing
description: 'Use when asked to write or restructure documentation using Diataxis types and a rule-based audit; produce docs that pass every audit criterion with no unmet criteria. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Docs writing

## Contract

| Field | Bound contract |
|---|---|
| Trigger | write docs, audit docs, Diataxis, API reference, tutorial, how-to guide, restructure documentation |
| Authority | Reversible local writes to documentation files in the named target set only; no VCS, credential, published, deployed, or remote mutation |
| Side effect | Writes or restructures docs in the target directory and applies the rule-based audit |
| Done | Docs follow Diataxis types and pass the rule-based audit with no unmet criteria |

## Inputs

Required: the target documentation directory or file set to write or restructure, and the intent (write new docs, audit existing docs, or restructure).

Optional: an existing Diataxis map of the doc set; a scope limit naming which files are in bounds.

## Procedure

1. Bound scope. Record the target directory and the file set in bounds. Refuse to write outside the named set.
2. Classify each doc into one Diataxis type: tutorial (learning-oriented, guided path), how-to guide (goal-oriented, steps to achieve a task), reference (information-oriented, API or fact lookup), or explanation (understanding-oriented, context and background). A doc that mixes types is split or retitled until each doc serves one type.
3. Apply the structure audit to every doc: lead with the bottom line up front; put conditions before the action they gate; one idea per section; no filler sections; tutorials include a quick start and a procedures section; every doc ends with next steps; the first heading gives an overview of the doc.
4. Apply the clarity audit to prose: one idea per sentence; avoid Latin abbreviations and nominalizations; use the serial comma; follow the clarity defaults.
5. Apply the code-example audit: examples are runnable, use named functions and realistic example names, show error descriptions, and move from isolated snippets to full context; keep a sane code-to-context ratio; handle multiple languages when relevant.
6. Apply the format audit: sentence-case headings; bold UI elements and code-font where appropriate; descriptive link text; image alt text; lowercase filenames; periods inside quotes; semantic HTML.
7. Apply the voice audit: no anthropomorphism; no unexplained jargon; use requirements language; follow the voice defaults.
8. Apply the hygiene audit: delete outdated content; keep a docs directory; no temporal language; label experimental and retconned content; update metadata.
9. Apply the navigation audit: every doc is linked; relative paths; searchable headings; breadcrumbs give context; no repeated nav; limit layer depth.
10. Apply the review and scan audit: verify links resolve and apply the review defaults; apply the scan defaults; API reference uses a three-column layout.
11. Record every unmet criterion. Fix in-bounds docs until no criterion is unmet, or stop and report the blocked set.

## Failure and recovery
- Unmet criterion that cannot be fixed within scope: stop, leave the doc set in its last consistent state, and report the unmet criterion and the file it blocks. Do not mark done.
- Ambiguous Diataxis type for a doc that cannot be split: report it as blocked rather than guessing a type.
- Link verification that cannot run (no resolver available): record the criterion as unverified, which counts as not met.
- Partial result: never claim the done predicate holds while any criterion is unmet or unverified.

## Output
The rewritten or restructured documentation files in the target directory, plus a report listing each doc's Diataxis type and the audit result (pass, unmet criterion, or blocked).

## Provenance

Adapted clean-room from mblode/agent-skills `skills/docs-writing`, revision e97a3b383f5944f90d41eb92b24b4fb3b917a7f9, MIT license (Copyright (c) 2026 Matthew Blode). The rule-based audit criteria are derived from the source rule-file names; no third-party expression is copied.
