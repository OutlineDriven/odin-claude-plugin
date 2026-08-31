#!/usr/bin/env node
// Write every generated distribution surface. --check reports drift and exits 1
// instead of writing, which is how the pre-commit hook runs it.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  ROOT,
  loadCatalog,
  renderPluginReadme,
  renderRootReadme,
  skillRows,
  surfacePlan,
} from "./plugin-surfaces.mjs";

const check = process.argv.includes("--check");
const catalog = loadCatalog();
const wanted = new Map();

for (const [relative, value] of surfacePlan(catalog))
  wanted.set(relative, `${JSON.stringify(value, null, 2)}\n`);

const license = readFileSync(join(ROOT, "LICENSE"), "utf8");
const notice = readFileSync(join(ROOT, "licenses/NOTICE"), "utf8");
for (const entry of catalog.entries) {
  wanted.set(`${entry.directory}/LICENSE`, license);
  wanted.set(`${entry.directory}/NOTICE`, notice);
  wanted.set(
    `${entry.directory}/README.md`,
    renderPluginReadme(catalog, entry, skillRows(entry)),
  );
}

// Only the plugin table is owned here; the surrounding prose is authored.
wanted.set(
  "README.md",
  renderRootReadme(catalog, readFileSync(join(ROOT, "README.md"), "utf8")),
);

const drifted = [];
let written = 0;
for (const [relative, contents] of wanted) {
  const path = join(ROOT, relative);
  let current = null;
  try {
    current = readFileSync(path, "utf8");
  } catch {
    current = null;
  }
  if (current === contents) continue;
  if (check) {
    drifted.push(relative);
    continue;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
  written += 1;
}

if (check && drifted.length) {
  process.stderr.write(
    `plugin surfaces drifted (${drifted.length}):\n${drifted
      .map((r) => `  ${r}`)
      .join("\n")}\nrun: just render\n`,
  );
  process.exit(1);
}
process.stdout.write(
  check
    ? `plugin surfaces match (${wanted.size} files, ${catalog.entries.length} plugins)\n`
    : `wrote ${written}/${wanted.size} file(s) for ${catalog.entries.length} plugins\n`,
);
