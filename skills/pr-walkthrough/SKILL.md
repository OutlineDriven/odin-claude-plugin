---
name: pr-walkthrough
description: 'Use when a user asks for a zoomable PR map or graph-canvas orientation. Produces a self-contained static HTML site with four D3 views, guided tours, and a passing validator. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# PR walkthrough

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants a zoomable PR map or graph-canvas orientation. |
| Authority | Reversible local write only. Write the output HTML site and any scratch files under the working directory. Delete or overwrite prior output on re-run. No VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Writes a self-contained static HTML site to the working directory. |
| Done | Four D3 views (file dependency graph, commit timeline, change heatmap, review thread flow) each with a guided tour, and the validator reports zero errors. |

## Inputs

- PR diff or branch diff: required. Supply as a unified diff file, a git range (`base..head`), or a GitHub PR URL.
- Repository root: optional. Defaults to the current working directory. Used to resolve file paths in the diff.
- Output directory: optional. Defaults to `./pr-walkthrough-site/`.

## Procedure

1. Parse the supplied diff. Extract every changed file path, hunk range, insertion count, and deletion count. If the input is a URL, fetch the diff via the GitHub API before parsing. Done when: all changed file paths, hunk ranges, and insertion/deletion counts are extracted.
2. Build the file dependency graph. For each changed file, record edges to other changed files that share an import or include relationship detected in the diff context lines. Store the graph as an adjacency list. Done when: the dependency graph is stored as an adjacency list.
3. Build the commit timeline. If the diff spans multiple commits (git range input), extract each commit hash, author, date, and subject. If the diff is a single unified diff, create one synthetic commit entry covering all hunks. Done when: the commit timeline is built with hash, author, date, and subject per commit.
4. Build the change heatmap. Map each hunk to its file path and line range. Bucket lines into 50-line blocks. Record insertion and deletion counts per block. Done when: the heatmap maps every hunk to bucketed line blocks with insertion/deletion counts.
5. Build the review thread flow. If a GitHub PR URL was supplied, fetch review comments and group them by file and position. Otherwise, create an empty thread list. Done when: review threads are grouped by file and position or the list is empty.
6. Generate the D3 canvas HTML. Produce one self-contained HTML file containing: an SVG-based file dependency graph with zoom and pan (d3-zoom), node coloring by change magnitude, and edge bundling; a horizontal commit timeline with zoom, click-to-inspect, and tooltip; a change heatmap grid (files × line blocks) with color intensity proportional to edit density; a review thread flow diagram showing comment threads as connected nodes along a vertical file axis; a guided tour for each view (a sequence of highlight steps defined as a JSON array embedded in a `<script>` tag); and inline CSS and inline JavaScript with no external dependencies except D3 v7 from a CDN `<script>` tag. Done when: the HTML file contains all four SVG views, guided tours, and inline CSS/JS.
7. Write the HTML file to the output directory as `index.html`. Done when: `index.html` is written to the output directory.
8. Run the validator script against the generated HTML. The validator checks that all four SVG containers are present, each tour JSON array has at least one step, the D3 CDN script tag is present, and no broken internal references exist (element IDs referenced by tour steps exist in the DOM). Done when: the validator runs and reports its results.
9. If the validator reports errors, fix the HTML and re-validate. Repeat up to three times. If errors persist after three attempts, report the validator output and stop. Done when: the validator reports zero errors or three attempts are exhausted.

## Failure and recovery
| Failure class | Behavior |
|---|---|
| Unparseable diff | Report the parse error. Produce no output site. Return `blocked`. |
| Empty diff (zero changed files) | Report that no changes were detected. Produce no output site. Return `blocked`. |
| Validator errors after three fix attempts | Report the validator output verbatim. Keep the last-generated HTML in the output directory. Return `non-converged`. |
| D3 CDN unreachable at generation time | Embed a fallback notice in the HTML `<head>` and proceed with inline D3 stubs that render placeholder rectangles. Report the CDN failure. |
| GitHub API failure (URL input) | Report the HTTP status and response body. Produce no output site. Return `blocked`. |

Partial results: if the HTML was written but validation failed, the output directory contains the last attempt. No rollback is needed because all writes are local and overwritable.

## Output
A self-contained static HTML site at the output directory containing `index.html` with four D3 views, guided tours, and a passing validator result — validator stdout included in the generation report.

## Provenance

Adapted from `source:source-warp-common:wc-08` at revision `f589e224907eda566c13755529f59db563090d14`. Original repository: https://github.com/warpdotdev/common-skills. License: MIT, Copyright (c) 2026 Denver Technologies, Inc. Mechanisms rewritten in ODIN style per permissive adaptation terms. The vendored third-party JS bundle (pierre-diffs.js) from the original skill-doctor assets is excluded from this adaptation.
