---
name: visualise-chart
description: 'Use when the user asks to visualise data as a chart, generate and return a self-contained HTML chart fragment in a visualizer fence. Don''t use for tasks that require source or remote-system changes.'
---

# Visualise chart

## Contract

| Field | Bound contract |
|---|---|
| Trigger | bar, line, doughnut, scatter, sparkline, inline SVG chart, D3 visualization, also chart/graph/plot/data visualization |
| Authority | read-only: no file, VCS, credential, paid, published, deployed, or remote mutation |
| Side effect | visualizer fence containing an HTML/SVG/canvas chart fragment, rendered by the client in a sandboxed iframe |
| Done | valid chart rendered in the sandboxed iframe |

## Inputs

- **Required**: data (values, series, or raw data text the user provides), chart type (bar, line, doughnut, scatter, sparkline, SVG, D3, or other named chart format the user requests).
- **Optional**: title, axis labels, legend preference, color palette guidance, width/height constraints.

## Procedure

1. Parse the user-provided data and chart type. Validate data format at the trust boundary: reject malformed numeric or series data with a named failure class before proceeding.
2. Select a suitable rendering approach from: inline SVG, HTML5 canvas via Chart.js, or D3.js, whichever best fits the chart type and data shape.
3. Generate a self-contained HTML fragment containing only the chosen chart renderer and the chart markup. Do not reference external scripts outside the standard CDN allowlist. Embed all data, labels, and configuration inline; do not fetch external data.
4. Wrap the fragment in the visualizer fence marker so the client renders it in a sandboxed iframe.
5. Return the fenced fragment as the sole output. Do not write files, mutate repositories, or call external services beyond the CDN allowlist.

## Failure and recovery
- **Malformed data**: named failure class `INVALID_DATA`; partial-result rule: return the named failure class and stop. Do not produce a chart fragment from invalid input.
- **Unsupported chart type**: named failure class `UNSUPPORTED_TYPE`; partial-result rule: return the named failure class and stop. Do not invent a fallback chart type.
- **Non-converged**: if rendering cannot be completed, return `NON_CONVERGED` with the named failure class. Do not pretend the done predicate holds.
- Rollback rule: no mutation occurs; the only output is the visualizer fence or a named failure class.

## Output
A visualizer fence containing a self-contained HTML/SVG/canvas chart fragment. No files written, no remote calls beyond the CDN allowlist, no repository mutation.

## Provenance

Origin: https://github.com/bentossell/visualise, revision 35cd185b58af5db2f9d0fe13d9872b544a467483. License: MIT. Adaptation: clean-room rederivation of chart-snippet generation mechanism from the upstream SKILL.md, retaining the visualizer-fence output pattern, read-only authority, and CDN-allowlist constraint. No upstream expression copied directly.
