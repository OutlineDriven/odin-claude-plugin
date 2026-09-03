---
name: docs-canvas
description: 'Use when asked to render documentation as an interactive, navigable HTML canvas. Fetches files, directories, or URLs, extracts headings and sources, and produces a self-contained HTML artifact with a table of contents. Not for writing or restructuring docs.'
---

# Docs canvas

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Render a set of documentation (file, directory, or URL) as an interactive, navigable HTML canvas artifact. |
| Authority | Reversible local writes for the single output HTML artifact in the working directory. Read-only access to local files or network fetch for URLs. |
| Side effect | Creates one self-contained HTML canvas artifact under the working directory. |
| Done | One self-contained, navigable HTML file at the stated path containing the structured overview, rendered sections, and a combined sources index. |

## Inputs

Required: a documentation source. A file path, a directory path, or a URL that is readable from the working directory or reachable over the network.

Optional: a preferred output filename (default `docs-canvas.html`) and a section-grouping hint.

## Procedure

1. Fetch or traverse the documentation source to extract text. For a single file, read it directly. For a directory, walk the tree and read every text-readable file (markdown, HTML, plain text), skipping binary and non-document files. For a URL, fetch the page content. Stop if the source is unreadable or unreachable. Done when: raw text is extracted from every readable source file or page.

2. Parse the extracted text into an ordered hierarchy of document titles and section headings. For each document, extract the title and every heading in source order. When two headings produce the same anchor, disambiguate by appending a numeric suffix. Done when: titles and headings are extracted in source order with unique anchors.

3. Extract source references and build a combined index. Collect every citation, link, and attribution discovered across all documents. Build an index mapping each reference to its source document and location. Done when: the combined sources index is built.

4. Render the content as a single HTML artifact with an interactive table of contents. Produce one section per heading, preserving the source text without paraphrase or invented content. The table of contents links each entry to its section anchor. Done when: every heading has a rendered section and every TOC entry links to its anchor.

5. Save to the working directory with all CSS and JavaScript inlined. The artifact must open without external dependencies. Done when: the HTML file exists at the stated path with inlined CSS and JavaScript, and every TOC link resolves to a rendered section.

## Failure and recovery

- Source unreadable or unreachable: stop, write nothing, report the missing source.
- No headings found: stop, report that the source lacks structure. Do not emit an empty canvas.
- Partial parse: emit only the successfully parsed sections and report which sections were dropped. Never fabricate missing content.
- Rollback: delete the written artifact file to revert. No state other than that single local file is mutated.

## Output

One self-contained HTML canvas artifact at the stated path containing a navigable table of contents, rendered sections with source text preserved, and a combined sources index, plus a one-line report naming the output path and the section count.
