#!/usr/bin/env node
/**
 * Generate the off-branch distribution projection under .release/distribution/.
 * Native catalogs list 28 runtime entries then informational odin last.
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog, renderPluginJson } from "./package-surfaces.mjs";
import { loadMembership } from "./skill-membership.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, ".release/distribution");
const RELEASE_VERSION = "2.0.0";
// The distribution projection (plugins/modules/<id>) lives on this branch, not on
// main where only packages/<id> exists. Kimi catalog source URLs must point at the
// ref that actually contains the plugins/modules/ path they reference.
const DISTRIBUTION_REF = `distribution-candidate/${RELEASE_VERSION}`;

function jsonBytes(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}


function copySkill(root, destSkills, slug) {
  const src = join(root, "skills", slug);
  if (!existsSync(src)) throw new Error(`missing authored skill ${slug}`);
  cpSync(src, join(destSkills, slug), { recursive: true });
}

function writeModulePlugin(mod, entry) {
  // Host-specific carriers, one shape per harness (docs/specs/harnesses.md):
  // deliberately no $schema, and Kimi needs the explicit skills path.
  const body = {
    name: entry.id,
    displayName: entry.display_name,
    version: RELEASE_VERSION,
    description: entry.description,
    author: { name: "OutlineDriven", url: "https://github.com/OutlineDriven" },
    homepage: entry.homepage,
    repository: "https://github.com/OutlineDriven/odin-claude-plugin",
    license: "SEE LICENSE IN LICENSE",
    keywords: entry.tags,
  };
  if (entry.id !== "odin") body.skills = "./skills/";
  for (const dir of [".codex-plugin", ".cursor-plugin", ".kimi-plugin"]) {
    mkdirSync(join(mod, dir), { recursive: true });
    writeFileSync(join(mod, `${dir}/plugin.json`), jsonBytes(body));
  }
  writeFileSync(join(mod, "plugin.json"), jsonBytes(body));
  // Claude-compatible manifest: byte-identical to the npm package surface
  // (packages/<id>/.claude-plugin/plugin.json) via the same generator, so the
  // distribution projection cannot drift from it. Grok reads this shape.
  mkdirSync(join(mod, ".claude-plugin"), { recursive: true });
  writeFileSync(join(mod, ".claude-plugin/plugin.json"), renderPluginJson(entry));
}

function runtimeThenOdin(catalog) {
  const runtime = catalog.entries.filter((e) => e.id !== "odin");
  const odin = catalog.entries.find((e) => e.id === "odin");
  return [...runtime, odin];
}

function renderCodexCatalog(entries) {
  return jsonBytes({
    name: "odin-marketplace",
    interface: { displayName: "ODIN" },
    plugins: entries.map((entry) => ({
      name: entry.id,
      source: { source: "local", path: `./plugins/modules/${entry.id}` },
      policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
      category: "Coding",
    })),
  });
}

function renderCursorCatalog(entries) {
  return jsonBytes({
    name: "odin-marketplace",
    owner: { name: "OutlineDriven", url: "https://github.com/OutlineDriven" },
    plugins: entries.map((entry) => ({
      name: entry.id,
      source: `./plugins/modules/${entry.id}`,
      description: entry.description,
    })),
  });
}

function renderGrokCatalog(entries) {
  return jsonBytes({
    name: "odin-marketplace",
    version: RELEASE_VERSION,
    plugins: entries.map((entry) => ({
      name: entry.id,
      source: `./plugins/modules/${entry.id}`,
      description: entry.description,
    })),
  });
}

const REPOSITORY_URL = "https://github.com/OutlineDriven/odin-claude-plugin";

function renderKimiCatalog(entries) {
  return jsonBytes({
    version: "2",
    plugins: entries.map((entry) => ({
      id: entry.id,
      displayName: entry.display_name,
      source: `${REPOSITORY_URL}/tree/${DISTRIBUTION_REF}/plugins/modules/${entry.id}`,
    })),
  });
}


export function renderDistribution(root = ROOT, out = OUT) {
  const catalog = loadCatalog(root);
  const membership = loadMembership(root);
  const skillCount = membership.skillCount;
  const { byModule, all } = membership;
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  const ordered = runtimeThenOdin(catalog);
  let copied = 0;
  for (const entry of catalog.entries) {
    const mod = join(out, "plugins/modules", entry.id);
    mkdirSync(mod, { recursive: true });
    for (const name of ["package.json", "README.md", "LICENSE", "NOTICE"]) {
      cpSync(join(root, "packages", entry.id, name), join(mod, name));
    }
    if (entry.id === "odin-core") {
      cpSync(join(root, "packages/odin-core/mcp.json"), join(mod, "mcp.json"));
      cpSync(join(root, "packages/odin-core/output-styles"), join(mod, "output-styles"), {
        recursive: true,
      });
    }
    writeModulePlugin(mod, entry);
    if (entry.id === "odin") continue;
    const destSkills = join(mod, "skills");
    mkdirSync(destSkills, { recursive: true });
    for (const slug of byModule.get(entry.id) || []) {
      copySkill(root, destSkills, slug);
      copied += 1;
    }
  }

  const complete = join(out, "plugins/odin-complete");
  mkdirSync(join(complete, "skills"), { recursive: true });
  mkdirSync(join(complete, ".devin-plugin"), { recursive: true });
  const completePlugin = jsonBytes({
    name: "odin-complete",
    displayName: "ODIN Complete",
    version: RELEASE_VERSION,
    description: `Complete ${skillCount}-skill ODIN plugin for hosts without a native 29-entry marketplace.`,
    author: { name: "OutlineDriven", url: "https://github.com/OutlineDriven" },
    homepage: "https://github.com/OutlineDriven/odin-claude-plugin",
    repository: "https://github.com/OutlineDriven/odin-claude-plugin",
    license: "SEE LICENSE IN LICENSE",
    skills: "./skills/",
  });
  writeFileSync(join(complete, ".devin-plugin/plugin.json"), completePlugin);
  writeFileSync(join(complete, "plugin.json"), completePlugin);
  cpSync(join(root, "LICENSE"), join(complete, "LICENSE"));
  cpSync(join(root, "licenses/NOTICE"), join(complete, "NOTICE"));
  for (const slug of all) copySkill(root, join(complete, "skills"), slug);

  mkdirSync(join(out, ".agents/plugins"), { recursive: true });
  mkdirSync(join(out, ".cursor-plugin"), { recursive: true });
  mkdirSync(join(out, ".grok-plugin"), { recursive: true });
  mkdirSync(join(out, "marketplaces"), { recursive: true });
  writeFileSync(join(out, ".agents/plugins/marketplace.json"), renderCodexCatalog(ordered));
  writeFileSync(join(out, ".cursor-plugin/marketplace.json"), renderCursorCatalog(ordered));
  writeFileSync(join(out, ".grok-plugin/marketplace.json"), renderGrokCatalog(ordered));
  writeFileSync(join(out, "marketplaces/kimi.json"), renderKimiCatalog(ordered));

  const manifest = {
    schema: "odin-distribution-manifest/v1",
    releaseVersion: RELEASE_VERSION,
    skill_count: skillCount,
    module_skill_copies: copied,
    catalogs: [
      ".agents/plugins/marketplace.json",
      ".cursor-plugin/marketplace.json",
      ".grok-plugin/marketplace.json",
      "marketplaces/kimi.json",
    ],
    informational_last: ordered[28].id,
  };
  writeFileSync(join(out, "MANIFEST.json"), jsonBytes(manifest));
  return manifest;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const manifest = renderDistribution();
  process.stdout.write(
    `distribution ${manifest.skill_count} skills modules=${manifest.module_skill_copies} last=${manifest.informational_last}\n`,
  );
}
