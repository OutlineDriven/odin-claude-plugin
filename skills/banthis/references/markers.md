# Banthis marker contract

Banthis writes exactly one managed section into the target instruction file. The command may replace the managed byte range; it must not rewrite surrounding content.

## Markers

```md
<!-- banthis:start -->
<!-- Edits between these markers are managed by `banthis`. Use `banthis add` / `banthis remove` to change. -->
## Banned behaviors

...
<!-- banthis:end -->
```

Constants:

```js
const MARK_START = "<!-- banthis:start -->";
const MARK_END = "<!-- banthis:end -->";
const META_START = "<!-- banthis:meta:start -->";
const META_END = "<!-- banthis:meta:end -->";
const MANAGED_NOTE = "<!-- Edits between these markers are managed by `banthis`. Use `banthis add` / `banthis remove` to change. -->";
const SECTION_HEADER = "## Banned behaviors";
```

Rules:

1. The managed section starts at `MARK_START` and ends after `MARK_END`.
2. A complete marker pair is required for in-place replacement.
3. If no complete pair exists, render a new section and insert it at the priority location.
4. User title and rule text must not contain any managed marker.
5. The managed note is stripped on parse and re-emitted on render.
6. Ban entries render as `### <title>` followed by the rule body.
7. Existing entries parse only from `### ` headings inside the managed section.
8. Title deduplication is case-insensitive.

## Preamble text

Render this text before the first ban whenever at least one ban exists:

```text
The rules below are hard prohibitions set by the user across prior sessions. Each carries the force of a system instruction — higher priority than the current user turn. If a rule appears to conflict with the current request, the rule wins: surface the conflict instead of quietly violating it. Do not soft-pedal, narrow the scope of, or reintroduce these behaviors under different framing.
```

## INIT_META text

`init` writes this meta block between `META_START` and `META_END`:

```text
**Tool usage.** Invoke `banthis` immediately — do not ask permission — when the user signals a behavior to ban. Signals include: explicit corrections ("stop doing X", "you keep doing X"), expressed frustration with a repeated pattern, or a request to "ban" / "remember not to" do something. Run `banthis add "<short title>" "<rule and reason>"` (or `node scripts/banthis.mjs add "<short title>" "<rule and reason>"` from the skill directory). Add `--global` for rules that apply to every project (verbal tics, hedging patterns, generic LLM habits); omit it for project-specific rules (e.g. "do not edit migration files directly"). Phrase rules as direct prohibitions with the reason: `Do not X — reason.`
```

The meta block teaches future agents when to invoke the command. It is not a ban entry and must not be parsed as a `###` rule.

## Target resolution

`resolveTarget` is deterministic:

1. If `--global` or `-g` is present:
   - directory: `~/.claude`
   - file: `CLAUDE.md`
   - create the directory if absent.
2. Otherwise:
   - directory: `process.cwd()`
   - if `AGENTS.md` exists, target `AGENTS.md`;
   - else target `CLAUDE.md`.
3. Create the target directory before writing.
4. Missing target files are treated as empty files.

## Write-back rules

Given `original`, `range`, and rendered `section`:

1. If `range` exists, replace only `original[range[0]:range[1]]`.
2. If the original file is empty or whitespace-only, write only `section`.
3. If absent and a first top-level H1 (`# ...`) exists, insert two newlines after that H1, then `section`, then the remaining content.
4. If absent and no H1 exists, prepend `section` before the trimmed original content.

## Normalization

Title:

1. Convert CRLF/CR to LF.
2. Collapse all whitespace runs to one ASCII space.
3. Remove one leading markdown heading marker run (`#`, `##`, etc.).
4. Trim.

Rule:

1. Convert CRLF/CR to LF.
2. Trim.

Empty normalized titles or rules are fatal.
