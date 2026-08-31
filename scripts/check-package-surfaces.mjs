#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog, renderAll } from "./package-surfaces.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = loadCatalog(ROOT);
const expected = renderAll(ROOT);
let drift = 0;
for (const file of expected) {
  const dest = join(ROOT, file.path);
  if (!existsSync(dest)) {
    console.error(`missing ${file.path}`);
    drift += 1;
    continue;
  }
  const actual = readFileSync(dest);
  const want = Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content);
  if (!actual.equals(want)) {
    console.error(`drift ${file.path}`);
    drift += 1;
  }
}
const ids = catalog.entries.map((e) => e.id);
if (new Set(ids).size !== 29) {
  console.error("duplicate catalog ids");
  drift += 1;
}

if (drift) {
  process.exit(1);
}
process.stdout.write("package-surfaces match\n");
