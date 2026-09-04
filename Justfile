# Task runner for the ODIN skill marketplace.
#
# There is no package manager here: every script is dependency-free Node ESM or
# standard-library Python, and nothing is published to a package registry.
# Plugins install straight from this repository through five distribution surfaces.

# Show the available tasks.
default:
    @just --list

# Regenerate every generated file: skill manifests, plugin manifests, registries, skill index.
render:
    node scripts/render-skill-manifests.mjs
    node scripts/render-plugin-surfaces.mjs
    node scripts/render-skill-index.mjs

# Mirror every skill into the outline repository as a flat Devin skill tree.
#
# Deliberately not part of `render`: this writes into a sibling checkout rather than
# this tree, and a generator that reaches outside the repository has to be asked for.
sync-outline:
    node scripts/sync-outline-skills.mjs

# Run every gate over the whole tree.
#
# This delegates rather than re-enumerating. The gate set lives in
# .pre-commit-config.yaml, and a second copy here drifted: it was missing both
# frontmatter gates while claiming to be what the hooks run, so `just check`
# passed on the defect those gates exist to catch. One list, no drift.
#
# The doctrine hook resyncs the output-style cascade when it has drifted, so this
# can leave the tree modified. `git status` shows what it repaired.
check:
    prek run --all-files

# Validate every skill against the Agent Skills specification with the GitHub CLI.
validate-skills:
    gh skill publish --dry-run

# Everything a change must pass before it is committed.
verify: check validate-skills

# Manual carrier sync, never a hook: a hook that rewrites home-directory files
# on every commit would fire on machines with no carriers to repair.
sync-carriers:
    python3 scripts/sync-carriers.py

sync-carriers-check:
    python3 scripts/sync-carriers.py --check
