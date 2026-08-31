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

1. Run `REPO_ROOT=$(git rev-parse --show-toplevel)`. If it fails, stop: the directory is not a git repository and the PR step cannot run. Use `$REPO_ROOT/reports/...` for every report path in every later step. Done when: repo root is located, or the step has stopped.
2. Discover the most recent report per directory. Sort by filename, never by filesystem modification time: filenames carry `YYYY-MM-DD` dates and mtimes are unreliable in freshly cloned repositories:

   ```bash
   ls "$REPO_ROOT/reports/customer_feedback_summaries/"*.md 2>/dev/null | sort | tail -1
   ls "$REPO_ROOT/reports/votc_insights/"*.md 2>/dev/null | sort | tail -1
   ls "$REPO_ROOT/reports/git_history_analysis/"*.md 2>/dev/null | sort | tail -1
   ls "$REPO_ROOT/reports/competitor_changelog_reports/"*.md 2>/dev/null | sort | tail -1
   ls "$REPO_ROOT/reports/weekly_sentiment_analysis/"*.md 2>/dev/null | sort | tail -1
   ls "$REPO_ROOT/reports/weekly_wynk/"*.md 2>/dev/null | sort | tail -1
   ```

   The last command finds the previous WYNK. If no report exists in any directory, stop and tell the operator; do not fabricate content. Done when: most recent report per directory is discovered, or the step has stopped on no reports.

3. Read the most recent file from each directory found in step 2, plus the previous WYNK when it exists, to track trends and follow up on prior recommendations. Done when: all discovered reports are read.
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

   Replace the data source ID and both status values with the operator's configuration. If `has_more` is true, repeat the request with `start_cursor` until it is false. Extract each item's title, status, functional area, category, and target ship date; this feeds the strategic frame and the Section 3 alignment. Retrieve the planning page's north star metrics with `GET /v1/blocks/{PLANNING_PAGE_ID}/children?page_size=100`. Done when: planning items and north star metrics are fetched, or the step is skipped because planning inputs are absent.

5. Synthesize the six sections following the per-section content rules in `references/section-specs.md`. Be matter-of-fact and evidence-driven; cite specific issue numbers, customer names, commit counts, and competitor names. Done when: all six sections are synthesized per the section specs.
6. Self-review every section using the checklist in `references/section-specs.md` and fix all violations before any write. Done when: all self-review checklist items pass.
7. Before the first mutation, verify authentication and preview the targets:

   ```bash
   curl -s "https://api.notion.com/v1/users/me" \
     -H "Authorization: Bearer $NOTION_API_KEY" \
     -H "Notion-Version: 2025-09-03" | jq
   ```

   A non-2xx response blocks with zero mutations. Present the operator the WYNK date, the parent page the weekly page will be created under, the six child sections, the local file path, the Slack webhook target, and the PR branch. Proceed only on the operator's explicit go-ahead. Done when: authentication is verified and operator go-ahead is received, or the step has stopped on non-2xx or withheld approval.

8. Publish to Notion. Write each request payload to a JSON file, send it with `curl -d @file`, and check every response before the next call. Create the weekly parent page (empty container, icon `📋`, title `WYNK — Week of YYYY-MM-DD`), then six empty child pages under it in order (📊 Executive Summary, 💬 Customer Feedback, 🔧 Engineering Investments, 🏁 Competitive Landscape, ❓ Open Questions, 💡 Recommendations (Beta)), capturing each returned `id`. Then populate each section by appending content as children blocks via `PATCH /v1/blocks/{SECTION_PAGE_ID}/children`. Convert markdown to Notion blocks (`heading_1`, `heading_2`, `heading_3`, `paragraph`, `bulleted_list_item`, `numbered_list_item`, `code`, `quote`, `divider`). Keep each `rich_text` element within 2000 characters and each request within 100 blocks; send the remainder in further requests. Retain mention page links and issue hyperlinks inside the rich text. Done when: all six sections are populated in Notion with the weekly page URL collected.

9. Save the local copy to `$REPO_ROOT/reports/weekly_wynk/wynk_YYYY-MM-DD.md`, combining all six sections with `---` separators and a header with the Notion page link. Done when: local copy is written.
10. Post to Slack. Refuse any webhook URL whose host is not `hooks.slack.com`. Write `{"text": "<Executive Summary and the Notion weekly page link>"}` to a JSON file and send it:

    ```bash
    curl -s --fail-with-body -w '\nHTTP %{http_code}\n' -X POST -H "Content-type: application/json" --data @/tmp/wynk_slack.json "$SLACK_WEBHOOK_URL"
    ```

    `--fail-with-body` makes the command exit non-zero on any 4xx/5xx while still printing the response body; only a 2xx with a zero curl exit confirms the post. Done when: Slack post is confirmed with a 2xx status and a zero curl exit, or the step has stopped on a 4xx/5xx failure.

11. Open the PR containing the new report file and nothing else:

    ```bash
    git checkout -b reports/wynk-YYYY-MM-DD
    git add "$REPO_ROOT/reports/weekly_wynk/wynk_YYYY-MM-DD.md"
    git commit -m "Add WYNK report for YYYY-MM-DD"
    git push -u origin reports/wynk-YYYY-MM-DD
    gh pr create --title "WYNK — Week of YYYY-MM-DD" --body "Adds reports/weekly_wynk/wynk_YYYY-MM-DD.md with the Notion weekly page link." --head reports/wynk-YYYY-MM-DD
    ```

    If the `gh` CLI is missing or unauthenticated, stop after the push and report the branch and local file path; the PR is a required side effect, so done does not hold without it. Done when: PR is open, or the step has stopped on missing gh.

12. Confirm the done predicate and emit the output report. Done when: output report is emitted with all four targets confirmed.

## Failure and recovery
- Stop before any mutation, reporting exactly what is missing, when: no report exists in any directory; `NOTION_API_KEY`, the Weekly WYNK parent page ID, or `SLACK_WEBHOOK_URL` is absent; `SLACK_WEBHOOK_URL` does not point at `hooks.slack.com`; the Notion authentication probe returns non-2xx; or the directory is not a git repository.
- HTTP 429 from Notion: honor `Retry-After` and retry the same request with exponential backoff.
- A Notion write fails mid-publish: keep every page already created; enumerate the created page IDs and the sections not yet populated; recover forward by re-issuing only the failed block-append requests. Never claim done while any section is unpopulated. Never archive or delete pages without the operator's explicit instruction (archiving is `PATCH /v1/pages/{page_id}` with `{"archived": true}`).
- The Slack post fails after Notion and the local copy succeeded: fix the cause and re-send only the Slack message; done does not hold until a 2xx response with a zero `curl` exit (`--fail-with-body` exits non-zero on 4xx/5xx).
- Never swallow an error, never substitute placeholder content for missing evidence, and never report done while any of the four publish targets is unconfirmed.

## Output
A terminal classification: Done (Notion weekly page URL, six child page URLs, local file path, Slack confirmation, PR URL — Sections 1-5 passed factual self-review, Section 6 labeled agent-generated recommendations), Partial (which of the four targets succeeded and which step failed), or Blocked (missing prerequisite or failed check, with mutation status).

## Provenance

Origin: `warpdotdev/competitive-intelligence-agent-oss`, `.warp/skills/weekly_wynk/SKILL.md`, pinned revision `9e0363e810a14405ef876fb354562735002797fb`; the Notion API and Slack webhook mechanics come from the same revision's `write_notion` and `post_to_slack` skills, which the source delegates to. License: MIT, notice retained; mechanism adapted. Adapted into this self-contained ODIN run-module skill: the delegated helper mechanics are inlined, the organization placeholders (`YOUR_NOTION_PARENT_PAGE_ID`, `YOUR_CONTINUOUS_PLANNING_PAGE_ID`, `YOUR_NOTION_DATA_SOURCE_ID`, `YOUR_ORG/YOUR_REPO`) became operator-supplied inputs, and no third-party expression is reproduced beyond the retained notice and adapted mechanism.
