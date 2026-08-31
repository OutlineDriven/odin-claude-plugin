---
title: Foundry materialization carries source identity into renamed skills
date: 2026-08-31
category: build-errors
module: skills
problem_type: logic_error
component: tooling
symptoms:
  - "81 of 816 SKILL.md name: fields carried the upstream source name (lfg, gstack-autoplan, mandela) while the directory carried the ODIN slug"
  - "Slash triggers referenced source verbs that collide with sibling skills (/retro inside retrospective/ while a real retro skill exists)"
  - "H1 headings and openai.yaml display_name carried source brand adjectives (Gstack Retro, lfg-ready)"
  - "Operational paths pointed at vendor state dirs (.compound-engineering/, /tmp/compound-engineering-<uid>/)"
root_cause: logic_error
resolution_type: code_fix
severity: high
tags: [skill-foundry, materialization, rename, invocation-leak, name-map]
---

# Foundry materialization carries source identity into renamed skills

## Problem

The 2.0 skill foundry renames imported skills to ODIN slugs at the directory level, but materialization copied file contents wholesale. Source identity survived inside files: frontmatter `name:`, slash triggers, headings, display names, and state paths. A skill whose loader key disagrees with its directory fails strict loaders, and a leaked source trigger can invoke the wrong sibling skill.

## Symptoms

- `name:` field != directory slug in 81 of 816 skills.
- Source slash aliases inside triggers and procedure steps (`/retro`, `/spec`, `/freeze`), including collisions with real sibling skills.
- Brand strings in H1s and `agents/openai.yaml` `display_name` (`# Gstack autoplan`, `Gstack iOS Design Review`).
- Vendor operational paths (`.compound-engineering/`) instead of the repo convention (`~/.odin/`).

## What Didn't Work

- A single `grep -r <old-name>` sweep. Bare prose words (beam, hate, aim) are not leaks, and provenance lines carry source names; a flat grep drowns in both. Each leak class needs its own pass and exemption list.
- Fixing only `name:` fields. The invocation surface (slash triggers, descriptions, H1s, display names, paths) is a distinct leak class per carrier file and stays broken after frontmatter repair.

## Solution

Build a name map (old source name -> new slug) from the provenance ledger, then repair by class with dedicated detectors:

1. Require `name:` to equal the directory slug (gate: `.outline/gates/check-skill-names.py`).
2. Catch invocation leaks: slash, backtick, and path forms of every old name, exempting provenance/attribution lines (gate: `.outline/gates/check-old-name-leaks.py`).
3. Strip brand names and bare old names from H1 headings and `openai.yaml` display names (a separate audit pass, since `.outline/gates/check-old-name-leaks.py` checks invocation patterns rather than bare heading text).
4. Rewrite operational paths to the repo state-dir convention (`~/.odin/`).
5. Fix verb-flipped slugs caught by reading the contract rather than the name: `workspace-freeze` described unfreezing; the directory itself was renamed.

Keep load-bearing product nouns: a skill that drives an external gstack binary keeps its gstack nouns; only identity-of-this-skill strings are leaks.

## Why This Works

The defect stems from one mechanism: renaming directories while keeping file contents intact. Enumerating by leak class matches how identity is embedded (loader key, invocation trigger, display surface, state path), pairing deterministic gate checks with targeted cleanup passes instead of an ad-hoc judgment call per flat grep hit. The provenance exemption keeps attribution intact, satisfying licensing obligations.

## Prevention

- Run the two gates in `.outline/gates/` after any materialization or bulk import into `skills/`.
- When importing a skill under a new slug, treat the rename as a content transform, not a directory move: map `name:`, triggers, H1, `display_name`, and state paths in the same pass.
- A slug whose verb contradicts its contract (freeze vs unfreeze) is a name defect even when no source name leaks; read the Done row of the contract when adopting a slug.

## Related Issues

- `.outline/evidence/skill-foundry/name-map.json` — the old->new map this repair used.
- `docs/solutions/workflow-issues/cascade-dedup-jaccard-misses-semantic-duplication.md` — sibling foundry-era learning.
