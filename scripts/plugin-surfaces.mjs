// Render every distribution surface from the one identity ledger, catalog/plugins.json.
//
// Five harness surfaces, five root registries, five per-plugin manifests:
//
//   Claude Code   .claude-plugin/marketplace.json + plugins/<id>/.claude-plugin/plugin.json
//   Codex         .codex-plugin/marketplace.json  + plugins/<id>/.codex-plugin/plugin.json
//   Cursor        .cursor-plugin/marketplace.json + plugins/<id>/.cursor-plugin/plugin.json
//   Grok          .grok-plugin/marketplace.json   + plugins/<id>/.grok-plugin/plugin.json
//   Kimi          .kimi-plugin/marketplace.json   + plugins/<id>/.kimi-plugin/plugin.json
//
// Each harness resolves component locations by its own conventions, so a dotdir
// manifest declares only what those defaults do not already resolve: Kimi needs
// `skills` (its default is a root SKILL.md fallback), and Codex and Grok need
// `mcpServers` where the default filename is the dotted .mcp.json. Codex reads
// .claude-plugin/marketplace.json today — MARKETPLACE_MANIFEST_RELATIVE_PATHS in
// codex-rs/core-plugins/src/marketplace.rs has no .codex-plugin/ entry — so the
// Codex registry here is forward-compat and inert today.
//
// Every source is a repository-relative path: nothing is published to a package registry.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CLAUDE_PLUGIN_SCHEMA =
  "https://json.schemastore.org/claude-code-plugin-manifest.json";
const CLAUDE_MARKETPLACE_SCHEMA =
  "https://json.schemastore.org/claude-code-marketplace.json";

export function loadCatalog(root = ROOT) {
  const catalog = JSON.parse(
    readFileSync(join(root, "catalog/plugins.json"), "utf8"),
  );
  if (catalog.schema !== "odin-plugin-catalog/v1")
    throw new Error(`unexpected catalog schema: ${catalog.schema}`);
  const seen = new Set();
  catalog.entries.forEach((entry, i) => {
    if (entry.index !== i + 1)
      throw new Error(`${entry.id}: index ${entry.index} out of order at ${i + 1}`);
    if (seen.has(entry.id)) throw new Error(`duplicate plugin id: ${entry.id}`);
    seen.add(entry.id);
    if (entry.directory !== `plugins/${entry.id}`)
      throw new Error(`${entry.id}: directory must be plugins/${entry.id}`);
    // Intersection of the four harness name grammars (Codex, Cursor, Grok, Kimi):
    // 1-64 chars, lowercase alnum plus hyphens, alphanumeric at both ends, no
    // consecutive '--'. Periods are excluded because Grok and Kimi reject them.
    if (
      !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(entry.id) ||
      entry.id.length > 64 ||
      entry.id.includes("--")
    )
      throw new Error(`${entry.id}: invalid plugin name`);
  });
  return catalog;
}

const author = (catalog) => ({
  name: catalog.owner.name,
  url: catalog.owner.url,
});

const hasMcp = (entry) => existsSync(join(ROOT, entry.directory, "mcp.json"));

// Claude Code plugin manifest. `skills` defaults to skills/, so it stays unset;
// mcpServers and outputStyles point at the shared root files where they exist.
//
// Every harness dotdir manifest carries the SAME `name` as this one: Codex
// resolves the plugin namespace from the dotdir list only
// (plugin_namespace_for_root_uri in codex-rs/utils/plugins/src/plugin_namespace.rs)
// and never from a root file, so diverged names load one plugin's components
// under another's namespace. check-plugin-surfaces asserts the parity.
export function renderClaudePluginManifest(catalog, entry) {
  const manifest = {
    $schema: CLAUDE_PLUGIN_SCHEMA,
    name: entry.id,
    displayName: entry.display_name,
    version: catalog.releaseVersion,
    description: entry.description,
    author: author(catalog),
    homepage: entry.homepage,
    repository: catalog.repository,
    license: catalog.license,
    keywords: entry.tags,
  };
  if (hasMcp(entry)) manifest.mcpServers = "./mcp.json";
  if (existsSync(join(ROOT, entry.directory, "output-styles")))
    manifest.outputStyles = "./output-styles";
  return manifest;
}

// Codex plugin manifest, Legacy format (RawPluginManifest in
// codex-rs/core-plugins/src/manifest.rs). No $schema: the published schemastore
// schema is closed and rejects the key, while the Rust deserializer ignores it.
// `skills` stays unset because Codex defaults to ./skills; `mcpServers` must be
// explicit because the Legacy default is the dotted .mcp.json, and
// resolve_manifest_path drops any value without the leading ./.
export function renderCodexPluginManifest(catalog, entry) {
  const manifest = {
    name: entry.id,
    version: catalog.releaseVersion,
    description: entry.description,
    keywords: entry.tags,
    author: author(catalog),
  };
  if (hasMcp(entry)) manifest.mcpServers = "./mcp.json";
  manifest.interface = {
    displayName: entry.display_name,
    shortDescription: entry.description,
    category: entry.category,
  };
  return manifest;
}

// Cursor plugin manifest: identity only. Cursor discovers skills under skills/
// and MCP at the dotless mcp.json by its own defaults, so nothing else is declared.
export function renderCursorPluginManifest(catalog, entry) {
  return {
    name: entry.id,
    version: catalog.releaseVersion,
    description: entry.description,
    author: author(catalog),
    homepage: entry.homepage,
    repository: catalog.repository,
    license: catalog.license,
    keywords: entry.tags,
    category: entry.category,
  };
}

// Grok plugin manifest. `skills` stays unset (Grok defaults to skills/);
// `mcpServers` is explicit for the same reason as Codex: Grok's default filename
// is the dotted .mcp.json.
export function renderGrokPluginManifest(catalog, entry) {
  const manifest = {
    name: entry.id,
    version: catalog.releaseVersion,
    description: entry.description,
    author: author(catalog),
    homepage: entry.homepage,
    repository: catalog.repository,
    license: catalog.license,
    keywords: entry.tags,
  };
  if (hasMcp(entry)) manifest.mcpServers = "./mcp.json";
  return manifest;
}

// Kimi plugin manifest. `skills` is mandatory: without it Kimi falls back to a
// root SKILL.md and loads zero skills from skills/. `mcpServers` is an inline
// server map rather than a path, so the shared mcp.json is read and inlined
// verbatim; Kimi's schema strips the non-standard alwaysLoad key instead of
// erroring. author carries name only: Kimi's readAuthor accepts no url field.
export function renderKimiPluginManifest(catalog, entry) {
  const manifest = {
    name: entry.id,
    version: catalog.releaseVersion,
    description: entry.description,
    keywords: entry.tags,
    homepage: entry.homepage,
    license: catalog.license,
    author: { name: catalog.owner.name },
    skills: "./skills",
  };
  if (hasMcp(entry))
    manifest.mcpServers = JSON.parse(
      readFileSync(join(ROOT, entry.directory, "mcp.json"), "utf8"),
    ).mcpServers;
  manifest.interface = {
    displayName: entry.display_name,
    shortDescription: entry.description,
  };
  return manifest;
}

export function renderClaudeMarketplace(catalog) {
  return {
    $schema: CLAUDE_MARKETPLACE_SCHEMA,
    name: catalog.marketplace_name,
    owner: catalog.owner,
    plugins: catalog.entries.map((entry) => ({
      name: entry.id,
      source: `./${entry.directory}`,
      description: entry.description,
      version: catalog.releaseVersion,
      author: author(catalog),
      homepage: entry.homepage,
      license: catalog.license,
      keywords: entry.tags,
      category: entry.category,
      // Codex parses this registry too (its entry parser is path-agnostic) and
      // would otherwise default authentication to ON_INSTALL; this holds ON_USE.
      policy: { installation: "AVAILABLE", authentication: "ON_USE" },
    })),
  };
}

// Codex marketplace. Codex's own candidate list (MARKETPLACE_MANIFEST_RELATIVE_PATHS
// in codex-rs/core-plugins/src/marketplace.rs) reads .claude-plugin/marketplace.json
// from this tree and holds no .codex-plugin/ entry, so this file is forward-compat
// and inert today. `source.path` resolves against the marketplace root, so it
// starts with ./ and stays inside the repository.
export function renderCodexMarketplace(catalog) {
  return {
    name: catalog.marketplace_name,
    interface: { displayName: "ODIN" },
    plugins: catalog.entries.map((entry) => ({
      name: entry.id,
      source: { source: "local", path: `./${entry.directory}` },
      policy: { installation: "AVAILABLE", authentication: "ON_USE" },
      category: entry.category,
    })),
  };
}

export function renderCursorMarketplace(catalog) {
  return {
    name: catalog.marketplace_name,
    owner: catalog.owner,
    metadata: {
      description: "ODIN skill plugins for agent harnesses.",
      version: catalog.releaseVersion,
    },
    plugins: catalog.entries.map((entry) => ({
      name: entry.id,
      source: `./${entry.directory}`,
      description: entry.description,
      version: catalog.releaseVersion,
      author: author(catalog),
      homepage: entry.homepage,
      license: catalog.license,
      keywords: entry.tags,
      category: entry.category,
    })),
  };
}

// Grok marketplace. The local source discriminator is `type`, the documented
// spelling (Codex uses `source` for the same role). `path` resolves against the
// marketplace root and rejects `..` and absolute paths. owner carries name only:
// Grok's IndexOwner has no url field.
export function renderGrokMarketplace(catalog) {
  return {
    name: catalog.marketplace_name,
    description: "ODIN skill plugins for agent harnesses.",
    owner: { name: catalog.owner.name },
    plugins: catalog.entries.map((entry) => ({
      name: entry.id,
      description: entry.description,
      category: entry.category,
      version: catalog.releaseVersion,
      homepage: entry.homepage,
      keywords: entry.tags,
      source: { type: "local", path: `./${entry.directory}` },
    })),
  };
}

// Kimi marketplace, consumed from a local clone:
//   /plugins marketplace <clone>/.kimi-plugin/marketplace.json
// Kimi resolves a relative source against the registry's own directory, so the
// source climbs one level out of .kimi-plugin/ to reach plugins/. Kimi cannot
// install a GitHub repository subdirectory, so its lane is the local clone.
export function renderKimiMarketplace(catalog) {
  return {
    version: "2",
    plugins: catalog.entries.map((entry) => ({
      id: entry.id,
      displayName: entry.display_name,
      description: entry.description,
      version: catalog.releaseVersion,
      homepage: entry.homepage,
      source: `../${entry.directory}`,
    })),
  };
}

export function skillRows(entry) {
  const dir = join(ROOT, entry.directory, "skills");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

export function renderPluginReadme(catalog, entry, skills) {
  const lines = [
    `# ${entry.display_name}`,
    "",
    entry.description,
    "",
    `${skills.length} skill${skills.length === 1 ? "" : "s"}, category ${entry.category}.`,
    "",
    "## Install",
    "",
    "```bash",
    `# Claude Code`,
    `/plugin marketplace add OutlineDriven/odin-claude-plugin`,
    `/plugin install ${entry.id}@${catalog.marketplace_name}`,
    "",
    `# Codex`,
    `codex plugin marketplace add OutlineDriven/odin-claude-plugin`,
    `codex plugin add ${entry.id}@${catalog.marketplace_name}`,
    "```",
    "",
    "## Skills",
    "",
    ...skills.map((slug) => `- ${slug}`),
    "",
  ];
  return lines.join("\n");
}

// The root README states each plugin's category, and a hand-kept copy of the ledger drifts:
// flipping a category in catalog/plugins.json used to leave the table stale with every gate
// green. Only the table is generated. The prose around it is authored, so this returns the
// current file with one region replaced rather than a whole rendered README.
const ROOT_README_TABLE = /(^## Plugins\n\n)(?:\|[^\n]*\n)+/m;

export function renderRootReadme(catalog, current) {
  const entries = catalog.entries;
  const half = Math.ceil(entries.length / 2);
  const rows = [];
  for (let i = 0; i < half; i += 1) {
    const left = entries[i];
    const right = entries[i + half];
    const cells = [left.id, left.category];
    if (right) cells.push(right.id, right.category);
    else cells.push("", "");
    rows.push(`| ${cells.join(" | ")} |`);
  }
  const table = [
    "| Plugin | Category | Plugin | Category |",
    "|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");
  if (!ROOT_README_TABLE.test(current))
    throw new Error("README.md: no plugin table found under a '## Plugins' heading");
  return current.replace(ROOT_README_TABLE, `$1${table}`);
}

export function surfacePlan(catalog) {
  const files = new Map();
  files.set(".claude-plugin/marketplace.json", renderClaudeMarketplace(catalog));
  files.set(".codex-plugin/marketplace.json", renderCodexMarketplace(catalog));
  files.set(".cursor-plugin/marketplace.json", renderCursorMarketplace(catalog));
  files.set(".grok-plugin/marketplace.json", renderGrokMarketplace(catalog));
  files.set(".kimi-plugin/marketplace.json", renderKimiMarketplace(catalog));
  for (const entry of catalog.entries) {
    files.set(
      `${entry.directory}/.claude-plugin/plugin.json`,
      renderClaudePluginManifest(catalog, entry),
    );
    files.set(
      `${entry.directory}/.codex-plugin/plugin.json`,
      renderCodexPluginManifest(catalog, entry),
    );
    files.set(
      `${entry.directory}/.cursor-plugin/plugin.json`,
      renderCursorPluginManifest(catalog, entry),
    );
    files.set(
      `${entry.directory}/.grok-plugin/plugin.json`,
      renderGrokPluginManifest(catalog, entry),
    );
    files.set(
      `${entry.directory}/.kimi-plugin/plugin.json`,
      renderKimiPluginManifest(catalog, entry),
    );
  }
  return files;
}
