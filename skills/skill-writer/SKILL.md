---
name: skill-writer
description: 'Use when a user asks to create, write, update, improve, or maintain an agent skill, produce a complete, validated, registered skill with a concise runtime router, source coverage, and provenance. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Skill writer

## Contract

| Field | Bound contract |
|---|---|
| Trigger | user asks to create, write, update, improve, or maintain an agent skill |
| Authority | reversible-local: write only named local skill artifacts; rollback on validation failure |
| Side effect | creates or updates SKILL.md, SPEC.md, SOURCES.md, references, and registration |
| Done | registered, validated skill with concise runtime router, source coverage, and provenance |

## Inputs

Required: user request specifying the target skill name, purpose, trigger phrasing, and authority class. Optional: existing source files, candidate patterns, or layout preference. Trust-boundary validation: reject requests outside the agent-skill authoring domain before any file action.

## Procedure

1. Parse the user request to extract the target skill name, trigger phrasing, authority class, and scope.
2. Validate the skill name is non-empty and not already present with conflicting disposition.
3. Identify the required artifacts: SKILL.md, agents/openai.yaml, and as needed SPEC.md (skill specification), SOURCES.md (source coverage and provenance), references/ (deferred-load material), and skill registration.
4. Determine the layout variant: inline, reference-backed, argument-driven, asset-template, script-backed workflow, or subagent fork.
5. Search the local skill directory for candidate patterns matching the trigger class and authority level.
6. Apply the selected pattern to produce SKILL.md, agents/openai.yaml, and supporting artifacts: SPEC.md for the skill specification, SOURCES.md for source coverage and provenance, references/ for deferred-load material, and the registration entry.
7. Validate the produced files: SKILL.md parses as valid YAML frontmatter with name and description, and all required sections (Contract, Inputs, Procedure, Failure and recovery, Output, Provenance) are non-empty; openai.yaml contains display_name (2–6 words) and short_description (25–64 characters); SPEC.md and SOURCES.md are present and non-empty; references/ files (if any) have observable load conditions; registration is valid.
8. On validation failure: remove all produced files and report the specific failure.
9. Return the complete skill directory path, the registration status, and a summary of produced files.

## Failure and recovery
**not-this-skill**: the request does not match the trigger class. Return no artifact.
**missing-required**: required inputs are absent or malformed. Stop before mutation.
**validation-failure**: produced files fail validation checks. Rollback all writes, report the specific failure.
**scope-expansion**: request widens mid-execution. Stop and surface the widening before acting on it.

No partial-result rule applies. A failure always produces a classification, never a silently incomplete state.

## Output
A validated, registered skill directory containing: SKILL.md with frontmatter (name, description), Contract, Inputs, Procedure, Failure and recovery, Output, and Provenance sections; agents/openai.yaml with display_name and short_description; SPEC.md for the skill specification; SOURCES.md for source coverage and provenance; references/ for deferred-load material (if any); and a valid registration entry. The skill router is concise and unambiguous.

## Provenance

Origin: getsentry/skills. Revision: c2f99a5b04b4cd992ec3022d7c2c3e23e938d241. License: Apache-2.0. Adaptation: clean-room reimplementation for odin-agent module with remapped module path per Q49 (skills). Source accounting: single source path `skills/skill-writer/SKILL.md` adapted to ODIN 2.0 format; no third-party expression copied.
