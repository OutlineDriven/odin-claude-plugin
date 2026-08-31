---
title: 'Package surfaces are generator-owned: fix the generator, then mirror'
date: 2026-08-31
category: workflow-issues
module: packaging
problem_type: convention
component: tooling
severity: medium
applies_when:
  - "Editing root package.json, packages/*/README.md, packages/*/PROVENANCE.md, or packages/*/.claude-plugin/plugin.json"
  - "A review finding names a defect inside one of those files"
tags: [generated-surfaces, package-surfaces, check-hooks, render-scripts]
---

# Package surfaces are generator-owned: fix the generator, then mirror

## Context

A PR review reported phantom npm-script references in root `package.json` (`check:claude` pointing at `scripts/validate-claude-surfaces.mjs`, which does not exist). Editing `package.json` directly fails: `scripts/package-surfaces.mjs` generates that file's script block, and `scripts/check-package-surfaces.mjs` (wired as a pre-commit hook) diffs the committed file against generator output. A hand edit passes locally and fails the hook, or the next render silently reverts it. Three workers hit this trap in one session.

## Guidance

The generator family owns these committed surfaces:

- root `package.json` (script block baked in by `scripts/package-surfaces.mjs`)
- `packages/*/package.json`, `packages/*/.claude-plugin/plugin.json` (same generator)
- `packages/*/README.md` (`renderPackageReadme()` in the same file)
- `packages/*/PROVENANCE.md` (`scripts/render-package-provenance.mjs`)

To change any of them: edit the generator (or its inputs, `catalog/packages.json` / `catalog/provenance-rows.json`), run the matching render script, and commit generator plus regenerated output together. When removing a package, delete the obsolete generated package root (`packages/<pkg>/`) manually because `render-package-surfaces.mjs` writes active package surfaces but does not prune removed package trees. Check scripts verify synchronization; a defect present in both generator and output is self-consistent and invisible to them.

## Why This Matters

Check hooks prove committed output matches the generator, not that either is correct. The phantom-script defect lived in the generator, so every check passed while `npm run check` failed on a clean checkout. Reviews flagging the output file are actually flagging the generator.

## When to Apply

- Any edit request or review finding that lands on one of the four surfaces above.
- Adding a package: update `catalog/packages.json` and run the generator.
- Removing a package: remove the entry from `catalog/packages.json`, delete the obsolete generated package root (`packages/<pkg>/`) manually because `render-package-surfaces.mjs` does not prune stale roots, then re-render remaining package surfaces.

## Examples

Wrong: delete the `check:claude` line from `package.json`. The next `render-package-surfaces.mjs` run restores it, and `check-package-surfaces.mjs` flags the interim mismatch.

Right: remove the entry from the script block in `scripts/package-surfaces.mjs`, run `node scripts/render-package-surfaces.mjs`, commit both.

## Related

- `docs/solutions/build-errors/foundry-materialization-carries-source-identity.md` — sibling learning from the same release campaign.
