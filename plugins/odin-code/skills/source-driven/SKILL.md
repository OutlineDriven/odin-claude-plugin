---
name: source-driven
description: 'Use when writing or verifying framework-specific code, boilerplate, or a documented, correct implementation. Backs every framework decision with a cited official source and flags unverified patterns. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Source-driven development

## Contract

| Field | Bound contract |
|---|---|
| Trigger | The current task is writing or verifying framework-specific code, boilerplate, or a documented, correct implementation. |
| Authority | Reversible-local: writes framework-specific code plus full-URL citations; rollback to last VCS commit on failure. |
| Side effect | Local writes with explicit UNVERIFIED flags for unverifiable patterns. |
| Done | Every framework-specific decision is backed by a cited official source and unverified patterns are explicitly flagged. |

## Inputs

- Framework context (required): the framework, language, or library.
- Dependency file (required): `package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`, `Gemfile`, `composer.json`, or `pyproject.toml`.
- Stack examples (optional): examples supplied by the caller. This skill has no bundled stack-reference dependency.

## Procedure

1. Read the project's dependency file and state the exact pinned versions. Done when: every dependency in the file has its pinned version stated.
2. For each dependency about to be written against, read the latest stable release from the release channel (registry, releases page, official download page). Report pinned and latest versions side by side. Name the gap when they differ. Done when: each touched dependency shows pinned and latest side by side, with the gap named when they differ.
3. Fetch the official documentation page for the exact feature being implemented. Use the source hierarchy: (1) official docs, (2) official blog/changelog, (3) web standards references (MDN, web.dev), (4) runtime compatibility references. Never use Stack Overflow, blog posts, tutorials, or training data as primary sources. Done when: the fetched page for each feature comes from the highest available tier of the hierarchy and no banned source is cited.
4. Extract the implementation patterns shown in the fetched docs. Use those exact API signatures. If the docs show a newer approach, use the newest one the pinned version supports. Do not use deprecated forms. Done when: every written API signature matches the fetched docs for the pinned version and no deprecated form remains.
5. When official sources contradict each other, report the discrepancy. Do not silently choose one. Done when: each contradiction surfaces as a CONFLICT DETECTED report rather than a silent pick.
6. Write code that follows the documented patterns. Every non-obvious decision gets a full-URL citation in a code comment. Quote the relevant passage when it supports a non-obvious decision. Done when: each non-obvious decision carries a full-URL citation, quoting the supporting passage where one exists.
7. Flag any pattern that could not be verified against official documentation with an explicit UNVERIFIED marker rather than a hedged disclaimer or confident guess. Done when: every unverified pattern carries an UNVERIFIED marker and none is presented as confirmed.

## Failure and recovery
- UNSPECIFIED_FRAMEWORK: user did not provide framework, language, or library context; stop and ask.
- UNVERIFIABLE_DEPENDENCY: a dependency version cannot be determined and the user has not supplied it; stop and ask.
- UNVERIFIABLE_PATTERN: no official documentation found for a required pattern; emit UNVERIFIED flag, do not write unverified code as confirmed.
- SOURCE_CONFLICT: official sources contradict each other or contradict existing project code; surface the conflict without picking a side.
- Non-converged: procedure cannot complete; write nothing, do not claim the done predicate holds.

## Output
STACK DETECTED block first (pinned versions, latest versions, version gaps), then the verified code with full-URL citations in comments, UNVERIFIED flags on anything unverifiable, and CONFLICT DETECTED blocks for each surfaced contradiction.
