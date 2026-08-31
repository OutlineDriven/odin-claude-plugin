#!/usr/bin/env node
// Structural gate over the plugin tree. Byte drift is checked by
// render-plugin-surfaces.mjs --check; this file holds the invariants that no
// renderer can restate: retired surfaces stay dead, every plugin directory
// matches the catalog, and no npm artifact comes back.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, AGENT_PLUGIN_SCHEMA, loadCatalog, skillRows } from "./plugin-surfaces.mjs";

const catalog = loadCatalog();
const errors = [];
const ids = catalog.entries.map((entry) => entry.id);

// Surfaces removed in earlier cutovers, plus the npm model retired with this one.
// Each one regrew at least once from a generator that outlived its purpose.
const RETIRED = [
  "catalog/packages.json",
  "catalog/provenance-rows.json",
  "catalog/skill-membership.json",
  "package.json",
  "package-lock.json",
  "registry-preflight.json",
  "scripts/assemble-packages.mjs",
  "scripts/check-distribution.mjs",
  "scripts/check-package-provenance.mjs",
  "scripts/check-package-surfaces.mjs",
  "scripts/pack-packages.mjs",
  "scripts/package-surfaces.mjs",
  "scripts/render-distribution.mjs",
  "scripts/render-package-provenance.mjs",
  "scripts/render-package-surfaces.mjs",
  "scripts/skill-membership.mjs",
  "skills",
  "packages",
  ...ids.map((id) => `plugins/${id}/package.json`),
  ...ids.map((id) => `plugins/${id}/PROVENANCE.md`),
];
for (const path of RETIRED)
  if (existsSync(join(ROOT, path))) errors.push(`retired surface present: ${path}`);

// Every plugins/ directory is a catalog entry and every entry has a directory.
const onDisk = readdirSync(join(ROOT, "plugins"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();
const missing = ids.filter((id) => !onDisk.includes(id));
const extra = onDisk.filter((id) => !ids.includes(id));
if (missing.length) errors.push(`catalog entries without a directory: ${missing.join(", ")}`);
if (extra.length) errors.push(`plugin directories without a catalog entry: ${extra.join(", ")}`);

// A plugin with no skills installs nothing. The Agent Plugins manifest must not
// declare component locations (spec §6.1) and must carry the 1.0.0 schema.
let skillTotal = 0;
for (const entry of catalog.entries) {
  const skills = skillRows(entry);
  skillTotal += skills.length;
  if (!skills.length) errors.push(`${entry.id}: no skills`);
  const manifestPath = join(ROOT, entry.directory, "plugin.json");
  if (!existsSync(manifestPath)) {
    errors.push(`${entry.id}: missing plugin.json`);
    continue;
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.$schema !== AGENT_PLUGIN_SCHEMA)
    errors.push(`${entry.id}: plugin.json $schema must be ${AGENT_PLUGIN_SCHEMA}`);
  for (const field of ["skills", "mcpServers", "commands", "agents", "hooks", "paths"])
    if (field in manifest)
      errors.push(`${entry.id}: plugin.json must not declare ${field} (Agent Plugins fixes it)`);
  // Codex takes the manifest from the root plugin.json but the plugin namespace
  // from the dotdir list only, so a name mismatch splits one plugin in two.
  const claudePath = join(ROOT, entry.directory, ".claude-plugin/plugin.json");
  if (!existsSync(claudePath)) {
    errors.push(`${entry.id}: missing .claude-plugin/plugin.json (Codex namespace source)`);
  } else {
    const claude = JSON.parse(readFileSync(claudePath, "utf8"));
    if (claude.name !== manifest.name)
      errors.push(
        `${entry.id}: name differs between plugin.json (${manifest.name}) and .claude-plugin/plugin.json (${claude.name})`,
      );
  }
  for (const slug of skills) {
    const skillDir = join(ROOT, entry.directory, "skills", slug);
    if (!existsSync(join(skillDir, "SKILL.md")))
      errors.push(`${entry.id}/${slug}: missing SKILL.md`);
    // Agent Plugins §7.1: immediate children only, so a nested skill never loads.
    for (const child of readdirSync(skillDir, { withFileTypes: true }))
      if (child.isDirectory() && existsSync(join(skillDir, child.name, "SKILL.md")))
        errors.push(`${entry.id}/${slug}: nested SKILL.md at ${child.name}/ never loads`);
  }
}

// No registry source may reach outside the repository.
for (const registry of [
  ".claude-plugin/marketplace.json",
  ".agents/plugins/marketplace.json",
  ".cursor-plugin/marketplace.json",
]) {
  const path = join(ROOT, registry);
  if (!existsSync(path)) {
    errors.push(`missing registry: ${registry}`);
    continue;
  }
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  if (parsed.plugins.length !== ids.length)
    errors.push(`${registry}: ${parsed.plugins.length} plugins, catalog has ${ids.length}`);
  for (const plugin of parsed.plugins) {
    const source = typeof plugin.source === "string" ? plugin.source : plugin.source?.path;
    if (!source?.startsWith("./plugins/"))
      errors.push(`${registry}: ${plugin.name} source is not a repository path`);
  }
}

if (errors.length) {
  process.stderr.write(`${errors.map((e) => `  ${e}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(
  `plugin surfaces ok: ${ids.length} plugins, ${skillTotal} skills\n`,
);
