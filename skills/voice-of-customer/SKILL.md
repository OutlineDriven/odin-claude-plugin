---
name: voice-of-customer
description: 'Synthesize customer call transcripts into a cited VoTC report'
disable-model-invocation: true
---

# Voice of customer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks for voice of the customer, VoTC analysis, customer call insights, or what customers are saying. |
| Authority | human-only-external-or-irreversible: require explicit human invocation. Preview the target and consequence before credentials, data-at-rest changes, paid actions, publishing, deployment, remote bulk mutation, or irreversible deletion. |
| Side effect | Runs fetch_grain_data.py and analyze_transcripts.py, then writes a VoTC report to reports/votc_insights/; creates a PR. |
| Done | Report contains customer pain points, competitive mentions, feature demand, success stories, and week-over-week changes with citations. |

## Inputs

- **GRAIN_API_TOKEN** (required): Grain API bearer token. Supplied as an environment variable. The skill halts if absent.
- **Date range** (optional): Start and end dates for transcript retrieval. Defaults to the trailing seven days when omitted.

## Procedure

1. Validate that `GRAIN_API_TOKEN` is set. If missing, halt and report the missing secret to the operator.
2. Run `fetch_grain_data.py` with the token and date range. The script calls the Grain API, retrieves call transcripts, and writes raw transcript files keyed by `participant_id` and call date.
3. If the fetch returns zero transcripts, halt and report "No transcripts found for the requested range" without creating an empty report.
4. Run `analyze_transcripts.py` over the fetched transcripts. The script extracts and categorizes: pain points, competitive mentions, feature demand, and success stories. It attributes every extracted item to a `participant_id` and call date.
5. Compute week-over-week deltas by comparing the current period against the prior period of equal length.
6. Assemble the report at `reports/votc_insights/votc_insights_YYYY-MM-DD.md` with sections: Pain Points, Competitive Mentions, Feature Demand, Success Stories, and Week-over-Week Changes. Every item carries a citation to `participant_id` and call date.
7. Commit the report and open a PR against the default branch.

## Failure and recovery
| Failure class | Behavior |
|---|---|
| Missing GRAIN_API_TOKEN | Halt before any network call. Report the missing secret. No partial artifact created. |
| Grain API authentication or network failure | Halt. Preserve any already-written raw transcript files. Report the API error with status code. |
| Zero transcripts returned | Halt after fetch. Report "No transcripts found for the requested range." No report file created. |
| Analysis script failure | Halt. Preserve raw transcripts. Report the analysis error. No report file created. |
| PR creation failure | Report is written locally. Report the git/PR error and the local path to the report. Operator creates the PR manually. |

Partial-result rule: never emit a report that omits a required section. If analysis produces data for only some categories, include those with explicit "No data found" entries for the missing categories and note the gap in the report header.

## Output
A markdown report at `reports/votc_insights/votc_insights_YYYY-MM-DD.md` containing:
- Pain Points with participant attribution and call dates
- Competitive Mentions with participant attribution and call dates
- Feature Demand with participant attribution and call dates
- Success Stories with participant attribution and call dates
- Week-over-Week Changes comparing current and prior periods

The report is committed and delivered as a PR against the default branch.

## Provenance

- Origin: warpdotdev/competitive-intelligence-agent-oss
- Pinned revision: 9e0363e810a14405ef876fb354562735002797fb
- License: MIT — MIT notice retained; mechanism adapted
- Source path: .warp/skills/votc_insights/SKILL.md
- Adaptation: Module remapped from odin-knowledge to odin-research. Two-stage fetch-and-analyze mechanism and participant_id attribution preserved. Grain token elevated to first-class required secret. Human-only invocation enforced for PR creation side effect.
