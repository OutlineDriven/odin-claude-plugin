---
name: source-driven
description: 'Use when writing or verifying framework-specific code, boilerplate, or a documented, correct implementation. Every framework-specific decision is backed by a cited official source and unverified patterns are explicitly flagged. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
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

User provides: framework, language, or library context; project dependency file (package.json, requirements.txt, go.mod, Cargo.toml, Gemfile, composer.json, pyproject.toml). Optional stack examples may be supplied by the caller; this skill has no bundled stack-reference dependency.

## Procedure

1. Read the project's dependency file and state the exact pinned versions.
2. For each dependency about to be written against, read the latest stable release from the release channel (registry, releases page, official download page). Report pinned and latest versions side by side. Name the gap when they differ.
3. Fetch the official documentation page for the exact feature being implemented. Use the source hierarchy: (1) official docs, (2) official blog/changelog, (3) web standards references (MDN, web.dev), (4) runtime compatibility references. Never use Stack Overflow, blog posts, tutorials, or training data as primary sources.
4. Extract the implementation patterns shown in the fetched docs. Use those exact API signatures. If the docs show a newer approach, use the newest one the pinned version supports. Do not use deprecated forms.
5. When official sources contradict each other, surface the discrepancy to the user without silently choosing one.
6. Write code that follows the documented patterns. Every non-obvious decision gets a full-URL citation in a code comment. Quote the relevant passage when it supports a non-obvious decision.
7. Flag any pattern that could not be verified against official documentation with an explicit UNVERIFIED marker rather than a hedged disclaimer or confident guess.

## Failure and recovery
- UNSPECIFIED_FRAMEWORK: user did not provide framework, language, or library context; stop and ask.
- UNVERIFIABLE_DEPENDENCY: a dependency version cannot be determined and the user has not supplied it; stop and ask.
- UNVERIFIABLE_PATTERN: no official documentation found for a required pattern; emit UNVERIFIED flag, do not write unverified code as confirmed.
- SOURCE_CONFLICT: official sources contradict each other or contradict existing project code; surface the conflict without picking a side.
- Non-converged: procedure cannot complete; write nothing, do not claim the done predicate holds.

## Output
Verified framework-specific code with full-URL citations to official documentation in code comments. Explicit UNVERIFIED flags for any pattern that could not be verified. A STACK DETECTED block listing pinned versions, latest versions, and version gaps. CONFLICT DETECTED blocks for any source contradictions surfaced.

## Provenance

Two sources. (1) `current:current-d:current:source-driven` — existing odin-code skill, origin `current-odin-skill-tree`, no external license, adapted for ODIN 2.0 authoring format and authority contract. (2) `source:source-addy:addy-source-driven-development` — MIT-licensed skill from addyosmani/agent-skills (Copyright (c) 2025 Addy Osmani; SPDX: MIT; pinned revision d2c37ef6225dd8726cdd369a8030307f48592d26; obligation: retain copyright notice and MIT permission text in derived distributions; otherwise unrestricted use); exact four-field duplicate of current:source-driven, absorbed into that survivor with no surviving alias.
