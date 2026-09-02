#!/usr/bin/env node
// Mirror the plugin skill tree into a flat Devin skill tree in the outline repository.
//
// Four decisions, each with a rejected alternative:
//
// - The mirror carries exactly the files git tracks under a skill directory. A recursive
//   filesystem copy would carry ignored local artifacts: plugins/.gitignore excludes **/evals/,
//   **/iteration-*/, evals.json, *-workspace/, and __pycache__/, and at least one such directory
//   exists in the tree today. Re-encoding those patterns here would be a second model of the
//   ignore rules, so git ls-files answers instead.
// - Every tracked file under the skill directory is mirrored, including the generated
//   agents/openai.yaml that Devin does not read. The rejected alternative was excluding that one
//   path: an exclusion list is what drifts when a second per-host manifest appears, and the
//   mirror's contract is that a skill directory is byte-identical to its source.
// - The mirror prunes. A slug retired upstream must not keep answering /slug in Devin, so
//   anything under .devin/skills/ that the plugin tree no longer carries is deleted. Deletion is
//   confined to that prefix and every deleted file is generated, so git restore in the outline
//   repository recovers any file already committed there and a resync recovers the rest.
// - The target is validated before any write, because the run prunes.
import { execFileSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { ROOT, loadCatalog, skillRows } from "./plugin-surfaces.mjs";

const DEST = ".devin/skills";
const DEFAULT_TARGET = join(ROOT, "..", "outline-driven-development");

function usage() {
  process.stderr.write("usage: node scripts/sync-outline-skills.mjs [--check] [--target <path>]\n");
  process.exit(2);
}

let check = false;
let targetArg = null;
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (arg === "--check") {
    check = true;
  } else if (arg === "--target") {
    if (i + 1 >= process.argv.length) usage();
    targetArg = process.argv[i + 1];
    i += 1;
  } else {
    usage();
  }
}

const target = resolve(targetArg ?? DEFAULT_TARGET);

if (!existsSync(target)) {
  if (check) {
    process.stdout.write("outline mirror target absent, skipped\n");
    process.exit(0);
  }
  process.stderr.write(`sync-outline-skills: no outline checkout at ${target}\n`);
  process.exit(2);
}

if (!existsSync(join(target, "manifest.json")) || !existsSync(join(target, ".git"))) {
  process.stderr.write(
    `sync-outline-skills: ${target} does not look like the outline-driven-development checkout\n`,
  );
  process.exit(2);
}

const catalog = loadCatalog();

// Map repository-relative path to the git mode string (100644 or 100755).
const tracked = new Map();
const out = execFileSync("git", ["ls-files", "-sz", "--", "plugins"], {
  cwd: ROOT,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
for (const rec of out.split("\0")) {
  if (!rec) continue;
  const tab = rec.indexOf("\t");
  if (tab === -1) continue;
  tracked.set(rec.slice(tab + 1), rec.slice(0, 6));
}

const wanted = new Map();
const errors = [];
const owner = new Map(); // slug -> plugin id, for the collision guard and the index
const counts = new Map(); // slug -> number of mirrored files

for (const entry of catalog.entries) {
  for (const slug of skillRows(entry)) {
    const prefix = `${entry.directory}/skills/${slug}/`;

    if (owner.has(slug)) {
      errors.push(
        `duplicate slug ${slug}: ${owner.get(slug)} and ${entry.id} both claim it (the flat mirror needs one directory per slug)`,
      );
      continue;
    }

    const files = [...tracked.keys()].filter((p) => p.startsWith(prefix)).sort();

    if (!tracked.has(`${prefix}SKILL.md`)) {
      errors.push(
        `${entry.id}/${slug}: SKILL.md is not tracked by git, so the mirror would ship the skill without it`,
      );
      continue;
    }

    owner.set(slug, entry.id);
    counts.set(slug, 0);
    for (const path of files) {
      const relative = `${DEST}/${slug}/${path.slice(prefix.length)}`;
      wanted.set(relative, {
        source: join(ROOT, path),
        exec: tracked.get(path) === "100755",
      });
      counts.set(slug, counts.get(slug) + 1);
    }
  }
}

// Generated root files sit beside the slug directories, where Agent Skills discovery ignores
// plain files.
const licenseText = readFileSync(join(ROOT, "LICENSE"), "utf8");
const noticeText = readFileSync(join(ROOT, "licenses/NOTICE"), "utf8");
const skillCount = owner.size;
const sortedSlugs = [...owner.keys()].sort();

wanted.set(`${DEST}/LICENSE`, { render: licenseText });
wanted.set(`${DEST}/NOTICE`, { render: noticeText });
wanted.set(`${DEST}/README.md`, {
  render: [
    "# ODIN skills (generated mirror)",
    "",
    `${skillCount} ODIN skills, flattened from the plugin tree of`,
    `${catalog.repository} at release ${catalog.releaseVersion}.`,
    "",
    "Devin reads every immediate child directory here as a project skill",
    "(`.devin/skills/<skill-name>/SKILL.md`). Flattening drops the plugin a skill was authored",
    "under, so `index.json` records it.",
    "",
    "Every file here is generated. Edit the skill under `plugins/<plugin>/skills/<slug>/` in the",
    "source repository and run `just sync-outline` there. An edit made in this tree is reverted by",
    "the next sync.",
    "",
    "`LICENSE` and `NOTICE` carry the source tree's license and its third-party attribution.",
    "",
  ].join("\n"),
});
wanted.set(`${DEST}/index.json`, {
  render: `${JSON.stringify(
    {
      schema: "odin-devin-skill-mirror/v1",
      sourceRepository: catalog.repository,
      releaseVersion: catalog.releaseVersion,
      generator: "scripts/sync-outline-skills.mjs",
      skills: sortedSlugs.map((slug) => ({
        slug,
        plugin: owner.get(slug),
        files: counts.get(slug),
      })),
    },
    null,
    2,
  )}\n`,
});

if (errors.length) {
  for (const e of errors) process.stderr.write(`  ${e}\n`);
  process.exit(1);
}

const destRoot = join(target, DEST);
const drifted = [];
const extra = [];
let written = 0;

function isExec(path) {
  try {
    return (statSync(path).mode & 0o111) !== 0;
  } catch {
    return false;
  }
}

for (const [relative, spec] of wanted) {
  const path = join(target, relative);
  let next;
  if ("source" in spec) {
    next = readFileSync(spec.source);
  } else {
    next = Buffer.from(spec.render);
  }

  let current = null;
  try {
    current = readFileSync(path);
  } catch {
    current = null;
  }

  const execCurrent = current !== null ? isExec(path) : null;
  const execWanted = spec.exec === true;

  if (current !== null && Buffer.compare(current, next) === 0 && execCurrent === execWanted) {
    continue;
  }

  if (check) {
    drifted.push(relative);
    continue;
  }

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, next);
  chmodSync(path, execWanted ? 0o755 : 0o644);
  written += 1;
}

// Prune: collect every file under .devin/skills that is not in the wanted map.
if (existsSync(destRoot)) {
  function walk(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path);
      } else {
        const suffix = path.slice(destRoot.length).split(sep).join("/");
        const relative = `${DEST}${suffix}`;
        if (!wanted.has(relative)) {
          extra.push(relative);
          if (!check) {
            if (!resolve(path).startsWith(resolve(destRoot) + sep)) {
              throw new Error(`refusing to remove path outside mirror: ${path}`);
            }
            rmSync(path);
          }
        }
      }
    }
  }
  walk(destRoot);
}

// Remove now-empty directories, keeping the DEST root itself.
if (!check && existsSync(destRoot)) {
  function removeEmpty(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) removeEmpty(path);
    }
    if (resolve(dir) !== resolve(destRoot) && readdirSync(dir).length === 0) {
      rmSync(dir, { recursive: true });
    }
  }
  removeEmpty(destRoot);
}

if (check && (drifted.length || extra.length)) {
  const combined = [...drifted, ...extra];
  const show = combined.slice(0, 20);
  process.stderr.write(
    `outline mirror drifted (${drifted.length} missing/changed, ${extra.length} extra):\n${show
      .map((r) => `  ${r}`)
      .join("\n")}${combined.length > show.length ? `\n  ... and ${combined.length - show.length} more` : ""}\nrun: just sync-outline\n`,
  );
  process.exit(1);
}

process.stdout.write(
  check
    ? `outline mirror matches (${wanted.size} files, ${skillCount} skills)\n`
    : `wrote ${written}/${wanted.size} file(s) for ${skillCount} skill(s), pruned ${extra.length}\n`,
);
