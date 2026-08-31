#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalog } from "./package-surfaces.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export function loadRows(root = ROOT) {
  const ledger = JSON.parse(readFileSync(join(root, "catalog/provenance-rows.json"), "utf8"));
  if (typeof ledger.skill_count !== "number" || ledger.rows.length !== ledger.skill_count) {
    throw new Error(`provenance-rows.json rows (${ledger.rows.length}) must match skill_count (${ledger.skill_count})`);
  }
  return ledger;
}

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|");
}

export function renderProvenance(entry, rows) {
  const lines = [
    `# Provenance — ${entry.package}`,
    "",
    "OutlineDriven-authored material in this package is Apache-2.0. See the repository `LICENSE`.",
    "",
  ];
  if (entry.id === "odin") {
    lines.push(
      "This package contains no runtime module and no installer executable. The universal installer lives in OutlineDriven/outline-driven.",
      "",
      "Shipped skill rows: 0.",
      "",
    );
    return lines.join("\n");
  }
  const mine = rows.filter((row) => row.module === entry.id).sort((a, b) => (a.slug < b.slug ? -1 : 1));
  lines.push(
    `This package ships ${mine.length} public ${mine.length === 1 ? "skill" : "skills"} from the canonical \`skills/<slug>/\` tree. Package-local skill copies are generated only at pack time.`,
    "",
    "| Skill | Strategy | Adaptation | Target | Origin |",
    "|---|---|---|---|---|",
  );
  for (const row of mine) {
    lines.push(
      `| \`${row.slug}\` | ${row.strategy} | ${row.adaptation} | \`${row.target}\` | ${escapeCell(row.origin)} |`,
    );
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

export function renderAllProvenance(root = ROOT) {
  const catalog = loadCatalog(root);
  const ledger = loadRows(root);
  return catalog.entries.map((entry) => ({
    path: `packages/${entry.id}/PROVENANCE.md`,
    content: renderProvenance(entry, ledger.rows),
  }));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const files = renderAllProvenance(ROOT);
  for (const file of files) {
    const dest = join(ROOT, file.path);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, file.content);
    process.stdout.write(`${file.path}\n`);
  }
  process.stdout.write(`wrote ${files.length} provenance files\n`);
}
