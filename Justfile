# Task runner for the ODIN skill marketplace.
#
# There is no package manager here: every script is dependency-free Node ESM or
# standard-library Python, and nothing is published to a package registry.
# Plugins install straight from this repository through four surfaces.

# Show the available tasks.
default:
    @just --list

# Regenerate every generated file: skill manifests, plugin manifests, registries.
render:
    node scripts/render-skill-manifests.mjs
    node scripts/render-plugin-surfaces.mjs

# Run every gate. This is what CI and the pre-commit hooks run.
check:
    node scripts/render-skill-manifests.mjs --check
    node scripts/render-plugin-surfaces.mjs --check
    node scripts/check-plugin-surfaces.mjs
    node scripts/check-skill-routes.mjs
    python3 scripts/sync-baseline.py --check
    python3 scripts/check-voice.py --self-test
    python3 scripts/check-voice.py

# Validate every skill against the Agent Skills specification with the GitHub CLI.
validate-skills:
    gh skill publish --dry-run

# Run the formatting and lint hooks over the whole tree.
hooks:
    prek run --all-files

# Everything a change must pass before it is committed.
verify: check hooks validate-skills
