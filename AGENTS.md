# AGENTS.md: `~/.claude/claude` (ODIN plugin source for Claude Code)

Edit `AGENTS.md` only; `CLAUDE.md` is a symlink to it. Never `write` CLAUDE.md directly: a write-replace severs the link and silently forks the two files.

## Output-styles edit rule [DEFAULT]

Treat `system-prompt-baseline.md` as the single source of truth for the agent's persona/doctrine: make every doctrine change there first, never in an output-style file alone.

**Always propagate `system-prompt-baseline.md` changes to `output-styles/*.md` files.** Every edit to the canonical MUST land as a single atomic commit that ALSO updates the embedded cascade in EVERY output-style file (`{axiom-mode,builder,duet,linus,odin}.md` AND `benchmark.md`); the Claude Code loader does not resolve refs, so each output-style must embed the full baseline at its tail. Edit at-once, never separately. Per-file commits and per-style sequential agents are the anti-pattern; one commit, one operation, one diff scope. The embedded baseline span MUST be byte-identical to `system-prompt-baseline.md` from the charter `<role>` onward.

`scripts/sync-baseline.py` enforces that invariant; it is no longer review-enforced. Do not hand-propagate the cascade:

1. Edit `system-prompt-baseline.md`. Touch nothing below the charter `<role>` in any output-style.
2. Run `python3 scripts/sync-baseline.py`. It rewrites each style from its SECOND `<role>` line (the canonical charter; the first opens the persona voice) to EOF, preserving the persona preamble above it.
3. Run `python3 scripts/sync-baseline.py --check`. Exit 0 means every style matches canonical. Exit 1 lists the drifted files; exit 2 means a style lacks the two `<role>` lines the layout requires, or the canonical is missing.
4. Stage and commit canonical + all 6 output-styles in ONE commit.

The `sync-baseline` prek hook runs the same script on any change to the canonical or a style, so `prek run --all-files` catches drift even if the steps above are skipped.

Never hand-edit `output-styles/benchmark.md`; its auto-gen header (margin-runner v0.5.5) marks it do-not-modify. The generator is the one sanctioned writer: it touches only the embedded canonical-baseline cascade region beneath the runner-specific preamble, which is exactly what the do-not-modify marker permits. Hand-edits above that region still require explicit user authorization.

## Submodule handling

Commit inside this tree and push from inside (it is a git submodule of `~/.claude`):

```bash
cd /home/alpha/.claude/claude && git push origin main
```

Plain `git push` only; force-push is denied at the Claude permissions layer (`git push -f`, `--force`, and every `--force-with-lease*` variant are blocked).

## Patch-bump convention

Behavior changes (paradigm shifts, agent rule changes, skill behavior changes) bump patch (+0.0.1) in the same commit as the change, on all SEVEN manifest version fields in lockstep. Bumping some but not all ships a stale plugin entry to whichever harness reads the one you missed:

| Field | Read by |
|---|---|
| `.claude-plugin/plugin.json` `.version` | Claude Code: **canonical source**; Codex and Grok resolve this too |
| `.claude-plugin/marketplace.json` `.version` | Claude Code marketplace |
| `.claude-plugin/marketplace.json` `.plugins[0].version` | Claude Code marketplace entry |
| `plugin.json` `.version` | Antigravity (`agy`) |
| `.cursor-plugin/plugin.json` `.version` | Cursor |
| `.kimi-plugin/plugin.json` `.version` | Kimi Code |
| `.devin-plugin/plugin.json` `.version` | Devin CLI: required before 3000.3.22, which hard-fails without it |

Do not hand-edit the six non-canonical fields: bump `.claude-plugin/plugin.json`, then run `python3 scripts/sync-manifests.py`, which mirrors `version` and `description` outward and shape-checks the static catalogs. `--check` reports drift (exit 1) or a structural fault (exit 2). The `sync-manifests` prek hook runs it on any manifest change.

The static catalogs carry no plugin version and are validated only: `.cursor-plugin/marketplace.json`, `.kimi-plugin/marketplace.json` (its top-level `version` is the catalog **schema** version, the literal `"2"`), and `.agents/plugins/marketplace.json`. Their `source` rules are mutually contradictory and enforced by the script, not by memory: Codex requires a local `"./"` source, Kimi rejects one and requires a URL.

Choose the bump base deterministically, immediately before editing: `git fetch origin`, read the version values from `origin/main`'s manifests, require them to agree, and bump that base by one patch. If local and origin differ, rebase onto `origin/main` and take its manifests as the base, never reuse a version literal planned earlier in the session. Push each behavior commit before starting the next, so the next fetch sees a base that already includes it.

Tooling-only changes (pre-commit hooks, formatter config), pure sync changes (e.g., normalizing an embedded baseline back to canonical), and editing-primer doc updates (this file) do not bump.

Do not add or backfill `CHANGELOG.md` entries for routine patch bumps.

## Skill frontmatter

Single-quote any SKILL.md frontmatter value containing `: ` (colon-space), in `description` and `metadata.short-description` alike. Unquoted colon-space in a plain scalar is invalid YAML (PyYAML: `mapping values are not allowed here`); Claude Code's lenient loader masks the defect, so it ships silently broken for strict parsers.

## Skill harness manifest

Give every directory under `skills/` an `agents/openai.yaml`. The Codex and ChatGPT harnesses read it for the skill's UI title and blurb; a skill without one falls back to its raw slug in the harness skill list.

```yaml
interface:
  display_name: "Writing Skills"
  short_description: "Write documents agents consume"
```

Hold `short_description` to 25-64 characters so the harness does not truncate it, and keep every `display_name` unique across `skills/` so two entries stay distinguishable. Nothing here validates the file: no script reads it, no hook checks it, and `prek` is silent on it, so a missing or malformed manifest ships without warning. Adding a skill means adding its manifest in the same commit.

## Verification: format-only

Run `prek run --all-files` as the sole gate (`prek` is the Rust drop-in for `pre-commit`, brew-installed at `/home/linuxbrew/.linuxbrew/bin/prek`; hooks defined in `.pre-commit-config.yaml`). Never invent `pytest` / `cargo test` / language test commands: there is no build, unit-test suite, or `.github/` CI here; don't add CI without an explicit ask.

## Active-style reload semantics

Run functional smoke tests of persona/doctrine edits in a fresh Claude Code session; `system-prompt-baseline.md` and `output-styles/*.md` load only at session start, so in-session verification of those files proves nothing.

## Harness carriers

Two files outside this repo embed the same doctrine for other harnesses: `~/.codex/AGENTS.md`
(Codex CLI) and `~/.omp/agent/AGENTS.md` (omp). A doctrine change to
`system-prompt-baseline.md` is not finished until both carry it.

They are not cascade tails and `scripts/sync-baseline.py` does not touch them. Each keeps a
harness-adapted `<code_tools>` layer and its own tool names, because the harnesses differ: Codex
shells out for everything and prefixes commands with `rtk`, omp and Claude Code ship native file
tools. Divergence in the tool layer is correct; divergence in a shared rule is drift, and the
canonical wins.

Edit them in place. Never commit them from this repo, and never stage `~/.codex/config.toml`.

## Writing-style defaults [LOAD-BEARING]

When editing or generating content under this tree (skills, agents, commands, READMEs, AGENTS docs, commit bodies):

- **Avoid previous-pointing jargon by default.** Phrases like "as discussed earlier", "the prior workstream", "see X above", "previously noted", "per the earlier section", and "do not duplicate that content here; refer to it" force readers to chase context. State the rule directly each time it's needed; a reader landing in the middle of the doc must be able to act without scrolling backward or opening another file.
- **Avoid cross-referencing jargon by default.** Phrases like "sibling codex/AGENTS.md", "consult the X document", "the canonical Y file", and inter-file pointers that exist only to compare-and-contrast belong out of editing primers and rule docs. If two files share a concept, name the concept directly in each. Duplicating one short rule beats one round-trip through a pointer of one short rule beats one round-trip through a pointer chain. Cross-references are allowed when the target is the literal source-of-truth that the reader must read (e.g., "the canonical baseline at `system-prompt-baseline.md` from `<role>` onward"), but not as decorative coupling.
- These two avoidances are the default. Override only when the cross-reference is genuinely load-bearing for behavior (e.g., "embedded baseline span MUST be byte-identical to `system-prompt-baseline.md` from `<role>` onward". That pointer IS the rule).
