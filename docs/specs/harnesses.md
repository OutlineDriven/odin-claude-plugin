# Harness manifests: carrier foundations

Verified 2026-08-03 against repo version `1.17.82`. We checked every row against vendor documentation or sources and verified CLI versions with `--version`: `codex-cli 0.146.0`, `devin 3000.2.17`, `agy 1.1.9`, `grok 0.2.118`, `claude 2.1.220`. Re-verify entries older than one release cycle.

**2026-08-31 update.** Commit `600508d` removed the 1.x harness carriers. Packaging authority is `catalog/packages.json`: 29 package roots each ship `packages/<name>/.claude-plugin/plugin.json`, rendered by `scripts/render-package-surfaces.mjs` and verified by `scripts/check-package-surfaces.mjs` at coordinated version `2.0.0`. The root `.claude-plugin/marketplace.json` provides the shared Claude/OMP catalog. Codex, Cursor, Grok, Kimi, Devin, and Antigravity install from the generated distribution branch rather than this source tree. The manifest records below document the removed carriers as design rationale for the distribution projection.

Two version gaps remain relevant: installed `devin 3000.2.17` trails the 3000.3.x line, so the `.claude-plugin/` fallback described in its documentation is unavailable here; opencode had no local install, so we tested its plugin module directly instead of through the host.

Core rule: **ship a manifest only where it adds a capability the repo lacks.** Most harnesses read `.claude-plugin/` natively and require no extra manifest.

## Native compatibility without manifests

| Harness | Why | Evidence |
|---|---|---|
| Codex CLI | Manifest discovery falls through `.codex-plugin/` → `.claude-plugin/` → `.cursor-plugin/`, and `.claude-plugin/marketplace.json` is an accepted marketplace | `DISCOVERABLE_PLUGIN_MANIFEST_PATHS` in `codex-rs/exec-server-protocol/src/protocol.rs`; developers.openai.com calls it "legacy-compatible". **Install proven** on 0.146.0 |
| Grok Build CLI | "Grok is fully compatible with Claude Code with zero configuration needed" | docs.x.ai, skills-plugins-marketplaces. `grok plugin validate .` passes on 0.2.118 |

A `.codex-plugin/` or `.grok-plugin/` manifest would create redundant state in the version lockstep without adding functionality.

## Manifests removed in 2.0

Commit `600508d` removed these carrier trees; their structures persist in the generated distribution projection.

| Path | Harness | Required fields | Note |
|---|---|---|---|
| `plugin.json` | Antigravity `agy` | `name` | No Claude compatibility. Deliberately carries **no `$schema`** (see below) |
| `.cursor-plugin/plugin.json` + `marketplace.json` | Cursor | `name` (kebab-case) | Cursor does not document reading `.claude-plugin/`. Components auto-discover from repository root, so the manifest declares no paths |
| `.kimi-plugin/plugin.json` + `marketplace.json` | Kimi Code | `name` matching `[a-z0-9][a-z0-9_-]{0,63}` | `skills` is **explicit**: Kimi treats an undeclared path as "root `SKILL.md` is one skill" |
| `.devin-plugin/plugin.json` | Devin CLI | `name` | Devin documents a `.claude-plugin/` fallback from 3000.3.22, but 3000.2.17 fails: `could not read manifest at .devin-plugin/plugin.json`. Verified by install |
| `.agents/plugins/marketplace.json` | Codex | entry `name`, `source`, `policy`, `category` | Codex current path. `.claude-plugin/marketplace.json` works, but vendor documentation labels it legacy |
| `.opencode/plugins/odin.js` | opencode | n/a | opencode has no manifest concept; a plugin is a module that mutates configuration at load |

## Distribution manifest validator rules

Commit `600508d` removed `scripts/sync-manifests.py`. `scripts/check-package-surfaces.mjs` now gates the source branch, checking rendered package-surface drift and catalog cardinality (29 roots). The Codex and Kimi validation rules now run in the distribution projection that generates per-harness marketplace manifests:

- **Codex** marketplace: `source.source` must be `"local"` and `source.path` must be `"./"`-prefixed. Non-local sources materialize only on install, causing plugin previews to show zero skills.
- **Kimi** marketplace: the validator rejects self-referential sources; `source` must be an absolute URL. Top-level `version` is the catalog schema version (literal `"2"`), not the plugin version.

## Why root plugin.json omits $schema

Commit `600508d` removed root `plugin.json`. This rationale applied on the 1.x branch and carries forward to distribution projection root manifests.

`agent-plugins.org/schemas/1.0.0/plugin.schema.json` resolves as a cross-vendor specification implemented by OpenAI and Microsoft for `$schema`-gated precedence. However, as of this writing it is ~10 days old, lacks a tagged release, and has zero manifests indexed in the wild.

Adding it degrades Codex behavior: with the schema present, Codex resolves the root file as the manifest, but `plugin_namespace_for_root_uri` consults only the dotdir list, causing manifest and namespace to resolve from different files. Without `$schema`, Codex classifies the root file as "Unrelated" and keeps the verified `.claude-plugin/` path.

`agy` requires only `name`, so it works either way. Revisit when the specification gains adoption.

Avoid copying the reference implementation: `EveryInc/compound-engineering-plugin` cites `https://antigravity.google/schemas/v1/plugin.json` in its root manifest, but that URL returns **404**.

## Not shipped

- **Cline, Pi**: Not requested. Both require a `package.json` key rather than a manifest directory.
- **Gemini CLI extension**: `gemini extensions install` accepts a repository URL or local path without a subdirectory flag. Supporting it would force `gemini-extension.json` into the repository root for a CLI superseded by Antigravity.
