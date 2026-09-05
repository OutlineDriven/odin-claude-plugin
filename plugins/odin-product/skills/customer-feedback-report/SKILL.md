---
name: customer-feedback-report
description: 'Use when customer feedback, NPS, churn, email feedback, call transcripts, or voice-of-the-customer analysis needs a report over a time window.'
disable-model-invocation: true
---

# Customer feedback report

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks for customer feedback analysis, weekly summary, trending issues, NPS, churn, email feedback, voice of the customer, VoTC analysis, customer call insights, or what customers are saying over a window. |
| Authority | Remote: reads customer data via credentials, saves a report, and creates a PR; requires explicit human invocation. Preview the exact account/team scope, time windows, enabled sources, credential use, output path, publication consequence, and PR consequence. Obtain explicit human authorization before using credentials, before publishing the report, and before creating the PR. |
| Side effect | Run the analysis mechanism inline, save one markdown report under `reports/customer_feedback_summaries/`, then create a PR. The named mechanism is a behavior contract, not a dependency on an external script. |
| Done | The saved report contains themes, exact counts, an equal-length week-over-week comparison, cited GitHub issue links, verbatim customer quotes, and (when call transcripts are enabled) pain points, competitive mentions, feature demand, and success stories, and the authorized PR contains that report. |
| Invocation | Human-only. Never invoke from model inference or another skill. |

## Inputs

Collect from the invoking human before any credential use:

- The current analysis window, with explicit start, end, and timezone. Derive the comparison window as the immediately preceding interval of equal duration.
- A concrete account/team scope. For GitHub, include the allowed organization and repositories or team-owned repository set. For Gmail, NPS, churn, and call transcripts, include the account, workspace, tenant, team, cohort, or equivalent source-native restriction. Reject `all`, `*`, an unbounded mailbox, or any other wildcard scope.
- The enabled subset of GitHub issues, Gmail feedback, NPS responses, churn records, and call transcripts.
- Human-supplied credentials or already-configured read access for each enabled source. Never invent placeholder credentials, print secrets, or persist credentials in the report.
- The repository and base branch for the report PR, plus any requested report date or title convention.

Before proceeding, show the resolved values and explain that the run will read customer data, write the report, and, after a separate authorization gate, open a PR.

## Procedure

1. Authorize access. Require an explicit human response authorizing the displayed source scope and credential use. If the response changes any scope, source, window, or target, display the revised preview and obtain authorization again. Do not write a report or create a PR at this stage. Done when: human authorization is obtained for the displayed scope and credentials, or re-obtained after a scope change.

2. Resolve the two windows. Interpret the current interval in the supplied timezone and compute the immediately preceding equal-duration interval. Use the same boundary convention for both windows. Record both intervals in the report so every count has an auditable denominator. Done when: both windows are computed with equal duration and the same boundary convention.

3. Fetch each enabled source inline and read-only. Use an available authenticated integration or source-native read/query tool; do not call a repository script or assume a particular provider API.
   - GitHub issues: restrict every query to the authorized organization and repository/team set and to records created or updated in either window. Collect issue title/body, relevant customer-authored comments, timestamps, state, labels, stable issue number, and canonical issue URL. Exclude records outside the allowed repositories even if search returns them.
   - Gmail feedback: restrict the authenticated mailbox query by both windows and the authorized label, sender/recipient, account, team, or equivalent mailbox constraint. Collect only messages that satisfy that scope, retaining message/thread ID, timestamp, subject, feedback text, and a stable link when the integration exposes one. Do not search the whole mailbox.
   - NPS: restrict the survey/export/query by the authorized account/team/cohort and both windows. Collect response ID, timestamp, score, verbatim response text, and an accessible source link or stable source identifier.
   - Churn: restrict the warehouse/export/query by the authorized account/team/cohort and both windows. Collect event or customer-record ID, effective timestamp, reason text, relevant status metadata, and an accessible source link or stable source identifier. Read only; do not update customer records.
   - Call transcripts: restrict the transcript retrieval by the authorized account/team/cohort and both windows. Collect transcript ID, participant ID, call date, full transcript text, and a stable source link when the integration exposes one. Read only; do not modify call records.
   If a source integration is unavailable or access is denied, record that source as unavailable rather than replacing it with an unscoped search.

   Done when: every enabled source is fetched read-only within scope, or recorded as unavailable.

4. Normalize and deduplicate inline. Represent every fetched item with `source`, stable source ID, timestamp, scoped account/team, feedback text, canonical link when available, and source-specific score/state metadata. Deduplicate only identical source IDs; never collapse distinct customers merely because their text is similar. Preserve the original text separately from any summary so quotes remain verbatim. Done when: every fetched item is normalized with stable ID and original text preserved.

5. Apply the analysis mechanism inline. Analyze the combined current and comparison records without invoking any absent helper file:
   - Derive a single theme codebook from both windows together, naming each theme in concrete customer language and defining its inclusion rule.
   - Assign each record one primary theme for mutually intelligible totals; list secondary themes separately if they materially help interpretation and state that secondary counts overlap.
   - Count records by source and primary theme for each window. Show the denominator, current count, previous count, absolute change, and percentage change; use `n/a` rather than division by zero when the previous count is zero.
   - Distinguish NPS score bands and churn events from free-text sentiment while allowing their verbatim reasons to inform themes.
   - When call transcripts are enabled, extract and categorize pain points, competitive mentions, feature demand, and success stories from the transcript text. Attribute every item to its transcript ID, participant ID, and call date.
   - Select representative quotes by stable source ID. Copy each quoted span exactly, preserve meaningful punctuation, and never manufacture or silently clean up wording. Redact secrets and unnecessary personal data without changing the remaining words; mark any redaction.
   - Tie every GitHub-derived claim and quote to its canonical issue link. For call transcripts and other private sources, cite the stable source ID and include an accessible link only when the authorized integration provides one.
   - Explain material week-over-week movement from observed evidence only. Label interpretations that are not directly stated by customers as inferences.

   Done when: themes, counts, quotes, citations, and (when enabled) pain points, competitive mentions, feature demand, and success stories are produced inline with every claim tied to a source.

6. Render a complete in-memory report before writing. Use this order: title and windows; scope and source coverage; executive summary; theme table and counts; week-over-week comparison; findings by theme; pain points, competitive mentions, feature demand, and success stories (when call transcripts are enabled); verbatim quotes with citations; source notes and limitations. Include zero-result and unavailable-source accounting. Validate that every number can be recomputed from the normalized records, every quote is an exact substring of its source text after marked redactions, and every GitHub citation is a canonical issue link. Done when: the in-memory report passes all validation checks in the stated section order.

7. Authorize publication. Preview the exact report path, a concise summary of the report, and the fact that the next action writes the file. Obtain explicit human authorization before saving it. Save only under `reports/customer_feedback_summaries/` using the requested convention or, when none was supplied, `feedback_analysis_<current-window-end-date>.md`. Done when: the report is saved under `reports/customer_feedback_summaries/` after human authorization.

8. Authorize and create the PR. Preview the repository, base branch, changed report path, PR title, and remote consequence. Obtain explicit human authorization specifically covering PR creation unless the latest authorization explicitly covered both the displayed report publication and this displayed PR. Create the PR with only the report change and return its URL. Done when: the PR is created with only the report change and its URL is returned.

## Failure and recovery

- Missing or wildcard scope: stop before credential use. Name the missing source-native restriction and ask the human for a concrete account/team scope; never broaden the query to recover.
- Missing credentials or authorization: stop before accessing that source. Report which source is blocked without exposing credential values. Continue only if the human supplies or authorizes valid read access.
- Empty source: retain a zero count for that enabled source and window. Do not infer missing records or generate substitute feedback.
- Unavailable or denied source: mark it unavailable with the observed reason and exclude it from cross-source totals; do not claim complete coverage.
- Malformed, duplicate, or boundary-ambiguous records: quarantine them from counts, list the exclusion rule and number excluded, and recompute both windows with the same rule.
- Zero call transcripts returned for the requested range: report "No transcripts found for the requested range" for that source and continue with other enabled sources; do not create empty transcript sections.
- Inline synthesis cannot satisfy the report contract: do not write the report or open a PR. Recheck normalization, theme assignment, arithmetic, quote-to-source matching, and links from the collected records; discard any incomplete rendered report if the defect cannot be repaired.
- Publication or PR authorization withheld: return the complete preview as an unpublished result and identify the withheld action. Never write or create the PR without the corresponding human authorization.
- Write or PR creation fails: preserve the already authorized, successfully completed state, report the exact failure, and retry only the failed operation after confirming that its target is unchanged. Never claim done without both the saved report and PR URL.

## Output

The saved report path under `reports/customer_feedback_summaries/`, the PR URL, and a coverage statement naming included, empty, unavailable, and excluded sources; the report contains themes, counts, week-over-week comparison, cited issue links, verbatim quotes, and (when call transcripts are enabled) pain points, competitive mentions, feature demand, and success stories in the section order from step 6.
