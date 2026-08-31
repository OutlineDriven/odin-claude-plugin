# Repository contract

## Repository file

Edit `AGENTS.md`, never `CLAUDE.md`. `CLAUDE.md` is a symlink, so replacing it forks the two files.

## Canonical baseline

Make every persona or doctrine change in `system-prompt-baseline.md` first. It is the source of truth.

Propagate each canonical change to all six output styles: `axiom-mode.md`, `builder.md`, `duet.md`, `linus.md`, `odin.md`, and `benchmark.md` under `packages/odin-core/output-styles/`. The Claude Code loader does not resolve references, so each style must embed the full baseline at its tail. Keep the span from the charter `<role>` through EOF byte-identical to `system-prompt-baseline.md` from `<role>` onward.

Perform propagation as one operation with one agent and one diff scope; never divide it by style.

Use the baseline generator; never hand-propagate the cascade:

1. Edit `system-prompt-baseline.md` without changing an output style below its charter `<role>`.
2. Run `python3 scripts/sync-baseline.py`. It replaces each style from its second `<role>` through EOF and preserves the persona preamble above it.
3. Run `python3 scripts/sync-baseline.py --check`. Exit 0 means all styles match; exit 1 names drifted files; exit 2 means the canonical file or a required two-`<role>` layout is missing.
4. Stage and commit the canonical file and all six styles together.

Never hand-edit `packages/odin-core/output-styles/benchmark.md`. Its margin-runner v0.5.5 header marks it as generated. The baseline generator may change only the embedded cascade below the runner preamble; a hand edit above that region requires explicit user authorization.

## Submodule publishing

Commit and push from this repository, not its parent `~/.claude`, because this tree is a Git submodule. From this repository's root, use plain `git push origin main`.

## Package surfaces

Keep every public package, plugin, and marketplace version at the single `releaseVersion` literal `2.0.0`; never bump only some manifests. `catalog/packages.json` owns package identity.

Treat the following generated files as generator-owned:

- `scripts/render-package-surfaces.mjs` and `scripts/check-package-surfaces.mjs` own the 29 committed package roots, the root `package.json` script block, and the shared Claude/OMP catalog.
- `scripts/render-package-provenance.mjs` owns the 29 `PROVENANCE.md` files.

Never hand-edit a generator-owned surface. Change its generator or catalog input, rerun the renderer, and commit the input and rendered output together. Do not create another authored skill tree under `packages/*/skills`.

Do not change `releaseVersion` for tooling-only changes such as pre-commit hooks or formatter configuration, or for edits to this file. Do not add or backfill `CHANGELOG.md` entries for routine version work.

## Skill metadata

Single-quote every `SKILL.md` frontmatter value that contains `: `, including `description` and `metadata.short-description`. Strict YAML parsers reject an unquoted colon-space even though Claude Code's loader accepts it. `scripts/check-skill-routes.mjs` enforces this at commit time: an unquoted colon-space is an error, not a silent normalization.

`agents/openai.yaml` is generated, not hand-authored. `scripts/render-skill-manifests.mjs` derives every manifest from SKILL.md frontmatter: `interface.display_name` is the title-cased name with an in-script acronym table (api→API, ci→CI, gh→GH, …); `interface.short_description` is the first sentence of `description`, hard-truncated at 64 chars on overflow and failed, not padded, under 25. Adding a skill means adding `SKILL.md` and running the generator (`node scripts/render-skill-manifests.mjs`); the prek hook `render-skill-manifests --check` fails on any drift between frontmatter and the on-disk manifest. Do not hand-edit a manifest; change the frontmatter and rerun the generator.

`scripts/check-skill-routes.mjs` is the commit-time identity gate. It checks that each directory name equals its frontmatter `name`, equals a registry row slug, and equals the manifest identity; that `catalog/provenance-rows.json` count is consistent (`rows.length` == `skill_count` == directory count); and that every `display_name` is unique across all manifests (Set collision check). Edit the registry rows and `skill_count` in the same commit that touches `skills/`.

## Verification

Run `prek run --all-files` as the sole repository gate. Do not invent language test commands or add CI without an explicit request; this repository has no build, unit-test suite, or GitHub Actions workflow.

Test persona or doctrine changes in a fresh Claude Code session. The canonical baseline and output styles load only at session start, so the current session cannot verify them.

## External harness carriers

Propagate every shared doctrine change to `~/.codex/AGENTS.md` and `~/.omp/agent/AGENTS.md`. The baseline generator does not update these external harness carriers.

Preserve each carrier's harness-specific `<code_tools>` layer and tool names. Codex shells out through `rtk`; omp and Claude Code provide native file tools. Tool-layer differences are intentional, but shared rules must match `system-prompt-baseline.md`.

Edit both carriers in place. Never commit them from this repository, and never stage `~/.codex/config.toml`; their owning repositories live outside this submodule.

## Writing style

Write content under this tree so each section is independently actionable. State a needed rule where the reader needs it instead of pointing backward with phrases such as "as discussed earlier", "see above", or "previously noted".

Prefer a short repeated rule to a decorative inter-file pointer. Use a cross-reference only when the target itself is required for correct behavior, such as the byte-identical canonical baseline span.
