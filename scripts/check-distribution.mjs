#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog } from "./package-surfaces.mjs";
import { loadRows } from "./render-package-provenance.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, ".release/distribution");
const STAGING = join(ROOT, ".release/npm/staging");

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

const catalog = loadCatalog(ROOT);
const ledger = loadRows(ROOT);
const skillCount = ledger.skill_count;
const catalogIds = catalog.entries.map((e) => e.id);

if (!existsSync(join(DIST, "MANIFEST.json"))) fail("missing .release/distribution/MANIFEST.json");
const manifest = JSON.parse(readFileSync(join(DIST, "MANIFEST.json"), "utf8"));
if (manifest.skill_count !== skillCount) fail(`distribution skill_count ${manifest.skill_count}, want ${skillCount}`);
if (manifest.module_skill_copies !== skillCount) fail(`module copies ${manifest.module_skill_copies}, want ${skillCount}`);
if (manifest.informational_last !== "odin") fail("informational entry is not last");
if (existsSync(join(DIST, "plugins/modules/odin/skills"))) fail("informational odin has skills");

// Validate actual distribution payload directories against the catalog.
const distModulesDir = join(DIST, "plugins/modules");
if (!existsSync(distModulesDir)) fail("missing distribution plugins/modules directory");
const distModuleIds = new Set(
  readdirSync(distModulesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name),
);
for (const id of catalogIds) {
  if (!distModuleIds.has(id)) fail(`distribution missing module directory for ${id}`);
}

// Count actual skill directories in each module and the complete plugin.
let distSkillTotal = 0;
for (const entry of catalog.entries) {
  if (entry.id === "odin") continue;
  const modDir = join(distModulesDir, entry.id);
  for (const carrier of [".codex-plugin", ".cursor-plugin", ".kimi-plugin"]) {
    if (!existsSync(join(modDir, carrier, "plugin.json"))) {
      fail(`distribution module ${entry.id} missing ${carrier}/plugin.json`);
    }
  }
  if (!existsSync(join(modDir, "plugin.json"))) fail(`distribution module ${entry.id} missing plugin.json`);
  const modSkills = join(modDir, "skills");
  if (!existsSync(modSkills)) fail(`distribution module ${entry.id} missing skills directory`);
  const slugs = readdirSync(modSkills, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  distSkillTotal += slugs.length;
}
for (const p of ["plugin.json", ".devin-plugin/plugin.json", "LICENSE", "PROVENANCE.md"]) {
  if (!existsSync(join(DIST, "plugins/odin-complete", p))) fail(`odin-complete missing ${p}`);
}
const completeSkillsDir = join(DIST, "plugins/odin-complete/skills");
if (!existsSync(completeSkillsDir)) fail("missing odin-complete skills directory");
const completeSlugs = readdirSync(completeSkillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);
if (completeSlugs.length !== skillCount) {
  fail(`odin-complete has ${completeSlugs.length} skills, want ${skillCount}`);
}

// Validate every ledger slug has a directory in the complete plugin.
const completeSet = new Set(completeSlugs);
const missingComplete = ledger.rows.map((r) => r.slug).filter((s) => !completeSet.has(s));
if (missingComplete.length > 0) {
  fail(`odin-complete missing skills: ${missingComplete.join(", ")}`);
}

// Compare each catalog's complete normalized ID list against catalog/packages.json.
const catalogs = [
  join(DIST, ".agents/plugins/marketplace.json"),
  join(DIST, ".cursor-plugin/marketplace.json"),
  join(DIST, ".grok-plugin/marketplace.json"),
  join(DIST, "marketplaces/kimi.json"),
];
for (const path of catalogs) {
  const data = JSON.parse(readFileSync(path, "utf8"));
  const plugins = data.plugins;
  if (plugins.length !== catalogIds.length) fail(`${path} has ${plugins.length} plugins, want ${catalogIds.length}`);
  const pluginIds = plugins.map((p) => p.name || p.id);
  // Distribution catalogs put the informational odin entry last; compare membership, then that convention.
  const want = new Set(catalogIds);
  const got = new Set(pluginIds);
  for (const id of want) if (!got.has(id)) fail(`${path} missing plugin ${id}`);
  for (const id of got) if (!want.has(id)) fail(`${path} has unknown plugin ${id}`);
  if (pluginIds[pluginIds.length - 1] !== "odin") fail(`${path} last entry is ${pluginIds[pluginIds.length - 1]}, want odin`);
}

if (!existsSync(join(STAGING, "MANIFEST.json"))) fail("missing staging MANIFEST.json");
const staging = JSON.parse(readFileSync(join(STAGING, "MANIFEST.json"), "utf8"));
if (staging.skill_copies !== skillCount || staging.packages !== catalogIds.length) {
  fail(`staging ${JSON.stringify(staging)}`);
}
if (existsSync(join(STAGING, "odin/skills"))) fail("staging informational odin has skills");

// Validate staging payload directories against the catalog.
const stagingDir = join(STAGING);
if (!existsSync(stagingDir)) fail("missing staging directory");
const stagingIds = new Set(
  readdirSync(stagingDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "node_modules")
    .map((d) => d.name),
);
for (const id of catalogIds) {
  if (!stagingIds.has(id)) fail(`staging missing package directory for ${id}`);
}
let stagingSkillTotal = 0;
for (const entry of catalog.entries) {
  if (entry.id === "odin") continue;
  const pkgSkills = join(stagingDir, entry.id, "skills");
  if (!existsSync(pkgSkills)) fail(`staging package ${entry.id} missing skills directory`);
  const slugs = readdirSync(pkgSkills, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  stagingSkillTotal += slugs.length;
}
if (stagingSkillTotal !== skillCount) {
  fail(`staging skill copies ${stagingSkillTotal}, want ${skillCount}`);
}
process.stdout.write(`distribution match ${skillCount} last=odin\n`);
