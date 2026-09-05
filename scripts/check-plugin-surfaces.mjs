#!/usr/bin/env node
// Structural gate over the plugin tree. Byte drift is checked by
// render-plugin-surfaces.mjs --check; this file holds the invariants that no
// renderer can restate: retired surfaces stay dead, every plugin directory
// matches the catalog, and no npm artifact comes back.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadCatalog, skillRows } from "./plugin-surfaces.mjs";

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
  ".agents",
  ".agents/plugins/marketplace.json",
  ...ids.map((id) => `plugins/${id}/package.json`),
  ...ids.map((id) => `plugins/${id}/PROVENANCE.md`),
  ...ids.map((id) => `plugins/${id}/plugin.json`),
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
const tiered = ids.filter((id) => id.endsWith("-advanced"));
if (tiered.length) errors.push(`plugin id names a tier, not a job: ${tiered.join(", ")}`);

// A plugin with no skills installs nothing. Each harness dotdir manifest must
// exist, parse, and carry the catalog name: Codex resolves the plugin namespace
// from the dotdir list only (plugin_namespace_for_root_uri in
// codex-rs/utils/plugins/src/plugin_namespace.rs) and never from a root file,
// so diverged names load one plugin's components under another's namespace.
const DOTDIRS = [
  ".claude-plugin",
  ".codex-plugin",
  ".cursor-plugin",
  ".grok-plugin",
  ".kimi-plugin",
];
let skillTotal = 0;
for (const entry of catalog.entries) {
  const skills = skillRows(entry);
  skillTotal += skills.length;
  if (!skills.length) errors.push(`${entry.id}: no skills`);
  const manifests = {};
  for (const dotdir of DOTDIRS) {
    const manifestPath = join(ROOT, entry.directory, dotdir, "plugin.json");
    if (!existsSync(manifestPath)) {
      errors.push(`${entry.id}: missing ${dotdir}/plugin.json`);
      continue;
    }
    manifests[dotdir] = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (manifests[dotdir].name !== entry.id)
      errors.push(
        `${entry.id}: ${dotdir}/plugin.json name is ${manifests[dotdir].name}, catalog id is ${entry.id}`,
      );
  }
  // The published Codex manifest schema is closed and rejects $schema, which the
  // Rust deserializer would happily ignore.
  if (manifests[".codex-plugin"] && "$schema" in manifests[".codex-plugin"])
    errors.push(`${entry.id}: .codex-plugin/plugin.json must not declare $schema`);
  // Kimi's default is a root SKILL.md fallback, not skills/, so the key is load-bearing.
  if (manifests[".kimi-plugin"] && !manifests[".kimi-plugin"].skills)
    errors.push(`${entry.id}: .kimi-plugin/plugin.json must declare skills`);
  // Codex and Grok default to the dotted .mcp.json, so a plugin shipping the
  // dotless mcp.json must override the default in both or its MCP silently
  // stops loading.
  if (existsSync(join(ROOT, entry.directory, "mcp.json")))
    for (const dotdir of [".codex-plugin", ".grok-plugin"]) {
      const manifest = manifests[dotdir];
      if (manifest && manifest.mcpServers !== "./mcp.json")
        errors.push(
          `${entry.id}: ${dotdir}/plugin.json must declare mcpServers "./mcp.json"`,
        );
    }
  for (const slug of skills) {
    const skillDir = join(ROOT, entry.directory, "skills", slug);
    if (!existsSync(join(skillDir, "SKILL.md")))
      errors.push(`${entry.id}/${slug}: missing SKILL.md`);
    // Immediate children only: a nested SKILL.md never loads.
    for (const child of readdirSync(skillDir, { withFileTypes: true }))
      if (child.isDirectory() && existsSync(join(skillDir, child.name, "SKILL.md")))
        errors.push(`${entry.id}/${slug}: nested SKILL.md at ${child.name}/ never loads`);
  }
}

// No registry source may reach outside the repository. Kimi's registry lives in
// .kimi-plugin/, so its sources climb one directory up to reach plugins/ and
// key their entries by id rather than name.
for (const registry of [
  ".claude-plugin/marketplace.json",
  ".codex-plugin/marketplace.json",
  ".cursor-plugin/marketplace.json",
  ".grok-plugin/marketplace.json",
  ".kimi-plugin/marketplace.json",
]) {
  const path = join(ROOT, registry);
  if (!existsSync(path)) {
    errors.push(`missing registry: ${registry}`);
    continue;
  }
  const parsed = JSON.parse(readFileSync(path, "utf8"));
  if (parsed.plugins.length !== ids.length)
    errors.push(`${registry}: ${parsed.plugins.length} plugins, catalog has ${ids.length}`);
  const kimi = registry === ".kimi-plugin/marketplace.json";
  const prefix = kimi ? "../plugins/" : "./plugins/";
  for (const plugin of parsed.plugins) {
    const label = kimi ? plugin.id : plugin.name;
    const source = typeof plugin.source === "string" ? plugin.source : plugin.source?.path;
    if (!source?.startsWith(prefix))
      errors.push(`${registry}: ${label} source is not a repository path`);
  }
}

if (errors.length) {
  process.stderr.write(`${errors.map((e) => `  ${e}`).join("\n")}\n`);
  process.exit(1);
}
process.stdout.write(
  `plugin surfaces ok: ${ids.length} plugins, ${skillTotal} skills\n`,
);
