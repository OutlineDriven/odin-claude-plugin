---
name: voice-of-customer
description: 'Use when the user asks for voice of the customer, VoTC analysis, or customer call insights. Synthesizes Grain call transcripts into a cited report with pain points, competitive mentions, and feature demand. Don''t use for ad-hoc summaries or non-VoTC formats.'
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

1. Validate that `GRAIN_API_TOKEN` is set. Done when: token is confirmed present, or the step has halted and reported the missing secret.
2. Run `fetch_grain_data.py` with the token and date range. The script calls the Grain API, retrieves call transcripts, and writes raw transcript files keyed by `participant_id` and call date. Done when: raw transcript files are written, or the step has halted on API failure.
3. If the fetch returns zero transcripts, halt and report "No transcripts found for the requested range" without creating an empty report. Done when: zero-transcript condition is detected and reported.
4. Run `analyze_transcripts.py` over the fetched transcripts. The script extracts and categorizes pain points, competitive mentions, feature demand, and success stories, attributing every item to a `participant_id` and call date. Done when: analysis output is produced, or the step has halted on analysis failure.
5. Compute week-over-week deltas by comparing the current period against the prior period of equal length. Done when: deltas are computed.
6. Assemble the report at `reports/votc_insights/votc_insights_YYYY-MM-DD.md` with sections: Pain Points, Competitive Mentions, Feature Demand, Success Stories, and Week-over-Week Changes. Every item carries a citation to `participant_id` and call date. Done when: report file is written with all five sections.
7. Commit the report and open a PR against the default branch. Done when: PR is open, or the step has reported the git/PR error and the local report path.

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
A markdown report at `reports/votc_insights/votc_insights_YYYY-MM-DD.md` with sections in order: Pain Points, Competitive Mentions, Feature Demand, Success Stories, Week-over-Week Changes — each item cited to `participant_id` and call date — committed and delivered as a PR.

## Provenance

- Origin: warpdotdev/competitive-intelligence-agent-oss
- Pinned revision: 9e0363e810a14405ef876fb354562735002797fb
- License: MIT — MIT notice retained; mechanism adapted
- Source path: .warp/skills/votc_insights/SKILL.md
- Adaptation: Module remapped from odin-knowledge to odin-research. Two-stage fetch-and-analyze mechanism and participant_id attribution preserved. Grain token elevated to first-class required secret. Human-only invocation enforced for PR creation side effect.
