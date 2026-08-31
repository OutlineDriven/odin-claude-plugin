---
name: sred-project-organizer
description: 'Use when the user asks to organize SRED projects or prepare a SRED submission. Creates one Notion child doc per SREDable project found in a work summary. Don''t use for writing the work summary itself (use sred-work-summary), local-only organization, or non-Notion targets.'
disable-model-invocation: true
---

# SRED project organizer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to organize SRED projects or prepare SRED submission |
| Authority | Human-only: external irreversible mutation: remote Notion bulk doc creation requires human authority and confirmation before any API call fires |
| Side effect | Creates one Notion child doc per SREDable project found in the Work Summary; all mutations target the Notion API and the specified parent page only |
| Done | SRED Project Descriptions Notion doc exists as a confirmed page, and every SREDable project named in the Work Summary has a child summary page that follows the project template |

## Inputs

Required:
- **Work Summary**: A document (Notion page, text, or structured summary) that contains one or more project descriptions or entries.
- **Notion parent page ID**: The Notion page ID of the SRED Project Descriptions parent document into which child project pages are created.
- **Project template**: The page template to apply to each child project summary (may be embedded, referenced by ID, or provided inline).
- **Notion API integration token**: A valid integration token with insert permissions on the target parent page.

Optional:
- **SRED eligibility criteria**: Explicit list of criteria used to classify a project as SREDable; if absent, apply the default SRED eligibility rules stated in the reference material.

## Procedure

1. **Validate inputs at trust boundary.** Confirm every required input is present and non-empty. Confirm the Notion API integration token is present. If any required input is absent, stop and report the missing field by name; do not proceed.
2. **Parse the Work Summary.** Extract every project entry. Treat each entry as a candidate. If the Work Summary contains no project entries, stop and report that zero projects were found; do not fabricate projects.
3. **Classify each project as SREDable or not.** Apply the SRED eligibility criteria to each parsed project. Produce a list of confirmed SREDable projects. If the list is empty, stop and report that no SREDable projects were identified; do not create any Notion pages.
4. **Confirm human authority before mutation.** Present the list of projects that will be created as Notion child docs. Wait for explicit human confirmation. If confirmation is withheld or the human rejects any project, stop without creating any pages.
5. **Create the parent Notion page if absent.** Check whether the SRED Project Descriptions Notion doc exists at the specified parent page ID. If it does not exist, create it. If creation fails, stop and report the failure; do not proceed.
6. **Create one child Notion page per SREDable project.** For each confirmed SREDable project, create a child page under the parent using the project template. Populate the template fields from the Work Summary entry. If any individual page creation fails, record the failure by project name and continue with the remaining projects. Do not retry failed pages.
7. **Report completion.** List every child page that was created successfully, every project that was skipped or failed, and the total count. If all projects failed, report the failure and state that no Notion doc was created.

## Failure and recovery
| Failure class | Rule |
|---|---|
| Missing required input | Stop; name the missing field; do not proceed |
| Zero projects found in Work Summary | Stop; report zero projects; create no pages |
| Zero SREDable projects identified | Stop; report zero SREDable; create no pages |
| Human authority withheld | Stop immediately; no API calls |
| Parent Notion doc creation fails | Stop; do not create child pages |
| Individual child page creation fails | Record failure by project name; continue remaining projects; include failures in report |

Partial-result rule: If some child pages succeed and others fail, report the successes and the failures. The done predicate does not hold if any confirmed SREDable project lacks a child page. Do not claim the skill is done if failures exist.

Non-rollback rule: Already-created Notion pages are not deleted on failure.

## Output
A structured completion report containing:
- The Notion parent page ID and its URL.
- A table of child pages: project name, child page ID, child page URL, and status (created / failed).
- Count of SREDable projects, pages created, and pages failed.
- If zero pages were created, the report states the skill did not complete and names the blocking failure.

## Provenance

Origin: `getsentry/skills` (Apache-2.0)
Revision: `c2f99a5b04b4cd992ec3022d7c2c3e23e938d241`
License: Apache-2.0
Paths: `skills/sred-project-organizer/SKILL.md`

Adaptation statement: Knowledge-gathering and remote Notion bulk doc creation procedure distilled from the upstream skill. Human-only authority enforced per authority classification. Module remapped from `odin-research-advanced` to `odin-run` because the substance is document creation and delivery execution, not research and analysis. SRED eligibility classification and Notion API integration steps made explicit. Remote bulk mutation guard made a mandatory human-confirmation step before any API call fires. Clean-room adaptation: procedure reconstructed from the upstream contract; no third-party expression copied.
