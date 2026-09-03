---
name: visualise-chart
description: 'Use when the user asks to visualise data as a chart. Returns a self-contained HTML chart fragment using inline SVG or Canvas in a visualizer fence. Don''t use for tasks that require source or remote-system changes.'
---

# Visualise chart

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to chart, plot, graph, or visualise numeric or series data. |
| Authority | Read-only: no file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Chat output only: a visualizer fence containing an HTML fragment with an inline SVG or Canvas chart. |
| Done | A valid chart is present in the visualizer fence. |

## Inputs

- Required: data (values, series, or raw numeric data the user provides) and chart type (bar, line, doughnut, scatter, sparkline, or other named chart format the user requests).
- Optional: title, axis labels, legend preference, color palette guidance, width/height constraints.

## Procedure

1. Parse and validate the user-provided data and chart type. Validate data format at the trust boundary. Done when: data parses as valid numeric or series data, or the step has stopped with `INVALID_DATA`.
2. Select an inline SVG or Canvas renderer, whichever best fits the chart type and data shape. Do not reference external scripts, CDNs, or libraries. All rendering logic is inline. Done when: a rendering approach is selected, or the step has stopped with `UNSUPPORTED_TYPE`.
3. Generate a self-contained HTML fragment containing only the inline renderer and the chart markup. Embed all data, labels, and configuration inline. Do not fetch external data. Do not use `<iframe>`, `<object>`, or `<embed>`. Do not reference external scripts, stylesheets, or fonts. Done when: the fragment contains only inline data and inline rendering logic with no external references.
4. Wrap the fragment in the visualizer fence marker so the client renders it in a sandboxed iframe. Done when: the fragment is wrapped in the visualizer fence.
5. Return the fenced fragment as the sole output. Do not write files, mutate repositories, or call external services. Done when: the fenced fragment is the only output in the response.

## Failure and recovery

- `INVALID_DATA`: malformed numeric or series data. Return the named failure class and stop. Do not produce a chart fragment from invalid input.
- `UNSUPPORTED_TYPE`: chart type not recognized. Return the named failure class and stop. Do not invent a fallback chart type.
- `NON_CONVERGED`: rendering cannot be completed. Return `NON_CONVERGED` with the named failure class. Do not pretend the done predicate holds.

No mutation occurs; the only output is the visualizer fence or a named failure class.

## Output

A visualizer fence containing a self-contained HTML fragment with an inline SVG or Canvas chart. No external scripts, CDNs, stylesheets, fonts, or iframe elements.
