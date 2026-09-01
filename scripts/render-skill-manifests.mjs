#!/usr/bin/env node
// Derive every plugins/<plugin>/skills/<slug>/agents/openai.yaml from SKILL.md:
//   display_name      = title-cased frontmatter name with an in-script acronym table
//   short_description = first sentence of the description, emitted whole so it reads
//                       as a complete phrase ending in terminal punctuation.
// The 64-char ceiling the generator once imposed is a local choice, not an Agent Plugins
// requirement: the Codex skill parser (codex-rs/skills/src/interface.rs) resolves
// interface.short_description against MAX_DESCRIPTION_LEN = 1024 and only warns above
// that, and the upstream openai.yaml reference calls 25-64 chars a soft "for quick
// scanning" guideline, not an enforced limit. Cutting a sentence at 64 chars left
// dangling conjunctions, articles, prepositions, and mid-clause fragments on the
// user-facing Agent Plugins surface, so the first sentence is now emitted in full.
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

// The short_description is the description's first sentence, emitted whole. The
// Codex skill parser accepts interface.short_description up to MAX_DESCRIPTION_LEN
// (1024) and only warns above it, so a complete sentence is always valid; emitting
// it intact (rather than cutting at a fixed width) leaves no dangling conjunction,
// article, preposition, or mid-clause fragment, and the first sentence is where the
// skill states the trigger a model routes on. A defensive 1024 cap guards against a
// future description whose first sentence exceeds the parser limit: it cuts at the
// last clause boundary (",", ";", ":", " — ") at or before 1024 and strips the
// trailing punctuation, falling back to the last space. No current first sentence
// approaches 1024 (max observed 342), so this branch is unreachable on this tree.
const SHORT_DESC_MAX = 1024;
function shortDescriptionFrom(desc) {
  const sentence = firstSentence(desc);
  if (sentence.length <= SHORT_DESC_MAX) return sentence;
  const cut = sentence.slice(0, SHORT_DESC_MAX);
  const boundary = Math.max(
    cut.lastIndexOf(", "),
    cut.lastIndexOf("; "),
    cut.lastIndexOf(": "),
    cut.lastIndexOf(" \u2014 "),
    cut.lastIndexOf(" "),
  );
  return (boundary > 0 ? cut.slice(0, boundary) : cut).replace(/[\s,;:\u2014\u2013-]+$/u, "");
}

function renderManifest(slug) {
  const dir = skillDirs.get(slug);
  if (!dir) throw new Error(`${slug}: not in any plugin skills/ directory`);
  const skillPath = join(ROOT, dir, "SKILL.md");
  if (!existsSync(skillPath)) throw new Error(`${slug}: missing SKILL.md`);
  const fm = parseFrontmatter(readFileSync(skillPath, "utf8"));
  if (!fm) throw new Error(`${slug}: missing/invalid frontmatter`);
  if (!fm.name) throw new Error(`${slug}: frontmatter has no name`);
  const display_name = titleCaseName(fm.name);
  const short_description = shortDescriptionFrom(fm.description);
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
