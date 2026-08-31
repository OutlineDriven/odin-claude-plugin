#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderAll } from "./package-surfaces.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = renderAll(ROOT);
for (const file of files) {
  const dest = join(ROOT, file.path);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, file.content);
  process.stdout.write(`${file.path}\n`);
}
process.stdout.write(`wrote ${files.length} files\n`);
