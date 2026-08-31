---
name: skill-plan-first-builder
description: 'Use when a user requests a Skill from an approved analysis. Builds a SKILL.md whose body follows the approved plan verbatim with all fixed values resolved via token substitution. Not for scrape-based creation — use skill-creator; not for general authoring — use skill-writer.'
---

# Skill plan first builder

## Contract

| Field | Bound contract |
|---|---|
| Trigger | user requests a Skill from an approved analysis |
| Authority | reversible-local: write only named local artifacts; rollback by deleting the written file |
| Side effect | writes SKILL.md into the target agent skills folder or an export dir; agent writes only the markdown body and references each fixed value by token |
| Done | built skill whose body follows the approved plan verbatim and whose values resolve via renderSkillMarkdown token substitution, no stale or unknown tokens |

## Inputs

1. **Approved analysis** (required): the analysis document containing the approved skill plan with typed sections and `{{id}}` value tokens.
2. **Target directory** (optional): the skills folder or export directory where the SKILL.md will be written. Defaults to the current agent skills folder.

## Procedure

1. Read the approved analysis and extract the skill definition: slug, trigger predicate, authority class, side-effect target, and done predicate. **Done when:** the skill definition is extracted and recorded.
2. Identify every `{{id}}` value token in the plan body. Each token must reference a catalogue entry with a known resolution. **Done when:** all tokens are inventoried and each has a catalogue key.
3. Validate each token against the catalogue. **Done when:** all tokens resolve to known values, or the full list of unresolved tokens is reported and no file is written.
4. Build the SKILL.md frontmatter from the extracted slug and trigger predicate. **Done when:** the frontmatter is valid YAML with the correct `name` and `description`.
5. Render the markdown body by substituting each `{{id}}` token with its catalogue-resolved value, preserving all non-token text verbatim from the approved plan. **Done when:** the rendered body matches the approved plan exactly, with every token replaced.
6. Write the completed SKILL.md to the target directory, or to the default agent skills folder if none is specified. **Done when:** the file is written and its contents match the rendered body.

## Failure and recovery

| Failure class | Behavior |
|---|---|
| Missing or malformed analysis | Stop. Report the defect. Do not write any file. |
| Unknown or stale token | Stop. Report the full list of unresolved tokens. Do not write any file. |
| Rendered body deviates from plan | Stop. Discard the rendered output. Report the divergence. Do not write any file. |
| Target directory unwritable | Stop. Report the filesystem error. Do not write any file. |

Partial-result rule: no partial file is ever written. Rollback rule: if the file was written before a late validation failure, delete it. Blocked result: no SKILL.md artifact exists.

## Output

A complete SKILL.md file whose body follows the approved plan verbatim, with all `{{id}}` tokens resolved to their catalogue values. No stale tokens, no unknown tokens, no deviations from the approved plan.

## Provenance

Adapted from Microsoft skill-recorder (https://github.com/microsoft/skill-recorder), revision c7f2fe4402527a0eb7f4fc1b653bf438229bac61. Source paths: electron/skillbuilder/instructions.ts, electron/skillbuilder/builder.ts, electron/skillbuilder/tools.ts, common/skill.ts, common/values.ts, electron/builders/read-tools.ts. License: MIT (Microsoft Corporation). Clean-room adaptation: no third-party expression copied; procedure re-derived from the plan-first construction mechanism described in the source.
