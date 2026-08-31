---
name: docs-canvas
description: 'Use when asked to render documentation as an interactive canvas. Produce a navigable artifact with overview, sections, and sources. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

1. Bind scope before mutation. Confirm the supplied documentation source is readable; if it is absent or empty, stop without writing. Choose one local output path, state it, and write nothing else.
2. Read and parse the documentation source into a structured outline: extract the document title, every section heading in source order, and every source reference (citation, link, or attribution) discovered in the text.
3. Build a navigable overview as a table of contents whose entries link to the rendered sections.
4. Render one section per heading, preserving the source text of that section without paraphrase or invented content.
5. Build a sources list citing every source reference discovered; if none is discovered, stop and report that the source lacks references.
6. Write a single self-contained HTML canvas artifact to the chosen local path. Inline all CSS and JavaScript so the artifact is standalone and opens without external dependencies.
7. Verify the artifact: the overview links resolve to the rendered sections and the sources list is non-empty.

## Failure and recovery
- Unreadable or empty source: stop, write nothing, report the missing source.
- No headings found: stop, report that the source lacks structure; do not emit an empty canvas.
- No source references found: stop, report that the source lacks references.
- Partial parse: emit only the successfully parsed sections and report which sections were dropped; never fabricate missing content.
- Rollback: delete the written artifact file to revert. No state other than that single local file is mutated.

## Output
One self-contained HTML canvas artifact containing a navigable overview, rendered sections, and a sources list, plus a one-line report naming the output path and the section count.

## Provenance

Adapted from the cursor/plugins `docs-canvas` outline (revision `68836ddaf5697224520f1847d90cdb90ca8babaa`, MIT). The published outline was explicitly incomplete; this is a clean-room adaptation that preserves the interactive-documentation-canvas mechanism without copying third-party expression.
