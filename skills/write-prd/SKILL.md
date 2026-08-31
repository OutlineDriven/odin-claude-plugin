---
name: write-prd
description: 'Use when a user asks to write a PRD, create a product spec, or draft requirements for a feature. Produces a structured PRD covering scope, solution, and risks with evidence-driven citations. Don''t use for model-invoked or automated runs; requires explicit human invocation.'
disable-model-invocation: true
---

# Write PRD

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to write a PRD, create a product spec, or draft requirements for a feature. |
| Authority | Human-only: must be explicitly invoked. Credentials, paid actions, and remote publishing are previewed and confirmed before execution. |
| Side effect | Saves a PRD to reports/prds/; creates a GitHub PR; optionally exports to Google Docs, Notion, or Slack as separate user-initiated steps. |
| Done | A PRD file exists at reports/prds/prd_<feature_slug>_YYYY-MM-DD.md containing all seven required sections with content. |

## Inputs

| Input | Required |
|---|---|
| Feature name or description | Required |
| Target users | Optional |
| Constraints | Optional |
| Related URLs or docs | Optional |
| Priority level (P0/P1/P2) | Optional |

## Procedure

1. **Confirm scope.** Stop if no feature name or description is supplied. Ask only what is strictly necessary; do not widen scope.

2. **Gather context.** Read the following local sources when present and non-stale (≤7 days):

   - `reports/customer_feedback_summaries/`: user pain points and NPS data
   - `reports/competitor_changelog_reports/` or `reports/feature_research/`: competitive positioning
   - `reports/git_history_analysis/`: engineering work and priorities
   - `reports/weekly_product_briefings/`: recent briefings for the feature area

   If a source directory is absent or its content is stale (>7 days), note the absence and continue. Skip any source that returns an error.

3. **Cite every claim.** Every claim in the Problem Statement and Technical Considerations sections must carry a citation to a source: report filename, URL, or issue number. Unattributed claims must be tagged `[UNCITED]` and resolved or flagged in Open Questions.

4. **Draft the PRD.** Produce a document with all seven required sections. Follow this exact section order:

   ```
   # PRD: <Feature Name>
   **Author:** <agent + user>
   **Date:** <YYYY-MM-DD>
   **Status:** Draft
   **Priority:** <P0/P1/P2 or unset>

   ## TL;DR
   <1–2 sentence summary>

   ## Problem Statement
   <Evidence-driven description of the user problem. Cite sources inline.>

   ## Goals & Success Metrics
   <Goal 1> — Metric: <how to measure>
   <Goal 2> — Metric: <how to measure>
   Non-goals: <explicit exclusions>

   ## Target Users
   <Primary and secondary user segments>

   ## Scope
   In scope:
   - <capability>
   Out of scope:
   - <explicit exclusion>

   ## Proposed Solution
   Overview:
   <High-level description>
   Key User Flows:
   1. <Flow 1>
   2. <Flow 2>

   ## Technical Considerations
   <Dependencies, risks with mitigations, known constraints. Cite every claim.>

   ## Competitive Context
   <How competitors handle this. Cite competitive research sources.>

   ## Open Questions
   - [ ] <Question 1>
   - [ ] <Question 2>

   ## References
   <Linked sources>
   ```

5. **Save the PRD.** Derive the feature slug from the feature name (lowercase, hyphenated). Write the file to `reports/prds/prd_<feature_slug>_YYYY-MM-DD.md`. Create the directory if absent.

6. **Create a PR.** Stage and commit the PRD file; open a pull request against the tracked default branch. If VCS commands fail, report the error with the full path.

7. **Optional exports.** Google Docs, Notion, and Slack are separate user-initiated steps outside this skill's required path. Do not invoke them as part of the core workflow.

## Failure and recovery
| Failure class | Partial-result rule | Recovery |
|---|---|---|
| Feature name absent | No file written | Stop; ask for the feature name. |
| File write fails | No PRD on disk | Report the error with the path and root cause; PRD is lost. |
| PR creation fails | PRD file exists | Report the error; do not delete the PRD file. |
| Source read fails | Continue without that source | Note the absence; do not halt. |
| Stale data (>7 days) | Note staleness | Proceed; do not block. |
| Uncited claim | Flag with `[UNCITED]` | Resolve or move to Open Questions. |
| Missing required section | PRD is incomplete | Do not claim Done; report which section is absent. |

## Output
A Markdown file at `reports/prds/prd_<feature_slug>_YYYY-MM-DD.md` containing all seven required sections with content, plus an open pull request against the default branch. Google Docs, Notion, and Slack exports are outside the required path.

## Provenance

**Origin:** warpdotdev/competitive-intelligence-agent-oss
**Revision:** 9e0363e810a14405ef876fb354562735002797fb
**License:** MIT — MIT notice retained; mechanism adapted.
**Adaptation:** Optional external exports (Google Docs, Notion, Slack) moved outside the required path per Q47/Q51. Evidence-driven citation rule and open-questions section retained. Module remapped from odin-orchestration to odin-create. Human-only authority applied to all write operations.
