---
name: readme-creator
description: 'Use when asked to write or refine a project README.md as a strong shop-window. Produces a complete README with shop-window, section templates, quality checklist, and appropriate badges. Not for README standard enforcement — use readme-standard.'
---

# Readme creator

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Write a README, rewrite README, public-facing README, README shop window, badges and shields. |
| Authority | Reversible-local: write only `README.md`; rollback by restoring prior file content or removing the file. |
| Side effect | Writes or refines README.md in the project root. |
| Done | README has a strong shop-window, section templates, quality checklist, and appropriate badges. |

## Refusals

- **README standard enforcement with verification gates**: use `readme-standard`. This skill creates and refines; readme-standard enforces.
- **Badges whose repository, workflow, registry, license, or coverage integration is not proven by project files**: rejected. Omit any badge whose value cannot be proven.
- **Copying code from source files into the README**: rejected. Summarize and link to source locations.

## Inputs

- **Project root** (required): the directory containing the project. The skill reads existing source files, package manifests, and any pre-existing `README.md` from this root.
- **User intent** (required): the user's request text. Clarify ambiguous intent before writing.
- **Inline authoring material**: the Badges and Shields Reference, Quality Checklist Reference, and Section Templates Reference in `references/`. They are part of this skill, not external support files.

## Procedure

1. Discover the project. Walk the project root. Identify the language, framework, package manager, test runner, and CI provider from file names and manifest contents. Skip hidden directories. **Done when**: the project type and tooling are identified.
2. Assess existing README. If `README.md` exists, read it fully. Note which sections are present and which are missing or weak. **Done when**: the existing README is assessed or its absence is noted.
3. Clarify intent. If the user request is vague ("make a README"), ask one clarifying question about the primary audience, project phase (new vs mature), or any section the user wants emphasized. Do not write until intent is clear. **Done when**: the user intent is clear.
4. Draft the shop-window. Write or rewrite the opening: project name, one-line tagline, one-sentence description, and a visual separator. **Done when**: the shop-window is drafted.
5. Choose section templates. Use the Section Templates Reference in `references/` to select sections matching the project type (library, CLI, web app, or the general-purpose minimum). Include at minimum: Installation, Quick Start, Features, Usage, Contributing, and License. **Done when**: the section set is selected.
6. Populate sections. Fill each section with real content derived from the project files. Do not copy code from source files; summarize and link to source locations. If installation instructions cannot be derived from the project files, stop and report this as a failure class. **Done when**: every selected section is populated with real content.
7. Apply the quality checklist. Evaluate the draft against every applicable item in the Quality Checklist Reference in `references/`. Fix each failing item before proceeding; an item that does not apply to the detected project type may be omitted only when the README does not claim that surface. **Done when**: every applicable checklist item passes.
8. Add badges. Select only badges whose repository, workflow, registry package, license, or coverage integration is proven by project files, using the URL patterns and limits in the Badges and Shields Reference in `references/`. Replace every angle-bracket variable with a derived value, place the badges below the project title and tagline, and omit any badge whose value cannot be proven. **Done when**: badges are placed with proven values.
9. Write `README.md`. Write the completed file to the project root, encoding as UTF-8. Preserve the user's preferred casing of "README". **Done when**: the file is written to disk.
10. Verify done predicate. Confirm the file exists, contains a shop-window title block, at least four section headings, a checklist or contributing section, and at least two badges. If any check fails, report which check failed and stop. **Done when**: all done-predicate checks pass.

## Failure and recovery

- **`unresolvable-intent`**: user intent cannot be clarified or is contradictory. Stop. Return "blocked: unresolvable-intent". Do not write.
- **`no-install-path`**: installation instructions cannot be derived from project files. Stop. Return "blocked: no-install-path". List the files that were checked.
- **`checklist-fails`**: done-predicate checks fail after writing. Overwrite the file. Repeat steps 4-10 until checks pass or a step reports `unresolvable-intent` / `no-install-path`.
- **`io-error`**: file write fails due to permissions or disk error. Stop. Return the raw error. Do not modify any other file.

Rollback: if a write overwrote a pre-existing `README.md`, restore the prior content captured by the read in step 2. No other rollback applies.

## Output

A complete `README.md` written to the project root with a shop-window opening, section templates selected for the project type, a quality checklist or Contributing section, and badges appropriate to the project.

## Provenance

Origin: `mblode/agent-skills` (MIT, Copyright (c) 2026 Matthew Blode), revision `e97a3b383f5944f90d41eb92b24b4fb3b917a7f9`, path `skills/readme-creator/SKILL.md`.

License: MIT. Preserve the copyright notice and the license text in all copies or substantial portions.

Adaptation: Clean-room authored for ODIN 2.0. Skill path, authority class, trigger predicate, done predicate, and contract structure derived from the source. Procedure steps, section templates, quality checklist, and badges references authored independently. Inline reference material moved to `references/` per I3.
