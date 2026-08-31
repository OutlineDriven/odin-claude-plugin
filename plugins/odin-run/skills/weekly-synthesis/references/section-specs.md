# Section specifications

Content rules for each of the six synthesis sections. Apply during synthesis (procedure step 4) and self-review (step 5).

## General rules (all sections)

- Lead with numbers (counts, percentages, week-over-week deltas) over qualitative wording; never use inflated adjectives such as "dominated", "surged", "intensified", "skyrocketed", "exploded", "massive", or "sweeping": write "60 mentions (up from 56)", not "mentions surged".
- Wrap branch names, commands, commit hashes, and file paths in inline code.
- Cite sources readably in italics like `*Source: Feedback Report, Mar 16*`; never print raw report filenames; omit a citation only when the source is obvious from context.
- Every factual claim carries at least one of: issue number, PR or branch name, customer name, direct quote, commit count, competitor name with feature, or date.
- Every issue tracker number becomes a link (`[#NNNN](https://host/org/repo/issues/NNNN)`), extracting the repository base URL from the source reports rather than hardcoding it.
- Every cross-section reference links the target heading, for example `[Customer feedback](#section-2-customer-feedback)`; never write a bare "Section 2".
- Keep the full synthesis under 500 lines of markdown; link to the full reports for detail instead of copying them.

## Section 1: Executive summary

Under 300 words, zero opinions. A 1-2 sentence strategic frame connecting the week's signals to the active planning priorities when configured, one line stating the date range and sources covered, then three number-led bullets each for Customer feedback, Engineering investments, and Competitive landscape, each linking its section. Close with a since-the-previous-synthesis paragraph when a previous synthesis exists: metrics that moved, issues opened or closed, prior items addressed. Note coverage gaps: any empty report directory or report older than 14 days.

## Section 2: Customer feedback

- Critical issues: bold title, linked issue numbers, comment count, one-line description, open or closed status.
- Trending themes: the specific issues, NPS responses, or email threads forming each theme.
- NPS signals: what promoters and detractors cite, with verbatim quotes and feedback IDs, never the NPS score itself.
- Enterprise signals: customer names and direct quotes; report what was said, never inferred intent.
- Churn risks: only explicit cancellations or competitive defections with cited evidence.
- Social sentiment: sentiment score and mention volume with week-over-week deltas, top positive and negative themes, overlap with other feedback channels, representative mention links, 1-2 standout testimonials.
- Cross-reference engineering work and competitive moves with section links.

## Section 3: Engineering investments

What was built and changed only, no individual names, author summaries, or contributor credits.

- What shipped: merged features grouped by theme, citing PRs or commit ranges.
- What is in progress: branch names with latest commit dates.
- Focus areas: effort by commit count and area.
- Alignment with stated priorities: map each theme to a planning item from the supplied planning context and state its recorded status; flag engineering effort with no planning item and high-priority items with no visible activity, as facts. Omit when no planning context was supplied and record the omission in section 5.
- Overlap with customer feedback: per top issue, corresponding branch, merged PR, or no visible activity, with linked issue numbers.
- Cleanup and tech debt: notable refactoring, citing PRs.

## Section 4: Competitive landscape

- Key competitor moves: the 3-5 most notable ships, each with an italicized own-product comparison such as *[Your product] supports X but does not support Y*.
- Industry themes: patterns with counts and named competitors.
- **Where your product has parity or leads**.
- Where competitors have shipped ahead: feature-to-feature evidence.
- Notable gaps: nothing shipped by any tracked competitor including your product; cite the evidence.

## Section 5: Open questions

One `###` heading per unresolved question or missing or ambiguous data, each with `**Context:**` citing evidence through section links and issue numbers and `**What would resolve it:**` naming the data or action. What is unknown, never what to do about it.

## Section 6: Recommendations

The only section with judgements, clearly labeled as agent-generated opinions rather than established facts. `## N.` headings numbered sequentially with no gaps, ordered by priority then strength of evidence, 5-10 total, each with `**Priority:**` (P0 means this week), `**Type:**`, `**Evidence:**` citing facts through section links, `**Reasoning:**`, and `**Suggested owner:**` (team or area).

# Self-review checklist

Run before writing the file (procedure step 5). Fix all violations before proceeding.

1. Sections 1-5 contain zero judgements, recommendations, "should" statements, or characterizing adjectives ("alarming", "concerning", "critical" used as emphasis); every opinion lives only in section 6.
2. Every claim cites specific evidence; delete uncited claims.
3. The NPS score number appears nowhere; NPS verbatim quotes and themes are fine.
4. Section 6 is clearly labeled as agent-generated opinions.
5. Every ambiguity or gap surfaced during synthesis is captured in section 5.
6. No bare "Section N" references remain; every cross-reference is a heading link that resolves within the written file.
7. Every issue tracker number is hyperlinked.
8. No raw report filenames appear in citations.
9. Recommendation numbering is sequential 1, 2, 3, ... with no gaps.
10. Branch names, commands, commit hashes, and file paths use inline code, and no inflated adjectives remain.
