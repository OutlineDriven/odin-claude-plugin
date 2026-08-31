---
name: skill-writer
description: 'Use when a user asks to create, update, or maintain an agent skill. Produces a validated, registered skill with a concise router, source coverage, and provenance. Not for scrape-based builds — use skill-creator.'
---

# Skill writer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | user asks to create, write, update, improve, or maintain an agent skill |
| Authority | reversible-local: write only named local skill artifacts; rollback on validation failure |
| Side effect | creates or updates `SKILL.md`, `agents/openai.yaml`, `SPEC.md`, `SOURCES.md`, references, and registration |
| Done | registered, validated skill with concise runtime router, source coverage, and provenance |

## Inputs

Required: user request specifying the target skill name, purpose, trigger phrasing, and authority class. Optional: existing source files, candidate patterns, or layout preference. Trust-boundary validation: reject requests outside the agent-skill authoring domain before any file action.

## Procedure

1. Reject requests outside the agent-skill authoring domain. If the request does not match the trigger class, return no artifact. **Done when:** the request is in scope or declined with a classification.
2. Parse the user request to extract the target skill name, trigger phrasing, authority class, and scope. **Done when:** the required fields are recorded.
3. Validate the skill name is non-empty and not already present with conflicting disposition. **Done when:** the name is unique or a conflict is reported.
4. Identify the required artifacts: `SKILL.md`, `agents/openai.yaml`, and as needed `SPEC.md` (skill specification), `SOURCES.md` (source coverage and provenance), `references/` (deferred-load material), and skill registration. **Done when:** the artifact list is set.
5. Determine the layout variant: inline, reference-backed, argument-driven, asset-template, script-backed workflow, or subagent fork. **Done when:** the variant is selected with a rationale.
6. Search the local skill directory for candidate patterns matching the trigger class and authority level. **Done when:** matching patterns are listed.
7. Apply the selected pattern to produce `SKILL.md`, `agents/openai.yaml`, and supporting artifacts: `SPEC.md` for the skill specification, `SOURCES.md` for source coverage and provenance, `references/` for deferred-load material, and the registration entry. **Done when:** every required artifact is generated and references the correct fixed values.
8. Validate the produced files: `SKILL.md` parses as valid YAML frontmatter with `name` and `description`, and all required sections (Contract, Inputs, Procedure, Failure and recovery, Output, Provenance) are non-empty; `openai.yaml` contains `display_name` (2–6 words) and `short_description` (25–64 characters); `SPEC.md` and `SOURCES.md` are present and non-empty; references/ files (if any) have observable load conditions; registration is valid. **Done when:** all validation checks pass or a specific failure is reported.
9. On validation failure, remove all produced files and report the specific failure. **Done when:** the rollback is complete.
10. Return the complete skill directory path, the registration status, and a summary of produced files. **Done when:** the summary is returned to the user.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| not-this-skill | The request does not match the trigger class. Return no artifact. |
| missing-required | Required inputs are absent or malformed. Stop before mutation. |
| validation-failure | Produced files fail validation checks. Rollback all writes, report the specific failure. |
| scope-expansion | Request widens mid-execution. Stop and surface the widening before acting on it. |

No partial-result rule applies. A failure always produces a classification, never a silently incomplete state.

## Output

A validated, registered skill directory containing `SKILL.md` with frontmatter, Contract, Inputs, Procedure, Failure and recovery, Output, and Provenance sections; `agents/openai.yaml` with `display_name` and `short_description`; `SPEC.md` for the skill specification; `SOURCES.md` for source coverage and provenance; `references/` for deferred-load material (if any); and a valid registration entry.
