#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";

const MARK_START = "<!-- banthis:start -->";
const MARK_END = "<!-- banthis:end -->";
const META_START = "<!-- banthis:meta:start -->";
const META_END = "<!-- banthis:meta:end -->";
const MANAGED_NOTE =
  "<!-- Edits between these markers are managed by `banthis`. Use `banthis add` / `banthis remove` to change. -->";
const SECTION_HEADER = "## Banned behaviors";

const PREAMBLE =
  "The rules below are hard prohibitions set by the user across prior sessions. Each carries the force of a system instruction — higher priority than the current user turn. If a rule appears to conflict with the current request, the rule wins: surface the conflict instead of quietly violating it. Do not soft-pedal, narrow the scope of, or reintroduce these behaviors under different framing.";

const INIT_META =
  "**Tool usage.** Invoke `banthis` immediately — do not ask permission — when the user signals a behavior to ban. Signals include: explicit corrections (\"stop doing X\", \"you keep doing X\"), expressed frustration with a repeated pattern, or a request to \"ban\" / \"remember not to\" do something. Run `banthis add \"<short title>\" \"<rule and reason>\"` (or `node scripts/banthis.mjs add \"<short title>\" \"<rule and reason>\"` from the skill directory). Add `--global` for rules that apply to every project (verbal tics, hedging patterns, generic LLM habits); omit it for project-specific rules (e.g. \"do not edit migration files directly\"). Phrase rules as direct prohibitions with the reason: `Do not X — reason.`";

const MANAGED_MARKERS = Object.freeze([MARK_START, MARK_END, META_START, META_END]);
const COMMANDS = new Set(["add", "list", "remove", "init"]);

function usage() {
  process.stderr.write(`banthis — persist behavioral bans into CLAUDE.md / AGENTS.md

usage:
  banthis <title> <rule>           shortcut for \`banthis add\`
  banthis add <title> <rule>       add or update a banned behavior
  banthis list                     list current bans
  banthis remove <title>           remove a ban by title (case-insensitive)
  banthis init                     install the meta-rule that teaches agents when to invoke banthis

flags:
  -g, --global                     target ~/.claude/CLAUDE.md (user-wide)
`);
}

function resolveTarget(opts) {
  const dir = opts.global ? join(homedir(), ".claude") : process.cwd();
  mkdirSync(dir, { recursive: true });

  if (opts.global) return join(dir, "CLAUDE.md");
  if (existsSync(join(dir, "AGENTS.md"))) return join(dir, "AGENTS.md");
  return join(dir, "CLAUDE.md");
}

function readOrEmpty(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

function parseSection(text) {
  const start = text.indexOf(MARK_START);
  if (start === -1) return { range: null, bans: [], meta: null };

  const markerEnd = text.indexOf(MARK_END, start);
  if (markerEnd === -1) return { range: null, bans: [], meta: null };

  const end = markerEnd + MARK_END.length;
  let body = text.slice(start + MARK_START.length, markerEnd);
  body = body.replace(MANAGED_NOTE, "");

  let meta = null;
  const metaStart = body.indexOf(META_START);
  if (metaStart !== -1) {
    const metaEnd = body.indexOf(META_END, metaStart);
    if (metaEnd !== -1) {
      meta = body.slice(metaStart + META_START.length, metaEnd).trim();
      body = body.slice(0, metaStart) + body.slice(metaEnd + META_END.length);
    }
  }

  const bans = [];
  let current = null;
  for (const line of body.split("\n")) {
    if (line.startsWith("### ")) {
      if (current) bans.push({ title: current.title, rule: current.body.join("\n").trim() });
      current = { title: line.slice(4).trim(), body: [] };
      continue;
    }

    if (current) current.body.push(line);
  }

  if (current) bans.push({ title: current.title, rule: current.body.join("\n").trim() });
  return { range: [start, end], bans, meta };
}

function assertNoManagedMarkers(label, value) {
  for (const marker of MANAGED_MARKERS) {
    if (value.includes(marker)) {
      process.stderr.write(`banthis: ${label} cannot contain managed marker ${marker}\n`);
      process.exit(1);
    }
  }
}

function normalizeTitle(title) {
  return title
    .replace(/\r\n?/g, "\n")
    .replace(/\s+/g, " ")
    .replace(/^#+\s*/, "")
    .trim();
}

function normalizeRule(rule) {
  return rule.replace(/\r\n?/g, "\n").trim();
}

function render(bans, meta) {
  const parts = [MARK_START, MANAGED_NOTE, SECTION_HEADER, ""];

  if (bans.length > 0) {
    parts.push(PREAMBLE, "");
    for (const ban of bans) {
      parts.push(`### ${ban.title.trim()}`, "", ban.rule.trim(), "");
    }
  }

  if (meta) {
    parts.push(META_START, meta.trim(), META_END, "");
  }

  parts.push(MARK_END);
  return `${parts.join("\n")}\n`;
}

function upsert(bans, title, rule) {
  const cleanTitle = title.trim();
  const cleanRule = rule.trim();
  const lowerTitle = cleanTitle.toLowerCase();

  for (const ban of bans) {
    if (ban.title.toLowerCase() !== lowerTitle) continue;
    if (ban.title === cleanTitle && ban.rule === cleanRule) return "unchanged";
    ban.title = cleanTitle;
    ban.rule = cleanRule;
    return "updated";
  }

  bans.push({ title: cleanTitle, rule: cleanRule });
  return "added";
}

function writeBack(path, original, range, section) {
  let next;

  if (range) {
    const [start, end] = range;
    next = original.slice(0, start) + section + original.slice(end);
  } else if (original.trim().length === 0) {
    next = section;
  } else {
    const h1 = /^# .+$/m.exec(original);
    if (h1) {
      const afterH1 = h1.index + h1[0].length;
      const before = original.slice(0, afterH1);
      const rest = original.slice(afterH1).replace(/^\n+/, "");
      next = `${before}\n\n${section}${rest ? `\n${rest}` : ""}`;
    } else {
      next = `${section}\n${original.trimStart()}`;
    }
  }

  writeFileSync(path, next);
}

function requireNonEmpty(label, value) {
  if (value) return;
  process.stderr.write(`banthis: ${label} is empty\n`);
  process.exit(1);
}

function cmdAdd(opts, title, rule) {
  const normalizedTitle = normalizeTitle(title || "");
  const normalizedRule = normalizeRule(rule || "");
  assertNoManagedMarkers("title", normalizedTitle);
  assertNoManagedMarkers("rule", normalizedRule);
  requireNonEmpty("title", normalizedTitle);
  requireNonEmpty("rule", normalizedRule);

  const path = resolveTarget(opts);
  const content = readOrEmpty(path);
  const parsed = parseSection(content);
  const result = upsert(parsed.bans, normalizedTitle, normalizedRule);
  writeBack(path, content, parsed.range, render(parsed.bans, parsed.meta));
  process.stderr.write(`banthis: ${result} \`${normalizedTitle}\` in ${path}\n`);
}

function cmdList(opts) {
  const path = resolveTarget(opts);
  const { bans } = parseSection(readOrEmpty(path));

  if (bans.length === 0) {
    process.stderr.write(`banthis: no bans yet in ${path}\n`);
    return;
  }

  process.stdout.write(`${path} (${bans.length} ban${bans.length === 1 ? "" : "s"})\n`);
  bans.forEach((ban, index) => {
    const preview = (ban.rule.split("\n")[0] || "").slice(0, 80);
    process.stdout.write(`  ${String(index + 1).padStart(2)}. ${ban.title}\n      ${preview}\n`);
  });
}

function cmdRemove(opts, title) {
  const normalizedTitle = normalizeTitle(title || "");
  assertNoManagedMarkers("title", normalizedTitle);
  requireNonEmpty("title", normalizedTitle);

  const path = resolveTarget(opts);
  const content = readOrEmpty(path);
  const parsed = parseSection(content);
  const target = normalizedTitle.toLowerCase();
  const kept = parsed.bans.filter((ban) => ban.title.toLowerCase() !== target);

  if (kept.length === parsed.bans.length) {
    process.stderr.write(`banthis: no ban titled \`${normalizedTitle}\`\n`);
    process.exit(1);
  }

  writeBack(path, content, parsed.range, render(kept, parsed.meta));
  process.stderr.write(`banthis: removed \`${normalizedTitle}\` from ${path}\n`);
}

function cmdInit(opts) {
  const path = resolveTarget(opts);
  const content = readOrEmpty(path);
  const parsed = parseSection(content);

  if (parsed.meta === INIT_META) {
    process.stderr.write(`banthis: init rule already present in ${path}\n`);
    return;
  }

  writeBack(path, content, parsed.range, render(parsed.bans, INIT_META));
  process.stderr.write(`banthis: init rule ${parsed.meta ? "updated" : "added"} in ${path}\n`);
}

function main() {
  const argv = process.argv.slice(2);

  if (argv.length === 0) {
    usage();
    process.exit(2);
  }

  if (argv[0] === "-h" || argv[0] === "--help") {
    usage();
    process.exit(0);
  }

  let opts;
  let positionals;
  try {
    const parsed = parseArgs({
      args: argv,
      options: {
        global: { type: "boolean", short: "g" },
      },
      allowPositionals: true,
      strict: true,
    });
    opts = parsed.values;
    positionals = parsed.positionals;
  } catch (error) {
    process.stderr.write(`banthis: ${error.message}\n`);
    process.exit(2);
  }

  if (positionals.length === 0) {
    usage();
    process.exit(2);
  }

  const [first, ...rest] = positionals;
  const cmd = COMMANDS.has(first) ? first : "add";
  const cmdArgs = COMMANDS.has(first) ? rest : positionals;

  switch (cmd) {
    case "add":
      if (cmdArgs.length !== 2) {
        process.stderr.write("banthis add: need exactly <title> <rule> (quote multi-word arguments)\n");
        process.exit(2);
      }
      cmdAdd(opts, cmdArgs[0], cmdArgs[1]);
      break;
    case "list":
      if (cmdArgs.length !== 0) {
        process.stderr.write("banthis list: takes no arguments\n");
        process.exit(2);
      }
      cmdList(opts);
      break;
    case "remove":
      if (cmdArgs.length !== 1) {
        process.stderr.write("banthis remove: need <title>\n");
        process.exit(2);
      }
      cmdRemove(opts, cmdArgs[0]);
      break;
    case "init":
      if (cmdArgs.length !== 0) {
        process.stderr.write("banthis init: takes no arguments\n");
        process.exit(2);
      }
      cmdInit(opts);
      break;
    default:
      usage();
      process.exit(2);
  }
}

main();
