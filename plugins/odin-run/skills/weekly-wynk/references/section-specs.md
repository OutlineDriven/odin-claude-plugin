# WYNK section specifications

Branch-specific content rules for each of the six WYNK sections. Apply these during synthesis (procedure step 5).

## General rules (all sections)

- Lead with numbers (counts, percentages, week-over-week deltas) over qualitative wording; never use inflated adjectives such as "dominated", "surged", "intensified", "skyrocketed", "exploded", "massive", or "sweeping": write "60 mentions (up from 56)", not "mentions surged".
- Wrap branch names, commands, commit hashes, and file paths in inline code.
- Cite sources readably in italics like `*Source: Feedback Report, Mar 16*`; never print raw report filenames; omit a citation only when the source is obvious from context.
- Every factual claim carries at least one of: issue number, PR or branch name, customer name, direct quote, commit count, competitor name with feature, or date.
- Every GitHub issue number becomes `[#NNNN](https://github.com/YOUR_ORG/YOUR_REPO/issues/NNNN)`, extracting the repository base URL from the source reports rather than hardcoding it.
- Every cross-section reference uses a Notion mention page link `<mention-page url="https://www.notion.so/{CHILD_PAGE_ID_WITHOUT_DASHES}">Title</mention-page>`; never write "Section 2" or "(Section 3, ...)".
- Keep the full WYNK under 500 lines of markdown; link to the full reports for detail instead of copying them.

## Section 1 — Executive Summary

Under 300 words, zero opinions. A 1-2 sentence strategic frame connecting the week's signals to the active planning priorities when configured, one line stating the date range and sources covered, then three number-led bullets each for Customer Feedback, Engineering Investments, and Competitive Landscape, each linking its section with a mention page link. Close with a since-last-WYNK paragraph when a previous WYNK exists: metrics that moved, issues opened or closed, prior items addressed. Note coverage gaps: any empty report directory or report older than 14 days.

## Section 2 — Customer Feedback

- **Critical Issues**: bold title, linked issue numbers, comment count, one-line description, open or closed status.
- **Trending Themes**: the specific issues, NPS responses, or email threads forming each theme.
- **NPS Signals**: what promoters and detractors cite, with verbatim quotes and feedback IDs, never the NPS score itself.
- **Enterprise Signals**: customer names and direct quotes; report what was said, never inferred intent.
- **Churn Risks**: only explicit cancellations or competitive defections with cited evidence.
- **Social Sentiment**: sentiment score and mention volume with week-over-week deltas, top positive and negative themes, overlap with other feedback channels, representative mention links, 1-2 standout testimonials.
- Cross-reference engineering work and competitive moves using mention page links.

## Section 3 — Engineering Investments

What was built and changed only, no individual names, author summaries, or contributor credits.

- **What Shipped**: merged features grouped by theme, citing PRs or commit ranges.
- **What's In Progress**: branch names with latest commit dates.
- **Focus Areas**: effort by commit count and area.
- **Alignment with Company Priorities**: map each theme to a planning item and state its recorded status; flag engineering effort with no planning item and high-priority items with no visible activity, as facts.
- **Overlap with Customer Feedback**: per top issue, corresponding branch, merged PR, or no visible activity, with linked issue numbers.
- **Cleanup & Tech Debt**: notable refactoring, citing PRs.

## Section 4 — Competitive Landscape

- **Key Competitor Moves**: the 3-5 most notable ships, each with an italicized own-product comparison such as *[Your product] supports X but does not support Y*.
- **Industry Themes**: patterns with counts and named competitors.
- **Where Your Product Has Parity or Leads**.
- **Where Competitors Have Shipped Ahead**: feature-to-feature evidence.
- **Notable Gaps**: nothing shipped by any tracked competitor including your product; cite the evidence.

## Section 5 — Open Questions

One `###` heading per unresolved question or missing or ambiguous data, each with `**Context:**` citing evidence through mention page links and issue numbers and `**What would resolve it:**` naming the data or action. What is unknown, never what to do about it.

## Section 6 — Recommendations (Beta)

The only section with judgements, clearly labeled as agent-generated opinions rather than established facts. `## N.` headings numbered sequentially with no gaps, ordered by priority then strength of evidence, 5-10 total, each with `**Priority:**` (P0 means this week), `**Type:**`, `**Evidence:**` citing facts through mention page links, `**Reasoning:**`, and `**Suggested owner:**` (team or area).

# Self-review checklist

Run before any write (procedure step 6). Fix all violations before proceeding.

1. Sections 1-5 contain zero judgements, recommendations, "should" statements, or characterizing adjectives ("alarming", "concerning", "critical" used as emphasis); every opinion lives only in Section 6.
2. Every claim cites specific evidence; delete uncited claims.
3. The NPS score number appears nowhere; NPS verbatim quotes and themes are fine.
4. Section 6 is clearly labeled as agent-generated opinions.
5. Every ambiguity or gap surfaced during synthesis is captured in Section 5.
6. No bare "Section N" references remain; every cross-reference is a mention page link. Finalize cross-reference URLs in step 8 once the child page IDs exist.
7. Every GitHub issue number is hyperlinked.
8. No raw report filenames appear in citations.
9. Recommendation numbering is sequential 1, 2, 3, ... with no gaps.
10. Branch names, commands, commit hashes, and file paths use inline code, and no inflated adjectives remain.
