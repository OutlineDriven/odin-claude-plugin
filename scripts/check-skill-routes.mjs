// Verify every authored skill satisfies the install routes it is published on.
//
//   gh skill install OutlineDriven/odin-claude-plugin plugins/<plugin>/skills/<slug>
//   plugin install <plugin>@odin-marketplace   (Claude, Codex, Cursor marketplaces)
//
// Both resolve a skill as <dir>/SKILL.md whose frontmatter name equals the
// directory name, so a mismatch silently drops the skill from one route while
// leaving the other working.
//
// Checks:
//   (a) frontmatter parses, carries a name, and the name equals the directory
//   (b) frontmatter values containing ': ' are single-quoted (AGENTS.md contract:
//       an unquoted colon-space plain scalar is invalid YAML for strict parsers)
//   (c) display_name is unique across every generated agents/openai.yaml, so two
//       skills never present the same label in a harness picker
//
// Frontmatter is parsed with a tiny built-in structural YAML parser (no dependency)
// so nested and hyphenated keys like metadata.short-description validate correctly.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadCatalog, skillRows } from "./plugin-surfaces.mjs";

const errors = [];
// [slug, repository-relative directory] for every authored skill.
const skills = loadCatalog().entries.flatMap((entry) =>
  skillRows(entry).map((slug) => [slug, `${entry.directory}/skills/${slug}`]),
);

// --- tiny structural YAML frontmatter parser (no dependency) ---
// Returns { entries: [{ path, key, value, quoted, raw }], error } or null when
// there is no frontmatter block.  `path` is a dotted path (e.g. "metadata.short-description").
// `quoted` is true when the scalar was single- or double-quoted.  Only handles the
// flat + one-level-nested mapping shape used by SKILL.md frontmatter; flow styles,
// multi-line scalars, and sequences are out of scope (frontmatter does not use them).
function parseFrontmatterYaml(text) {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 4);
  if (end === -1) return { error: "unterminated frontmatter", entries: [] };
  const block = text.slice(4, end);
  const entries = [];
  const stack = []; // [{ indent, pathPrefix }]
  for (const line of block.split("\n")) {
    if (line.trim() === "" || /^\s*#/.test(line)) continue;
    const indent = line.length - line.trimStart().length;
    // Pop stack entries whose indent is >= current (siblings or dedent).
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    const trimmed = line.trimStart();
    const m = /^([A-Za-z0-9][A-Za-z0-9_-]*):\s?(.*)$/.exec(trimmed);
    if (!m) continue; // non-key lines (sequence items, etc.) are ignored
    const key = m[1];
    const rawVal = m[2];
    const prefix = stack.length ? stack[stack.length - 1].pathPrefix + "." : "";
    const path = prefix + key;
    if (rawVal.trim() === "") {
      // Nested mapping parent — push onto stack for subsequent indented keys.
      stack.push({ indent, pathPrefix: path });
      continue;
    }
    // Quoted scalars may carry a trailing inline comment after the closing
    // quote; record which quote character closed the value ('\'', '"', null).
    let value, quote = null;
    const v = rawVal.trim();
    let qm = /^'((?:[^']|'')*)'(?:\s+#.*)?$/.exec(v);
    if (qm) {
      value = qm[1].replace(/''/g, "'");
      quote = "'";
    } else if ((qm = /^"((?:[^"\\]|\\.)*)"(?:\s+#.*)?$/.exec(v))) {
      value = qm[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
      quote = '"';
    } else {
      value = v;
    }
    entries.push({ path, key, value, quote, raw: rawVal });
  }
  return { entries, error: null };
}

// --- (a) frontmatter presence + name == directory ---
const badName = [];
const badFrontmatter = [];
const parsed = new Map();
for (const [slug, dir] of skills) {
  const skillPath = join(ROOT, dir, "SKILL.md");
  if (!existsSync(skillPath)) {
    badFrontmatter.push(`${dir}: missing SKILL.md`);
    continue;
  }
  const fm = parseFrontmatterYaml(readFileSync(skillPath, "utf8"));
  if (fm === null) {
    badFrontmatter.push(`${dir}: no frontmatter block`);
    continue;
  }
  if (fm.error) {
    badFrontmatter.push(`${dir}: ${fm.error}`);
    continue;
  }
  parsed.set(dir, fm);
  const nameEntry = fm.entries.find((e) => e.path === "name");
  if (!nameEntry) {
    badFrontmatter.push(`${dir}: frontmatter has no name`);
    continue;
  }
  if (nameEntry.value !== slug) badName.push(`${dir}: name is ${nameEntry.value}`);
}
if (badFrontmatter.length)
  errors.push(
    `route-breaking frontmatter: ${badFrontmatter.slice(0, 5).join("; ")} (${badFrontmatter.length} total)`,
  );
if (badName.length)
  errors.push(
    `name/directory mismatches: ${badName.slice(0, 5).join("; ")} (${badName.length} total)`,
  );

// --- (b) frontmatter values containing ': ' must be single-quoted ---
const badQuote = [];
for (const [, dir] of skills) {
  const fm = parsed.get(dir);
  if (!fm) continue;
  for (const entry of fm.entries) {
    if (!entry.raw.includes(": ")) continue;
    if (entry.quote === "'") continue;
    if (entry.quote === '"')
      badQuote.push(`${dir}: double-quoted ': ' value; contract requires single quotes (${entry.path})`);
    else badQuote.push(`${dir}: unquoted frontmatter value contains ': ' (${entry.path})`);
  }
}
if (badQuote.length)
  errors.push(
    `': ' frontmatter values not single-quoted: ${badQuote.slice(0, 5).join("; ")} (${badQuote.length} total)`,
  );

// --- (d) the description must let a harness route to the skill ---
// A description with no trigger phrase leaves the model guessing when the skill
// applies, which is the failure that makes a skill fire unreliably. Human-only
// skills are exempt: nothing routes to them automatically.
// "Use after a build" and "Use on direct request" state a condition just as well
// as "Use when", so they route. A bare imperative ("Design non-trivial code")
// does not: it says what the skill does, never when to reach for it.
//
// The trailing space is load-bearing. Without it, the "not for X, use to-spec"
// pointer every description carries would match "use to" and pass a skill whose
// own description never states a trigger.
const TRIGGERS = [
  "use when ",
  "use this ",
  "use for ",
  "use to ",
  "use after ",
  "use on ",
  "use during ",
  "runs /",
  "invoked ",
  "invoke ",
  "asks to ",
  "asks for ",
  "says ",
];
const badDescription = [];
for (const [, dir] of skills) {
  const fm = parsed.get(dir);
  if (!fm) continue;
  const description = fm.entries.find((e) => e.path === "description")?.value;
  if (!description) {
    badDescription.push(`${dir}: frontmatter has no description`);
    continue;
  }
  // Agent Skills spec: description is 1-1024 characters.
  if (description.length > 1024)
    badDescription.push(`${dir}: description ${description.length} chars, limit 1024`);
  const humanOnly =
    fm.entries.find((e) => e.path === "disable-model-invocation")?.value === "true";
  const lowered = description.toLowerCase();
  if (!humanOnly && !TRIGGERS.some((t) => lowered.includes(t)))
    badDescription.push(`${dir}: description states no trigger`);
}
if (badDescription.length)
  errors.push(
    `unroutable descriptions: ${badDescription.slice(0, 5).join("; ")} (${badDescription.length} total)`,
  );

// --- (c) display_name uniqueness across generated manifests ---
const byName = new Map();
const missingManifest = [];
for (const [, dir] of skills) {
  const manifestPath = join(ROOT, dir, "agents/openai.yaml");
  if (!existsSync(manifestPath)) {
    missingManifest.push(dir);
    continue;
  }
  const match = /^\s*display_name:\s*(.+)$/m.exec(readFileSync(manifestPath, "utf8"));
  if (!match) {
    missingManifest.push(dir);
    continue;
  }
  const name = match[1].trim().replace(/^["']|["']$/g, "");
  byName.set(name, [...(byName.get(name) ?? []), dir]);
}
if (missingManifest.length)
  errors.push(
    `missing display_name: ${missingManifest.slice(0, 5).join(", ")} (${missingManifest.length} total)`,
  );
const dupes = [...byName.entries()].filter(([, dirs]) => dirs.length > 1);
if (dupes.length)
  errors.push(
    `duplicate display_name: ${dupes
      .slice(0, 5)
      .map(([name, dirs]) => `${name} <- ${dirs.join(", ")}`)
      .join("; ")} (${dupes.length} group(s))`,
  );

if (errors.length) {
  for (const e of errors) process.stderr.write(`check-skill-routes: ${e}\n`);
  process.exit(1);
}
process.stdout.write(`skill-routes ok ${skills.length} skills\n`);
