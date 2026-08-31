#!/usr/bin/env node
/**
 * Generate the off-branch distribution projection under .release/distribution/.
 * Native catalogs list 28 runtime entries then informational odin last.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog } from "./package-surfaces.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, ".release/distribution");
const RELEASE_VERSION = "2.0.0";

function jsonBytes(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function loadMembership() {
  const v6 = JSON.parse(
    readFileSync(
      join(
        process.env.HOME,
        ".omp/agent/sessions/-.claude-claude/2026-08-30T22-35-52-550Z_01a054d0-9b66-7766-9f51-9d204b454e3c/local/skill-foundry-final-authoring-audit-input.json",
      ),
      "utf8",
    ),
  );
  const byModule = new Map();
  for (const skill of v6.skills) {
    if (!byModule.has(skill.module)) byModule.set(skill.module, []);
    byModule.get(skill.module).push(skill.slug);
  }
  for (const slugs of byModule.values()) slugs.sort();
  return { byModule, all: v6.skills.map((s) => s.slug).sort() };
}

function copySkill(root, destSkills, slug) {
  const src = join(root, "skills", slug);
  if (!existsSync(src)) throw new Error(`missing authored skill ${slug}`);
  cpSync(src, join(destSkills, slug), { recursive: true });
}

function writeModulePlugin(entry) {
  const body = {
    name: entry.id,
    displayName: entry.display_name,
    version: RELEASE_VERSION,
    description: entry.description,
    author: { name: "OutlineDriven", url: "https://github.com/OutlineDriven" },
    homepage: entry.homepage,
    repository: "https://github.com/OutlineDriven/odin-claude-plugin",
    license: "SEE LICENSE IN PROVENANCE.md",
    keywords: entry.tags,
  };
  if (entry.id !== "odin") body.skills = "./skills/";
  return jsonBytes(body);
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

function renderKimiCatalog(entries) {
  return jsonBytes({
    version: "2",
    plugins: entries.map((entry) => ({
      id: entry.id,
      displayName: entry.display_name,
      source: `./plugins/modules/${entry.id}`,
    })),
  });
}

export function renderDistribution(root = ROOT, out = OUT) {
  const catalog = loadCatalog(root);
  const { byModule, all } = loadMembership();
  if (all.length !== 816) throw new Error(`expected 816 slugs, got ${all.length}`);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  const ordered = runtimeThenOdin(catalog);
  let copied = 0;
  for (const entry of catalog.entries) {
    const mod = join(out, "plugins/modules", entry.id);
    mkdirSync(mod, { recursive: true });
    for (const name of ["package.json", "README.md", "LICENSE", "PROVENANCE.md"]) {
      cpSync(join(root, "packages", entry.id, name), join(mod, name));
    }
    const plugin = writeModulePlugin(entry);
    mkdirSync(join(mod, ".codex-plugin"), { recursive: true });
    mkdirSync(join(mod, ".cursor-plugin"), { recursive: true });
    mkdirSync(join(mod, ".kimi-plugin"), { recursive: true });
    writeFileSync(join(mod, ".codex-plugin/plugin.json"), plugin);
    writeFileSync(join(mod, ".cursor-plugin/plugin.json"), plugin);
    writeFileSync(join(mod, ".kimi-plugin/plugin.json"), plugin);
    writeFileSync(join(mod, "plugin.json"), plugin);
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
    description: "Complete 816-skill ODIN plugin for hosts without a native 29-entry marketplace.",
    author: { name: "OutlineDriven", url: "https://github.com/OutlineDriven" },
    homepage: "https://github.com/OutlineDriven/odin-claude-plugin",
    repository: "https://github.com/OutlineDriven/odin-claude-plugin",
    license: "SEE LICENSE IN PROVENANCE.md",
    skills: "./skills/",
  });
  writeFileSync(join(complete, ".devin-plugin/plugin.json"), completePlugin);
  writeFileSync(join(complete, "plugin.json"), completePlugin);
  cpSync(join(root, "LICENSE"), join(complete, "LICENSE"));
  cpSync(join(root, "packages/odin-core/PROVENANCE.md"), join(complete, "PROVENANCE.md"));
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
    skill_count: 816,
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const manifest = renderDistribution();
  process.stdout.write(
    `distribution ${manifest.skill_count} skills modules=${manifest.module_skill_copies} last=${manifest.informational_last}\n`,
  );
}
