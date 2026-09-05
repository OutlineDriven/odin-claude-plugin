---
name: catchup
description: 'Use when the human returns after a gap, cannot follow the project, asks what happened, or wants a visual HTML recap page. Not for onboarding: use onboard. Not for handoff: use handoff.'
---

# Catchup

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The human returns after a gap, says they can't follow the project, asks what happened or what a term means, faces a decision with a stale mental model, or asks for a visual recap page of the project. |
| Authority | Reversible local: mode visual writes only the recap page under `<project-root>/diagrams/`; mode briefing writes nothing; rollback is deleting the written file. No remote mutation. |
| Side effect | Mode briefing: none; it briefs, it does not act. Mode visual: writes the 8-section recap page to the diagrams directory and opens it. |
| Done | Mode briefing: a cold-read of the briefing requires no pre-gap memory or unglossed coined term to parse; needs-you items are each actionable without opening another file; every claim has a checkable source; it fits on a screen with expansion offered rather than delivered. Mode visual: a returning developer can rebuild the mental model from the page, and next steps derive only from evidence. |

## Inputs

- Mode: `briefing` (default) or `visual`.
- The project working directory or project root path, inferred from the current repository when not supplied. Required for mode visual.
- The human's last touch point (their last message, judgment, or commit) for mode briefing; inferred from session history or the most recent commit when not supplied.
- Branch name for mode visual. Optional; defaults to the current VCS branch or HEAD.

## Procedure

Mode briefing (default):

1. Read only live state: recent file mtimes, git log and diffs, plan and state docs, task boards, and re0-memo notes. Never brief from conversation memory alone; that memory may have drifted. **Done when:** live state is read from the project, not from conversation memory.
2. Anchor on the human's last touch (their last message, judgment, or commit). Everything after that point is the delta; everything before it is assumed known and stays out. **Done when:** the last touch point is identified and the delta boundary is set.
3. Compose in decision order, not chronological order:
   - Needs you: decisions, judgments, or inputs only the human can give, each self-contained enough to act on without opening another file.
   - Changed while you were away: outcomes, not process. Prefer "The plan's scoring rule was replaced" to "I ran three analysis passes."
   - New words: every term coined or repurposed since their last touch, one line each, with where it lives. Skip terms they already used themselves.
   Done when: the three sections are composed in decision order.
4. Gloss on first use: any project-specific term appearing in the briefing gets an inline plain-language aside at its first occurrence, even if a glossary section follows. **Done when:** every project-specific term is glossed at first use.
5. Keep the default short (a screen or less). End with drill-down offers per section, not with everything expanded. **Done when:** the briefing fits on a screen with drill-down offers, not full expansion.
6. Cold-read the briefing for pre-gap memory dependence or unglossed coined terms; confirm each needs-you item is actionable without opening another file; confirm every claim has a checkable source (file, commit, or artifact path). **Done when:** the cold-read passes with no pre-gap memory dependence, no unglossed terms, actionable needs-you items, and sourced claims.

Mode visual:

1. Confirm the project root exists and is readable; stop and report when it is not. **Done when:** the project root is confirmed readable.
2. Detect the VCS type (git or hg) and read the current branch name. **Done when:** the VCS type and branch name are determined.
3. Walk the project tree. Identify the file kinds the 8 sections need: config files, source entry points, dependency declarations, test files, documentation files, build artifacts directory, and module or package roots. **Done when:** every file kind is identified.
4. Gather the content for each of the 8 sections:
   - Section 1 (Project name and branch): project directory name and current branch or commit hash.
   - Section 2 (Config files): config files found (e.g., package.json, Cargo.toml, pyproject.toml, go.mod, Makefile, Dockerfile, .env.example, .editorconfig).
   - Section 3 (Source entry points): main source files (e.g., src/index, main, index, app, lib, __main__).
   - Section 4 (Module structure): directory tree one level deep showing the package/module layout.
   - Section 5 (Dependencies): dependency declaration files and key packages (e.g., requirements.txt, package-lock.json, yarn.lock, Cargo.lock, go.sum).
   - Section 6 (Test files): test files and test directory structure.
   - Section 7 (Documentation): README, CONTRIBUTING, docs/ directory.
   - Section 8 (Build and deploy): build scripts, CI configs, Dockerfiles, deployment configs.
   **Done when:** content is gathered for all 8 sections.
5. Compose a self-contained single-file HTML page with all 8 sections rendered, inline CSS, and no external resources. **Done when:** the HTML page is composed with all 8 sections.
6. Write the page to `<project-root>/diagrams/project-recap.html`, creating `diagrams/` when it does not exist. **Done when:** the page is written to the target path.
7. Open the file in the default browser or file viewer. **Done when:** the file is opened or the open failure is reported.

## Failure and recovery

- No live state found (briefing): if the working directory has no readable git history, plan docs, or task artifacts, report that the project state is unreadable and name what was checked. Do not fabricate a briefing from memory.
- Last touch point unidentifiable (briefing): state the assumption used (e.g., most recent commit) and proceed. Do not guess silently.
- Claim without source (briefing): drop it or mark it explicitly as unverified. Never present an ungrounded claim as fact.
- Briefing exceeds a screen: trim to the needs-you items and one-line summaries of the changed and new-words sections; offer drill-down for the rest. Do not deliver the full expansion by default.
- Unreadable project root (visual): stop; report that the project root cannot be read.
- Empty project (visual): report that no project files were detected; do not write a placeholder page.
- Diagrams directory creation or file write fails (visual): stop; report the write failure; do not open a non-existent file.
- Open step fails (visual): the file remains on disk; report the failure and do not claim the skill is complete.
- Partial result: a briefing covering only some sections is still useful when every included claim is source-grounded; state which sections were omitted and why. A recap page with an unpopulated section keeps the section with a "not detected" note; all 8 sections stay present.

## Output

- Mode briefing: a screen-length briefing with three sections in decision order (Needs you, Changed while you were away, New words), every claim tracing to a file, commit, or artifact path, every project-specific term glossed at first use, and drill-down offers per section; the briefing requires no pre-gap memory to parse.
- Mode visual: a self-contained HTML file at `<project-root>/diagrams/project-recap.html` with 8 labeled sections (Project name/branch, Config files, Source entry points, Module structure, Dependencies, Test files, Documentation, Build and deploy), each derived from evidence in the project tree.
