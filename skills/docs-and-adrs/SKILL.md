---
name: docs-and-adrs
description: 'Use when making an architectural decision, changing a public API, shipping a user-facing feature, or capturing context for future engineers and agents. Produces ADRs, README and API documentation, inline gotcha comments, changelog entries, and current agent-rules files. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Docs and ADRs

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Making an architectural decision, changing a public API, shipping a user-facing feature, or capturing context for future engineers and agents |
| Authority | Reversible-local: create or edit only the documentation artifacts listed under Side effect, inside the current project working tree; nothing is committed, staged, published, or pushed |
| Side effect | ADR, README, API/JSDoc/OpenAPI docs, inline comments, changelog and agent-rules files; deletions are limited to commented-out code |
| Done | ADR exists for each significant decision, README/API/inline gotchas accurate, no commented-out code, agent rules current |

## Inputs

- Required: the decision, API change, feature, or context that fired the trigger, with the rationale and constraints the user can supply.
- Optional: existing ADR directory, README, `CHANGELOG.md`, OpenAPI spec, and agent-rules file; where one is absent, create it at the location the Procedure names.
- Dates, rejected alternatives, and constraints come only from the user or the repository; never invent them.

## Procedure

1. Bound scope before any write: enumerate only the decisions, APIs, and features named by the trigger. Do not document code whose meaning is obvious from reading it, write comments restating what code already says, or document throwaway prototypes.
2. For each significant decision — a framework or library choice, data model, auth strategy, API architecture, or any expensive-to-reverse choice, including a choice between competing approaches — write one ADR. Read the existing ADR directory to confirm the next number, then write `docs/adr/NNNN-<kebab-title>.md` (create `docs/adr/` when absent; `NNNN` continues existing numbering or starts at `0001`):

   ```markdown
   # NNNN. <Title>

   ## Status

   proposed

   ## Date

   YYYY-MM-DD

   ## Context

   Requirements, constraints, and the alternatives considered.

   ## Decision

   We will <one active-voice statement>, because <the why>.

   ## Consequences

   What becomes easier, what becomes harder, and what this enables or blocks later.
   ```

3. Manage the ADR lifecycle in place: an ADR recording a decision taken in this session is `accepted`; when a later ADR reverses an earlier one, set the old ADR's status to `superseded by NNNN`, and never delete an ADR file.
4. Inline comments: write only why-comments — the constraint, trade-off, or trap the code cannot show. Replace what-comments (`i++; // increment i`) with why-comments (`i++; // retry budget: the upstream limiter drops the first burst per connection`).
5. Document each known trap as a gotcha comment at the exact place a future engineer or agent would hit it, stating the trigger and the reason (`// NOTE: call flush() before close(); close() silently drops buffered records otherwise.`). Delete commented-out code on this pass, and report a TODO comment that has sat for weeks as stale instead of leaving it as documentation.
6. API documentation: for every public API function added or changed, write JSDoc carrying its TypeScript parameter and return types; for every REST endpoint added or changed, add or update its OpenAPI/Swagger entry — path, method, parameters, and response schema — in the project's OpenAPI spec.
7. README: when the project has no README or its README is stale relative to this work, update it to cover quick start, commands, an architecture overview, and contributing, preserving existing correct content.
8. Changelog: when shipping a feature that changes user-facing behavior, add a Keep-a-Changelog-style entry at the top of `CHANGELOG.md` (create `## [Unreleased]` when absent) under one of `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.
9. Keep agent-facing documentation current in the same pass: the agent-rules file (`CLAUDE.md` or `AGENTS.md`) carries the conventions agents must follow, spec files stay updated so agents build the right thing, ADRs record why past decisions were made so agents do not re-decide them, and inline gotchas sit where agents will hit them.
10. Stop rather than widen scope: never expand the pass into documenting the whole codebase, and never write an artifact whose content would have to be invented.

## Failure and recovery
- Missing rationale: do not fabricate constraints, alternatives, or dates. Ask the human for the why, or record the ADR with an explicit `Rationale: unknown` line and report the gap; never present a fabricated rationale as done.
- Conflicting or stale existing docs: edit in place and preserve correct existing content; never rewrite unrelated sections to impose a structure.
- Interrupted pass: each written artifact is self-contained, so partial results stay valid; list exactly which files were created or edited and touch nothing further.
- Rollback: every change is a plain working-tree edit; restore the touched tracked files with version control or delete created ADR files to revert completely.
- Blocked: when the decision or its rationale cannot be obtained, stop before writing and report which decision is blocked and which input is missing; the done predicate never reports true while a checklist item fails.

## Output
A report listing every file created or edited with a one-line change description, the ADR numbers and titles created, surfaced gaps (decisions with unknown rationale, stale TODOs reported), and this checklist with per-item pass state:

- [ ] ADR exists for all significant architectural decisions
- [ ] README covers quick start, commands, and architecture overview
- [ ] Public API functions have parameter and return type documentation; REST endpoints have OpenAPI entries
- [ ] Known gotchas are documented inline where they matter
- [ ] No commented-out code remains
- [ ] Agent-rules files are current and accurate

Terminal state is done only when every checklist item passes; otherwise the report names the failing items and stops.

## Provenance

Adapted from the ODIN 1.x project-owned skill `skills/docs-and-adrs/SKILL.md` (candidate `current:current-b:current:docs-and-adrs`); no upstream revision pin and no external license apply. Normalized to the ODIN 2.0 router format; the five reference files (`references/adrs.md`, `references/inline-comments.md`, `references/api-documentation.md`, `references/readme-structure.md`, `references/changelog.md`) are folded inline per the editorial ruling and no third-party expression is copied.
