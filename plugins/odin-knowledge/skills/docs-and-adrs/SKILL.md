---
name: docs-and-adrs
description: 'Use when making an architectural decision, changing a public API, shipping a feature, or recording a codebase term. Not for domain language: use domain-modeling. Not for docs: use docs-writing.'
---

# Docs and ADRs

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Making an architectural decision, changing a public API, shipping a user-facing feature, capturing context for future engineers and agents, or a codebase term resolving |
| Authority | Reversible local: writes only the documentation artifacts listed under Side effect, inside the current project working tree; rollback is version control. No remote mutation. Nothing is committed, staged, published, or pushed. |
| Side effect | ADR, README, API/JSDoc/OpenAPI docs, inline comments, changelog and agent-rules files; deletions are limited to commented-out code |
| Done | ADR exists for each significant decision, README/API/inline gotchas accurate, no commented-out code, agent rules current, each resolved codebase term routed to domain-modeling |

## Inputs

- Required: the decision, API change, feature, or context that fired the trigger, with the rationale and constraints the user can supply.
- Optional: existing ADR directory, README, `CHANGELOG.md`, OpenAPI spec, and agent-rules file; where one is absent, create it at the location the Procedure names.
- Optional: the repository's documentation convention (ADR directory, numbering, extension, markup, heading set), detected by inspection; an established convention overrides the Procedure's defaults.
- Dates, rejected alternatives, and constraints come only from the user or the repository; never invent them.

## Procedure

1. Bound scope before any write: enumerate only the decisions, APIs, and features named by the trigger. Do not document code whose meaning is obvious from reading it, write comments restating what code already says, or document throwaway prototypes. Done when: the scope list names only items from the trigger and nothing invented.
2. Inspect the repository for an established documentation convention: existing ADRs, project instructions, ADR tooling config. Match the existing location, extension, markup, numbering, and heading set; when evidence conflicts, surface the conflict instead of introducing a second scheme. Apply the defaults below only when no convention exists. Done when: the convention is matched, or the default layout is selected with any conflict surfaced.
3. Route resolved codebase terms to domain-modeling. When a codebase term resolves during this pass, hand the term, its project definition, and its near-synonyms to domain-modeling, which owns `CONTEXT.md` and its entry schema. Do not write to `CONTEXT.md` here. Done when: each resolved term is routed to domain-modeling, or no term resolved.
4. For each significant decision, write one ADR. Follow `references/adrs.md` for the qualifying conditions that gate whether a decision warrants an ADR, the `docs/decisions/` storage location with sequential numbering, and the template with its optional fields. Read the existing ADR directory to confirm the next number before writing. Done when: an ADR file exists at the location and format the reference specifies (or the detected convention's path) for each qualifying decision, with sequential numbering continuing the existing sequence.
5. Manage the ADR lifecycle in place. Mark an ADR recording a decision taken in this session as `accepted`. When a later ADR reverses an earlier one, set the old ADR's status to `superseded by NNNN`. Never delete an ADR file. Done when: each ADR's status field reflects its lifecycle position.
6. Inline comments: write only why-comments that explain the constraint, trade-off, or trap the code cannot show. Replace what-comments (`i++; // increment i`) with why-comments (`i++; // retry budget: the upstream limiter drops the first burst per connection`). Done when: every comment in the changed surface is a why-comment; no what-comments remain.
7. Document each known trap as a gotcha comment at the exact place a future engineer or agent would hit it. State the trigger and the reason, and cross-reference the governing ADR by number where one exists (`// NOTE: call flush() before close(); close() silently drops buffered records otherwise. See ADR 0007.`). Delete commented-out code on this pass. Report a TODO comment that has sat for weeks as stale instead of leaving it as documentation. Done when: each known trap has a gotcha comment at its code site and no commented-out code remains in the changed surface.
8. API documentation: for every public API function added or changed, write JSDoc with its TypeScript parameter and return types, thrown errors, and a usage example. For every REST endpoint added or changed, add or update its OpenAPI/Swagger entry in the project's OpenAPI spec, including path, method, parameters, and response schema. Done when: every public API function in scope has typed JSDoc and every REST endpoint in scope has an OpenAPI entry.
9. README: when the project has no README or its README is stale relative to this work, update it to cover quick start, commands, an architecture overview linking to ADRs, and contributing, preserving existing correct content. Done when: README covers quick start, commands, architecture overview, and contributing.
10. Changelog: when shipping a feature that changes user-facing behavior, add a Keep-a-Changelog-style entry at the top of `CHANGELOG.md` (create `## [Unreleased]` when absent) under one of `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`, with the issue or PR reference where one exists. Done when: a changelog entry exists under the correct section for each user-facing behavior change.
11. Keep agent-facing documentation current in the same pass. Put agent conventions in the agent-rules file (`CLAUDE.md` or `AGENTS.md`). Keep spec files updated so agents build the right thing. Use ADRs to record why past decisions were made so agents do not re-decide them. Place inline gotchas where agents will encounter them. Done when: agent-rules files and spec files reflect current conventions and no settled decision lacks a discoverable rationale.
12. Stop rather than widen scope: never expand the pass into documenting the whole codebase, and never write an artifact whose content would have to be invented. Done when: no artifact was written whose content had to be invented and no out-of-trigger code was documented.

## Failure and recovery
- Missing rationale: do not fabricate constraints, alternatives, or dates. Ask the human for the reason, or record the ADR with an explicit `Rationale: unknown` line and report the gap. Never present a fabricated rationale as done.
- Conflicting documentation convention: stop and surface the conflict with the evidence found; never write an ADR under an invented or second scheme.
- Conflicting or stale existing docs: edit in place and preserve correct existing content; never rewrite unrelated sections to impose a structure.
- Interrupted pass: each written artifact is self-contained, so partial results stay valid; list exactly which files were created or edited and touch nothing further.
- Rollback: every change is a plain working-tree edit; restore the touched tracked files with version control or delete created ADR files to revert completely.
- Blocked: when the decision or its rationale cannot be obtained, stop before writing and report which decision is blocked and which input is missing; the done predicate never reports true while a checklist item fails.
- Unavailable ADR directory: route any resolved term to domain-modeling, skip the ADR, and report the pass as partial with the skipped artifact named; never halt the whole pass over one missing directory.

## Output
A report listing every file created or edited with a one-line change description, the ADR numbers and titles created, resolved codebase terms routed to domain-modeling, and surfaced gaps (decisions with unknown rationale, stale TODOs reported), ordered by artifact type then file path.
