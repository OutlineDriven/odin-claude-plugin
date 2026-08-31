// Render every distribution surface from the one identity ledger, catalog/plugins.json.
//
// Four supported surfaces, three registry files, one per-plugin manifest pair:
//
//   Agent Plugins 1.0.0   plugins/<id>/plugin.json
//                         Closed schema (agent-plugins.org/schemas/1.0.0/plugin.schema.json):
//                         the manifest MUST NOT declare component locations, because the spec
//                         fixes skills/ and mcp.json at the plugin root. Codex and Cursor both
//                         load this format natively.
//   Codex marketplace     .agents/plugins/marketplace.json
//                         Codex reads the root plugin.json at highest precedence, so its
//                         display metadata rides in extensions["com.openai"].interface.
//   Claude marketplace    .claude-plugin/marketplace.json + plugins/<id>/.claude-plugin/plugin.json
//                         Claude Code does not read the Agent Plugins manifest; it needs its own,
//                         and odin-core needs it to declare output styles.
//   Cursor marketplace    .cursor-plugin/marketplace.json
//                         One combined registry at the repo root. Cursor discovers skills and MCP
//                         servers through the Agent Plugins manifest, so no per-plugin file.
//
// Every source is a repository-relative path: nothing is published to a package registry.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const AGENT_PLUGIN_SCHEMA =
  "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
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
    // Agent Plugins §5.5: 1-64 chars, lowercase alnum plus periods and hyphens,
    // alphanumeric at both ends, no consecutive '--' or '..'.
    if (!/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(entry.id))
      throw new Error(`${entry.id}: invalid Agent Plugins name`);
    if (entry.id.length > 64 || entry.id.includes("--") || entry.id.includes(".."))
      throw new Error(`${entry.id}: invalid Agent Plugins name`);
  });
  return catalog;
}

const author = (catalog) => ({
  name: catalog.owner.name,
  url: catalog.owner.url,
});

// Agent Plugins manifest. Component locations are deliberately absent: declaring
// them violates the spec, and every client resolves skills/ and mcp.json itself.
export function renderAgentPluginManifest(catalog, entry) {
  return {
    $schema: AGENT_PLUGIN_SCHEMA,
    name: entry.id,
    version: catalog.releaseVersion,
    description: entry.description,
    author: author(catalog),
    homepage: entry.homepage,
    repository: catalog.repository,
    license: catalog.license,
    keywords: entry.tags,
    extensions: {
      "com.openai": {
        name: entry.id,
        interface: {
          displayName: entry.display_name,
          shortDescription: entry.description,
          category: entry.category,
        },
      },
    },
  };
}

// Claude Code plugin manifest. `skills` defaults to skills/, so it stays unset;
// mcpServers and outputStyles point at the shared root files where they exist.
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
  if (existsSync(join(ROOT, entry.directory, "mcp.json")))
    manifest.mcpServers = "./mcp.json";
  if (existsSync(join(ROOT, entry.directory, "output-styles")))
    manifest.outputStyles = "./output-styles";
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
    })),
  };
}

// Codex marketplace. `source.path` resolves against the marketplace root, so it
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

export function surfacePlan(catalog) {
  const files = new Map();
  files.set(
    ".claude-plugin/marketplace.json",
    renderClaudeMarketplace(catalog),
  );
  files.set(".agents/plugins/marketplace.json", renderCodexMarketplace(catalog));
  files.set(".cursor-plugin/marketplace.json", renderCursorMarketplace(catalog));
  for (const entry of catalog.entries) {
    files.set(
      `${entry.directory}/plugin.json`,
      renderAgentPluginManifest(catalog, entry),
    );
    files.set(
      `${entry.directory}/.claude-plugin/plugin.json`,
      renderClaudePluginManifest(catalog, entry),
    );
  }
  return files;
}
