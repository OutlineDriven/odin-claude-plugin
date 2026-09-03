---
name: testing-handbook-generator
description: 'Use when the user asks to discover, generate, refresh, or validate skills from the Trail of Bits Testing Handbook or appsec.guide. Not for tasks that require source or remote-system changes.'
---

# Testing handbook skill generator

## Contract

| Field | Bound contract |
|---|---|
| Trigger | User wants to discover, generate, refresh, or validate skills from the Trail of Bits Testing Handbook or appsec.guide. |
| Authority | Reversible local: writes only generated skill directories and their cross-references under the configured output path; rollback is deleting generated directories. No remote mutation. No other state is affected. |
| Side effect | Local write: generated skill directories (each containing SKILL.md) and cross-reference links between them. No mutation of the handbook source, other plugins, or remote state. |
| Done | Approved handbook sections produce type-appropriate skills whose references resolve and whose activation and validation checks pass. |

## Inputs

1. **Handbook path** (required): local path to the Testing Handbook repository. The `content/docs/` directory must exist. If not supplied, check `./testing-handbook`, `../testing-handbook`, `~/testing-handbook`; then ask the user; then offer to shallow-clone `https://github.com/trailofbits/testing-handbook` as a last resort.
2. **Output directory** (required): local path where generated skill directories are written. Defaults to the skill's sibling directory.
3. **Scope** (optional): a specific handbook section path to generate from, skipping full discovery. When omitted, the skill runs full discovery across all handbook sections.

Invocation policy is model+human: the model executes discovery, classification, and generation; the human approves the plan before any skill is written.

## Refusals

- Will not proceed to generation without explicit user approval of the plan.
- Will not deliver a file over 500 lines: split into sibling files.
- Will not claim the done predicate holds when validation has not passed for a generated skill.
- Will not mutate the handbook source, other plugins, or remote state.

## Procedure

1. **Locate the handbook.** Check `./testing-handbook`, `../testing-handbook`, `~/testing-handbook` for a `content/docs/` directory. If not found, ask the user for the path. If the user does not know, offer to clone `https://github.com/trailofbits/testing-handbook` with depth 1. Stop if the handbook cannot be located or `content/docs/` is missing. **Done when:** the handbook is located with a `content/docs/` directory.
2. **Scan directory structure.** Walk `{handbook_path}/content/docs/` and enumerate every directory. For each markdown file, parse YAML frontmatter for `title`, `summary`, `weight`, `bookCollapseSection`, and `draft`. **Done when:** every directory and markdown file is enumerated with its frontmatter.
3. **Classify candidates.** For each directory, apply the first matching rule: `/static-analysis/[name]/` with numbered files (00-, 10-): tool skill; `/fuzzing/[lang]/[name]/` with `index.md` or numbered files: fuzzer skill; `/fuzzing/techniques/[name]/` with any `.md` files: technique skill; `/crypto/[name]/` with any `.md` files: domain skill; `/web/[name]/` with numbered files or `_index.md`: tool skill (check exclusions first); `_index.md` with `bookCollapseSection: true`: container, scan children, create no skill for the container; any other directory with only `_index.md`: skip (insufficient content). Most specific (deepest) path wins. When multiple types match, prefer Tool > Fuzzer > Technique > Domain. **Done when:** every directory is classified or skipped.
4. **Apply exclusions.** Skip a section if: `draft: true` appears in frontmatter, the directory is empty, the file is a template or placeholder, or the tool is GUI-only (e.g., `web/burp/`: Burp Suite requires visual interaction and cannot be operated headlessly). **Done when:** exclusions are applied and skipped sections are recorded.
5. **Build candidate list.** For each candidate, record: name (slugified from `title`), type, source section path, summary from frontmatter, weight, whether a resources file (`99-resources.md` or `91-resources.md`) exists, and related sections. **Done when:** the candidate list is built with all fields.
6. **Prioritize candidates.** Order by weight field (lower first), then content depth (more numbered files first), then presence of resources file, then core section status (fuzzing, static-analysis first). **Done when:** the candidate list is ordered.
7. **Present plan to user.** Output a plan table: skill name, source section, type, related sections. List skipped sections with reasons. List external resources to fetch. Wait for explicit user approval before proceeding. Accept modifications: remove skills, change types, rename, add custom related sections. **Done when:** the user approves the plan.
8. **Prepare generation context.** For each approved skill, collect: primary section content (`_index.md` or `index.md`), numbered files, related sections, and resources. Fetch non-video URLs with a 30-second timeout; skip on timeout and note in warnings. Extract video URLs as title and link only. Verify each candidate's primary content is non-empty, frontmatter has title and summary, and the template for its type exists. **Done when:** generation context is prepared for every approved skill.
9. **Pass 1: content generation (parallel).** For each approved skill, generate a SKILL.md with all sections except Related Skills. Apply the type-appropriate section structure and Hugo shortcode conversion rules per `references/type-templates.md`. Preserve code blocks exactly. Leave a Related Skills placeholder. If content exceeds 450 lines, extract large sections into sibling files and add a decision tree to SKILL.md. Hard limit: 500 lines per file. **Done when:** every approved skill has a SKILL.md written with its type-appropriate sections.
10. **Pass 2: cross-reference population (sequential).** After all Pass 1 skills are written, list generated skill names. For each skill, determine related skills per the rules in `references/type-templates.md`. Replace each placeholder with a Related Skills table. Validate that every referenced skill directory exists. **Done when:** every placeholder is replaced and all cross-references validate.
11. **Validate.** For each generated skill, verify: YAML frontmatter parses; `name` matches `^[a-z0-9-]{1,64}$`; `description` is non-empty and at most 1024 characters; required sections for the skill type are present; line count is under 500; no Hugo shortcodes remain; no escaped backtick sequences remain; all internal links resolve; and all cross-referenced skills exist. **Done when:** every generated skill passes validation.
12. **Finalize.** Update the repository README with a table of generated skills (author: `testing-handbook-generator`). Update the Skills Cross-Reference graph from each skill's Related Skills section. Note any template, discovery, or content extraction issues encountered for future improvement. **Done when:** the README and cross-reference graph are updated.

## Failure and recovery

| Failure class | Rule |
|---|---|
| Handbook not found | Stop. Report that no `content/docs/` directory exists at the checked locations. Do not proceed to discovery. |
| Clone failure | Report the error. Ask the user to clone manually and provide the path. |
| Empty or draft section | Skip the section. Record it in the skipped-sections list with the reason. Continue with remaining candidates. |
| Single agent failure | Re-run the failed agent alone with the same inputs. Do not re-run the entire parallel batch. |
| Validation failure | Check the specific failure (missing section, broken reference, shortcode residue). Patch or re-run the single skill. |
| Pass 2 broken reference | Check whether the referenced skill was skipped. Update or remove the reference. |
| Over 500 lines | Split into sibling files. Keep SKILL.md as a router with a decision tree. Never deliver a file over 500 lines. |

Partial results are valid: deliver all skills that pass validation and report any that failed or were skipped. Never claim the done predicate holds when validation has not passed for a generated skill.

Rollback: delete the generated skill directories for the current run. No handbook, plugin, or remote state is affected.

## Output

Generated skill directories under the configured output path (each containing a SKILL.md with type-appropriate sections, cross-references, and passing validation), an updated README table and cross-reference graph, and a per-skill generation report (line count, split status, populated sections, gaps, warnings, references): ordering: skills, README, graph, reports.
