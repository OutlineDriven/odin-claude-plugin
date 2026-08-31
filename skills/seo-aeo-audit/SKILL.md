---
name: seo-aeo-audit
description: 'Use when asked to improve SEO, optimize for search, fix meta tags, add structured data, or improve AEO visibility, run a full technical, page, structured-data, and AEO audit and return a prioritized markdown report with validated JSON-LD and re-verification steps. Don''t use for tasks that require source or remote-system changes.'
---

# SEO / AEO audit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Improve SEO, optimize for search, fix meta tags, add structured data, or improve AEO visibility |
| Authority | read-only: no file, VCS, credential, paid, published, deployed, or remote mutation |
| Side effect | none: audit report only; no files are written, no services are modified |
| Done | Report lists critical/high/medium issues, includes validated JSON-LD recommendations, and provides re-verification steps using Lighthouse, PageSpeed, and Search Console |

## Inputs

- **URL(s)** (required): The target page or site URL(s) to audit.
- **Focus area** (optional): Narrow the audit to one or more of: `technical`, `page`, `structured-data`, `aeo`. Default: all four.
- **JSON-LD template** (optional): A caller-supplied local template used to validate structured-data recommendations.

## Procedure

1. **Confirm URL and scope.** Require at least one target URL. Parse the scope argument or default to all four areas.
2. **Run technical SEO checks.** Execute Lighthouse against the target URL. Parse the output for: crawlability signals, indexability, HTTP status, canonical tags, robots directives, hreflang, sitemap presence, and Core Web Vitals. Record every violation as critical, high, or medium.
3. **Audit on-page elements.** Fetch the page HTML. Parse title tags, meta descriptions, heading hierarchy (H1–H6), image alt attributes, internal/external link distribution, and content keyword density. Flag duplicate, missing, truncated, or over-stuffed elements.
4. **Audit structured data.** Extract all `<script type="application/ld+json">` blocks from the fetched page. Validate each against the appropriate JSON-LD schema type (Article, BreadcrumbList, FAQPage, Product, Organization, LocalBusiness, HowTo, SpeakableSpecification, or others). Report malformed, missing, or conflicting markup. If JSON-LD templates are available, compare the live markup against the recommended template for each detected type.
5. **Audit AEO visibility.** Assess the page for answer-engine optimization signals: clear entity definitions in the first 100 words, FAQ or HowTo blocks, SpeakableSpecification in structured data, passage-level relevance, and citation eligibility signals. Do not fabricate rankings or citations.
6. **Synthesize the report.** Combine findings from steps 2–5. Assign every issue a severity: critical (blocks indexing), high (major ranking factor impact), or medium (improvement opportunity). Group under the four sections. For every structured-data finding, include the corrected JSON-LD block with the corrected fields shown.
7. **Add re-verification steps.** After the findings, append a Verification section with step-by-step instructions using:
   - **Lighthouse**: command-line command to re-run the audit.
   - **PageSpeed Insights API**: curl command to fetch the pagespeed API result.
   - **Google Search Console**: URL Inspection API steps to verify index status.
  8. **Return the report.** Output the complete markdown report to the user. Do not write any file.

## Failure and recovery
- **No URL provided**: Stop. Return `"error": "url_required"` with the message "Audit requires a target URL."
- **Page unreachable**: Stop. Return `"error": "page_unreachable"` with the URL and the response code or error text.
- **Script execution failure**: Catch the error. Return `"error": "tool_execution_failed"` with the script name and error output.
- **Malformed JSON-LD detected**: Flag as a critical finding in the report. Include the raw block and the parsing error. Do not halt the audit.
- **Zero findings in a category**: State "No issues detected in this category" explicitly in the report rather than omitting the section.
- **Partial tool results**: Include whatever data the tool returned. Mark any missing fields as `"status": "unavailable"` in the tool output block.

## Output
A markdown audit report containing:

- A header with the target URL, audit timestamp, and scope.
- Four sections: Technical SEO, On-Page SEO, Structured Data, AEO Visibility.
- Each issue with severity label, description, current value, recommended fix, and the relevant HTML or tool output snippet.
- Validated JSON-LD code blocks for every structured-data fix.
- A Verification section with exact Lighthouse, PageSpeed, and Search Console re-verification commands.
- A Summary table listing issue count by severity.

## Provenance

Origin: https://github.com/warpdotdev/oz-skills revision 6c08c49fc6c51b8f768bf8c53c041bc06a160765.
License: MIT (Copyright 2026 Warp). Adaptation: read-only tool-evidence audit replacing CI/CD integration with model+human evidence gathering. Support scripts (lighthouse.sh, pagespeed.sh, search-console-export.mjs) used as local tool references only; not executed unless the user provides a local environment. A caller-supplied JSON-LD template remains an optional input. No third-party expression copied; clean-room adaptation.
