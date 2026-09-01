---
name: ground-latest
description: 'Use when starting a codebase or service, scaffolding, migrating or refactoring, picking a language edition, runtime, framework, or dependency, or when the user asks for the latest, current, LTS, or modern way. Not for remote, credential, publish, deploy, or irreversible changes.'
---

# Ground latest

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Starting a new codebase or service, scaffolding, migrating or refactoring, picking a language edition, runtime, framework, or dependency, or the user asks for the latest, current, LTS, or modern way |
| Authority | reversible-local: write a dated grounded set into the change (plan, ADR, or PR body); no VCS, credential, paid, published, deployed, or remote mutation |
| Side effect | local write of a dated grounded set of pinned versions with release-channel links and LTS-vs-latest decisions; drops pre-release and deprecated choices with named replacements |
| Done | every pinned choice has a release-channel version plus link; LTS-vs-latest decided per project; grounded set written and dated |

## Inputs

- The change being grounded (plan, ADR, or PR body) and the list of choices it pins: language edition, runtime, each framework and dependency, build and test tooling, and the platform baseline. That list is the grounding set.
- Optional: existing repo pins or version floors that may override a pick.

## Procedure

1. List every choice this change pins: language edition, runtime, each framework and dependency, build and test tooling, and the platform baseline. That list is the grounding set. Done when: the grounding set lists every pinned choice (language edition, runtime, frameworks, dependencies, build and test tooling, platform baseline), and no choice is omitted.
2. Look each one up at its own release channel today: the project release page, changelog, or registry metadata. For support windows and LTS tracks, query `https://endoflife.date/api/v1/products/<product>/`. Recall is not a source. Done when: each entry is looked up at its release channel today, and the source URL or page is recorded for each; no entry is pinned from recall.
3. Record per entry: current stable, current LTS if the project runs an LTS track, release date, and end-of-support date. Done when: each entry records current stable, current LTS if applicable, release date, and end-of-support date, sourced from the release channel or endoflife.date API.
4. Pin the latest stable LTS where the project offers one, otherwise the latest stable. An existing repo pin or version floor wins over the pick; name which one applied. Done when: each entry is pinned to latest stable LTS or latest stable, and when a repo pin or version floor overrode the pick, the override is named.
5. Drop pre-release, deprecated, and unmaintained choices (no release or security fix in 12 months), and name the maintained replacement pinned instead. Done when: every pre-release, deprecated, or unmaintained choice is dropped, and each has a named maintained replacement or is marked dropped-without-replacement.
6. Read the chosen version's current recommended pattern before writing against it. Renamed APIs and replaced defaults are where recalled code breaks. Done when: the chosen version current recommended pattern is read from its release-channel docs, and no code is written against a recalled API.
7. Leave the grounded set in the change (plan, ADR, or PR body) with versions, dates, and links, so the next reader sees when it was grounded. Done when: the grounded set is written into the change (plan, ADR, or PR body) with versions, dates, links, and a grounding date, so the next reader sees when it was grounded.

## Failure and recovery
- No release channel reachable for an entry: mark the entry ungrounded; do not pin from recall. Stop and report which entry blocked and which channel was tried.
- LTS-versus-latest conflict with no project policy: record both with dates and defer the decision to the human; do not silently pick.
- A choice is pre-release, deprecated, or unmaintained and no maintained replacement is found: mark it dropped-without-replacement and name the gap; do not retain the dropped version.
- Partial result: write only the entries grounded from a release channel today; list ungrounded entries as blocked, never filled from recall.

## Output
A dated grounded set written into the change (plan, ADR, or PR body). Per entry: pinned version, release date, end-of-support date, release-channel link, LTS-vs-latest decision, and any repo floor that overrode the pick. Dropped choices are listed with their named replacement or marked dropped-without-replacement.
