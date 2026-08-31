#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, ".release/distribution");
const STAGING = join(ROOT, ".release/npm/staging");

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

if (!existsSync(join(DIST, "MANIFEST.json"))) fail("missing .release/distribution/MANIFEST.json");
const manifest = JSON.parse(readFileSync(join(DIST, "MANIFEST.json"), "utf8"));
if (manifest.skill_count !== 816) fail(`distribution skill_count ${manifest.skill_count}`);
if (manifest.module_skill_copies !== 816) fail(`module copies ${manifest.module_skill_copies}`);
if (manifest.informational_last !== "odin") fail("informational entry is not last");
if (existsSync(join(DIST, "plugins/modules/odin/skills"))) fail("informational odin has skills");

const catalogs = [
  join(DIST, ".agents/plugins/marketplace.json"),
  join(DIST, ".cursor-plugin/marketplace.json"),
  join(DIST, ".grok-plugin/marketplace.json"),
  join(DIST, "marketplaces/kimi.json"),
];
for (const path of catalogs) {
  const data = JSON.parse(readFileSync(path, "utf8"));
  const plugins = data.plugins;
  if (plugins.length !== 29) fail(`${path} has ${plugins.length} plugins`);
  const last = plugins[28].name || plugins[28].id;
  if (last !== "odin") fail(`${path} last entry is ${last}`);
}

if (!existsSync(join(STAGING, "MANIFEST.json"))) fail("missing staging MANIFEST.json");
const staging = JSON.parse(readFileSync(join(STAGING, "MANIFEST.json"), "utf8"));
if (staging.skill_copies !== 816 || staging.packages !== 29) {
  fail(`staging ${JSON.stringify(staging)}`);
}
if (existsSync(join(STAGING, "odin/skills"))) fail("staging informational odin has skills");
process.stdout.write("distribution match 816 last=odin\n");
