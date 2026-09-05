---
name: pr-walkthrough
description: 'Use when a user asks for a zoomable PR map or graph-canvas orientation. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# PR walkthrough

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants a zoomable PR map or graph-canvas orientation. |
| Authority | Reversible local: writes only the output HTML site and scratch files under the working directory; rollback is deleting or overwriting prior output. No remote mutation. |
| Side effect | Writes a self-contained static HTML site to the output directory. |
| Done | Four D3 views (file dependency graph, commit timeline, change heatmap, review thread flow) each with a guided tour, in a single HTML file with all assets bundled locally and no external network dependency. |

## Inputs

- PR diff or branch diff. Required. Supply as a unified diff file, a git range (`base..head`), or a GitHub PR URL.
- API credentials. Required when the input is a GitHub PR URL. Supply via `GITHUB_TOKEN` environment variable or `gh auth` session. Used read-only to fetch the diff and review threads.
- Repository root. Optional. Defaults to the current working directory. Used to resolve file paths in the diff.
- Output directory. Optional. Defaults to `./pr-walkthrough-site/`.

## Procedure

1. Parse the supplied diff. If the input is a unified diff file or git range, parse it directly. If the input is a GitHub PR URL, fetch the diff via the GitHub API with authentication: use the `gh` CLI or `GITHUB_TOKEN` for authorization, follow pagination with `Link` headers to retrieve all pages of the diff and review threads, and handle rate-limit responses (HTTP 403/429) by stopping and reporting the rate limit. Extract every changed file path, hunk range, insertion count, and deletion count. Done when: all changed file paths, hunk ranges, and insertion/deletion counts are extracted, or the fetch failure is reported.
2. Build the file dependency graph. For each changed file, record edges to other changed files that share an import or include relationship detected in the diff context lines. Store the graph as an adjacency list. Done when: the dependency graph is stored as an adjacency list.
3. Build the commit timeline. If the diff spans multiple commits (git range input), extract each commit hash, author, date, and subject. If the diff is a single unified diff, create one synthetic commit entry covering all hunks. Done when: the commit timeline is built with hash, author, date, and subject per commit.
4. Build the change heatmap. Map each hunk to its file path and line range. Bucket lines into 50-line blocks. Record insertion and deletion counts per block. Done when: the heatmap maps every hunk to bucketed line blocks with insertion/deletion counts.
5. Build the review thread flow. If a GitHub PR URL was supplied, fetch review comments via the GitHub API with the same authentication and pagination as step 1, and group them by file and position. If no URL was supplied, create an empty thread list. Done when: review threads are grouped by file and position, or the list is empty.
6. Generate the HTML artifact. Produce one self-contained HTML file containing: an SVG-based file dependency graph with zoom and pan (d3-zoom), node coloring by change magnitude, and edge bundling; a horizontal commit timeline with zoom, click-to-inspect, and tooltip; a change heatmap grid (files by line blocks) with color intensity proportional to edit density; a review thread flow diagram showing comment threads as connected nodes along a vertical file axis; a guided tour for each view (a sequence of highlight steps defined as a JSON array embedded in a script tag); and inline CSS, inline JavaScript, and D3 v7 bundled locally as a string literal inside a script tag. No external script tags, no CDN references, no network dependency. Done when: the HTML file contains all four SVG views, guided tours, and fully bundled assets with no external references.
7. Write the HTML file to the output directory as `index.html`. Done when: `index.html` is written to the output directory.
8. Verify the output is self-contained: open the HTML file, confirm no `src` attributes point to external URLs, confirm all four SVG containers are present, and confirm each tour JSON array has at least one step. Done when: the verification passes, or the specific defect is named and the skill stops.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Unparseable diff | Report the parse error. Produce no output site. Return `blocked`. |
| Empty diff (zero changed files) | Report that no changes were detected. Produce no output site. Return `blocked`. |
| GitHub API authentication failure | Report the HTTP status. Produce no output site. Return `blocked`. |
| GitHub API rate limit | Report the rate limit and the reset time. Produce no output site. Return `blocked`. |
| GitHub API pagination failure | Report the page that failed and the partial data retrieved. Produce no output site. Return `blocked`. |
| Self-containment verification failure | Report the external reference or missing element. Fix the HTML and re-verify. Return `non-converged` if the fix fails after three attempts. |

Partial results: if the HTML was written but verification failed, the output directory contains the last attempt. No rollback is needed because all writes are local and overwritable.

## Output

A self-contained static HTML site at the output directory containing `index.html` with four D3 views, guided tours, and all assets bundled locally with no external network dependency.
