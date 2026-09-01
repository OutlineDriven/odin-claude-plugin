# Distribution surfaces

Verified 2026-09-01 against vendor specifications, vendor source code, vendor documentation, and the tools installed on this machine. Re-verify any row older than one release cycle.

## Purpose

This repository dropped npm distribution. It now ships one skill tree through exactly four surfaces, plus per-skill install:

1. Agent Plugins 1.0.0, the vendor-neutral standard
2. The Claude Code plugin marketplace
3. The OpenAI Codex plugin marketplace
4. The Cursor plugin marketplace

This document records what each surface requires, the repository layout that satisfies all four at once, and the toolchain versions the gates run on.

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

## Agent Plugins 1.0.0

The specification repository is `github.com/agentplugins/agent-plugins-spec` (Tier 1, source: https://github.com/agentplugins/agent-plugins-spec, verified). Its README states: "Agent Plugins Specification 1.0.0 is the current published release. Agent Plugins Specification 1.1.0 is a working draft" (Tier 1, source: README.md lines 7-9 in that repository, verified).

### Manifest

The manifest is `plugin.json` at the plugin root (Tier 1, source: spec/1.0.0.md sections 4 and 5, verified).

The 1.0.0 schema is closed. Its `$id` is `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`, it sets `additionalProperties: false` at the top level and inside `author`, and `required` is `["$schema", "name"]` (Tier 1, source: schemas/1.0.0/plugin.schema.json in the spec repository, verified).

Permitted top-level fields, and no others: `$schema`, `name`, `version`, `description`, `author`, `homepage`, `repository`, `license`, `keywords`, `extensions` (Tier 1, source: schemas/1.0.0/plugin.schema.json, verified).

- `$schema` is required and is a `const` of the 1.0.0 URI (Tier 1, source: plugin.schema.json, verified).
- `author` MAY contain only `name`, `email`, `url`, each a string (Tier 1, source: spec/1.0.0.md section 5.4, verified).

The `name` constraints: 1 to 64 characters; lowercase alphanumerics, periods, and hyphens only; must start and end alphanumeric; no consecutive `--` or `..`. The schema pattern is `^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$` (Tier 1, source: spec/1.0.0.md section 5.5 and plugin.schema.json, verified).

The `extensions` field holds client-specific data keyed by reverse-domain namespace. Agent Plugins assigns no semantics to namespace contents (Tier 1, source: spec/1.0.0.md sections 5.6 and 8, verified).

### Component locations

Component locations are fixed. The specification says: "`plugin.json` cannot override these locations or contain inline component configuration." Skills live at `skills/`, MCP servers at `mcp.json` (Tier 1, source: spec/1.0.0.md section 6.1, verified). MCP config "MUST NOT be declared inline in `plugin.json` or loaded from any alternative core path" (Tier 1, source: spec/1.0.0.md section 7.2, verified).

### Skill discovery

Discovery reads only the immediate children of `skills/`: "Each immediate child directory containing a path named exactly `SKILL.md` ... is treated as one skill. Clients MUST NOT recursively search deeper descendants for additional skills" (Tier 1, source: spec/1.0.0.md section 7.1, verified).

### SKILL.md format

Skill files follow the Agent Skills specification (Tier 1, source: https://agentskills.io/specification, verified):

- `name`: required, 1 to 64 characters, lowercase alphanumerics and hyphens, no leading, trailing, or consecutive hyphens, and it must match the parent directory name.
- `description`: required, 1 to 1024 characters.
- `license`: optional.
- `compatibility`: optional, 1 to 500 characters.
- `metadata`: optional, a map from string keys to string values.
- `allowed-tools`: optional, a space-separated string, marked experimental.

## Codex marketplace

Codex reads repo marketplaces from the first of, in order: `.agents/plugins/marketplace.json`, `.agents/plugins/api_marketplace.json`, `.claude-plugin/marketplace.json`, `.cursor-plugin/marketplace.json`. The constant is `MARKETPLACE_MANIFEST_RELATIVE_PATHS` (Tier 1, source: openai/codex `codex-rs/core-plugins/src/marketplace.rs` lines 20-25, verified). The vendor docs describe `$REPO_ROOT/.agents/plugins/marketplace.json` as the repo-scoped list and call the `.claude-plugin/` layout "legacy-compatible" (Tier 2, source: https://developers.openai.com/plugins/build/plugins.md, verified).

### Marketplace entry

Entry fields, from the serde struct `RawMarketplaceManifestPlugin`: `name` (required), `source` (required), `policy` (default), `category` (default), plus flattened extra fields (Tier 1, source: marketplace.rs lines 984-994, verified).

- `source` may be a plain relative path string or an object. The docs show `"source": "local"` with `path`, and also plain-string local paths (Tier 2, source: https://developers.openai.com/plugins/build/plugins.md, verified).
- A local `path` must start with `./`, resolve against the marketplace root, and stay inside that root. The parser strips the `./` prefix, rejects paths whose components are not all `Normal`, and reports "local plugin source path must stay within the marketplace root" (Tier 1, source: marketplace.rs lines 661-685, verified).
- `policy.installation` values shown by the docs: `AVAILABLE`, `INSTALLED_BY_DEFAULT`, `NOT_AVAILABLE`. `policy.authentication` decides install-time or first-use auth (Tier 2, source: https://developers.openai.com/plugins/build/plugins.md, verified).

### Category: gap closed

`category` is a free string, not a validated enum. The deserializer types it `Option<String>`; `plugin_interface_with_marketplace_category` copies it verbatim into the interface with the comment "Marketplace taxonomy wins when both sources provide a category". No fixed set appears anywhere in the parsing path (Tier 1, source: marketplace.rs lines 939-948 and 986-992, verified). The docs say "Always include ... `category`" but enumerate no permitted values; their examples use `Productivity` (Tier 2, source: https://developers.openai.com/plugins/build/plugins.md, verified). The manifest parser defaults the derived interface category to `"Other"` when the marketplace gives none (Tier 1, source: `codex-rs/core-plugins/src/agent_plugin_manifest.rs`, verified).

### Manifest precedence

Per-plugin resolution order, from `find_plugin_manifest_path`:

1. Root `plugin.json`, when its `$schema` is an Agent Plugins URI (supported or recognized-but-unsupported).
2. Otherwise the first existing file among `DISCOVERABLE_PLUGIN_MANIFEST_PATHS`: `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, `.cursor-plugin/plugin.json`.

(Tier 1, source: `codex-rs/utils/plugins/src/plugin_namespace.rs` and `codex-rs/exec-server-protocol/src/protocol.rs` lines 46-50, verified.)

### Agent Plugins manifests in Codex

When Codex parses a root Agent Plugins manifest, it hardcodes `skills: "./skills"` and `mcpServers: "./mcp.json"`, and derives a default interface: displayName from `name`, shortDescription and longDescription from `description`, developerName from `author.name`, category `"Other"`, websiteUrl from `homepage` (Tier 1, source: `parse_agent_plugin_manifest_uri` in `codex-rs/core-plugins/src/agent_plugin_manifest.rs`, verified).

`extensions["com.openai"]` is parsed as a legacy Codex manifest by `apply_codex_agent_plugin_extension`. It supplies `paths.apps` and `paths.hooks`, and when it carries an `interface`, that interface replaces the derived one (`if extension.interface.is_some() { resolved.interface = extension.interface; }`). Interface field names are camelCase (`rename_all = "camelCase"`): displayName, shortDescription, longDescription, developerName, category, websiteUrl (Tier 1, source: agent_plugin_manifest.rs, verified).

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

Shared-file claim, stated precisely: one shared file serves Claude Code and Agent Plugins clients,
but only through an explicit `mcpServers` entry, because the two surfaces fix different default
filenames. Agent Plugins requires `mcp.json`; Claude Code defaults to `.mcp.json`. Without the
manifest entry, Claude Code does not load `mcp.json`. Mechanism verified at Tier 2.

Repository state as read 2026-09-01: `plugins/odin-core/.claude-plugin/plugin.json` declares
`"mcpServers": "./mcp.json"`, so Claude Code loads the same file the Agent Plugins clients read.
No `plugins/*/plugin.json` declares `mcpServers`, which is correct: the Agent Plugins schema
forbids it. `renderClaudePluginManifest` adds the entry whenever a plugin ships an `mcp.json`
(Tier 1, source: repository files and `scripts/plugin-surfaces.mjs`, verified).

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

- Agent Plugins: root `plugin.json`, components skills and MCP servers.
- Cursor Plugins: `.cursor-plugin/plugin.json`, components skills, MCP servers, rules, agents, commands, hooks, variables.

Entry `source` is a relative path string or an object with `path` and options (Tier 2, source: "Plugin entry fields" table, verified). The submission checklist requires "All paths in manifest are relative and valid (no `..`, no absolute paths)" (Tier 2, source: same page, verified). Whether a bare `.` (the marketplace root itself) is rejected is not settled by the docs; see open questions.

### Skill discovery

Cursor walks a skills root recursively: "Cursor walks the skills root recursively and picks up any `SKILL.md` it finds" (Tier 2, source: https://cursor.com/docs/skills, "Nested skill directories", verified). This differs from the Claude Code documented shape, which names one level.

## Per-skill install with gh skill

`gh skill` is built into the GitHub CLI and is in preview: the command help states "Working with agent skills in the GitHub CLI is in preview and subject to change without notice" (Tier 1, source: `gh skill --help` on this machine, verified). Installed version: `gh version 2.98.0 (2026-08-20)` (Tier 1, source: `gh --version`, verified).

### Discovery conventions

`gh skill publish --help` enumerates exactly four conventions (Tier 1, source: `gh skill publish --help`, verified):

- `skills/*/SKILL.md`
- `skills/{scope}/*/SKILL.md`
- `*/SKILL.md` at root level
- `plugins/{scope}/skills/*/SKILL.md`

`gh skill install --help` states discovery follows the agentskills.io `skills/*/SKILL.md` convention "including when the `skills/` directory is nested under a prefix", and that an exact repository path "avoids a full tree traversal of the repository" (Tier 1, source: `gh skill install --help`, verified). The traversal shortcut matters for a repository with 613 skills.

### Publish validation

Validation checks, from the help text (Tier 1, source: `gh skill publish --help`, verified):

- Skill names match the strict agentskills.io naming rules.
- Each skill name matches its directory name.
- Required frontmatter fields `name` and `description` are present.
- `allowed-tools` is a string, not an array.
- Install metadata `metadata.github-*` is stripped.

### Dry-run result, this machine, 2026-09-01

Command: `gh skill publish --dry-run` from the repository root (Tier 1, source: local execution, verified).

- Exit code: 0.
- Skills discovered: 657, all under the `[plugins]` label, matching the 657 `plugins/<module>/skills/<slug>/` directories on disk.
- Warnings: 660 total.
  - 657 of type `recommended field missing: license`, one per skill.
  - 3 repository-level advisories: secret scanning not enabled, secret scanning push protection not enabled, no active tag protection rulesets.
- Final line: "Dry run complete. Use without --dry-run to publish."

### License decision

The tree carries no blanket per-skill `license` frontmatter field, and this is deliberate:

- The skill tree has mixed provenance. Third-party attribution lives in `licenses/` and `NOTICE` files.
- A uniform value would misstate the provenance of adapted skills.
- `license` is optional in the Agent Skills specification (Tier 1, source: https://agentskills.io/specification, verified).

The 657 warnings are advisory and do not fail the run.

## Repository layout

The current layout satisfies all four surfaces from one tree (Tier 1, source: repository files, verified):

```
.
├── .agents/plugins/marketplace.json     # Codex: 28 entries, local source objects
├── .claude-plugin/marketplace.json      # Claude Code: 28 entries, ./plugins/<module>
├── .cursor-plugin/marketplace.json      # Cursor: 28 entries, ./plugins/<module>
├── plugins/
│   └── <module>/                        # 28 modules
│       ├── plugin.json                  # Agent Plugins 1.0.0 root manifest
│       ├── mcp.json                     # optional; only odin-core ships one
│       └── skills/<slug>/SKILL.md       # 613 skills total
├── catalog/                             # registry and membership data
├── scripts/                             # dependency-free Node ESM and stdlib Python
├── Justfile                             # render, check, validate-skills, verify
└── .pre-commit-config.yaml              # gate hooks, run by prek
```

Why this shape works for each surface:

- Agent Plugins clients read each `plugins/<module>/plugin.json` (all 28 carry the 1.0.0 `$schema`), then the fixed `skills/` and `mcp.json` locations.
- Claude Code reads `.claude-plugin/marketplace.json`; each `./plugins/<module>` source resolves from the repository root; skills are discovered one level deep.
- Codex reads `.agents/plugins/marketplace.json` first. Entries use `{"source": "local", "path": "./plugins/<module>"}` with `policy` and `category`, which the parser resolves against the repository root. The root `plugin.json` wins manifest precedence.
- Cursor reads `.cursor-plugin/marketplace.json` with the same relative sources, and would walk each `skills/` root recursively if nested skills ever appear.
- `gh skill` discovers the fourth convention `plugins/{scope}/skills/*/SKILL.md`, so per-skill install works without any manifest.

## Toolchain set

All versions read 2026-09-01.

| Tool | Pin or line | Current | Released | End of support | Source and tier |
|---|---|---|---|---|---|
| Node.js | LTS line 24 is the project line | 24.20.0 | 2026-08-26 | 2028-04-30 | (Tier 3, source: https://endoflife.date/api/v1/products/nodejs/, probable) |
| Node.js, this machine | none | v26.7.0, Current, not LTS; line 26 becomes LTS 2026-10-28 | | | (Tier 1, source: `node --version`; Tier 3, source: endoflife.date, probable) |
| Python | 3.14 is the project line | 3.14.7 | 2026-08-05 | 2030-10-31 | (Tier 3, source: https://endoflife.date/api/v1/products/python/, probable) |
| Python, this machine | | 3.14.7, equals current | | | (Tier 1, source: `python3 --version`, verified) |
| prek | gate runner | 0.5.0 | 2026-08-27 | | (Tier 2, source: https://github.com/j178/prek/releases, verified) |
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
2. Claude Code and the Agent Plugins root manifest: the absence of support rests on vendor docs and binary string counts (Tier 2). A vendor announcement adopting the standard should trigger a re-check; if Claude Code ever reads root `plugin.json`, the `.claude-plugin/marketplace.json` could shrink.
3. Cursor marketplace load. `cursor-agent plugin marketplace add` accepts a git repository URL
   only, and rejects a local path, so the Cursor surface cannot be exercised until this branch
   reaches the remote. `docs/specs/install-proof.md` records the rejection verbatim. The registry
   itself is generated to the documented schema and gated by `check-plugin-surfaces`.

Two questions from the first draft are now closed against the tree rather than left open. Node
carries no pin and no enforcement point, which the toolchain section states outright. Claude Code
does load the shared MCP file, because `plugins/odin-core/.claude-plugin/plugin.json` declares
`"mcpServers": "./mcp.json"`.
