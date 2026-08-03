# Harness manifests — what each one rests on

Last verified 2026-08-03. Every row was checked against a vendor doc or vendor source that
day, and most were checked against the installed CLI. Re-verify before trusting an entry
older than a release cycle.

The rule this file exists to enforce: **ship a manifest only where it adds a capability
the repo does not already have.** Most harnesses read `.claude-plugin/` natively, so most
need nothing.

## Ships nothing — already works

| Harness | Why | Evidence |
|---|---|---|
| Codex CLI | Manifest discovery falls through `.codex-plugin/` → `.claude-plugin/` → `.cursor-plugin/`, and `.claude-plugin/marketplace.json` is an accepted marketplace | `DISCOVERABLE_PLUGIN_MANIFEST_PATHS` in `codex-rs/exec-server-protocol/src/protocol.rs`; developers.openai.com calls it "legacy-compatible". **Install proven** on 0.146.0 |
| Grok Build CLI | "Grok is fully compatible with Claude Code with zero configuration needed" | docs.x.ai, skills-plugins-marketplaces. `grok plugin validate .` passes on 0.2.118 |

A `.codex-plugin/` or `.grok-plugin/` manifest here would be duplicate state joining the
version lockstep forever and buying nothing.

## Ships a manifest — adds a capability

| Path | Harness | Required fields | Note |
|---|---|---|---|
| `plugin.json` | Antigravity `agy` | `name` | No Claude compatibility of any kind. Deliberately carries **no `$schema`** — see below |
| `.cursor-plugin/plugin.json` + `marketplace.json` | Cursor | `name` (kebab-case) | Cursor does not document reading `.claude-plugin/`. Components auto-discover from the repo root, so no paths are declared |
| `.kimi-plugin/plugin.json` + `marketplace.json` | Kimi Code | `name` matching `[a-z0-9][a-z0-9_-]{0,63}` | `skills` is **explicit**: Kimi treats an undeclared path as "root `SKILL.md` is one skill" |
| `.devin-plugin/plugin.json` | Devin CLI | `name` | Devin documents a `.claude-plugin/` fallback from 3000.3.22, but 3000.2.17 hard-fails: `could not read manifest at .devin-plugin/plugin.json`. Verified by install |
| `.agents/plugins/marketplace.json` | Codex | entry `name`, `source`, `policy`, `category` | Codex's current path. `.claude-plugin/marketplace.json` works but its own docs label it legacy |
| `.opencode/plugins/odin.js` | opencode | n/a | opencode has no manifest concept at all — a plugin is a module that mutates config at load |

## Contradictions the validator holds, so nobody has to remember them

`scripts/sync-manifests.py` enforces these. They cannot share one rule:

- **Codex** marketplace: `source.source` must be `"local"` and `source.path` must be
  `"./"`-prefixed. A non-local source materialises only on install, so the plugin preview
  shows zero skills.
- **Kimi** marketplace: a self-referential source is rejected; `source` must be an
  absolute URL. Its top-level `version` is the catalog **schema** version — the literal
  `"2"` — not the plugin version.

## Why the root `plugin.json` has no `$schema`

`agent-plugins.org/schemas/1.0.0/plugin.schema.json` resolves and is a genuine
cross-vendor spec: OpenAI and Microsoft independently implement the same `$schema`-gated
precedence. It is also ~10 days old as of this writing, has no tagged release, and has
zero manifests in the wild across two search indexes.

More concretely, adding it changes Codex's behavior for the worse today. With the schema
present, Codex resolves the root file as the manifest, but `plugin_namespace_for_root_uri`
still consults only the dotdir list — manifest and namespace would resolve from different
files. Without it, Codex classifies the root file "Unrelated" and keeps the
`.claude-plugin/` path that is proven to work.

`agy` requires only `name`, so it is satisfied either way. Revisit when the spec has
adopters.

Do not copy the reference implementation here: `EveryInc/compound-engineering-plugin`
cites `https://antigravity.google/schemas/v1/plugin.json` in its root manifest, and that
URL **404s**.

## Not shipped

- **Cline, Pi** — not requested. Both would need a `package.json` key rather than a
  manifest directory.
- **Gemini CLI extension** — `gemini extensions install` accepts a repo URL or local path
  with no subdirectory flag, so folding it in would force `gemini-extension.json` to this
  repo's root for a CLI that Antigravity replaced.
