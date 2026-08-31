#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog } from "./package-surfaces.mjs";
import { renderAllProvenance, loadRows } from "./render-package-provenance.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = loadCatalog(ROOT);
const ledger = loadRows(ROOT);
const expected = renderAllProvenance(ROOT);
let drift = 0;
let runtimeRows = 0;
for (const file of expected) {
  const dest = join(ROOT, file.path);
  if (!existsSync(dest)) {
    console.error(`missing ${file.path}`);
    drift += 1;
    continue;
  }
  const actual = readFileSync(dest, "utf8");
  if (actual !== file.content) {
    console.error(`drift ${file.path}`);
    drift += 1;
  }
  if (!file.path.includes("/odin/PROVENANCE.md")) {
    runtimeRows += actual.split("\n").filter((line) => line.startsWith("| `")).length;
  }
}
const odin = readFileSync(join(ROOT, "packages/odin/PROVENANCE.md"), "utf8");
if (!odin.includes("Shipped skill rows: 0.")) {
  console.error("odin provenance must ship zero skill rows");
  drift += 1;
}
if (runtimeRows !== ledger.skill_count) {
  console.error(`runtime provenance rows ${runtimeRows}, want ${ledger.skill_count}`);
  drift += 1;
}
const skillsDir = join(ROOT, "skills");
const skillsOnDisk = new Set(
  readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name),
);
const missingSlugs = ledger.rows
  .map((r) => r.slug)
  .filter((slug) => !skillsOnDisk.has(slug));
if (missingSlugs.length > 0) {
  console.error(`ledger slugs without canonical skills/ directory: ${missingSlugs.join(", ")}`);
  drift += 1;
}
if (drift) process.exit(1);
process.stdout.write(`package-provenance match ${ledger.skill_count}\n`);
