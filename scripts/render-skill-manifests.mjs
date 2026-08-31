#!/usr/bin/env node
// Derive every plugins/<plugin>/skills/<slug>/agents/openai.yaml from SKILL.md:
//   display_name      = title-cased frontmatter name with an in-script acronym table
//   short_description = first sentence of description, hard-truncated at 64 chars
// A short_description under 25 chars is a generation ERROR (listed, nonzero exit).
// Default mode writes files; --check diffs generated vs on-disk and exits 1 on drift.
// --only <slug>[,<slug>...] limits scope (fixture verification while the tree mutates).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { ROOT, loadCatalog, skillRows } from "./plugin-surfaces.mjs";

// slug -> repository-relative skill directory, in catalog then alphabetical order.
const skillDirs = new Map(
  loadCatalog().entries.flatMap((entry) =>
    skillRows(entry).map((slug) => [slug, `${entry.directory}/skills/${slug}`]),
  ),
);

// Whole-name literals: the display_name is not token title-casing.
const NAME_LITERALS = {
  "agents-md": "AGENTS.md",
  "atomic-issues-prs": "Atomic Issues and PRs",
};

// Per-token acronym overrides (matched case-insensitively on the lowercased token).
const ACRONYMS = {
  api: "API",
  ci: "CI",
  gh: "GH",
  pr: "PR",
  tui: "TUI",
  cli: "CLI",
  ui: "UI",
  css: "CSS",
  html: "HTML",
  sql: "SQL",
  aws: "AWS",
  gcp: "GCP",
  id: "ID",
  ai: "AI",
  llm: "LLM",
  mcp: "MCP",
  yaml: "YAML",
  json: "JSON",
  url: "URL",
  http: "HTTP",
  jwt: "JWT",
  oauth: "OAuth",
  ux: "UX",
  seo: "SEO",
  adr: "ADR",
  md: "MD",
  npm: "NPM",
  pdf: "PDF",
  qa: "QA",
  sdk: "SDK",
};

function titleCaseName(name) {
  if (NAME_LITERALS[name]) return NAME_LITERALS[name];
  return name
    .split("-")
    .map((tok) => {
      const key = tok.toLowerCase();
      if (ACRONYMS[key]) return ACRONYMS[key];
      return tok.charAt(0).toUpperCase() + tok.slice(1).toLowerCase();
    })
    .join(" ");
}

// Parse a single-line YAML scalar following "key:".
function parseScalar(raw) {
  const s = raw.trim();
  if (s.startsWith("'")) {
    const body = s.slice(1, s.lastIndexOf("'"));
    return body.replace(/''/g, "'");
  }
  if (s.startsWith('"')) {
    const body = s.slice(1, s.lastIndexOf('"'));
    return body
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
  return s;
}

function parseFrontmatter(text) {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  if (end === -1) return null;
  const out = {};
  for (const line of text.slice(4, end).split("\n")) {
    const m = /^([a-zA-Z_]+):(.*)$/.exec(line);
    if (m) out[m[1]] = parseScalar(m[2]);
  }
  return out;
}

// First sentence: text up to the first period followed by whitespace, else the whole value.
function firstSentence(desc) {
  const m = /(.+?\.)\s/.exec(desc);
  return m ? m[1] : desc;
}

// Hard limit 64 chars; cut at the last space at or before 64 to avoid mid-word
// breaks, then strip dangling whitespace and punctuation in one pass so a cut
// that exposes " — " or "feedback," leaves no residue.
function truncate64(s) {
  if (s.length <= 64) return s;
  const cut = s.slice(0, 64);
  const sp = cut.lastIndexOf(" ");
  return (sp > 0 ? cut.slice(0, sp) : cut).replace(/[\s,;:\u2014\u2013-]+$/u, "");
}

function renderManifest(slug) {
  const dir = skillDirs.get(slug);
  if (!dir) throw new Error(`${slug}: not in any plugin skills/ directory`);
  const skillPath = join(ROOT, dir, "SKILL.md");
  if (!existsSync(skillPath)) throw new Error(`${slug}: missing SKILL.md`);
  const fm = parseFrontmatter(readFileSync(skillPath, "utf8"));
  if (!fm) throw new Error(`${slug}: missing/invalid frontmatter`);
  if (!fm.name) throw new Error(`${slug}: frontmatter has no name`);
  if (!fm.description) throw new Error(`${slug}: frontmatter has no description`);
  const display_name = titleCaseName(fm.name);
  const short_description = truncate64(firstSentence(fm.description));
  const yaml =
    `interface:\n` +
    `  display_name: ${JSON.stringify(display_name)}\n` +
    `  short_description: ${JSON.stringify(short_description)}\n`;
  return { slug, dir, display_name, short_description, yaml };
}

const args = process.argv.slice(2);
const check = args.includes("--check");
const onlyIdx = args.indexOf("--only");
let targets = null;
if (onlyIdx !== -1) {
  const val = args[onlyIdx + 1];
  if (!val) {
    console.error("render-skill-manifests: --only requires a slug list");
    process.exit(2);
  }
  targets = val.split(",").map((s) => s.trim()).filter(Boolean);
} else {
  targets = [...skillDirs.keys()].sort();
}

const errors = [];
const drifted = [];
let written = 0;

for (const slug of targets) {
  let manifest;
  try {
    manifest = renderManifest(slug);
  } catch (e) {
    errors.push(e.message);
    continue;
  }
  if (manifest.short_description.length < 25) {
    errors.push(
      `${slug}: short_description under 25 chars (${manifest.short_description.length}): "${manifest.short_description}"`,
    );
  }
  const dest = join(ROOT, manifest.dir, "agents", "openai.yaml");
  if (check) {
    if (!existsSync(dest)) {
      drifted.push(`${dest.slice(ROOT.length + 1)} (missing)`);
    } else {
      const onDisk = readFileSync(dest, "utf8");
      if (onDisk !== manifest.yaml) drifted.push(dest.slice(ROOT.length + 1));
    }
  } else {
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, manifest.yaml);
    process.stdout.write(`${manifest.dir}/agents/openai.yaml\n`);
    written += 1;
  }
}

if (errors.length) {
  for (const e of errors) console.error(`render-skill-manifests: ${e}`);
  console.error(`render-skill-manifests: ${errors.length} error(s)`);
}
if (check && drifted.length) {
  for (const p of drifted) console.error(`render-skill-manifests: drift ${p}`);
  console.error(`render-skill-manifests: ${drifted.length} drifted manifest(s)`);
}
if (errors.length || (check && drifted.length)) process.exit(1);
if (!check) process.stdout.write(`wrote ${written} manifest(s)\n`);
else process.stdout.write(`manifests match (${targets.length})\n`);
