# Repository contract

## Repository file

Edit `AGENTS.md`, never `CLAUDE.md`. `CLAUDE.md` is a symlink, so replacing it forks the two files.

## Canonical baseline

Make every persona or doctrine change in `system-prompt-baseline.md` first. It is the source of truth.

Propagate each canonical change to all six output styles: `axiom-mode.md`, `builder.md`, `duet.md`, `linus.md`, `odin.md`, and `benchmark.md` under `plugins/odin-core/output-styles/`. The Claude Code loader does not resolve references, so each style must embed the full baseline at its tail. Keep the span from the charter `<role>` through EOF byte-identical to `system-prompt-baseline.md` from `<role>` onward.

Perform propagation as one operation with one agent and one diff scope; never divide it by style.

Use the baseline generator; never hand-propagate the cascade:

1. Edit `system-prompt-baseline.md` without changing an output style below its charter `<role>`.
2. Run `python3 scripts/sync-baseline.py`. It replaces each style from its second `<role>` through EOF and preserves the persona preamble above it.
3. Run `python3 scripts/sync-baseline.py --check`. Exit 0 means all styles match; exit 1 names drifted files; exit 2 means the canonical file or a required two-`<role>` layout is missing.
4. Stage and commit the canonical file and all six styles together.

Never hand-edit `plugins/odin-core/output-styles/benchmark.md`. Its margin-runner v0.5.5 header marks it as generated. The baseline generator may change only the embedded cascade below the runner preamble; a hand edit above that region requires explicit user authorization.

## Submodule publishing

Commit and push from this repository, not its parent `~/.claude`, because this tree is a Git
submodule. From this repository's root, use plain `git push origin main`.

Plain `git push` only. Force-push is denied: `git push -f`, `--force`, and every
`--force-with-lease*` variant are blocked at the Claude permissions layer. The denial covers the
lease variants too, because a lease protects the remote from a stale overwrite and protects nothing
from a rewrite you intended. On a branch with an open pull request, rewriting history strands every
inline review comment on commits that no longer exist.

A push that only adds commits needs no flag. If a push is rejected as non-fast-forward, the answer
is to fetch and rebase or to ask, never to reach for a force variant.

## The skill tree

A skill is authored once, at `plugins/<plugin>/skills/<slug>/SKILL.md`. That path is its only home, and the directory states which plugin owns the skill. Do not add a membership registry, a second skill tree, or a per-plugin copy: the earlier model kept all three in sync and each one drifted.

Adding a skill means creating `plugins/<plugin>/skills/<slug>/SKILL.md` and running `just render`.

Moving a skill between plugins means moving its directory. Nothing else records membership.

Agent Plugins fixes components at the plugin root, so a skill nested deeper than `skills/<slug>/` never loads. `check-plugin-surfaces` fails on a nested `SKILL.md` for that reason.

## Distribution surfaces

Four surfaces are supported, and no others: the Agent Plugins standard, the Claude Code marketplace, the Codex marketplace, and the Cursor marketplace. Nothing is published to a package registry, and no npm artifact belongs in this tree. `check-plugin-surfaces` fails if one returns.

`catalog/plugins.json` owns plugin identity: name, description, category, tags, and directory. Every manifest and registry is generated from it. Keep every plugin and marketplace version at the single `releaseVersion` literal `2.0.0`; never bump only some manifests.

Treat these as generator-owned and never hand-edit them:

- `plugins/*/plugin.json`, `plugins/*/.claude-plugin/plugin.json`, `plugins/*/README.md`, `plugins/*/LICENSE`, `plugins/*/NOTICE`
- `.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.json`, `.cursor-plugin/marketplace.json`
- `plugins/*/skills/*/agents/openai.yaml`

To change one, change its generator or `catalog/plugins.json`, run `just render`, and commit input and output together.

The Agent Plugins manifest schema is closed and forbids declaring component locations. Do not add `skills`, `mcpServers`, `commands`, `agents`, `hooks`, or `paths` to a root `plugin.json`; the specification fixes those locations and the gate rejects them.

Do not change `releaseVersion` for tooling-only changes such as pre-commit hooks or formatter configuration, or for edits to this file. Do not add or backfill `CHANGELOG.md` entries for routine version work.

## Skill metadata

Frontmatter carries `name` and `description` and little else. `name` must equal the directory name, or `gh skill install` drops the skill. `description` must state a trigger a model can route on, and `check-skill-routes` fails a description that states none.

Single-quote every frontmatter value containing `: `. Strict YAML parsers reject an unquoted colon-space even though Claude Code's loader accepts it, so it ships silently broken. `check-skill-routes` treats it as an error, not a normalization.

Do not add a `license` field to a skill. This tree has mixed provenance and attribution lives in `licenses/NOTICE`; a uniform value would misstate the provenance of adapted skills.

`scripts/render-skill-manifests.mjs` derives each `agents/openai.yaml` from frontmatter: `interface.display_name` is the title-cased name with an in-script acronym table, and `interface.short_description` is the first sentence of the description, truncated at 64 characters and failed, never padded, under 25.

## Verification

```shell
just check     # all five gates
just verify    # gates, prek hooks, and Agent Skills validation
```

`just validate-skills` runs `gh skill publish --dry-run`, which validates every skill against the Agent Skills specification: strict naming, name matching its directory, required frontmatter, `allowed-tools` as a string, and no leftover install metadata.

Do not invent language test commands or add CI without an explicit request; this repository has no build, no unit-test suite, and no GitHub Actions workflow.

Test persona or doctrine changes in a fresh Claude Code session. The canonical baseline and output styles load only at session start, so the current session cannot verify them.

## External harness carriers

Propagate every shared doctrine change to `~/.codex/AGENTS.md` and `~/.omp/agent/AGENTS.md`. The baseline generator does not update these external harness carriers.

Preserve each carrier's harness-specific `<code_tools>` layer and tool names. Codex shells out through `rtk`; omp and Claude Code provide native file tools. Tool-layer differences are intentional, but shared rules must match `system-prompt-baseline.md`.

Edit both carriers in place. Never commit them from this repository, and never stage `~/.codex/config.toml`; their owning repositories live outside this submodule.

## Writing style

Write content under this tree so each section is independently actionable. State a needed rule where the reader needs it instead of pointing backward with phrases such as "as discussed earlier", "see above", or "previously noted".

Prefer a short repeated rule to a decorative inter-file pointer. Use a cross-reference only when the target itself is required for correct behavior, such as the byte-identical canonical baseline span.

## Voice

Every skill in this tree is authored in one register, set by the ODIN doctrine in
`system-prompt-baseline.md` and the spine taste anchors. `docs/specs/voice.md` is the contract:
the ten anchors, the two-sided ban list covering slop and overkill, and the thresholds a script
can measure.

The spine itself is user-private, at `~/.claude/skills/spine/`. Read it when authoring; never
edit it from this repository, and never vendor a copy into this tree. `docs/specs/voice.md`
carries what an editor needs without loading it.

`scripts/check-voice.py` enforces the measurable half over every `SKILL.md`, skill reference,
`docs/` page, and this file. It fails on two or more consecutive `**Label**:` lines where a list
or table belongs, five or more em or en dashes inside 600 characters, a heading capitalizing a
minor word past the first position, AI-marker vocabulary, and curly quotes. It strips fenced
blocks and inline spans first, so a shell flag or code sample never trips it.

Passing the gate is not passing the register. The script sees formatting tells, not absent
conviction; whether a section earns its place is the spine audit's judgment, not a regular
expression's.
