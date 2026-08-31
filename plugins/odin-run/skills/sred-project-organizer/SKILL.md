---
name: sred-project-organizer
description: 'Use when the user asks to classify a batch of projects against eligibility rules and generate an approval preview before creating hierarchical child documents. Reads a work summary, classifies each project as eligible or not against explicit criteria, presents a preview for human confirmation, then creates one child document per eligible project using a template. Not for writing the work summary itself.'
disable-model-invocation: true
---

# Project organizer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User asks to classify projects against eligibility rules and create hierarchical child documents from a work summary. |
| Authority | Read-only for classification and preview. Requires explicit human confirmation before creating any child document. |
| Side effect | Creates one child document per eligible project under the specified parent, using the provided template. |
| Done | Child documents created per eligible project and partial failures reported. |

## Inputs

- Work summary (required): a document that contains one or more project descriptions or entries.
- Project template (required): the page template to apply to each child project summary. May be embedded, referenced by ID, or provided inline.
- Target parent ID (required): the identifier of the parent document under which child pages are created.
- Eligibility criteria (required): explicit list of criteria used to classify a project as eligible. No defaults are applied; every criterion must be supplied.
- API credentials (required): valid credentials with create permissions on the target parent document.

## Procedure

1. Validate inputs. Confirm every required input is present and non-empty. Halt if any is missing. Done when: every required input is confirmed present, or a missing field is named.
2. Parse the work summary. Extract every project entry. Treat each entry as a candidate. Done when: every project entry is extracted, or zero projects found is reported.
3. Classify each project against the provided eligibility criteria as eligible or not. Produce a list of eligible projects with the matching criteria noted per project. Done when: the eligible list is produced, or zero eligible projects is reported.
4. Present the preview list to the human: every project with its eligibility classification and the criteria that matched or did not match. Wait for explicit human confirmation. Done when: the human confirms, or authority is withheld and the skill stops.
5. Upon confirmation, sequentially create one child document per eligible project under the target parent using the project template. Populate the template fields from the work summary entry. If any individual creation fails, record the failure by project name and continue with the remaining projects. Do not retry failed creations. Done when: every eligible project has a child document or a recorded failure.
6. Report completion. List every child document that was created successfully, every project that failed, and the total count. Done when: the report lists successes, failures, and totals.

## Failure and recovery

- Missing input: stop. Name the missing field. Do not proceed.
- Zero projects found in work summary: stop. Report zero projects. Create no documents.
- Zero eligible projects identified: stop. Report zero eligible. Create no documents.
- Human authority withheld: stop immediately. No API calls.
- Individual child document creation fails: record failure by project name. Continue remaining projects. Include failures in report.
- Partial result: if some documents succeed and others fail, report the successes and the failures. Do not claim done if any confirmed eligible project lacks a child document.
- Non-rollback: already-created documents are not deleted on failure.

## Output

A structured completion report: target parent ID and URL, table of child documents (project name, document ID, document URL, status of created or failed), counts of eligible projects, documents created, and documents failed. If zero documents were created, the report states the skill did not complete and names the blocking failure.
