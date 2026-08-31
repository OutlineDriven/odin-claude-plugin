---
name: docs-canvas
description: 'Use when asked to render documentation as an interactive canvas. Produces a navigable HTML artifact with overview, sections, and sources. Not for writing or restructuring docs — use docs-writing; not for explainer artifacts — use explainer-artifact.'
---

# Docs canvas

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Render documentation as an interactive canvas. |
| Authority | Write only the named local canvas artifact; delete it to roll back. |
| Side effect | Creates one canvas artifact under the working directory. |
| Done | Navigable overview, sections, and sources. |

## Inputs

A documentation source must be supplied: a file path, directory, or URL that is readable from the working directory. Optional: a preferred output filename (default `docs-canvas.html`) and a section-grouping hint.

## Procedure

1. Bind scope before mutation. Confirm the supplied documentation source is readable; if it is absent or empty, stop without writing. Choose one local output path, state it, and write nothing else. Done when: the source is confirmed readable and one output path is stated.
2. Read and parse the documentation source into a structured outline: extract the document title, every section heading in source order, and every source reference (citation, link, or attribution) discovered in the text. Done when: title, headings in source order, and source references are extracted.
3. Build a navigable overview as a table of contents whose entries link to the rendered sections. Done when: every TOC entry links to a section anchor.
4. Render one section per heading, preserving the source text of that section without paraphrase or invented content. Done when: one rendered section exists per heading with source text preserved.
5. Build a sources list citing every source reference discovered; if none is discovered, stop and report that the source lacks references. Done when: the sources list is non-empty or the run stopped with a no-references report.
6. Write a single self-contained HTML canvas artifact to the chosen local path. Inline all CSS and JavaScript so the artifact is standalone and opens without external dependencies. Done when: the HTML file exists at the chosen path with inlined CSS and JavaScript.
7. Verify the artifact: the overview links resolve to the rendered sections and the sources list is non-empty. Done when: every overview link resolves and the sources list is non-empty.

## Failure and recovery
- Unreadable or empty source: stop, write nothing, report the missing source.
- No headings found: stop, report that the source lacks structure; do not emit an empty canvas.
- No source references found: stop, report that the source lacks references.
- Partial parse: emit only the successfully parsed sections and report which sections were dropped; never fabricate missing content.
- Rollback: delete the written artifact file to revert. No state other than that single local file is mutated.

## Output
One self-contained HTML canvas artifact at the stated path containing a navigable overview, rendered sections, and a sources list, plus a one-line report naming the output path and the section count.
