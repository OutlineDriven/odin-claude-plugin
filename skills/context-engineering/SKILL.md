---
name: context-engineering
description: 'Use when a long session has accumulated stale or conflicting context or when the user asks to refresh it. Rechecks context against source and drops stale items so the acting context is provably current and minimal. No remote, credential, publish, deploy, or irreversible mutation.'
---

# Context engineering

## Contract

| Field | Bound contract |
|---|---|
| Trigger | Long session has accumulated stale or conflicting context, or the user asks to refresh or recheck context before continuing. |
| Authority | Reversible local: may write an optional scratch state note only; no project file, VCS, credential, paid, published, deployed, or remote mutation. |
| Side effect | Optional scratch state note only; no project files touched. |
| Done | Acting context is provably current and minimal; stale items are dropped with the user informed. |

## Inputs

- The current acting context present in the session: stated facts, assumptions, inferred file state, and prior decisions.
- The source of truth for each item being rechecked: repository files, tool output, or user-stated ground truth.
- Optional: a user-named subset to recheck. If omitted, recheck the full acting context.

## Procedure

1. Enumerate every item in the acting context: stated facts, assumptions, inferred file state, and prior decisions. Done when: every acting-context item is enumerated.
2. For each item, recheck it against its source of truth by the narrowest action that settles it: read the file, re-run the tool, or ask the user. Classify the item as current, stale, or contradicted. Done when: every item is classified current, stale, or contradicted.
3. Drop stale and contradicted items from the acting context. Replace a dropped item with the corrected value only when the source of truth supplies one. Done when: stale and contradicted items are dropped and replaced where a corrected value exists.
4. Remove redundant or duplicate items so the acting context holds only items that are provably current and needed for the remaining work. Done when: no redundant or duplicate items remain.
5. Tell the user which items were dropped and why, and identify any item that could not be settled because its source of truth was unreachable. Done when: dropped items and reasons are reported and unsettled items are identified.
6. Optionally write a scratch state note recording the settled context and the dropped items. Do not touch any project file. Done when: the scratch note is written or skipped, and no project file is touched.

## Failure and recovery
- Unreachable source of truth: leave the dependent item flagged as unsettled, do not drop or replace it, and report it to the user. Never assert an item is current without a settled source.
- Contradiction between sources: report both sources and ask the user which to keep. Do not silently pick one.
- Partial result: deliver the subset that was settled and explicitly list the unsettled remainder. Never present a partial refresh as complete.
- Non-mutation boundary: if any step would require touching a project file or remote state, stop and report the boundary rather than widening authority.

## Output
Refreshed acting context (only provably current, minimal items) → user-facing list of dropped items with reasons → optional scratch state note. Unsettled items listed separately and remain flagged.
