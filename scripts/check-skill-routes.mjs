// Verify the canonical skills/ tree satisfies both public skill-install routes:
//   npx skills add https://github.com/OutlineDriven/odin-claude-plugin/tree/<tag>/skills/<slug>
//   gh skill install OutlineDriven/odin-claude-plugin skills/<slug>
// Both routes discover skills as skills/<slug>/SKILL.md with frontmatter name matching the
// directory. The distribution projection must carry the same roster, so a tag serves
// identical skill sets over every route.
//
// Extended gates (G1/G3):
//   (a) registry-as-count-authority: every skills/ dir has a provenance row whose slug
//       == dir name, and rows.length == skill_count == dir count.
//   (b) frontmatter values containing ': ' MUST be single-quoted; unquoted is an error.
//   (c) display_name uniqueness across every agents/openai.yaml (Set collision check).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const note = (msg) => process.stderr.write(`check-skill-routes: ${msg}\n`);

const skillsDir = join(ROOT, "skills");
if (!existsSync(skillsDir)) {
  note("missing canonical skills/ tree");
  process.exit(1);
}
const slugs = readdirSync(skillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

// --- existing route checks: frontmatter presence + name == directory ---
const badName = [];
const badFrontmatter = [];
for (const slug of slugs) {
  const skillPath = join(skillsDir, slug, "SKILL.md");
  if (!existsSync(skillPath)) {
    badFrontmatter.push(`${slug}: missing SKILL.md`);
    continue;
  }
  const text = readFileSync(skillPath, "utf8");
  if (!text.startsWith("---\n")) {
    badFrontmatter.push(`${slug}: no frontmatter block`);
    continue;
  }
  const end = text.indexOf("\n---", 4);
  if (end === -1) {
    badFrontmatter.push(`${slug}: unterminated frontmatter`);
    continue;
  }
  const fm = text.slice(4, end);
  const nameLine = fm.split("\n").find((l) => l.startsWith("name:"));
  if (!nameLine) {
    badFrontmatter.push(`${slug}: frontmatter has no name`);
    continue;
  }
  const name = nameLine.slice(5).trim().replace(/^['"]|['"]$/g, "");
  if (name !== slug) badName.push(`${slug}: name is ${name}`);
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
for (const slug of slugs) {
  const skillPath = join(skillsDir, slug, "SKILL.md");
  if (!existsSync(skillPath)) continue;
  const text = readFileSync(skillPath, "utf8");
  if (!text.startsWith("---\n")) continue;
  const end = text.indexOf("\n---", 4);
  if (end === -1) continue;
  for (const line of text.slice(4, end).split("\n")) {
    const m = /^([a-zA-Z_]+):\s?(.*)$/.exec(line);
    if (!m) continue;
    const raw = m[2];
    if (!raw.includes(": ")) continue;
    // Quoted (single or double) scalars are safe; only plain scalars misparse on ': '.
    if (!raw.startsWith("'") && !raw.startsWith('"'))
      badQuote.push(`${slug}: unquoted frontmatter value contains ': ' (${m[1]})`);
  }
}
if (badQuote.length)
  errors.push(
    `unquoted ': ' frontmatter values: ${badQuote.slice(0, 5).join("; ")} (${badQuote.length} total)`,
  );

// --- (a) registry as count authority ---
const registryPath = join(ROOT, "catalog/provenance-rows.json");
if (!existsSync(registryPath)) {
  errors.push("missing catalog/provenance-rows.json");
} else {
  const registry = JSON.parse(readFileSync(registryPath, "utf8"));
  const rowSlugs = registry.rows.map((r) => r.slug);
  const rowSet = new Set(rowSlugs);
  const missingRows = slugs.filter((s) => !rowSet.has(s));
  const extraRows = rowSlugs.filter((s) => !slugs.includes(s));
  const dupRows = rowSlugs.length - rowSet.size;
  const countMismatch =
    registry.rows.length !== registry.skill_count ||
    registry.skill_count !== slugs.length;
  const parts = [];
  if (missingRows.length)
    parts.push(`dirs without rows: ${missingRows.slice(0, 5).join(", ")} (${missingRows.length})`);
  if (extraRows.length)
    parts.push(`rows without dirs: ${extraRows.slice(0, 5).join(", ")} (${extraRows.length})`);
  if (dupRows) parts.push(`${dupRows} duplicate row slug(s)`);
  if (countMismatch)
    parts.push(
      `count mismatch: rows=${registry.rows.length} skill_count=${registry.skill_count} dirs=${slugs.length}`,
    );
  if (parts.length) errors.push(`registry count authority: ${parts.join("; ")}`);
}

// --- (c) display_name uniqueness across agents/openai.yaml ---
const displayNames = [];
const missingManifest = [];
for (const slug of slugs) {
  const manifestPath = join(skillsDir, slug, "agents", "openai.yaml");
  if (!existsSync(manifestPath)) {
    missingManifest.push(slug);
    continue;
  }
  const text = readFileSync(manifestPath, "utf8");
  const line = text.split("\n").find((l) => l.trim().startsWith("display_name:"));
  if (!line) {
    missingManifest.push(`${slug}: no display_name`);
    continue;
  }
  const val = line.split("display_name:")[1].trim().replace(/^['"]|['"]$/g, "");
  displayNames.push({ slug, name: val });
}
if (missingManifest.length)
  errors.push(
    `missing display_name: ${missingManifest.slice(0, 5).join(", ")} (${missingManifest.length} total)`,
  );
const nameCounts = new Map();
for (const { slug, name } of displayNames) {
  if (!nameCounts.has(name)) nameCounts.set(name, []);
  nameCounts.get(name).push(slug);
}
const dupes = [...nameCounts.entries()].filter(([, sl]) => sl.length > 1);
if (dupes.length)
  errors.push(
    `duplicate display_name: ${dupes
      .slice(0, 5)
      .map(([n, sl]) => `"${n}" [${sl.join(", ")}]`)
      .join("; ")} (${dupes.length} group(s))`,
  );

// --- roster parity with the distribution projection when it has been rendered ---
const completeSkills = join(ROOT, ".release/distribution/plugins/odin-complete/skills");
if (existsSync(completeSkills)) {
  const distSlugs = new Set(
    readdirSync(completeSkills, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name),
  );
  const missing = slugs.filter((s) => !distSlugs.has(s));
  const extra = [...distSlugs].filter((s) => !slugs.includes(s));
  if (missing.length)
    errors.push(`distribution missing route skills: ${missing.slice(0, 5).join(", ")} (${missing.length})`);
  if (extra.length)
    errors.push(`distribution has non-route skills: ${extra.slice(0, 5).join(", ")} (${extra.length})`);
}

if (errors.length) {
  for (const e of errors) note(e);
  note(`${errors.length} gate(s) failed`);
  process.exit(1);
}
process.stdout.write(`skill-routes ok ${slugs.length} skills\n`);
