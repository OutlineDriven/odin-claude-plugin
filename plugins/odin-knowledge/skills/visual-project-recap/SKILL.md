---
name: visual-project-recap
description: 'Use when a developer returns to a project or loses context. Produces an 8-section HTML recap page so they can rebuild the mental model and derive next steps only from evidence. Not for session handoff snapshots; use handoff.'
---

# Visual project recap

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Context switch or a request to rebuild the mental model of a project |
| Authority | Reversible local write: write the 8-section recap page to the diagrams directory; open it. Roll back by deleting the file. |
| Side effect | Writes the 8-section recap page to the diagrams directory; opens it |
| Done | A returning developer can rebuild the mental model; next steps derive only from evidence |

## Inputs

- Required: project root path (the working directory or an explicit absolute path).
- Optional: branch name (defaults to the current VCS branch or HEAD).

## Procedure

1. Confirm the project root exists and is readable. **Done when:** the project root is confirmed readable.
2. Detect the VCS type (git or hg) and read the current branch name. **Done when:** the VCS type and branch name are determined.
3. Walk the project tree. Identify the file kinds listed in the 8 sections: config files, source entry points, dependency declarations, test files, documentation files, build artifacts directory, and any module/package root. **Done when:** every file kind is identified.
4. Gather the content for each of the 8 sections:
   - Section 1 (Project name and branch): project directory name and current branch or commit hash.
   - Section 2 (Config files): list of config files found (e.g., package.json, Cargo.toml, pyproject.toml, go.mod, Makefile, Dockerfile, .env.example, .editorconfig).
   - Section 3 (Source entry points): main source files (e.g., src/index, main, index, app, lib, __main__).
   - Section 4 (Module structure): directory tree one level deep showing the package/module layout.
   - Section 5 (Dependencies): dependency declaration files and key packages (e.g., requirements.txt, package-lock.json, yarn.lock, Cargo.lock, go.sum).
   - Section 6 (Test files): test files and test directory structure.
   - Section 7 (Documentation): README, CONTRIBUTING, docs/ directory.
   - Section 8 (Build and deploy): build scripts, CI configs, Dockerfiles, deployment configs.
   **Done when:** content is gathered for all 8 sections.
5. Compose a self-contained HTML page with all 8 sections rendered. Use inline CSS so no external resources are required. Use a single-file, no-dependency layout. **Done when:** the HTML page is composed with all 8 sections.
6. Write the page to `<project-root>/diagrams/visual-project-recap.html`. If `diagrams/` does not exist, create it first. **Done when:** the page is written to the target path.
7. Open the file in the default browser or file viewer. **Done when:** the file is opened or the open failure is reported.

## Failure and recovery
- Unreadable project root: stop; report that the project root cannot be read.
- Empty project (no files found): write a minimal recap page with all 8 section headers and a "no files detected" note in each section.
- Diagrams directory creation fails: stop; report the write failure.
- File write fails: stop; report the write failure; do not open a non-existent file.
- Open step fails: the file has been written; report the failure but do not claim the skill is complete.
- Partial-result rule: if any section cannot be populated, write the section with a "not detected" note rather than omitting the section. The done predicate requires all 8 sections to be present.
- Rollback: if the file is written but the open step fails, the file remains on disk; the user can open it manually.

## Output
A self-contained HTML file at `<project-root>/diagrams/visual-project-recap.html` with 8 labeled sections (Project name/branch, Config files, Source entry points, Module structure, Dependencies, Test files, Documentation, Build and deploy), each derived from evidence in the project tree.
