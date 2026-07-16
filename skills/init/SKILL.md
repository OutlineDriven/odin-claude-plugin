---
name: inits
description: Creates or improves an AGENTS.md file. Use when onboarding to a repo, or capturing conventions, constraints, and rationale that are expensive to rediscover.
---

# Init - AGENTS.md Generator

Analyze this codebase and create or improve an `AGENTS.md` file for future ODIN Code Agent instances.

## Governing maxim

**`AGENTS.md` records what needs to be, not what it is.** Every entry is a rule, constraint, or obligation a future agent must uphold; it is never a description of the repository's current state. Prescriptive vs. descriptive is the admission gate; everything below refines it.

## Admission gates (in order)

1. **Normative first.** The candidate must prescribe: an imperative, a prohibition, or an invariant to preserve. Descriptions of structure, tooling, or state fail here regardless of accuracy or usefulness.
2. **Expensive to rediscover.** Among prescriptive candidates, keep only those a future agent cannot cheaply re-derive with a search or one file read. Rules enforced loudly by tooling (a linter that fails the build) are self-announcing; omit them.

## Phrasing rule

Write each entry as an imperative or prohibition, paired with why the rule needs to be:

- Admissible: "Use pnpm; npm lockfiles break CI."
- Inadmissible: "The repo uses pnpm."

Same fact, but only the normative form carries an obligation.

## What to omit

Everything failing a gate:

- Repository summaries: file trees, per-directory descriptions, component or dependency inventories (fail gate 1).
- Generic development best practices not specific to this repo (fail gate 2).
- Fabricated filler sections such as "Common Development Tasks", "Tips", or "Support".
- Facts one search away, even when phrased as rules (fail gate 2).

## Workflow

- New file: admit only entries passing both gates; each states the rule and its rationale.
- Existing file: audit every line against the maxim. Descriptive lines ("what it is") are deletion candidates; propose their removal, don't merely avoid adding more. Prefer targeted edits over wholesale rewrites.
- Each fact appears once. Ground every statement in files actually read. If uncertain, omit the claim rather than speculate.
