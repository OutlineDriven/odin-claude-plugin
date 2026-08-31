---
name: web-accessibility-audit
description: 'Use when the user requests an accessibility audit, a11y check, or WCAG compliance review. Returns a prioritized WCAG findings report with file and line locations, before and after code fixes, and manual testing recommendations. Don''t use for tasks that require source or remote-system changes.'
---

# Web accessibility audit

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Accessibility audit, a11y check, or WCAG compliance review |
| Authority | Read-only: read project files and run only analysis tools already installed in the project; create, modify, or delete no file; no VCS, credential, paid, publishing, deployment, or remote mutation; install no package |
| Side effect | None: the only artifact is the accessibility report returned in the conversation |
| Done | Report contains prioritized WCAG findings with file/line locations, before/after code, and manual testing recommendations |

## Inputs

- Audit scope: directories, files, or a running URL named by the user. When none is named, the audit targets the web/UI source rooted at the current working directory, the scope the underlying inspection commands use.
- Target WCAG level, optional: A, AA, or AAA as named by the user. When none is named, findings are scored against Level A (must pass) and Level AA (should pass; legal baseline in many jurisdictions), and the report states that basis.
- Nothing is installed or configured; every step runs on present source and, where available, already-installed tooling.

## Procedure

1. Bound the scope before inspecting: enumerate the target directories and files, or the single URL, and reject anything outside it. Read-only throughout: never write a file, never redirect tool output to disk, never install. Done when: scope is enumerated and bounded.
2. Static inspection. For each of the twelve WCAG inspection classes in `references/inspection-classes.md`, search the in-scope markup, components, and styles, open every hit at its location to confirm it, and record confirmed violations as `path:line`. Done when: all twelve classes are inspected and confirmed violations are recorded.
3. Automated scanning, only with tooling already present in the project. Follow the per-tool instructions in `references/fixes-and-scanning.md` (eslint/jsx-a11y, Lighthouse, axe-core). Absent tooling is recorded as absent; never install, never fetch, never write result files. Done when: all available automated tools are run and their results are folded into the matching inspection classes.
4. Prioritize every confirmed finding by user impact using the severity tiers in `references/fixes-and-scanning.md` (Critical, Serious, Moderate, Minor). Done when: every confirmed finding is assigned a severity tier.
5. Write each fix as before/after code taken from the actual file, following the canonical fix patterns in `references/fixes-and-scanning.md`. Done when: every finding has a before/after code fix from the actual source.
6. Include the manual testing recommendations from `references/fixes-and-scanning.md` in every report. Done when: manual testing recommendations are included.

## Failure and recovery
- Scope missing or target is not web/UI source: stop and request a scope; never scan unrelated trees.
- Tooling absent (no eslint/jsx-a11y, no Lighthouse): install nothing; set the summary's automated-coverage line to "none (tooling not installed)" and complete the audit by static inspection. The done predicate still holds: static findings with file/line locations, before/after code, and manual testing recommendations are present.
- A tool run fails or exits without usable output: record the failure and its error in the summary's failed-checks line; never swallow it and never report the check as passed.
- Contrast not computable (dynamic theming, images of text, gradients): list the exact color pairs or elements as open items for manual verification; never guess a ratio.
- Scope too large to finish: return the report explicitly labeled with the classes and paths not yet inspected; presenting a partial audit as complete violates the done predicate.
- Non-mutation: nothing is written at any point, so there is nothing to roll back; if a step could only proceed by writing a file, skip that step and say so in the report.

## Output
A report returned in the conversation (no files created) with sections in order: Summary (scope, WCAG level, issue counts by severity, automated coverage, failed checks), Findings (in severity order: Critical, Serious, Moderate, Minor — each with WCAG criterion, `path:line` locations, before/after code, and fix rationale), Manual testing recommendations, and Next steps.
