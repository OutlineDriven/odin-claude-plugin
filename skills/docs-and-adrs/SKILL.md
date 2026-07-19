---
name: docs-and-adrs
description: Document decisions, not just code. Use when making architectural decisions, changing public APIs, shipping features, or capturing context for future engineers and agents.
---

# Documentation and ADRs

## Overview

Document decisions, not just code. The most valuable documentation captures the *why*: the context, constraints, and trade-offs that led to a decision. Code shows *what* was built; documentation explains *why it was built this way* and *what alternatives were considered*. This context is essential for future humans and agents working in the codebase.

## When to Use

- Making a significant architectural decision
- Choosing between competing approaches
- Adding or changing a public API
- Shipping a feature that changes user-facing behavior
- Onboarding new team members (or agents) to the project
- When you find yourself explaining the same thing repeatedly

**When NOT to use:** Don't document obvious code. Don't add comments that restate what the code already says. Don't write docs for throwaway prototypes.

## Architecture Decision Records (ADRs)

Read `references/adrs.md` when making a significant architectural decision (framework/library choice, data model, auth strategy, API architecture, or any expensive-to-reverse choice) — it has the "When to Write an ADR" checklist, the ADR template, and the lifecycle states.

> Restricted-write harness: the ADR is the only standalone artifact this skill redirects (see `references/adrs.md`). Do not edit its other surfaces (README, CHANGELOG, inline code comments, API docs) under restricted writes: report each deferred file and its intended change in one line, then continue read-only; never relocate a merge into an existing repo file to `local://`.

## Inline Documentation

Read `references/inline-comments.md` when writing or reviewing inline code comments — it has the why-not-what rule with before/after examples and the gotcha-documentation pattern.

## API Documentation

Read `references/api-documentation.md` when adding or changing a public API — it has the TypeScript JSDoc pattern and the OpenAPI/Swagger REST pattern.

## README Structure

Read `references/readme-structure.md` when a project lacks a README or its README is stale — it has the section skeleton (quick start, commands, architecture, contributing).

## Changelog Maintenance

Read `references/changelog.md` when shipping a feature that changes user-facing behavior — it has the Keep-a-Changelog-style entry format.

## Documentation for Agents

Special consideration for AI agent context:

- **Agent rules files** (`CLAUDE`, `AGENTS`): Document project conventions so agents follow them
- **Spec files**: Keep specs updated so agents build the right thing
- **ADRs**: Help agents understand why past decisions were made (prevents re-deciding)
- **Inline gotchas**: Prevent agents from falling into known traps

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "The code is self-documenting" | Code shows what. It doesn't show why, what alternatives were rejected, or what constraints apply. |
| "We'll write docs when the API stabilizes" | APIs stabilize faster when you document them. The doc is the first test of the design. |
| "Nobody reads docs" | Agents do. Future engineers do. Your 3-months-later self does. |
| "ADRs are overhead" | A 10-minute ADR prevents a 2-hour debate about the same decision six months later. |
| "Comments get outdated" | Comments on *why* are stable. Comments on *what* get outdated. That's why you only write the former. |

## Red Flags

- TODO comments that have been there for weeks

## Verification

After documenting:

- [ ] ADRs exist for all significant architectural decisions
- [ ] README covers quick start, commands, and architecture overview
- [ ] API functions have parameter and return type documentation
- [ ] Known gotchas are documented inline where they matter
- [ ] No commented-out code remains
- [ ] Agent rules files (`CLAUDE`, `AGENTS`) are current and accurate
