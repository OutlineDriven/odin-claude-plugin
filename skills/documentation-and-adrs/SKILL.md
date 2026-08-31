---
name: documentation-and-adrs
description: 'Use when making a significant architectural decision, changing a public API, shipping a feature, or recording context for future engineers and agents. Produces ADRs, README updates, inline gotchas, and changelog entries so rationale stays discoverable. Don''t use for remote, credential, publish, deploy, or irreversible changes.'
---

# Documentation and ADRs

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Making a significant architectural decision, changing a public API, shipping a feature, or recording context that future engineers and agents need to understand the codebase. |
| Authority | Reversible local writes only: create or update ADRs, README sections, inline comments, API documentation, changelog entries, and agent-context files inside the working repository. No VCS mutation, publication, deployment, or remote change. |
| Side effect | Local writes to ADRs, README updates, inline gotchas, and changelog entries under the repository documentation tree. Scope is bounded to the decision or feature that triggered invocation. |
| Done | ADRs exist for every significant architectural decision touched, README covers quick start and architecture, no commented-out code remains in the changed surface, and rationale is discoverable from the artifacts written. |

## Inputs

- The decision, API change, or feature being documented. Must be supplied.
- Repository documentation convention, if one exists: existing ADR directory, numbering, file extension, markup, and heading set. Optional; detected by inspection. An established convention overrides the defaults below.
- Existing README, changelog, and agent-context files (CLAUDE.md or equivalent rules files). Optional; read before editing so additions extend rather than duplicate.

## Procedure

1. Bound scope to the single decision, API change, or feature that triggered invocation. Do not document unrelated code or restate what the code already says.
2. Inspect the repository for an established documentation convention: existing ADRs, project instructions, and ADR tooling configuration. Match the existing location, file extension, markup, numbering sequence, and heading set. If evidence conflicts, surface the conflict rather than silently introducing a second scheme. Apply the defaults below only when no convention can be established.
3. For a significant architectural decision, write an ADR that captures the *why*: Context (requirements, constraints, forces), Decision, Alternatives Considered (each with pros, cons, and rejection reason), and Consequences. Use sequential numbering continuing the existing sequence. Record Status as Proposed, then Accepted once the decision is taken.
4. Follow the ADR lifecycle: Proposed → Accepted → Superseded or Deprecated. Never delete an old ADR; it captures historical context. When a decision changes, write a new ADR that references and supersedes the old one by number.
5. For inline documentation, comment the *why* (non-obvious intent, constraints, traps), not the *what*. Do not comment self-explanatory code. Do not leave TODO comments for work that should be done now. Delete commented-out code rather than keeping it; the version history retains it.
6. Document known gotchas inline at the code site that traps future readers or agents, and cross-reference the relevant ADR for full rationale.
7. For a public API, document parameters, return values, thrown errors, and a usage example inline with the type signature. For REST APIs, keep the OpenAPI or Swagger specification consistent with the implementation.
8. For the README, ensure it covers a one-paragraph description, Quick Start (clone, install, environment, run), a Commands table, an Architecture overview that links to ADRs, and Contributing guidance. Add only the sections missing or stale for the current change.
9. For a shipped feature, add a changelog entry under Added, Fixed, or Changed with the issue or PR reference.
10. For agent context, keep rules files (CLAUDE.md or equivalent) and spec files current so agents follow project conventions and build the right thing; ADRs and inline gotchas prevent agents from re-deciding settled questions and falling into known traps.
11. Verify against the done predicate before stopping: every significant architectural decision in scope has an ADR, the README covers quick start and architecture, API functions in scope have parameter and return documentation, known gotchas are inline, no commented-out code remains in the changed surface, and rules files are current.

## Failure and recovery
- Conflicting documentation convention detected: stop and surface the conflict with the evidence found; do not write an ADR under an invented or second scheme. Recovery is the user resolving which convention governs.
- No convention can be established and the user has not authorized the default layout: write the ADR under the default `docs/decisions/` layout and state in the artifact that no prior convention was found.
- Partial result rule: if documentation for one part of scope cannot be completed (for example, an API signature is not yet final), write the parts whose inputs are settled and record the blocked part explicitly in the artifact rather than claiming the done predicate holds.
- Non-mutation rule: never delete an old ADR, never mutate VCS state, and never publish or deploy. All writes are local file additions or edits reversible by the user.
- Blocked result: return the artifacts written, the specific input missing, and the convention conflict or unsettled signature that prevented completion.

## Output
One or more of: an ADR file recording context, decision, alternatives, and consequences; updated README sections; inline comments documenting why and known gotchas; API documentation inline with types or in an OpenAPI specification; a changelog entry; and current agent-context rules files. The changed documentation surface contains no commented-out code, and rationale for every significant decision in scope is discoverable from the written artifacts.

## Provenance

Adapted from `skills/documentation-and-adrs/SKILL.md` in `addyosmani/agent-skills` at pinned revision `d2c37ef6225dd8726cdd369a8030307f48592d26` (MIT). Copyright (c) 2025 Addy Osmani. Adapted for the odin-research module as a self-contained procedure preserving the source mechanism: document decisions with context, alternatives, and consequences; match existing convention before imposing defaults; never delete superseded ADRs; comment why not what; delete commented-out code. The MIT permission notice is retained in derived distributions.
