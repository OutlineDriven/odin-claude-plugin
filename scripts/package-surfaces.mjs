#!/usr/bin/env node
/**
 * Deterministic ODIN package/marketplace renderer.
 * Reads catalog/packages.json and emits committed JSON/LICENSE/README bytes.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE_VERSION = "2.0.0";
const SCHEMA_PLUGIN = "https://json.schemastore.org/claude-code-plugin-manifest.json";
const SCHEMA_MARKETPLACE = "https://json.schemastore.org/claude-code-marketplace.json";

export function loadCatalog(root = ROOT) {
  const catalog = JSON.parse(readFileSync(join(root, "catalog/packages.json"), "utf8"));
  if (!Array.isArray(catalog.entries) || catalog.entries.length !== 29) {
    throw new Error(`catalog/packages.json must contain exactly 29 entries, got ${catalog.entries?.length}`);
  }
  if (catalog.entries[0].id !== "odin") {
    throw new Error("catalog entry 0 must be informational odin");
  }
  if (catalog.releaseVersion !== RELEASE_VERSION) {
    throw new Error(`catalog releaseVersion must be ${RELEASE_VERSION}`);
  }
  return catalog;
}

function ordered(obj, keys) {
  const out = {};
  for (const key of keys) {
    if (Object.hasOwn(obj, key) && obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
}

function jsonBytes(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

const PACKAGE_KEYS = [
  "name",
  "version",
  "description",
  "keywords",
  "homepage",
  "bugs",
  "repository",
  "license",
  "author",
  "files",
  "exports",
  "publishConfig",
];

const FILES = {
  installer: [".claude-plugin", "PROVENANCE.md"],
  runtime: [".claude-plugin", "skills", "PROVENANCE.md"],
  core: [".claude-plugin", "skills", "mcp.json", "output-styles", "PROVENANCE.md"],
};

export function renderPackageJson(entry) {
  const files = FILES[entry.files_variant];
  if (!files) throw new Error(`unknown files_variant ${entry.files_variant} for ${entry.id}`);
  return jsonBytes(
    ordered(
      {
        name: entry.package,
        version: RELEASE_VERSION,
        description: entry.description,
        keywords: entry.tags,
        homepage: entry.homepage,
        bugs: { url: "https://github.com/OutlineDriven/odin-claude-plugin/issues" },
        repository: {
          type: "git",
          url: "git+https://github.com/OutlineDriven/odin-claude-plugin.git",
          directory: `packages/${entry.id}`,
        },
        license: "SEE LICENSE IN PROVENANCE.md",
        author: { name: "OutlineDriven", url: "https://github.com/OutlineDriven" },
        files,
        exports: {
          "./plugin.json": "./.claude-plugin/plugin.json",
          "./package.json": "./package.json",
        },
        publishConfig: {
          access: "public",
          registry: "https://registry.npmjs.org",
          provenance: true,
        },
      },
      PACKAGE_KEYS,
    ),
  );
}

export function renderPluginJson(entry) {
  if (entry.id === "odin") {
    return jsonBytes({
      $schema: SCHEMA_PLUGIN,
      name: "odin",
      displayName: "ODIN Installer",
      version: RELEASE_VERSION,
      description: "Choose ODIN modules through OutlineDriven's universal installer.",
      author: { name: "OutlineDriven", url: "https://github.com/OutlineDriven" },
      homepage: "https://github.com/OutlineDriven/outline-driven",
      repository: "https://github.com/OutlineDriven/odin-claude-plugin",
      license: "SEE LICENSE IN PROVENANCE.md",
      keywords: ["odin", "outlinedriven", "claude-code", "installer", "catalog"],
      defaultEnabled: false,
      metadata: {
        runtime: false,
        installerRepository: "https://github.com/OutlineDriven/outline-driven",
      },
    });
  }
  const manifest = {
    $schema: SCHEMA_PLUGIN,
    name: entry.id,
    displayName: entry.display_name,
    version: RELEASE_VERSION,
    description: entry.description,
    author: { name: "OutlineDriven", url: "https://github.com/OutlineDriven" },
    homepage: "https://github.com/OutlineDriven/odin-claude-plugin",
    repository: "https://github.com/OutlineDriven/odin-claude-plugin",
    license: "SEE LICENSE IN PROVENANCE.md",
    keywords: entry.tags,
    skills: "./skills/",
  };
  if (entry.id === "odin-core") {
    manifest.mcpServers = "./mcp.json";
    manifest.outputStyles = "./output-styles/";
  }
  return jsonBytes(manifest);
}

export function renderMarketplace(catalog) {
  const plugins = catalog.entries.map((entry) => {
    const row = {
      name: entry.id,
      displayName: entry.display_name,
      version: RELEASE_VERSION,
      description: entry.description,
      author: { name: "OutlineDriven", url: "https://github.com/OutlineDriven" },
      homepage: entry.homepage,
      repository: "https://github.com/OutlineDriven/odin-claude-plugin",
      license: "SEE LICENSE IN PROVENANCE.md",
      tags: entry.tags,
      strict: true,
      source: {
        source: "npm",
        package: entry.package,
        version: RELEASE_VERSION,
        registry: "https://registry.npmjs.org",
      },
    };
    if (entry.id === "odin") row.defaultEnabled = false;
    return row;
  });
  return jsonBytes({
    $schema: SCHEMA_MARKETPLACE,
    name: "odin-marketplace",
    version: RELEASE_VERSION,
    description:
      "ODIN turns intent into a bounded, inspectable, verified change through independently installable modules from OutlineDriven.",
    owner: { name: "OutlineDriven", url: "https://github.com/OutlineDriven" },
    plugins,
  });
}

export function renderRootPackageJson() {
  return jsonBytes({
    name: "@outlinedriven/odin-workspace",
    private: true,
    workspaces: ["packages/*"],
    scripts: {
      "generate:package-surfaces": "node scripts/render-package-surfaces.mjs",
      "generate:package-provenance": "node scripts/render-package-provenance.mjs",
      "generate:distribution": "node scripts/render-distribution.mjs",
      "pack:packages": "node scripts/pack-packages.mjs",
      "check:package-surfaces": "node scripts/check-package-surfaces.mjs",
      "check:package-provenance": "node scripts/check-package-provenance.mjs",
      "check:distribution": "node scripts/check-distribution.mjs",
      "check:skill-routes": "node scripts/check-skill-routes.mjs",
      check:
        "npm run check:package-surfaces && npm run check:package-provenance && npm run check:distribution && npm run check:skill-routes",
    },
  });
}

export function renderPackageReadme(entry) {
  const lines = [
    `# ${entry.display_name}`,
    "",
    entry.description,
    "",
    `npm package: \`${entry.package}@${RELEASE_VERSION}\``,
    "",
    entry.id === "odin"
      ? "This entry is informational. It ships no skills and runs no installer."
      : "Skills live in the canonical `skills/` tree. Package tarballs project this module's subset at pack time.",
    "",
    "License: see `PROVENANCE.md`.",
    "",
  ];
  return lines.join("\n");
}

export function renderAll(root = ROOT) {
  const catalog = loadCatalog(root);
  const files = [];
  files.push({ path: "package.json", content: renderRootPackageJson() });
  files.push({ path: ".claude-plugin/marketplace.json", content: renderMarketplace(catalog) });
  const license = readFileSync(join(root, "LICENSE"));
  for (const entry of catalog.entries) {
    files.push({ path: `packages/${entry.id}/package.json`, content: renderPackageJson(entry) });
    files.push({
      path: `packages/${entry.id}/.claude-plugin/plugin.json`,
      content: renderPluginJson(entry),
    });
    files.push({ path: `packages/${entry.id}/README.md`, content: renderPackageReadme(entry) });
    files.push({ path: `packages/${entry.id}/LICENSE`, content: license });
  }
  return files;
}
