---
name: sred-project-organizer
description: 'Use when the user asks to organize SRED projects or prepare a SRED submission. Creates one Notion child doc per SREDable project found in a work summary. Not for writing the work summary itself — use sred-work-summary. Not for local-only organization or non-Notion targets.'
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
- **Work Summary**: a document (Notion page, text, or structured summary) that contains one or more project descriptions or entries.
- **Notion parent page ID**: the Notion page ID of the SRED Project Descriptions parent document into which child project pages are created.
- **Project template**: the page template to apply to each child project summary (may be embedded, referenced by ID, or provided inline).
- **Notion API integration token**: a valid integration token with insert permissions on the target parent page.

Optional:
- **SRED eligibility criteria**: explicit list of criteria used to classify a project as SREDable; if absent, apply the default SRED eligibility rules stated in the reference material.

## Refusal

- Missing required input: stop; name the missing field; do not proceed.
- Zero projects found in Work Summary: stop; report zero projects; create no pages.
- Zero SREDable projects identified: stop; report zero SREDable; create no pages.
- Human authority withheld: stop immediately; no API calls.
- Parent Notion doc creation fails: stop; do not create child pages.

## Procedure

1. **Validate inputs at trust boundary.** Confirm every required input is present and non-empty. Confirm the Notion API integration token is present. Done when: every required input is confirmed present, or a missing field is named.
2. **Parse the Work Summary.** Extract every project entry. Treat each entry as a candidate. Done when: every project entry is extracted, or zero projects found is reported.
3. **Classify each project as SREDable or not.** Apply the SRED eligibility criteria to each parsed project. Produce a list of confirmed SREDable projects. Done when: the SREDable list is produced, or zero SREDable is reported.
4. **Confirm human authority before mutation.** Present the list of projects that will be created as Notion child docs. Wait for explicit human confirmation. Done when: the human confirms, or authority is withheld and the skill stops.
5. **Create the parent Notion page if absent.** Check whether the SRED Project Descriptions Notion doc exists at the specified parent page ID. If it does not exist, create it. Done when: the parent doc exists or creation failure is reported.
6. **Create one child Notion page per SREDable project.** For each confirmed SREDable project, create a child page under the parent using the project template. Populate the template fields from the Work Summary entry. If any individual page creation fails, record the failure by project name and continue with the remaining projects. Do not retry failed pages. Done when: every SREDable project has a child page or a recorded failure.
7. **Report completion.** List every child page that was created successfully, every project that was skipped or failed, and the total count. If all projects failed, report the failure and state that no Notion doc was created. Done when: the report lists successes, failures, and totals.

## Failure modes

- Individual child page creation fails: record failure by project name; continue remaining projects; include failures in report.
- Partial result: if some child pages succeed and others fail, report the successes and the failures. The done predicate does not hold if any confirmed SREDable project lacks a child page. Do not claim the skill is done if failures exist.
- Non-rollback: already-created Notion pages are not deleted on failure.

## Output

A structured completion report: Notion parent page ID and URL, table of child pages (project name, child page ID, child page URL, status of created/failed), counts of SREDable projects, pages created, and pages failed. If zero pages were created, the report states the skill did not complete and names the blocking failure.

## Provenance

Origin: `getsentry/skills` (Apache-2.0)
Revision: `c2f99a5b04b4cd992ec3022d7c2c3e23e938d241`
License: Apache-2.0
Paths: `skills/sred-project-organizer/SKILL.md`

Adaptation statement: Knowledge-gathering and remote Notion bulk doc creation procedure distilled from the upstream skill. Human-only authority enforced per authority classification. Module remapped from `odin-research-advanced` to `odin-run` because the substance is document creation and delivery execution, not research and analysis. SRED eligibility classification and Notion API integration steps made explicit. Remote bulk mutation guard made a mandatory human-confirmation step before any API call fires. Clean-room adaptation: procedure reconstructed from the upstream contract; no third-party expression copied.
