#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog } from "./package-surfaces.mjs";
import { renderAllProvenance } from "./render-package-provenance.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = loadCatalog(ROOT);
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
if (runtimeRows !== 816) {
  console.error(`runtime provenance rows ${runtimeRows}, want 816`);
  drift += 1;
}
if (catalog.entries.length !== 29) {
  console.error("catalog cardinality failed");
  drift += 1;
}
if (drift) process.exit(1);
process.stdout.write("package-provenance match 816\n");
