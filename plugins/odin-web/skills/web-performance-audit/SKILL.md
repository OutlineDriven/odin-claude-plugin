---
name: web-performance-audit
description: 'Use when asked to audit, profile, or debug page load performance, Lighthouse scores, or site speed. Returns a report with quantified Core Web Vitals, prioritized issues, and specific recommendations. Don''t use for tasks that require source or remote-system changes.'
---

# Web performance audit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Audit, profile, debug, or optimize page load performance, Lighthouse scores, or site speed |
| Authority | Read-only. No file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | None. Produces a performance audit report with Core Web Vitals, network analysis, accessibility snapshot, and codebase findings. |
| Done | Report contains quantified CWV metrics, prioritized issues with estimated impact, specific recommendations, and framework/bundler detection. |

## Inputs

- Target URL (required): Page or application URL to audit. It must be reachable from the agent environment.
- Viewport and throttling (optional): Device profile and network conditions. Defaults to mobile Moto G Power with slow 4G throttling.
- Focus area (optional): Narrow the audit to a specific concern such as LCP, CLS, FID, bundle size, or accessibility. When omitted, all areas are audited.

## Procedure

1. Detect framework and bundler. Inspect the page source, JavaScript bundles, and build artifacts to identify the framework (React, Vue, Next.js, Nuxt, Astro, SvelteKit, plain HTML, or other) and bundler (Webpack, Vite, esbuild, Rollup, Parcel, or other). Record detection confidence. Done when: framework and bundler are identified with confidence recorded (or marked unknown).
2. Collect Core Web Vitals. Use the Chrome DevTools MCP to navigate to the target URL and measure LCP, CLS, INP, FCP, and TTFB. Run at least three navigations and report the median and spread. Record the device profile and network throttling used. Done when: CWV metrics are collected with median, spread, and device/throttling recorded.
3. Capture network waterfall. Use the Chrome DevTools MCP to record all network requests. Identify the largest assets by transfer size, the longest-blocking resources, render-blocking scripts and stylesheets, and unoptimized image formats. Compute total transfer size and request count. Done when: network waterfall is captured with largest assets, blocking resources, and totals computed.
4. Snapshot accessibility state. Use the Chrome DevTools MCP to run an accessibility tree snapshot. Record contrast violations, missing alt text, missing ARIA labels, and keyboard navigation gaps. Done when: accessibility snapshot is recorded.
5. Inspect JavaScript execution. Use the Chrome DevTools MCP CPU profile or performance trace to identify long tasks exceeding 50 ms, main-thread blocking time, and third-party script contribution. Done when: long tasks, blocking time, and third-party contribution are identified.
6. Map findings to impact. For each issue found, estimate its impact on CWV metrics using the measurement data from steps 2-5. Rank issues by estimated metric improvement if fixed. Done when: every issue is ranked by estimated impact.
7. Generate recommendations. For each prioritized issue, provide a specific, actionable recommendation for the detected framework and bundler. Include the relevant configuration change, code modification, or asset optimization. Do not recommend tools or packages that cannot be verified to exist. Done when: every prioritized issue has a specific recommendation.
8. Assemble report. Compile the sections in the output format. Done when: report is assembled with all sections.

## Failure and recovery
- Target unreachable: report the HTTP error or timeout. Do not retry with a different URL. Return partial report with the failure class.
- DevTools MCP unavailable: report that Chrome DevTools MCP is not connected. Return partial report with the failure class. Do not substitute shell-based alternatives.
- Navigation timeout: report the timeout. If at least one successful navigation completed, use available data. If zero navigations succeeded, return partial report with the failure class.
- Framework not detected: record confidence as unknown. Continue the audit with generic recommendations. Do not invent a framework.
- Partial results: if any audit step fails after step 1, include all successfully collected data in the report with a note on which steps failed and why. Never claim the done predicate holds when CWV metrics are absent.

## Output
A structured performance audit report with sections in order: Summary (framework/bundler, overall grade, top three issues), Core Web Vitals (LCP/CLS/INP/FCP/TTFB with median, spread, pass/fail against Google thresholds), Network analysis (transfer size, request count, largest assets, render-blocking resources), Accessibility snapshot, JavaScript execution (long tasks, blocking time, third-party contribution), Prioritized issues (ranked with affected metric, estimated impact, recommendation), and Framework-specific guidance.
