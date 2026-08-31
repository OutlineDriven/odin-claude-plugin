---
name: weekly-wynk
description: 'Use when the user asks to create a WYNK, compile weekly reports, or summarize what they need to know this week. Publishes a Notion page, a Slack post, and a PR. Don''t use for generating the underlying reports, ad-hoc summaries, or non-WYNK formats.'
disable-model-invocation: true
---

# Weekly WYNK (what you need to know)

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to create a WYNK, compile weekly reports, or what they need to know this week. |
| Authority | Explicit human invocation only. This skill publishes to Notion, posts to Slack, and opens a PR: after synthesis, preview every target and consequence and proceed only on the operator's explicit go-ahead before the first write. |
| Side effect | Exactly one Notion parent page with 6 child section pages under the configured Weekly WYNK parent page, one local file `reports/weekly_wynk/wynk_YYYY-MM-DD.md`, one Slack webhook message, and one PR containing only that file. No other file, VCS, credential, or remote change. |
| Done | Notion WYNK page is live, local copy saved, Slack posted, PR open; Sections 1-5 are factual and Section 6 is labeled recommendations. |

## Inputs

- `NOTION_API_KEY` environment variable, required. Never display, log, or send it anywhere except the `Authorization` header.
- The Weekly WYNK Notion parent page ID, required, supplied by the operator.
- `SLACK_WEBHOOK_URL` environment variable, required, and it must start with `https://hooks.slack.com/`.
- The WYNK date `YYYY-MM-DD`: the operator names the week, otherwise use the current date.
- Report directories under the repository root: `reports/customer_feedback_summaries/`, `reports/votc_insights/`, `reports/git_history_analysis/`, `reports/competitor_changelog_reports/`, `reports/weekly_sentiment_analysis/`. The most recent file in each is optional input; at least one report across all directories is required.
- The previous WYNK at `reports/weekly_wynk/`, optional, enables the trend comparison.
- The Continuous Planning Notion page ID, planning data source ID, and the organization's status values, optional. When absent, Sections 1 and 3 omit planning alignment and the omission is recorded in Section 5.
- Command-line capabilities `git`, `curl`, `jq`, and `gh` (for the PR) must be available; a missing capability blocks the run at the step that needs it, with no substitution.
- The WYNK synthesizes only report artifacts that already exist; it never collects new data or generates the underlying reports.

## Procedure

1. Run `REPO_ROOT=$(git rev-parse --show-toplevel)`. If it fails, stop: the directory is not a git repository and the PR step cannot run. Use `$REPO_ROOT/reports/...` for every report path in every later step.
2. Discover the most recent report per directory. Sort by filename, never by filesystem modification time: filenames carry `YYYY-MM-DD` dates and mtimes are unreliable in freshly cloned repositories:

   ```bash
   ls "$REPO_ROOT/reports/customer_feedback_summaries/"*.md 2>/dev/null | sort | tail -1
   ls "$REPO_ROOT/reports/votc_insights/"*.md 2>/dev/null | sort | tail -1
   ls "$REPO_ROOT/reports/git_history_analysis/"*.md 2>/dev/null | sort | tail -1
   ls "$REPO_ROOT/reports/competitor_changelog_reports/"*.md 2>/dev/null | sort | tail -1
   ls "$REPO_ROOT/reports/weekly_sentiment_analysis/"*.md 2>/dev/null | sort | tail -1
   ls "$REPO_ROOT/reports/weekly_wynk/"*.md 2>/dev/null | sort | tail -1
   ```

   The last command finds the previous WYNK. If no report exists in any directory, stop and tell the operator; do not fabricate content.
3. Read the most recent file from each directory found in step 2, plus the previous WYNK when it exists, to track trends and follow up on prior recommendations.
4. When the Continuous Planning inputs are configured, query active planning items and fetch north star metrics from the Continuous Planning page:

   ```bash
   curl -s -X POST "https://api.notion.com/v1/data_sources/YOUR_NOTION_DATA_SOURCE_ID/query" \
     -H "Authorization: Bearer $NOTION_API_KEY" \
     -H "Notion-Version: 2025-09-03" \
     -H "Content-Type: application/json" \
     -d '{
       "page_size": 100,
       "filter": {
         "and": [
           {"property": "Status", "status": {"does_not_equal": "Shipped"}},
           {"property": "Status", "status": {"does_not_equal": "Not prioritized"}}
         ]
       }
     }' | jq
   ```

   Replace the data source ID and both status values with the operator's configuration. If `has_more` is true, repeat the request with `start_cursor` until it is false. Extract each item's title, status, functional area, category, and target ship date; this feeds the strategic frame and the Section 3 alignment. Retrieve the planning page's north star metrics with `GET /v1/blocks/{PLANNING_PAGE_ID}/children?page_size=100`.
5. Synthesize the six sections. Be matter-of-fact and evidence-driven; cite specific issue numbers, customer names, commit counts, and competitor names:
   - All sections: lead with numbers (counts, percentages, week-over-week deltas) over qualitative wording; never use inflated adjectives such as "dominated", "surged", "intensified", "skyrocketed", "exploded", "massive", or "sweeping": write "60 mentions (up from 56)", not "mentions surged". Wrap branch names, commands, commit hashes, and file paths in inline code. Cite sources readably in italics like `*Source: Feedback Report, Mar 16*`; never print raw report filenames; omit a citation only when the source is obvious from context. Every factual claim carries at least one of: issue number, PR or branch name, customer name, direct quote, commit count, competitor name with feature, or date. Every GitHub issue number becomes `[#NNNN](https://github.com/YOUR_ORG/YOUR_REPO/issues/NNNN)`, extracting the repository base URL from the source reports rather than hardcoding it. Every cross-section reference uses a Notion mention page link `<mention-page url="https://www.notion.so/{CHILD_PAGE_ID_WITHOUT_DASHES}">Title</mention-page>`; never write "Section 2" or "(Section 3, ...)".
   - Section 1 Executive Summary: under 300 words, zero opinions. A 1-2 sentence strategic frame connecting the week's signals to the active planning priorities when configured, one line stating the date range and sources covered, then three number-led bullets each for Customer Feedback, Engineering Investments, and Competitive Landscape, each linking its section with a mention page link. Close with a since-last-WYNK paragraph when a previous WYNK exists: metrics that moved, issues opened or closed, prior items addressed. Note coverage gaps: any empty report directory or report older than 14 days.
   - Section 2 Customer Feedback: Critical Issues (bold title, linked issue numbers, comment count, one-line description, open or closed status), Trending Themes (the specific issues, NPS responses, or email threads forming each theme), NPS Signals (what promoters and detractors cite, with verbatim quotes and feedback IDs, never the NPS score itself), Enterprise Signals (customer names and direct quotes; report what was said, never inferred intent), Churn Risks (only explicit cancellations or competitive defections with cited evidence), Social Sentiment (sentiment score and mention volume with week-over-week deltas, top positive and negative themes, overlap with other feedback channels, representative mention links, 1-2 standout testimonials). Cross-reference sources citing the same issue; report the facts without characterizing them.
   - Section 3 Engineering Investments: what was built and changed only, no individual names, author summaries, or contributor credits. What Shipped (merged features grouped by theme, citing PRs or commit ranges), What's In Progress (branch names with latest commit dates), Focus Areas (effort by commit count and area), Alignment with Company Priorities (map each theme to a planning item and state its recorded status; flag engineering effort with no planning item and high-priority items with no visible activity, as facts), Overlap with Customer Feedback (per top issue: corresponding branch, merged PR, or no visible activity, with linked issue numbers), Cleanup & Tech Debt (notable refactoring, citing PRs).
   - Section 4 Competitive Landscape: Key Competitor Moves (the 3-5 most notable ships, each with an italicized own-product comparison such as *[Your product] supports X but does not support Y*), Industry Themes (patterns with counts and named competitors), Where Your Product Has Parity or Leads, Where Competitors Have Shipped Ahead (feature-to-feature evidence), Notable Gaps (nothing shipped by any tracked competitor including your product; cite the evidence).
   - Section 5 Open Questions: one `###` heading per unresolved question or missing or ambiguous data, each with `**Context:**` citing evidence through mention page links and issue numbers and `**What would resolve it:**` naming the data or action. What is unknown, never what to do about it.
   - Section 6 Recommendations (Beta): the only section with judgements, clearly labeled as agent-generated opinions rather than established facts. `## N.` headings numbered sequentially with no gaps, ordered by priority then strength of evidence, 5-10 total, each with `**Priority:**` (P0 means this week), `**Type:**`, `**Evidence:**` citing facts through mention page links, `**Reasoning:**`, and `**Suggested owner:**` (team or area).
   - Keep the full WYNK under 500 lines of markdown; link to the full reports for detail instead of copying them.
6. Self-review every section and fix all violations before any write:
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
7. Before the first mutation, verify authentication and preview the targets:

   ```bash
   curl -s "https://api.notion.com/v1/users/me" \
     -H "Authorization: Bearer $NOTION_API_KEY" \
     -H "Notion-Version: 2025-09-03" | jq
   ```

   A non-2xx response blocks with zero mutations. Present the operator the WYNK date, the parent page the weekly page will be created under, the six child sections, the local file path, the Slack webhook target, and the PR branch. Proceed only on the operator's explicit go-ahead.
8. Publish to Notion. Write each request payload to a JSON file, send it with `curl -d @file`, and check every response before the next call.
   - **Weekly parent page.** Create an empty container page under the Weekly WYNK parent page: no content blocks of its own, icon `📋`, title `WYNK — Week of YYYY-MM-DD`:

     ```bash
     curl -s -X POST "https://api.notion.com/v1/pages" \
       -H "Authorization: Bearer $NOTION_API_KEY" \
       -H "Notion-Version: 2025-09-03" \
       -H "Content-Type: application/json" \
       -d @/tmp/wynk_week_page.json | jq
     ```

     Payload: `{"parent": {"page_id": "<WYNK_PARENT_PAGE_ID>"}, "icon": {"type": "emoji", "emoji": "📋"}, "properties": {"title": {"title": [{"text": {"content": "WYNK — Week of YYYY-MM-DD"}}]}}}`. Capture the returned `id` as `WEEK_PAGE_ID`.
   - **Six empty child pages.** Create all six under `WEEK_PAGE_ID` with no content, in this order, capturing each returned `id`: 📊 Executive Summary, 💬 Customer Feedback, 🔧 Engineering Investments, 🏁 Competitive Landscape, ❓ Open Questions, 💡 Recommendations (Beta). Creating them empty first yields every ID so the populated content can carry correct mention page cross-references.
   - **Populate sections.** Append each section's content as children blocks:

     ```bash
     curl -s -X PATCH "https://api.notion.com/v1/blocks/{SECTION_PAGE_ID}/children" \
       -H "Authorization: Bearer $NOTION_API_KEY" \
       -H "Notion-Version: 2025-09-03" \
       -H "Content-Type: application/json" \
       -d @/tmp/wynk_section_N.json | jq
     ```

     Convert each section's markdown to Notion blocks: `heading_1`, `heading_2`, `heading_3`, `paragraph`, `bulleted_list_item`, `numbered_list_item`, `code`, `quote`, `divider`. Keep each `rich_text` element within 2000 characters and each request within 100 blocks; send the remainder in further requests. Retain the mention page links and issue hyperlinks inside the rich text.
   - **Collect URL.** The weekly page URL is `https://www.notion.so/{WEEK_PAGE_ID}`; it is the link used for distribution.
9. Save the local copy to `$REPO_ROOT/reports/weekly_wynk/wynk_YYYY-MM-DD.md`, combining all six sections:

   ```
   # WYNK — Week of YYYY-MM-DD
   Generated: YYYY-MM-DD
   Notion Page: [link]

   ---
   ## Executive Summary
   [Section 1 content]

   ---
   ## Customer Feedback
   [Section 2 content]

   ---
   ## Engineering Investments
   [Section 3 content]

   ---
   ## Competitive Landscape
   [Section 4 content]

   ---
   ## Open Questions
   [Section 5 content]

   ---
   ## Recommendations (Beta)
   [Section 6 content]
   ```
10. Post to Slack. Refuse any webhook URL whose host is not `hooks.slack.com`. Write `{"text": "<Executive Summary and the Notion weekly page link>"}` to a JSON file and send it:

    ```bash
    curl -s -X POST -H "Content-type: application/json" --data @/tmp/wynk_slack.json "$SLACK_WEBHOOK_URL"
    ```

    Only a 2xx response confirms the post.
11. Open the PR containing the new report file and nothing else:

    ```bash
    git checkout -b reports/wynk-YYYY-MM-DD
    git add "$REPO_ROOT/reports/weekly_wynk/wynk_YYYY-MM-DD.md"
    git commit -m "Add WYNK report for YYYY-MM-DD"
    git push -u origin reports/wynk-YYYY-MM-DD
    gh pr create --title "WYNK — Week of YYYY-MM-DD" --body "Adds reports/weekly_wynk/wynk_YYYY-MM-DD.md with the Notion weekly page link." --head reports/wynk-YYYY-MM-DD
    ```

    If the `gh` CLI is missing or unauthenticated, stop after the push and report the branch and local file path; the PR is a required side effect, so done does not hold without it.
12. Confirm the done predicate and emit the Output report.

## Failure and recovery
- Stop before any mutation, reporting exactly what is missing, when: no report exists in any directory; `NOTION_API_KEY`, the Weekly WYNK parent page ID, or `SLACK_WEBHOOK_URL` is absent; `SLACK_WEBHOOK_URL` does not point at `hooks.slack.com`; the Notion authentication probe returns non-2xx; or the directory is not a git repository.
- HTTP 429 from Notion: honor `Retry-After` and retry the same request with exponential backoff.
- A Notion write fails mid-publish: keep every page already created; enumerate the created page IDs and the sections not yet populated; recover forward by re-issuing only the failed block-append requests. Never claim done while any section is unpopulated. Never archive or delete pages without the operator's explicit instruction (archiving is `PATCH /v1/pages/{page_id}` with `{"archived": true}`).
- The Slack post fails after Notion and the local copy succeeded: fix the cause and re-send only the Slack message; done does not hold until a 2xx response.
- The push or PR creation fails: report the branch, the local file path, and the failing command; done does not hold until the PR is open.
- Never swallow an error, never substitute placeholder content for missing evidence, and never report done while any of the four publish targets is unconfirmed.

## Output
A terminal classification with evidence. **Done** lists the Notion weekly page URL, the six child page URLs, the local file path, the Slack confirmation, and the PR URL, and states that Sections 1-5 passed the factual self-review and Section 6 is labeled agent-generated recommendations. **Partial** enumerates which of the four targets (Notion, local copy, Slack, PR) succeeded and exactly which step failed. **Blocked** states the missing prerequisite or failed check and that zero mutations or only the enumerated subset occurred.

## Provenance

Origin: `warpdotdev/competitive-intelligence-agent-oss`, `.warp/skills/weekly_wynk/SKILL.md`, pinned revision `9e0363e810a14405ef876fb354562735002797fb`; the Notion API and Slack webhook mechanics come from the same revision's `write_notion` and `post_to_slack` skills, which the source delegates to. License: MIT, notice retained; mechanism adapted. Adapted into this self-contained ODIN run-module skill: the delegated helper mechanics are inlined, the organization placeholders (`YOUR_NOTION_PARENT_PAGE_ID`, `YOUR_CONTINUOUS_PLANNING_PAGE_ID`, `YOUR_NOTION_DATA_SOURCE_ID`, `YOUR_ORG/YOUR_REPO`) became operator-supplied inputs, and no third-party expression is reproduced beyond the retained notice and adapted mechanism.
