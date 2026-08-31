#!/usr/bin/env node
/**
 * Assemble pack-time package trees under .release/npm/staging/.
 * Does not commit package-local skill mirrors.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog } from "./package-surfaces.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, ".release/npm/staging");

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
  return byModule;
}

export function assemblePackages(root = ROOT, out = OUT) {
  const catalog = loadCatalog(root);
  const byModule = loadMembership();
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  let copied = 0;
  for (const entry of catalog.entries) {
    const dest = join(out, entry.id);
    mkdirSync(dest, { recursive: true });
    for (const name of ["package.json", "README.md", "LICENSE", "PROVENANCE.md"]) {
      cpSync(join(root, "packages", entry.id, name), join(dest, name));
    }
    mkdirSync(join(dest, ".claude-plugin"), { recursive: true });
    cpSync(
      join(root, "packages", entry.id, ".claude-plugin/plugin.json"),
      join(dest, ".claude-plugin/plugin.json"),
    );
    if (entry.id === "odin-core") {
      cpSync(join(root, "packages/odin-core/mcp.json"), join(dest, "mcp.json"));
      cpSync(join(root, "packages/odin-core/output-styles"), join(dest, "output-styles"), {
        recursive: true,
      });
    }
    if (entry.id !== "odin") {
      const destSkills = join(dest, "skills");
      mkdirSync(destSkills, { recursive: true });
      for (const slug of byModule.get(entry.id) || []) {
        const src = join(root, "skills", slug);
        if (!existsSync(src)) throw new Error(`missing authored skill ${slug}`);
        cpSync(src, join(destSkills, slug), { recursive: true });
        copied += 1;
      }
    }
  }
  writeFileSync(
    join(out, "MANIFEST.json"),
    `${JSON.stringify({ schema: "odin-pack-staging/v1", skill_copies: copied, packages: catalog.entries.length }, null, 2)}\n`,
  );
  return { copied, packages: catalog.entries.length };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const result = assemblePackages();
  process.stdout.write(`staging packages=${result.packages} skills=${result.copied}\n`);
}
