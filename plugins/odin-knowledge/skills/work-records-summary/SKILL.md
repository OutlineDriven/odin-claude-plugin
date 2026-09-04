---
name: work-records-summary
description: 'Use when the user asks to discover, group, and summarize work records across multiple systems for a given period or project. Not for organizing projects into child documents or local-only summaries.'
disable-model-invocation: true
---

# Work records summary

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to discover, group, and summarize work records across multiple systems for a given period or project. |
| Authority | Remote: creates one summary document via the target system API; requires explicit human invocation, and human review of the draft precedes publishing. |
| Side effect | Creates one summary document via the target system API after human review of the draft. |
| Done | A published summary document with grouped cross-source records and no content truncation. |

## Inputs

- Date range (required): the period to gather records for.
- Source system credentials and API keys (required): credentials for each configured source system. Missing or refused credentials stop the skill without partial action.
- Grouping approach (required): how records are organized: by project, by team, by area, or another explicit scheme.
- Target document parent ID (required): the identifier of the parent document under which the summary is created.
- Target system API credentials (required): valid credentials with create permissions on the target parent.
- Specific repositories or sources to include or exclude (optional): human specifies.

## Procedure

1. Confirm the date range and system access. Present the date range, configured sources, and proposed grouping approach. Obtain explicit confirmation before proceeding. Done when: the human confirms the scope.
2. Retrieve records from each configured source system. Query each source for records in the specified date range. Extract title, URL, date, and project or area metadata. If a source fails, stop gather for that source and report what was gathered and what source failed. Done when: records are gathered from each source, or the failed source is reported.
3. Group records logically based on the provided grouping approach. Each group holds the records assigned to it. Use record titles, descriptions, and metadata for grouping. Generate the draft summary with one section per group. Write all records; do not truncate or abbreviate. Done when: every record is assigned to a group and the draft is generated.
4. Present the draft to the human for correction. Wait for explicit confirmation or adjustments. Done when: the human confirms the draft.
5. Publish the final summary. Using the confirmed target parent ID and credentials, create the summary document with one section per group. Each group section contains a group name header, a summary line counting records per source, and subsections listing every record as a link with its date. Done when: the summary document is created with all records.
6. Confirm creation and return the document URL. Done when: the document URL is returned.

## Failure and recovery

- Missing credentials: stop before any network call. Return the credential name that is absent or unconfirmed.
- Source API failure during gather: stop gather for that source. Report what was gathered and what source failed. Do not proceed to publish with partial data.
- Empty results: stop. Report zero records. Do not fabricate content.
- Publish partial or truncated: treat as failure. Report the last successfully written group. Do not claim done.
- Human revokes confirmation mid-flow: stop immediately. No rollback needed if the write has not occurred.

## Output

One summary document URL returned to the user. The document title matches the requested period. All gathered records are grouped per the supplied approach with zero truncation. No local file is produced.