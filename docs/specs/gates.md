# Gates and generators

Every script under `scripts/` is either a generator that writes derived files from one authored
source, or a gate that proves an invariant over the whole tree. This document says what each one
reads, what it writes or proves, how to run it, and how to read a failure. It is written against the
scripts as they stand in the tree; when a script and this page disagree, the script is right and this
page has drifted.

`.pre-commit-config.yaml` is the gate list. This page explains the entries; it does not own their
order or their membership, because a second copy of that list drifted twice before it was cut.

## Running the set

| Command | What runs |
|---|---|
| `just render` | `render-skill-manifests.mjs`, then `render-plugin-surfaces.mjs`, then `render-skill-index.mjs`, in that order |
| `just check` | `prek run --all-files`: every hook in `.pre-commit-config.yaml` |
| `just verify` | `just check`, then `gh skill publish --dry-run` |
| `just sync-outline` | `sync-outline-skills.mjs`, writing into the sibling outline checkout |
| `just sync-carriers` | `sync-carriers.py`, rewriting each external carrier's shared sections from the baseline |
| `just sync-carriers-check` | `sync-carriers.py --check`: the planned rewrites plus the `check-carriers` audit |

Every local hook carries `pass_filenames: false` and `always_run: true`, so each gate audits the
whole tree on every commit no matter which files were touched. Expect the full set to take a few
seconds.

The scripts need no package manager. Every `.mjs` imports `node:` builtins only and every `.py`
imports the standard library only, so each one runs directly when `prek` or `just` is absent:

```shell
node scripts/check-plugin-surfaces.mjs
python3 scripts/check-skill-frontmatter.py
```

The hooks run whichever `python3` the machine has, so `check-skill-frontmatter.py --self-test`
proves the gate itself still parses on Python 3.9 before it checks anything else.

One hook writes. `sync-baseline` runs without `--check`, so when an output style has drifted it
rewrites the file, prints `synced <path>`, and exits 1 to fail the commit. Stage the repaired styles
and commit again; the second run is clean. `just check` can therefore leave the tree modified, and
`git status` shows what it repaired.

## Generators

Each generator has a `--check` mode that diffs its output against the tree and exits 1 on drift
instead of writing. The hooks run the check modes of all but `sync-baseline`, which repairs in
place; `just render` runs the write modes of the three in-tree generators. `sync-carriers` is
manual: a hook that rewrote home-directory files on every commit would fire on machines with no
carriers to repair. Its `--self-test` is a hook, because the planner has shipped a wrong overlay
rule and the fixtures catch that without touching a live carrier.

### render-skill-manifests.mjs

Derives `plugins/<plugin>/skills/<slug>/agents/openai.yaml` from each `SKILL.md` frontmatter. The
file carries two fields under `interface`:

| Field | Derivation |
|---|---|
| `display_name` | The frontmatter `name`, split on hyphens and title-cased, with an in-script acronym table (`api` to `API`, `mcp` to `MCP`, and so on) and a whole-name literal table (`agents-md` to `AGENTS.md`) |
| `short_description` | The first sentence of `description`, emitted whole. A sentence longer than 1024 characters is cut at its last clause boundary; none in the tree approaches that |

A `short_description` under 25 characters is an error, not a warning: the first sentence is where a
skill states its trigger, and a fragment that short states none.

`--only <slug>[,<slug>...]` limits the run to named skills, which is how a fixture is checked while
the tree is mid-edit. Any other invocation processes every skill the catalog reaches.

### render-plugin-surfaces.mjs

Writes every file that `catalog/plugins.json` owns. The renderers live in `plugin-surfaces.mjs`,
which the checks import too, so one module defines both what is generated and what is verified.

| Output | Per | Notes |
|---|---|---|
| `.claude-plugin/marketplace.json` | tree | Codex reads this file too, so each entry carries `policy` |
| `.codex-plugin/marketplace.json` | tree | Forward-compat; Codex's candidate list has no `.codex-plugin/` entry today |
| `.cursor-plugin/marketplace.json` | tree | |
| `.grok-plugin/marketplace.json` | tree | Local source spelled `{"type": "local", "path"}` |
| `.kimi-plugin/marketplace.json` | tree | Sources read `../plugins/<id>`, resolved against `.kimi-plugin/` |
| `.claude-plugin/plugin.json` | plugin | Adds `mcpServers` when `mcp.json` exists and `outputStyles` when `output-styles/` exists |
| `.codex-plugin/plugin.json` | plugin | No `$schema`; adds `mcpServers: "./mcp.json"` when `mcp.json` exists |
| `.cursor-plugin/plugin.json` | plugin | Identity only |
| `.grok-plugin/plugin.json` | plugin | Adds `mcpServers: "./mcp.json"` when `mcp.json` exists |
| `.kimi-plugin/plugin.json` | plugin | Always declares `skills: "./skills"`; inlines the `mcpServers` map from `mcp.json` |
| `README.md`, `LICENSE`, `NOTICE` | plugin | README lists the skills; LICENSE and NOTICE are byte copies of the root `LICENSE` and `licenses/NOTICE` |
| The table under `## Plugins` in the root `README.md` | tree | The only generated region of that file; the prose around it is authored |

The run reports `plugin surfaces match (<files> files, <plugins> plugins)` when clean. On drift it
lists each file and ends with `run: just render`.

Loading the catalog is itself a check. `loadCatalog` throws, and the process exits 1, when the
`schema` is not `odin-plugin-catalog/v1`, when an entry's `index` is out of sequence, when an `id`
repeats, when `directory` is not `plugins/<id>`, or when an `id` falls outside the name grammar
every harness accepts: 1 to 64 characters, lowercase alphanumerics and hyphens, alphanumeric at both
ends, no `--`, no periods.

### render-skill-index.mjs

Writes `docs/specs/skill-index.md`: one row per skill, sorted by slug, naming its plugin and
category. `--check` diffs against the file and exits 1 on drift. The hook runs the check mode; `just
render` writes it.

### sync-baseline.py

Regenerates the doctrine cascade at the tail of every file in `plugins/odin-core/output-styles/`.
Each style is a persona preamble followed by a byte-identical copy of `system-prompt-baseline.md`
from its `<role>` line onward. The split point is the style's second whole-line `<role>`: the first
opens the persona voice, the second opens the canonical charter.

| Exit | Meaning |
|---|---|
| 0 | Every style matches |
| 1 | With `--check`, drift was found and named; without it, drifted styles were rewritten |
| 2 | `system-prompt-baseline.md` is missing, or a style has fewer than two `<role>` lines |

A style with one `<role>` line is refused rather than rewritten, because the generator cannot tell
the persona from the charter and would emit a file with no preamble or a doubled one.

File arguments are accepted and filtered to the styles directory, which is how the hook tolerates
being handed every staged path.

### sync-outline-skills.mjs

Mirrors every skill into `.devin/skills/<slug>/` in the outline repository, the project-scope path
Devin reads. The default target is the sibling checkout `../outline-driven-development`; pass
`--target <path>` for a clone elsewhere.

The mirror carries exactly the files `git ls-files` tracks under each skill directory, including the
generated `agents/openai.yaml`, with executable bits preserved. A recursive copy was rejected because
`plugins/.gitignore` excludes eval and workspace directories that exist locally, and re-encoding
those patterns would be a second model of the ignore rules. Beside the slug directories it writes
`LICENSE`, `NOTICE`, a `README.md` naming the source, and an `index.json` recording which plugin each
slug came from, since flattening drops that.

The run prunes: anything under `.devin/skills/` that the plugin tree no longer carries is deleted.
Deletion never leaves that prefix. Because the run prunes, the target is validated first and must
hold both `manifest.json` and `.git`.

| Condition | Result |
|---|---|
| Target absent, `--check` | `outline mirror target absent, skipped`, exit 0, so the hook passes on a machine without the checkout |
| Target absent, write mode | Exit 2 |
| Target present but not the outline checkout | Exit 2 |
| Two plugins claim one slug | Exit 1; the flat mirror needs one directory per slug |
| A skill's `SKILL.md` is untracked | Exit 1; add the file to git first |
| Drift under `--check` | Exit 1, listing up to 20 paths |

Commit the mirror in the outline repository, in its own commit. Never edit it in place; the next run
reverts the edit.

### sync-carriers.py

Rewrites each external harness carrier's shared doctrine sections from `system-prompt-baseline.md`
and leaves the four tool-layer sections alone. The carriers live in the home directory of whoever
runs the harness, so this is a manual command (`just sync-carriers`), never a rewrite hook.

`--check` reports planned inserts and rewrites, then runs the `check-carriers.py` audit on the
would-be result. An unknown section, a missing tool-layer tag, a duplicate shared section, or a
malformed overlay therefore fails even when the shared bodies already match. A missing carrier is
skipped; an existing path that is not a regular file is an error.

A carrier may hold one `<role>` overlay above the canonical block. If only the overlay is present,
the planner inserts the canonical block after it rather than rewriting the overlay. `--self-test`
proves that shape, the audit reuse, and the non-file override, using synthetic fixtures so a machine
with no carrier still runs it.

## Checks

### check-plugin-surfaces.mjs

The structural gate over the plugin tree. Byte drift belongs to `render-plugin-surfaces --check`;
this script holds the invariants no renderer can restate.

| Invariant | Failure text |
|---|---|
| No retired surface exists: `package.json`, `catalog/skill-membership.json`, `plugins/<id>/plugin.json`, the retired package and distribution generators under `scripts/`, a root `skills/` or `packages/` directory, and `.agents/` | `retired surface present: <path>` |
| Every `plugins/` directory is a catalog entry and every entry has a directory | `catalog entries without a directory` or `plugin directories without a catalog entry` |
| Every plugin has at least one skill | `<id>: no skills` |
| All five dotdir manifests exist, parse, and carry `name` equal to the catalog `id` | `<id>: missing <dotdir>/plugin.json` or `name is X, catalog id is Y` |
| `.codex-plugin/plugin.json` declares no `$schema` | `must not declare $schema` |
| `.kimi-plugin/plugin.json` declares `skills` | `must declare skills` |
| A plugin shipping `mcp.json` declares `mcpServers: "./mcp.json"` in its Codex and Grok manifests | `must declare mcpServers "./mcp.json"` |
| Every skill directory holds `SKILL.md` and no nested `SKILL.md` one level down | `missing SKILL.md` or `nested SKILL.md at <dir>/ never loads` |
| All five registries exist, list exactly as many plugins as the catalog, and every source starts with `./plugins/` (`../plugins/` for Kimi) | `missing registry`, `N plugins, catalog has M`, or `source is not a repository path` |

The name-parity rule exists because Codex resolves a plugin's namespace from the dotdir manifest list
alone. Five manifests with different names load one plugin's components under another's namespace,
and nothing else reports it.

Passing output: `plugin surfaces ok: 28 plugins, 614 skills`.

### check-skill-routes.mjs

Proves each skill resolves on both install routes, `gh skill install <repo> plugins/<plugin>/skills/<slug>`
and `plugin install <plugin>@odin-marketplace`. Both read `<dir>/SKILL.md` and expect the frontmatter
`name` to equal the directory, so a mismatch drops the skill from one route while the other keeps
working.

| Check | Rule |
|---|---|
| Frontmatter | Present, terminated, and carrying `name` |
| Name | Equals the directory slug |
| Quoting | Any value containing `: ` is single-quoted; double quotes fail with their own message |
| Description | Present, at most 1024 characters, and stating a trigger unless `disable-model-invocation: true` |
| Display name | Unique across every generated `agents/openai.yaml` |

A trigger is one of these phrases, case-insensitive, with the trailing space load-bearing: `use when `,
`use this `, `use for `, `use to `, `use after `, `use on `, `use during `, `runs /`, `invoked `,
`invoke `, `asks to `, `asks for `, `says `. Without the space, the "not for X, use to-spec" pointer
most descriptions carry would match `use to` and pass a description that never states its own
trigger. A bare imperative such as "Design non-trivial code" says what the skill does and never
when to reach for it, so it fails.

The display-name check reads the generated `agents/openai.yaml`, so a freshly added skill fails this
gate with `missing display_name` until `just render` has run.

Each failure class reports its first five instances and a total.

### check-skill-frontmatter.py

Proves each frontmatter parses under a strict YAML parser, using the standard library only. The
manifest generator brackets single-quoted scalars with `lastIndexOf("'")`, so an unescaped
apostrophe passes it silently and then fails `gh skill publish` with `yaml: did not find expected
key`. This gate closes that hole.

It does so without reimplementing YAML, because the frontmatter shape is closed: one flat mapping,
keys from a fixed set, each value a plain or quoted scalar on one line. Anything outside that shape
fails and names what it saw, so an author introducing a new value form is told to extend the checker
rather than passing unnoticed.

| Rule | Detail |
|---|---|
| Keys | Only `name`, `description`, `disable-model-invocation`, `argument-hint`, `allowed-tools`; `name` and `description` required; no duplicates |
| Shape | No indented continuation lines; `key:value` without a space after the colon is one plain scalar, not an entry |
| Single-quoted | `''` is one apostrophe; anything else after a lone `'` is content after the closing quote |
| Double-quoted | Only the YAML 1.2 escapes; `\x`, `\u`, `\U` take exactly 2, 4, 8 hex digits |
| Plain | May not start with an indicator character, contain `: ` or ` #`, or end with `:` |

The `metadata` key the Agent Skills specification allows is rejected here, so a skill that needs it
has to widen `ALLOWED_KEYS` first.

`--self-test` runs the inline fixtures for the scalar rules and the compatibility rules, then exits
before the tree scan. Fixtures are string literals rather than files because every tracked markdown
file is gated by `check-voice`, and a fixture carrying a defect by design would need an ignored
directory the gates can see.

### check-voice.py

Enforces the measurable half of `docs/specs/voice.md`: five density-based formatting tells. Fenced
blocks and inline code spans are stripped first, so a shell flag or a sample never trips a gate,
and hiding prose in backticks to silence a finding is gaming the gate.

| Gate | Trips at |
|---|---|
| Bold run | Consecutive lines opening with a bold span: 2 when at least two are colon-bearing labels, 5 otherwise |
| Dash run | 5 em or en dashes inside 600 characters |
| Title-case heading | A minor word capitalized past the first position and followed by another capitalized word |
| Banned words | The filler senses of `delve`, `leverage`, `seamless`, `underscore`, plus `holistic` and `synergy` |
| Curly quotes | Any of the four |

Scope is every markdown file the git index tracks, generated files included, plus two external
carriers named in `carriers.py`: `~/.codex/AGENTS.md` and `~/.omp/agent/AGENTS.md`. An absent
carrier is skipped with a notice. A carrier that exists but cannot be written is still gated and
fails the run if it carries findings, because they cannot be repaired from here. Passing file
arguments gates only those files.

Scope comes from the index on purpose. A directory walk with an exclusion list reported clean in one
checkout and 3725 findings in another, because an untracked staging tree sat inside the repository.
When `git` is missing or the path is not a work tree, the gate exits 1 rather than falling back to a
walk that would change its scope silently.

A finding in a generated file, such as a plugin README, names the generator as the defect site.

Passing output: `voice ok <N> files`. `--self-test` runs the inline classification and scope
fixtures.

### check-carriers.py

Proves the two external harness carriers hold the canonical shared doctrine. Sections are the
whole-line `<tag>` to `</tag>` blocks of `system-prompt-baseline.md`, compared byte for byte, with
line endings preserved so a CRLF carrier cannot pass an LF baseline.

Four sections are the harness tool layer and are exempt from comparison but required to be present:
`git`, `directives`, `code_tools`, `thinking`. The gate prints this bound on every run, because
doctrine written inside those four is outside what a green run asserts.

| Carrier shape | Verdict |
|---|---|
| A shared section matches | Counted |
| A shared section is absent or differs | Failure |
| A shared section appears twice, even with identical copies | Failure; a consumer has no rule for which copy wins |
| A section the baseline does not define | Failure |
| A tool-layer section is absent | Failure |
| One extra `<role>` block above the canonical one | Allowed; the omp carrier prepends a persona overlay this way |
| A `<role>` below the canonical one, or two overlays | Failure |

When neither carrier is installed the gate prints a notice and exits 0, so a contributor who uses
neither harness is not blocked. `--self-test` builds every drift shape synthetically from the
baseline and proves each is caught, so it runs identically on a machine with no carrier.

The carriers are edited in place and never committed from this repository. The baseline generator
does not update them. A doctrine change means editing `system-prompt-baseline.md`, running
`sync-baseline.py`, then `just sync-carriers` so the two external carriers pick up the shared
sections. `check-carriers.py` and `just sync-carriers-check` both have to be green.

## Exit codes

| Script | 0 | 1 | 2 |
|---|---|---|---|
| `render-skill-manifests.mjs` | Written, or matched under `--check` | Generation error or drift | `--only` given no slug list |
| `render-plugin-surfaces.mjs` | Written, or matched | Drift under `--check`; catalog failed to load | |
| `sync-baseline.py` | Clean | Drift; also after repairing in write mode | Canonical file or two-`<role>` layout missing |
| `sync-outline-skills.mjs` | Written, or matched, or target absent under `--check` | Slug collision, untracked `SKILL.md`, or drift | Bad arguments or an unusable target |
| `render-skill-index.mjs` | Written, or matched under `--check` | Drift | |
| `sync-carriers.py` | Written, in sync, skipped missing, or self-test passed | Would change, audit failure, not a file, or self-test failure | Bad arguments |
| `check-plugin-surfaces.mjs` | Clean | Any invariant broken | |
| `check-skill-routes.mjs` | Clean | Any check failed | |
| `check-skill-frontmatter.py` | Clean, or self-test passed | Any failure, or a self-test fixture failed | |
| `check-voice.py` | Clean, or self-test passed | Findings, self-test failure, or git unavailable | |
| `check-carriers.py` | Clean or no carrier installed | Failures, missing baseline, or self-test failure | |

## Workflows

Adding a skill: create `plugins/<plugin>/skills/<slug>/SKILL.md` with `name` equal to `<slug>` and a
`description` whose first sentence states a trigger, run `just render` to generate its
`agents/openai.yaml`, refresh the plugin README, and refresh the skill index, then `just check`.
Nothing else records membership; the directory is the registry.

Adding a plugin: append an entry to `catalog/plugins.json` with the next `index`, an `id` in the
shared name grammar, and `directory` equal to `plugins/<id>`. Create at least one skill under it, run
`just render` to write its five manifests, README, LICENSE, and NOTICE and to extend every registry
and the root README table, then `just check`.

Changing doctrine: edit `system-prompt-baseline.md`, run `python3 scripts/sync-baseline.py`, confirm
with `--check`, and commit the canonical file with all six styles. Then run `just sync-carriers` and
confirm with `just sync-carriers-check` and `check-carriers.py`.

Reading a failure: each gate names the file and the rule in its stderr lines and ends with a count.
A generator's drift message ends with the command that repairs it. A `retired surface present`
finding means a generator that should be dead has run again; delete the file and find what wrote it.
