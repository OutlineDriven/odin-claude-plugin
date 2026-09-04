# Distribution surfaces

Verified 2026-09-01 against vendor specifications, vendor source code, vendor documentation, and the tools installed on this machine; the Codex manifest, Grok, and Kimi rows were verified 2026-09-03. Re-verify any row older than one release cycle.

## Purpose

This repository dropped npm distribution. It now ships one skill tree through exactly five harness surfaces, plus per-skill install:

1. The Claude Code plugin marketplace
2. The OpenAI Codex plugin marketplace
3. The Cursor plugin marketplace
4. The Grok plugin marketplace
5. The Kimi Code plugin marketplace

The Agent Plugins standard surface was retired on 2026-09-03; no root `plugins/<id>/plugin.json` ships anymore. This document records what each surface requires, the repository layout that satisfies all five at once, and the toolchain versions the gates run on.

## How to read the evidence

Each claim ends with a tag: `(Tier N, source, confidence)`.

Tiers:

- Tier 1: specification text, vendor source code, or a command executed locally, read or run verbatim.
- Tier 2: official vendor documentation, or the vendor release API on GitHub.
- Tier 3: release aggregator data (endoflife.date).
- Tier 4: official vendor changelog or forum announcement.

Confidence: Verified covers Tier 1 and Tier 2. Probable covers Tier 3 and Tier 4. Speculative means unconfirmed.

Corrections applied to earlier findings:

- The Claude Code manifest-authority field is `strict`, not `requireManifest`. Neither the vendor docs nor the schemastore schema contains `requireManifest`.
- The Cursor skills reference moved. `cursor.com/docs/reference/skills` no longer serves; the live page is `cursor.com/docs/skills`.
- "Repository doctrine pins the Node LTS" could not be confirmed. The tree pins no Node version. See the toolchain section.

## SKILL.md format

Skill files follow the Agent Skills specification (Tier 1, source: https://agentskills.io/specification, verified):

- `name`: required, 1 to 64 characters, lowercase alphanumerics and hyphens, no leading, trailing, or consecutive hyphens, and it must match the parent directory name.
- `description`: required, 1 to 1024 characters.
- `license`: optional.
- `compatibility`: optional, 1 to 500 characters.
- `metadata`: optional, a map from string keys to string values.
- `allowed-tools`: optional, a space-separated string, marked experimental.

## Codex marketplace

Codex reads repo marketplaces from the first of, in order: `.agents/plugins/marketplace.json`, `.agents/plugins/api_marketplace.json`, `.claude-plugin/marketplace.json`, `.cursor-plugin/marketplace.json`. The constant is `MARKETPLACE_MANIFEST_RELATIVE_PATHS` (Tier 1, source: openai/codex `codex-rs/core-plugins/src/marketplace.rs` lines 20-25, verified). The vendor docs describe `$REPO_ROOT/.agents/plugins/marketplace.json` as the repo-scoped list and call the `.claude-plugin/` layout "legacy-compatible" (Tier 2, source: https://developers.openai.com/plugins/build/plugins.md, verified).

This tree ships no `.agents/` directory, so Codex resolves `.claude-plugin/marketplace.json`. `.codex-plugin/marketplace.json` is not in the candidate list; it is generated as forward-compat and is inert today (Tier 1, source: repository files and `scripts/plugin-surfaces.mjs`, verified 2026-09-03).

### Marketplace entry

Entry fields, from the serde struct `RawMarketplaceManifestPlugin`: `name` (required), `source` (required), `policy` (default), `category` (default), plus flattened extra fields (Tier 1, source: marketplace.rs lines 984-994, verified).

- `source` may be a plain relative path string or an object. The docs show `"source": "local"` with `path`, and also plain-string local paths (Tier 2, source: https://developers.openai.com/plugins/build/plugins.md, verified).
- A local `path` must start with `./`, resolve against the marketplace root, and stay inside that root. The parser strips the `./` prefix, rejects paths whose components are not all `Normal`, and reports "local plugin source path must stay within the marketplace root" (Tier 1, source: marketplace.rs lines 661-685, verified).
- `policy.installation` values shown by the docs: `AVAILABLE`, `INSTALLED_BY_DEFAULT`, `NOT_AVAILABLE`. `policy.authentication` decides install-time or first-use auth (Tier 2, source: https://developers.openai.com/plugins/build/plugins.md, verified).

### Category: gap closed

`category` is a free string, not a validated enum. The deserializer types it `Option<String>`; `plugin_interface_with_marketplace_category` copies it verbatim into the interface with the comment "Marketplace taxonomy wins when both sources provide a category". No fixed set appears anywhere in the parsing path (Tier 1, source: marketplace.rs lines 939-948 and 986-992, verified). The docs say "Always include ... `category`" but enumerate no permitted values; their examples use `Productivity` (Tier 2, source: https://developers.openai.com/plugins/build/plugins.md, verified). The manifest parser defaults the derived interface category to `"Other"` when the marketplace gives none (Tier 1, source: `codex-rs/core-plugins/src/agent_plugin_manifest.rs`, verified).

### Manifest precedence

Per-plugin resolution order, from `find_plugin_manifest_path`:

1. Root `plugin.json`, when its `$schema` is an Agent Plugins URI. This tree ships no root manifests, so this step never fires here.
2. Otherwise the first existing file among `DISCOVERABLE_PLUGIN_MANIFEST_PATHS`: `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, `.cursor-plugin/plugin.json`.

(Tier 1, source: `codex-rs/utils/plugins/src/plugin_namespace.rs` and `codex-rs/exec-server-protocol/src/protocol.rs` lines 46-50, verified.)

With no root manifests, every plugin resolves through `.codex-plugin/plugin.json`, first in the list. That flips Codex from the AgentPlugin format to the Legacy format: the MCP default filename becomes `.mcp.json` with a dot, so a plugin shipping the dotless `mcp.json` must declare `mcpServers` explicitly or its MCP silently stops loading (Tier 1, source: `codex-rs/core-plugins/src/manifest.rs` and `DEFAULT_SKILLS_DIR_NAME` in `codex-rs/core-plugins/src/loader.rs` line 68, verified 2026-09-03).

### Legacy manifests in Codex

The Legacy deserializer is `RawPluginManifest` (`codex-rs/core-plugins/src/manifest.rs` lines 45-74): `rename_all = "camelCase"`, every field `#[serde(default)]`, no `deny_unknown_fields`, so unknown keys are ignored and every field is optional to the parser (Tier 1, source: manifest.rs, verified 2026-09-03).

- Skills default to `skills/` (`DEFAULT_SKILLS_DIR_NAME`, `codex-rs/core-plugins/src/loader.rs` line 68), so the generated manifests leave `skills` unset (Tier 1, verified 2026-09-03).
- `resolve_manifest_path` (manifest.rs lines 597-655) strips a leading `./` and warns-and-drops any `mcpServers` value without it, which is why the generated value is exactly `./mcp.json` (Tier 1, verified 2026-09-03).

Divergence worth recording: the published schemastore schema at `https://www.schemastore.org/codex-plugin-manifest.json` sets `additionalProperties: false` and does not list `$schema`, so a manifest carrying `$schema` invalidates its own file under that schema; it also requires `author`, `interface.longDescription`, `interface.developerName`, `interface.capabilities`, and `interface.defaultPrompt`, none of which the Rust deserializer requires. The generated manifests satisfy the deserializer, not that schema (Tier 1, source: the fetched schema and manifest.rs, verified 2026-09-03).

### Install commands

- `codex plugin add PLUGIN@MARKETPLACE` (Tier 1, source: `codex-rs/cli/src/plugin_cmd.rs`, `bin_name = "codex plugin add"`, value `PLUGIN[@MARKETPLACE]`, verified).
- `codex plugin marketplace add owner/repo` (Tier 1, source: `codex-rs/cli/src/marketplace_cmd.rs`, verified; Tier 2, source: https://developers.openai.com/plugins/build/plugins.md, verified).

## Claude Code marketplace

The registry is `.claude-plugin/marketplace.json` at the repository root. Required top-level fields: `name`, `owner` (`name` required; `email`, `url` optional), `plugins`. Each entry requires `name` and `source` (Tier 2, source: https://code.claude.com/docs/en/plugin-marketplaces, verified; Tier 2, source: https://json.schemastore.org/claude-code-marketplace.json, `required` arrays match, verified).

The schemastore schema `$schema` URL is `https://json.schemastore.org/claude-code-marketplace.json` (Tier 2, source: https://json.schemastore.org/claude-code-marketplace.json, verified).

### Plugin entries and sources

An in-repository plugin uses a relative path string starting with `./`. Paths resolve against the marketplace root, "which is the directory containing `.claude-plugin/`", not against `.claude-plugin/` itself (Tier 2, source: https://code.claude.com/docs/en/plugin-marketplaces, "Relative paths" section, verified).

### Per-plugin manifest

The per-plugin manifest is `.claude-plugin/plugin.json`. It is optional: without one, Claude Code discovers components in default locations and derives the plugin name from the directory name (Tier 2, source: https://code.claude.com/docs/en/plugins-reference, verified).

Correction: the field that controls manifest authority is `strict`, a marketplace-entry field, default true. The docs define it as "Controls whether `plugin.json` is the authority for component definitions (skills, agents, hooks, MCP servers, output styles)" (Tier 2, source: https://code.claude.com/docs/en/plugin-marketplaces, "Strict mode" section, verified). `requireManifest` appears in neither the docs nor the schemastore schema (Tier 2, sources: both, verified as absent).

Only `plugin.json` belongs inside `.claude-plugin/`: "All other directories (commands/, agents/, skills/, workflows/, output-styles/, themes/, monitors/, hooks/) must be at the plugin root" (Tier 2, source: https://code.claude.com/docs/en/plugins-reference, "File locations reference", verified).

Claude Code does not read the Agent Plugins root `plugin.json`. The docs describe only `.claude-plugin/plugin.json` as the manifest location, and the installed binary contains 15 occurrences of the string `.claude-plugin/plugin.json` and zero occurrences of `agent-plugins` (Tier 2, sources: https://code.claude.com/docs/en/plugins-reference and the installed `~/.local/share/claude/versions/2.1.251` binary, verified). String counts are evidence of absence, not proof; treat vendor adoption announcements as the trigger to re-check.

### Components

Manifest component path fields: `skills`, `commands`, `agents`, `workflows`, `hooks`, `mcpServers`, `outputStyles`, `lspServers`, `experimental.themes`, `experimental.monitors` (Tier 2, source: https://code.claude.com/docs/en/plugins-reference, "Component path fields" table, verified).

`skills` adds to the default scan: "The default `skills/` directory is always scanned, and directories listed in `skills` are loaded alongside it" (Tier 2, source: plugins-reference, "Path behavior rules", verified). `commands`, `agents`, `workflows`, `outputStyles`, and the experimental fields replace their defaults instead (Tier 2, source: plugins-reference, verified).

### MCP configuration

Claude Code reads plugin MCP configuration from `.mcp.json` at the plugin root by default, or inline in plugin.json (Tier 2, source: plugins-reference, "MCP servers" section, verified).

The manifest `mcpServers` field accepts a path: type `string|array|object`, described as "MCP config paths or inline config", example `"./my-extra-mcp-config.json"` (Tier 2, source: plugins-reference, "Component path fields" table, verified).

Shared-file claim, stated precisely: one shared `mcp.json` serves Claude Code, Codex, and Grok, but only through an explicit `mcpServers` entry, because all three default to the dotted `.mcp.json`. Without the manifest entry, none of the three loads the dotless file. Kimi takes the servers inline instead: its `mcpServers` is a server map, not a path, so the generator reads `mcp.json` and inlines its `mcpServers` value verbatim. Mechanism verified at Tier 2 for Claude Code and Tier 1 for Codex and Grok.

Repository state as read 2026-09-03: `plugins/odin-core/.claude-plugin/plugin.json`, `plugins/odin-core/.codex-plugin/plugin.json`, and `plugins/odin-core/.grok-plugin/plugin.json` all declare `"mcpServers": "./mcp.json"`, and `plugins/odin-core/.kimi-plugin/plugin.json` carries the inlined server map. No other plugin ships `mcp.json`, so the other 27 manifests omit the key. The renderers add the entry whenever a plugin ships an `mcp.json` (Tier 1, source: repository files and `scripts/plugin-surfaces.mjs`, verified 2026-09-03).

### Skill discovery

Plugin skills follow the `skills/<name>/SKILL.md` structure, one level deep. A single `SKILL.md` at the plugin root loads as a one-skill plugin when there is no `skills/` directory and no `skills` field (Tier 2, source: plugins-reference, verified). The docs document no recursive walk; Cursor, by contrast, documents one explicitly (see below).

### Install commands

`/plugin marketplace add owner/repo`, then `/plugin install name@marketplace` (Tier 2, source: https://code.claude.com/docs/en/plugin-marketplaces and https://code.claude.com/docs/en/discover-plugins, verified).

## Cursor marketplace

Plugin marketplace support arrived in Cursor 2.5, released 2026-02-17 (Tier 4, source: https://cursor.com/changelog/page/11 and https://forum.cursor.com/t/cursor-2-5-plugins/152124, probable).

### Registry file

The registry is one combined `.cursor-plugin/marketplace.json` at the repository root. Required: `name` (kebab-case), `owner` (`name` required, `email` optional), `plugins`. The plugins array takes at most 500 entries (Tier 2, source: https://cursor.com/docs/reference/plugins, "Marketplace manifest fields" table, verified).

### Formats

Cursor loads both formats, identified by manifest location (Tier 2, source: https://cursor.com/docs/reference/plugins, "Supported plugin formats" table, verified):

- Agent Plugins: root `plugin.json`, components skills and MCP servers. This tree ships no root manifests, so this format never fires here.
- Cursor Plugins: `.cursor-plugin/plugin.json`, components skills, MCP servers, rules, agents, commands, hooks, variables.

This tree ships the Cursor Plugins format only: `.cursor-plugin/plugin.json` declares identity alone and lets Cursor's defaults resolve `skills/` and the dotless `mcp.json` (Tier 1, source: repository files and `scripts/plugin-surfaces.mjs`, verified 2026-09-03).

Entry `source` is a relative path string or an object with `path` and options (Tier 2, source: "Plugin entry fields" table, verified). The submission checklist requires "All paths in manifest are relative and valid (no `..`, no absolute paths)" (Tier 2, source: same page, verified). Whether a bare `.` (the marketplace root itself) is rejected is not settled by the docs; see open questions.

### Skill discovery

Cursor walks a skills root recursively: "Cursor walks the skills root recursively and picks up any `SKILL.md` it finds" (Tier 2, source: https://cursor.com/docs/skills, "Nested skill directories", verified). This differs from the Claude Code documented shape, which names one level.

## Grok marketplace

Grok Build v1.0.13, released 2026-08-28 (Tier 1, source: the `xai-org/grok-build` repository main branch, verified 2026-09-03).

### Registry file

The registry is `.grok-plugin/marketplace.json` at the repository root. Grok probes the marketplace file first, then `.grok-plugin/plugin.json` as the second marketplace-index candidate, so that filename must never appear at the repository root (Tier 1, source: `crates/codegen/xai-grok-agent/src/plugins/index.rs`, verified 2026-09-03). This tree carries it only under `plugins/<id>/`, so there is no collision.

The local source discriminator is `type`, not `source`: the documented example is `{"type": "local", "path": "./plugins/gdrive"}` (Tier 2, source: `09-plugins.md` lines 191-205, verified 2026-09-03). The parser normalizes a `source`-tagged object too (`index.rs` lines 121-138), but the generated entries use the documented `type` spelling (Tier 1, verified 2026-09-03). A local `path` resolves against the marketplace root and rejects `..` and absolute paths (Tier 1, source: `types.rs` lines 40-89, verified 2026-09-03).

### Per-plugin manifest

`PluginManifest` (`crates/codegen/xai-grok-agent/src/plugins/manifest.rs` lines 119-155, `rename_all = "camelCase"`) requires `name` only; unknown fields are silently ignored (Tier 1, verified 2026-09-03).

- Skills default to the convention directory `skills/`, so the generated manifests leave `skills` unset.
- The MCP default filename is the dotted `.mcp.json` (Tier 1, source: `manifest.rs` lines 187-193, verified 2026-09-03), so a plugin shipping the dotless `mcp.json` must declare `mcpServers` explicitly; the gate asserts this.
- The name grammar rejects periods (Tier 1, source: `manifest.rs` lines 19-36, verified 2026-09-03): one of the two harnesses that forced the catalog id intersection.
- `owner` is `IndexOwner` `{name, email?}` with no `url` field, so the registry carries name only.
- Catalog tags map to `keywords`, not `tags`: Grok's `tags` are request matchers, while this catalog's tags are descriptive.

### Install commands

- `grok plugin marketplace add owner/repo` (Tier 2, source: vendor plugin docs, verified 2026-09-03).
- `grok plugin install owner/repo#subdir` selects one plugin subdirectory and combines with `@ref` (Tier 2, source: `09-plugins.md` line 74, verified 2026-09-03).

## Kimi marketplace

Kimi Code CLI `@moonshot-ai/kimi-code` 0.40.1, released 2026-09-02 (Tier 1, source: the npm package and its repository, verified 2026-09-03).

### Registry file

The registry is `.kimi-plugin/marketplace.json`, carrying `version: "2"` as in the vendor's documented example (Tier 2, source: vendor plugin docs, verified 2026-09-03). `resolveEntrySource` (`marketplace.ts` lines 236-249) resolves a relative source against the registry's own directory, which is `.kimi-plugin/`, so the generated sources read `../plugins/<id>` (Tier 1, verified 2026-09-03).

Served over https, the same relative source resolves to a raw URL that `parseGithubRepo` rejects because it requires exactly two path segments (`marketplace.ts` lines 292-304). Kimi therefore consumes this registry from a local clone: `/plugins marketplace <clone>/.kimi-plugin/marketplace.json` (Tier 1, verified 2026-09-03).

### No subdirectory installs

`/tree/<ref>` consumes its entire tail as a git ref (`packages/agent-core-v2/src/app/plugin/source.ts` lines 44-98), and codeload returns the whole-repo archive, so a GitHub URL cannot target one plugin directory (Tier 1, verified 2026-09-03). The Kimi lane is a local clone with absolute paths: `source.ts` lines 30-36 throw "Plugin root must be an absolute path" on a relative one (Tier 1, verified 2026-09-03).

### Per-plugin manifest

The name must match `^[a-z0-9][a-z0-9_-]{0,63}$` (`PLUGIN_NAME_REGEX`, `types.ts` line 196): periods rejected, the second harness behind the catalog id intersection (Tier 1, verified 2026-09-03).

- `skills` is mandatory. With `skills` absent Kimi does not fall back to `skills/`; it looks for a root `SKILL.md` and sets `rootSkillFallback` (Tier 1, source: `manifest.ts` lines 100-108, verified 2026-09-03), yielding zero skills. The gate asserts the key.
- `mcpServers` is an inline server map keyed by server name, not a path. The generator reads the shared `mcp.json` and inlines its `mcpServers` value; Kimi's zod schema strips the non-standard `alwaysLoad` key rather than erroring (Tier 1, verified 2026-09-03).
- `author` is read by `readAuthor` (`manifest.ts` lines 511-518) as `string | {name?, email?}`: no `url` field, so the generated value carries name only.
- `interface` accepts `displayName`, `shortDescription`, `longDescription`, `developerName`, `websiteURL`; the generated manifests emit the first two.

### Install commands

From a local clone (Tier 1, sources: `source.ts` and `marketplace.ts`, verified 2026-09-03):

- `/plugins marketplace <abs-clone>/.kimi-plugin/marketplace.json`
- `/plugins install <abs-clone>/plugins/<plugin>`

## Per-skill install with gh skill

`gh skill` is built into the GitHub CLI and is in preview: the command help states "Working with agent skills in the GitHub CLI is in preview and subject to change without notice" (Tier 1, source: `gh skill --help` on this machine, verified). Installed version: `gh version 2.98.0 (2026-08-20)` (Tier 1, source: `gh --version`, verified).

### Discovery conventions

`gh skill publish --help` enumerates exactly four conventions (Tier 1, source: `gh skill publish --help`, verified):

- `skills/*/SKILL.md`
- `skills/{scope}/*/SKILL.md`
- `*/SKILL.md` at root level
- `plugins/{scope}/skills/*/SKILL.md`

`gh skill install --help` states discovery follows the agentskills.io `skills/*/SKILL.md` convention "including when the `skills/` directory is nested under a prefix", and that an exact repository path "avoids a full tree traversal of the repository" (Tier 1, source: `gh skill install --help`, verified). The traversal shortcut matters for a repository with 614 skills.

### Publish validation

Validation checks, from the help text (Tier 1, source: `gh skill publish --help`, verified):

- Skill names match the strict agentskills.io naming rules.
- Each skill name matches its directory name.
- Required frontmatter fields `name` and `description` are present.
- `allowed-tools` is a string, not an array.
- Install metadata `metadata.github-*` is stripped.

### Dry-run result, 2026-09-04

Run 2026-09-04 against this tree at `releaseVersion` 2.1.0, when the tree held 614 skills in 28
plugins. The verbatim output is in `docs/specs/install-proof.md`; the shape:

Command: `gh skill publish --dry-run` from the repository root (Tier 1, source: local execution, verified).

- Exit code: 0.
- Skills discovered: 614, all under the `[plugins]` label, matching the 614 `plugins/<module>/skills/<slug>/` directories on disk.
- Warnings: 617 total.
  - 614 of type `recommended field missing: license`, one per skill.
  - 3 repository-level advisories: secret scanning not enabled, secret scanning push protection not enabled, no active tag protection rulesets.
- Final line: "Dry run complete. Use without --dry-run to publish."

### License decision

The tree carries no blanket per-skill `license` frontmatter field, and this is deliberate:

- The skill tree has mixed provenance. Third-party attribution lives in `licenses/` and `NOTICE` files.
- A uniform value would misstate the provenance of adapted skills.
- `license` is optional in the Agent Skills specification (Tier 1, source: https://agentskills.io/specification, verified).

The 614 warnings are advisory and do not fail the run.

## Repository layout

The current layout satisfies all five surfaces from one tree (Tier 1, source: repository files, verified 2026-09-03):

```
.
├── .claude-plugin/marketplace.json      # Claude Code: 28 entries, ./plugins/<module>
├── .codex-plugin/marketplace.json       # Codex format, forward-compat (Codex reads .claude-plugin/)
├── .cursor-plugin/marketplace.json      # Cursor: 28 entries, ./plugins/<module>
├── .grok-plugin/marketplace.json        # Grok: 28 entries, {type: local, path}
├── .kimi-plugin/marketplace.json        # Kimi: 28 entries, ../plugins/<module>
├── plugins/
│   └── <module>/                        # 28 modules
│       ├── .claude-plugin/plugin.json   # Claude Code manifest
│       ├── .codex-plugin/plugin.json    # Codex Legacy manifest
│       ├── .cursor-plugin/plugin.json   # Cursor manifest, identity only
│       ├── .grok-plugin/plugin.json     # Grok manifest
│       ├── .kimi-plugin/plugin.json     # Kimi manifest, skills declared
│       ├── mcp.json                     # optional; only odin-core ships one
│       └── skills/<slug>/SKILL.md       # 614 skills total
├── catalog/                             # registry and membership data
├── scripts/                             # dependency-free Node ESM and stdlib Python
├── Justfile                             # render, check, validate-skills, verify
└── .pre-commit-config.yaml              # gate hooks, run by prek
```

Why this shape works for each surface:

- Claude Code reads `.claude-plugin/marketplace.json`; each `./plugins/<module>` source resolves from the repository root; skills are discovered one level deep.
- Codex reads `.claude-plugin/marketplace.json` (its candidate list holds no `.codex-plugin/` entry); entries use `{"source": "local", "path": "./plugins/<module>"}` with `policy` and `category`. Each plugin resolves through `.codex-plugin/plugin.json` in Legacy format, first in `DISCOVERABLE_PLUGIN_MANIFEST_PATHS`.
- Cursor reads `.cursor-plugin/marketplace.json` with the same relative sources, and would walk each `skills/` root recursively if nested skills ever appear.
- Grok reads `.grok-plugin/marketplace.json` with `{"type": "local", "path": "./plugins/<module>"}` sources resolving against the marketplace root.
- Kimi reads `.kimi-plugin/marketplace.json` from a local clone; each `../plugins/<module>` source resolves against the registry's own directory.
- `gh skill` discovers the fourth convention `plugins/{scope}/skills/*/SKILL.md`, so per-skill install works without any manifest.

## Toolchain set

All versions read 2026-09-03. Harness-surface rows re-verified that day; the remaining rows below are unchanged since 2026-09-01.

| Tool | Pin or line | Current | Released | End of support | Source and tier |
|---|---|---|---|---|---|
| Node.js | LTS line 24 is the project line | 24.20.0 | 2026-08-26 | 2028-04-30 | (Tier 3, source: https://endoflife.date/api/v1/products/nodejs/, probable) |
| Node.js, this machine | none | v26.8.1, Current, not LTS; line 26 becomes LTS 2026-10-28 | | | (Tier 1, source: `node --version`, verified 2026-09-03; Tier 3, source: endoflife.date, probable) |
| Python | 3.14 is the project line | 3.14.7 | 2026-08-05 | 2030-10-31 | (Tier 3, source: https://endoflife.date/api/v1/products/python/, probable) |
| Python, this machine | | 3.14.7, equals current | | | (Tier 1, source: `python3 --version`, verified) |
| prek | gate runner | 0.5.1 | | | (Tier 1, source: `prek --version`, verified 2026-09-03; release notes not re-read) |
| pre-commit/pre-commit-hooks | pinned v6.0.0 | v6.0.0, equals latest | 2025-08-09 | | (Tier 2, source: https://github.com/pre-commit/pre-commit-hooks/releases, verified) |
| tombi-toml/tombi-pre-commit | pinned v1.1.3, raising to v1.5.0 | v1.5.0, not a prerelease | 2026-08-29 | | (Tier 2, source: https://github.com/tombi-toml/tombi-pre-commit/releases, verified) |

Notes:

- prek is the only gate runner. `.pre-commit-config.yaml` opens with "Run the whole set with: prek run --all-files", and the Justfile `check` task calls `prek run --all-files` (Tier 1, source: repository files, verified).
- tombi hook ids `tombi-lint` and `tombi-format` are byte-identical in `.pre-commit-hooks.yaml` at tags v1.1.3 and v1.5.0, so the pin raise changes no hook interface (Tier 1, source: raw.githubusercontent.com at both tags, verified).
- The repository has no runtime dependencies. The Justfile states it: "There is no package manager here: every script is dependency-free Node ESM or standard-library Python, and nothing is published to a package registry." An import audit agrees: every `scripts/*.mjs` import resolves to a `node:` builtin, and `scripts/sync-baseline.py` imports only `argparse`, `sys`, and `pathlib` (Tier 1, source: Justfile and scripts imports, verified).
- No Node version is pinned, and there is no enforcement point: the repository has no CI, no build,
  and no `engines` field to read. Every script imports `node:` builtins only, so the real floor is
  whatever ships `node:fs`, `node:path`, and `node:url`, which is every supported line. The earlier
  claim of a Node 24 doctrine pin is withdrawn (Tier 1, source: repository files, verified absent).

## Open questions

1. Cursor marketplace entry `source`: does the parser reject a bare `.` (the marketplace root itself)? The docs reject `..` and absolute paths but say nothing about `.`. Attempted at Tier 2 (full plugins reference, plugin-template README) and web search. Cursor's parser is not public, so this needs a live probe against Cursor 2.5 or later.
2. Claude Code and an unknown `policy` entry field: `policy` in `.claude-plugin/marketplace.json` entries is schema-valid and honored by Codex's path-agnostic parser, but not verified against Claude Code's runtime loader, which may warn. If it warns, drop the key from `renderClaudeMarketplace` and accept Codex's `ON_INSTALL` default.
3. Cursor marketplace load. `cursor-agent plugin marketplace add` accepts a git repository URL
   only, and rejects a local path, so the Cursor surface cannot be exercised until this branch
   reaches the remote. `docs/specs/install-proof.md` records the rejection verbatim. The registry
   itself is generated to the documented schema and gated by `check-plugin-surfaces`.
4. Cursor's MCP file shape: the docs name `mcp.json` as the default MCP path but do not state whether the `mcpServers` wrapper object or a bare server map is expected. Needs a live probe against Cursor 2.5 or later. Fallback if it fails: declare `"mcpServers": "./mcp.json"` in the Cursor manifest for plugins shipping `mcp.json`.

Two questions from the first draft are now closed against the tree rather than left open. Node
carries no pin and no enforcement point, which the toolchain section states outright. Claude Code
does load the shared MCP file, because `plugins/odin-core/.claude-plugin/plugin.json` declares
`"mcpServers": "./mcp.json"`.
