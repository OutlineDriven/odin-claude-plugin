---
title: 'Plugin surfaces are generator-owned: fix the generator, then re-render'
date: 2026-08-31
category: workflow-issues
module: packaging
problem_type: convention
component: tooling
severity: medium
applies_when:
  - "Editing plugins/*/README.md, plugins/*/NOTICE, plugins/*/.<harness>-plugin/plugin.json, or any marketplace registry"
  - "A review finding names a defect inside one of those files"
tags: [generated-surfaces, plugin-surfaces, check-hooks, render-scripts]
---

# Plugin surfaces are generator-owned: fix the generator, then re-render

## Context

The lesson was learned against the retired npm generation: a review reported a phantom
npm-script reference in root `package.json` (`check:claude` pointing at
`scripts/validate-claude-surfaces.mjs`, which did not exist), and a hand edit of the file
kept failing because `scripts/package-surfaces.mjs` baked that block and
`scripts/check-package-surfaces.mjs` diffed the file against generator output. Three
workers hit that trap in one session. The npm surfaces were retired the next day by
commit ebafe05d and are now gated dead (`check-plugin-surfaces.mjs` fails the commit if
`package.json`, `catalog/packages.json`, `catalog/skill-membership.json`, `packages/`, or
the old `scripts/package-surfaces.mjs` family reappear), but the ownership rule carried
over unchanged to the `plugin-surfaces` generators that replaced them.

## Guidance

The generator family owns these committed surfaces:

- the five registries `.claude-plugin/marketplace.json`, `.codex-plugin/marketplace.json`,
  `.cursor-plugin/marketplace.json`, `.grok-plugin/marketplace.json`,
  `.kimi-plugin/marketplace.json` (`surfacePlan()` in `scripts/plugin-surfaces.mjs`)
- `plugins/<plugin>/.claude-plugin/plugin.json`, `plugins/<plugin>/.codex-plugin/plugin.json`,
  `plugins/<plugin>/.cursor-plugin/plugin.json`, `plugins/<plugin>/.grok-plugin/plugin.json`,
  and `plugins/<plugin>/.kimi-plugin/plugin.json` (same function)
- `plugins/<plugin>/LICENSE` and `plugins/<plugin>/NOTICE` (byte copies of root `LICENSE`
  and authored `licenses/NOTICE`)
- `plugins/<plugin>/README.md` (`renderPluginReadme()`)
- the plugin table inside root `README.md` (`renderRootReadme()`; surrounding prose is
  authored and preserved across renders)
- `plugins/<plugin>/skills/<slug>/agents/openai.yaml`, derived from SKILL.md frontmatter by
  `scripts/render-skill-manifests.mjs`

The inputs are `catalog/plugins.json` (the one identity ledger), `LICENSE`,
`licenses/NOTICE`, and the skill tree itself (each entry's skills are read from its
`plugins/<plugin>/skills/` listing).

To change any of them: edit the generator or one of those inputs, run `just render` (or
`node scripts/render-skill-manifests.mjs` plus `node scripts/render-plugin-surfaces.mjs`),
and commit generator plus regenerated output together. Removing a plugin: delete its
`catalog/plugins.json` entry and re-render; `render-plugin-surfaces.mjs` does not prune a
dropped plugin's directory tree, so remove `plugins/<plugin>/` in the same change.
`check-plugin-surfaces.mjs` fails the commit when a `plugins/` directory has no catalog
entry, so a forgotten prune is caught rather than silently shipped. Check scripts verify
synchronization, not correctness: a defect present in both generator and output is
self-consistent and invisible to them.

## Why This Matters

Check hooks prove committed output matches the generator, not that either is correct. The
phantom-script defect lived in the generator, so every check passed while `npm run check`
failed on a clean checkout. Reviews flagging the output file are actually flagging the
generator.

## When to Apply

- Any edit request or review finding that lands on one of the generated surfaces above.
- Adding a plugin: append its `catalog/plugins.json` entry and run `just render`.
- Removing a plugin: delete the entry, delete `plugins/<plugin>/`, re-render.

## Examples

Wrong: delete a stale line from `plugins/odin-code/README.md` by hand. The next
`just render` restores it, and `node scripts/render-plugin-surfaces.mjs --check` flags the
interim mismatch.

Right: fix `renderPluginReadme()` (or the catalog entry feeding it) in
`scripts/plugin-surfaces.mjs`, run `just render`, commit both.

## Related

- `docs/solutions/build-errors/foundry-materialization-carries-source-identity.md` — sibling learning from the same release campaign.
