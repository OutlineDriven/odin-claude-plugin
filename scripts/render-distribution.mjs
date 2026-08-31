#!/usr/bin/env node
/**
 * Generate the off-branch distribution projection under .release/distribution/.
 * Native catalogs list 28 runtime entries then informational odin last.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog } from "./package-surfaces.mjs";
import { loadRows } from "./render-package-provenance.mjs";

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

function loadMembership(root = ROOT) {
  const membershipPath = process.env.ODIN_MEMBERSHIP_PATH
    ? process.env.ODIN_MEMBERSHIP_PATH
    : join(root, "catalog/provenance-rows.json");
  const ledger = JSON.parse(readFileSync(membershipPath, "utf8"));
  const byModule = new Map();
  for (const row of ledger.rows) {
    if (!byModule.has(row.module)) byModule.set(row.module, []);
    byModule.get(row.module).push(row.slug);
  }
  for (const slugs of byModule.values()) slugs.sort();
  return { byModule, all: ledger.rows.map((r) => r.slug).sort() };
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

function renderCompleteProvenance(rows) {
  const sorted = [...rows].sort((a, b) => (a.slug < b.slug ? -1 : 1));
  const lines = [
    "# Provenance — ODIN Complete",
    "",
    "OutlineDriven-authored material in this package is Apache-2.0. See the repository `LICENSE`.",
    "",
    `This package ships ${sorted.length} public ${sorted.length === 1 ? "skill" : "skills"} from the canonical \`skills/<slug>/\` tree. Package-local skill copies are generated only at pack time.`,
    "",
    "| Skill | Strategy | Adaptation | Target | Origin |",
    "|---|---|---|---|---|",
  ];
  for (const row of sorted) {
    const esc = String(row.origin).replaceAll("|", "\\|");
    lines.push(
      `| \`${row.slug}\` | ${row.strategy} | ${row.adaptation} | \`${row.target}\` | ${esc} |`,
    );
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

export function renderDistribution(root = ROOT, out = OUT) {
  const catalog = loadCatalog(root);
  const ledger = loadRows(root);
  const skillCount = ledger.skill_count;
  const { byModule, all } = loadMembership(root);
  if (all.length !== skillCount) throw new Error(`expected ${skillCount} slugs, got ${all.length}`);
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
    description: `Complete ${skillCount}-skill ODIN plugin for hosts without a native 29-entry marketplace.`,
    author: { name: "OutlineDriven", url: "https://github.com/OutlineDriven" },
    homepage: "https://github.com/OutlineDriven/odin-claude-plugin",
    repository: "https://github.com/OutlineDriven/odin-claude-plugin",
    license: "SEE LICENSE IN PROVENANCE.md",
    skills: "./skills/",
  });
  writeFileSync(join(complete, ".devin-plugin/plugin.json"), completePlugin);
  writeFileSync(join(complete, "plugin.json"), completePlugin);
  cpSync(join(root, "LICENSE"), join(complete, "LICENSE"));
  writeFileSync(join(complete, "PROVENANCE.md"), renderCompleteProvenance(ledger.rows));
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
