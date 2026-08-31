---
name: readme-creator
description: 'Use when asked to write or refine a project README.md as a strong shop-window. Triggered when the user asks to write, rewrite, or improve a README. Produces a complete README.md with shop-window, section templates, quality checklist, and appropriate badges. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Readme creator

## Contract

| Field | Bound contract |
|---|---|
| Trigger | write a README, rewrite README, public-facing README, README shop window, badges and shields |
| Authority | reversible-local: write only `README.md`; rollback by restoring prior file content or removing the file |
| Side effect | Writes or refines README.md in the project root. |
| Done | README has a strong shop-window, section templates, quality checklist, and appropriate badges. |

## Inputs

- **Project root** (required): the directory containing the project. The skill reads existing source files, package manifests, and any pre-existing `README.md` from this root.
- **User intent** (required): the user's request text. Clarify ambiguous intent before writing.
- **Inline authoring material**: the **Badges and Shields Reference**, **Quality Checklist Reference**, and **Section Templates Reference** appended below Provenance in this file. They are part of this skill, not external support files.

## Procedure

1. **Discover the project.** Walk the project root. Identify the language, framework, package manager, test runner, and CI provider from file names and manifest contents. Skip hidden directories.
2. **Assess existing README.** If `README.md` exists, read it fully. Note which sections are present and which are missing or weak.
3. **Clarify intent.** If the user request is vague ("make a README"), ask one clarifying question about the primary audience, project phase (new vs mature), or any section the user wants emphasized. Do not write until intent is clear.
4. **Draft the shop-window.** Write or rewrite the opening: project name, one-line tagline, one-sentence description, and a visual separator.
5. **Choose section templates.** Use the inline **Section Templates Reference** below to select sections matching the project type (library, CLI, web app, or the general-purpose minimum). Include at minimum: Installation, Quick Start, Features, Usage, Contributing, and License.
6. **Populate sections.** Fill each section with real content derived from the project files. Do not copy code from source files; summarize and link to source locations. If installation instructions cannot be derived from the project files, stop and report this as a failure class.
7. **Apply the quality checklist.** Evaluate the draft against every applicable item in the inline **Quality Checklist Reference** below. Fix each failing item before proceeding; an item that does not apply to the detected project type may be omitted only when the README does not claim that surface.
8. **Add badges.** Select only badges whose repository, workflow, registry package, license, or coverage integration is proven by project files, using the URL patterns and limits in the inline **Badges and Shields Reference** below. Replace every angle-bracket variable with a derived value, place the badges below the project title and tagline, and omit any badge whose value cannot be proven.
9. **Write `README.md`.** Write the completed file to the project root, encoding as UTF-8. Preserve the user's preferred casing of "README".
10. **Verify done predicate.** Confirm the file exists, contains a shop-window title block, at least four section headings, a checklist or contributing section, and at least two badges. If any check fails, report which check failed and stop.

## Failure and recovery
| Failure class | Condition | Result |
|---|---|---|
| `unresolvable-intent` | User intent cannot be clarified or is contradictory | Stop. Return "blocked: unresolvable-intent". Do not write. |
| `no-install-path` | Installation instructions cannot be derived from project files | Stop. Return "blocked: no-install-path". List the files that were checked. |
| `checklist-fails` | Done-predicate checks fail after writing | Overwrite the file. Repeat steps 4–10 until checks pass or a step reports `unresolvable-intent` / `no-install-path`. |
| `io-error` | File write fails due to permissions or disk error | Stop. Return the raw error. Do not modify any other file. |

Rollback: if a write overwrote a pre-existing `README.md`, restore the prior content captured by the read in step 2. No other rollback applies.

## Output
A complete `README.md` file written to the project root. The file contains:
- A shop-window opening (title, tagline, description, separator)
- Section templates selected for the project type
- A quality checklist or Contributing section
- Badges appropriate to the project

## Provenance

Origin: `mblode/agent-skills` (MIT, Copyright (c) 2026 Matthew Blode), revision `e97a3b383f5944f90d41eb92b24b4fb3b917a7f9`, path `skills/readme-creator/SKILL.md`.

License: MIT. Preserve the copyright notice and the license text in all copies or substantial portions.

Adaptation: Clean-room authored for ODIN 2.0. Skill path, authority class, trigger predicate, done predicate, and contract structure derived from the source. Procedure steps, section templates, quality checklist, and badges references authored independently.

---

# Badges and shields reference

Badges communicate build status, version, license, and key project metadata. Place them directly below the project title and tagline in the README opening.

### Common badge providers

| Provider | URL pattern | Notes |
|---|---|---|
| shields.io | `https://img.shields.io/badge/<LABEL>-<MESSAGE>-<COLOR>.svg` | General-purpose; supports custom label/message/color. |
| GitHub Actions | `https://github.com/<owner>/<repo>/actions/workflows/<name>/badge.svg` | Requires a workflow file in `.github/workflows/`. |
| npm | `https://img.shields.io/npm/v/<package-name>.svg` | Package version from the npm registry. |
| PyPI | `https://img.shields.io/pypi/v/<package-name>.svg` | Python package version. |
| codecov | `https://codecov.io/gh/<owner>/<repo>/branch/main/graph/badge.svg` | Requires Codecov integration. |
| Coveralls | `https://coveralls.io/repos/github/<owner>/<repo>/badge.svg?branch=main` | Requires Coveralls integration. |
| libraries.io | `https://img.shields.io/librariesio/release/npm/<package-name>.svg` | Dependency health. |

### Badge style guidelines

- Use flat-square or flat style (`style=flat-square`, `style=flat`) for a modern look.
- Choose colors semantically: green for success/passing, blue for info/neutral, red for failure, yellow/orange for warning or in-progress.
- Limit to 4–6 badges in the shop-window. Additional badges may appear in a dedicated "Badges" section.
- Ensure badges use HTTPS.
- Prefer SVG badges; fall back to PNG only when SVG is not supported.

### Common badge patterns

### CI build status

```markdown
[![Build Status](https://img.shields.io/github/actions/workflow/status/<owner>/<repo>/ci.yml?style=flat-square)](https://github.com/<owner>/<repo>/actions)
```

### Version

```markdown
[![npm version](https://img.shields.io/npm/v/<package-name>.svg?style=flat-square)](https://www.npmjs.com/package/<package-name>)
```

### License

```markdown
[![License](https://img.shields.io/github/license/<owner>/<repo>.svg?style=flat-square)](LICENSE)
```

### Code coverage

```markdown
[![Coverage](https://img.shields.io/codecov/c/github/<owner>/<repo>/flat/main.svg?style=flat-square)](https://codecov.io/gh/<owner>/<repo>)
```

### Downloads

```markdown
[![Downloads](https://img.shields.io/npm/dm/<package-name>.svg?style=flat-square)](https://www.npmjs.com/package/<package-name>)
```

---

# Quality checklist reference

Use this checklist to evaluate every README before finalizing. Fix each failing item before declaring the skill done.

### Structure

- [ ] Opens with a clear project name and one-line tagline
- [ ] Includes a visual separator after the shop-window block
- [ ] Sections follow a logical order: Overview → Install → Usage → API/Config → Contributing → License
- [ ] Each section has a heading and meaningful content (not just a placeholder)

### Content

- [ ] Installation instructions are accurate and complete for the project's package manager
- [ ] Quick Start section has a minimal working example that can be run in under 2 minutes
- [ ] Usage section shows at least one realistic example beyond the quick start
- [ ] API or configuration section covers all public options with descriptions and types
- [ ] Contributing section explains how to set up the dev environment and run tests
- [ ] License section identifies the license by name and links to the full text

### Accuracy

- [ ] No commands that require non-standard tools beyond those listed in Installation
- [ ] No dead links to external resources (run a link check or verify URLs manually)
- [ ] No version numbers, command flags, or API signatures that contradict the actual source code
- [ ] No placeholder text such as "TODO", "your package name here", or "describe your project"

### Presentation

- [ ] Badge images load and display correctly
- [ ] Code blocks use the correct language identifier for syntax highlighting
- [ ] File paths and command examples use the correct path separator for the OS
- [ ] No excessive use of emoji; badges and ASCII are preferred in the shop-window

---

# Section templates reference

Select and adapt the sections below based on the project type. Combine with the quality checklist to produce a complete README.

### Library / package

1. **Shop-window**: name, tagline, one-sentence description, badges
2. **Installation**: package manager install command, peer dependency notes, CDN alternative
3. **Quick Start**: minimal import and first-use example (≤10 lines)
4. **Features**: bulleted list of key capabilities (≥3 items)
5. **Usage / Examples**: 2–3 realistic examples showing common use cases
6. **API Reference**: table of exported functions, classes, or types with signature, description, and parameter types
7. **Configuration**: environment variables or options object with defaults
8. **Contributing**: dev setup commands, test runner commands, PR guidelines
9. **License**: license name and link

### CLI tool

1. **Shop-window**: name, tagline, one-sentence description, badges
2. **Installation**: install command (brew, npm -g, go install, pip, cargo, etc.)
3. **Quick Start**: first command invocation with expected output
4. **Features**: bulleted list of key capabilities
5. **Usage**: full command reference, flags, arguments, and examples
6. **Configuration**: config file location and format, env var overrides
7. **Examples**: 2–3 common workflows
8. **Contributing**: dev setup, test commands, PR guidelines
9. **License**: license name and link

### Web application

1. **Shop-window**: name, tagline, one-sentence description, screenshots (optional), badges
2. **Live Demo**: link to running instance or screenshot
3. **Installation**: clone command, env setup, database prerequisites
4. **Quick Start**: local dev server command, first-run instructions
5. **Features**: bulleted list of key capabilities
6. **Screenshots / Demo**: ASCII or linked image placeholders
7. **Configuration**: env vars, config file schema
8. **Deployment**: hosting options, build commands, env requirements
9. **Contributing**: dev setup, test commands, PR guidelines
10. **License**: license name and link

### General-Purpose minimum

Every README must include at minimum:
- Project name and tagline (shop-window)
- Installation instructions
- Quick Start or Usage example
- License

Add sections from the appropriate template above until all four minimum items are covered and the done predicate is satisfied.
