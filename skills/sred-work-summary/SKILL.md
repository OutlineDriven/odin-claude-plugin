---
name: sred-work-summary
description: 'Use when the user explicitly asks to create a SRED work summary or gather a year of work. Creates one Notion document grouping PRs, Linear tickets, and docs by project. Don''t use for organizing projects into child pages (use sred-project-organizer) or local-only summaries.'
disable-model-invocation: true
---

# SRED work summary

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User explicitly asks to create a SRED work summary or gather a year of work |
| Authority | Human-only-external-or-irreversible: requires explicit invocation; Notion API credentials are used only after human previews the target page title and confirms the grouping structure before any write occurs |
| Side effect | Creates one Notion document via the Notion API; the document is the sole artifact and is remote |
| Done | Notion document confirmed created with all gathered links grouped into projects and no content truncation |

## Inputs

- **Required**: Notion API integration token and parent page ID (human provides or confirms)
- **Required**: GitHub token or confirmed PR list (human provides or confirms)
- **Required**: Linear API key (human provides or confirms)
- **Required**: Year or date range to gather (human specifies; default to current calendar year)
- **Optional**: Specific repositories to include or exclude (human specifies)

No input is invented. Missing or refused credentials stop the skill without partial action.

## Procedure

1. **Confirm scope with human**: Present the date range, sources (GitHub PRs, Linear tickets, Notion pages), and proposed grouping approach (project name → list of links). Obtain explicit confirmation before proceeding.
2. **Gather GitHub PRs**: Query GitHub for merged PRs in the specified repositories and date range. Extract PR title, URL, merged date, and repository.
3. **Gather Linear tickets**: Query Linear for completed issues assigned to the user or team in the specified date range. Extract title, URL, state, and project.
4. **Gather Notion pages**: Query Notion for pages created or updated in the specified date range within the known workspace. Extract title and URL.
5. **Group into projects**: Organize all items by inferred or specified project. Each project bucket holds PR links, ticket links, and doc links. Use PR titles and descriptions, Notion document content, and Linear ticket titles and descriptions for grouping.
6. **Preview grouping**: Present the grouped structure to the human. Confirm or adjust groupings before Notion write.
7. **Create Notion document**: Using the confirmed parent page ID and Notion integration token, create one new child page titled with the summary period (e.g., "SRED Work Summary — YYYY"). Populate with one section per project. Each project section contains a project name header, a summary line counting PRs, Notion docs, and Linear tickets, and subsections for each source type listing every item as a link with its date. Write all grouped items; do not truncate or abbreviate with phrases like "and N more".
8. **Confirm creation**: Retrieve the created page via Notion API to confirm it exists and contains all items.
9. **Return the document URL**: Present the Notion document URL to the user as the final report. The URL must be the actual Notion page link, not a placeholder.

## Failure and recovery
| Failure class | Behavior |
|---|---|
| Missing credentials | Stop before any network call. Return credential name that is absent or unconfirmed. |
| API error during gather | Stop gather for that source. Report what was gathered and what source failed. Do not proceed to Notion write. |
| Notion write partial or truncated | Treat as failure. Report the last successfully written project. Do not claim Done. |
| Notion write error | Stop. Report API error. Do not claim Done. |
| Human revokes confirmation mid-flow | Stop immediately. No rollback needed (Notion write has not occurred). |

Partial-result rule: if a gather source fails, the skill stops and reports; it does not proceed with partial data.

## Output
One Notion document URL, returned to the user as the final report. The document title matches the requested period. All gathered items are grouped into projects with zero truncation. No local file is produced.

## Provenance

- Origin: getsentry/skills (`skills/sred-work-summary/SKILL.md`)
- Revision: `c2f99a5b04b4cd992ec3022d7c2c3e23e938d241`
- License: Apache-2.0
- Adaptation: Clean-room adaptation of work-history gathering from GitHub, Linear, and Notion with remote Notion document creation as the sole output artifact. Human-only invocation because the skill performs remote bulk mutation (Notion doc creation) on behalf of the user.
