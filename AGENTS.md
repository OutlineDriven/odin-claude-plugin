# AGENTS.md — `~/.claude/claude` (ODIN plugin source for Claude Code)

Edit `AGENTS.md` only; `CLAUDE.md` is a symlink to it. Never `write` CLAUDE.md directly — a write-replace severs the link and silently forks the two files.

## Output-styles edit rule [DEFAULT]

Treat `system-prompt-baseline.md` as the single source of truth for the agent's persona/doctrine: make every doctrine change there first, never in an output-style file alone.

**Always propagate `system-prompt-baseline.md` changes to `output-styles/*.md` files.** Every edit to the canonical (`system-prompt-baseline.md`) MUST land as a single atomic commit that ALSO updates the embedded cascade in EVERY output-style file (`{axiom-mode,builder,duet,linus,odin}.md` AND `benchmark.md`); the Claude Code loader does not resolve refs, so each output-style must embed the full baseline at its tail. Edit at-once, never separately. Per-file commits and per-style sequential agents are the anti-pattern; one commit, one operation, one diff scope. The embedded baseline span MUST be byte-identical to `system-prompt-baseline.md` from the charter `<role>` onward; drift is a CI-less invariant enforced by review.

Procedural recipe (apply on every canonical edit):
1. Edit `system-prompt-baseline.md`.
2. Re-extract canonical from the charter `<role>` onward — the `<role>` block whose body is `You are a minimal-output entropy manipulator …`; it is the FIRST/only `<role>` in `system-prompt-baseline.md`, so the canonical is the whole file (e.g. `cp system-prompt-baseline.md /tmp/canon.md`).
3. For each output-style, locate its charter `<role>` line — the SECOND `<role>` in the file (each output-style leads with a persona voice `<role>`); it is the line before `You are a minimal-output entropy manipulator`.
4. Replace each output-style's cascade region (from its charter `<role>` line through EOF) with `/tmp/canon.md` content, keeping the persona voice prefix intact.
5. Verify byte-equivalence per file — the tail must equal canonical: `diff -q /tmp/canon.md <(tail -c "$(wc -c < /tmp/canon.md)" output-styles/X.md)` returns identical for all 6.
6. Stage and commit canonical + all 6 output-styles in ONE commit.

Never hand-edit `output-styles/benchmark.md`; its auto-gen header (margin-runner v0.5.5) marks it do-not-modify. Override only on explicit user authorization, and then touch only the embedded canonical-baseline cascade region beneath the runner-specific preamble.

## Submodule handling

Commit inside this tree and push from inside (it is a git submodule of `~/.claude`):

```bash
cd /home/alpha/.claude/claude && git push origin main
```

Plain `git push` only — force-push is denied at the Claude permissions layer (`git push -f`, `--force`, and every `--force-with-lease*` variant are blocked).

## Patch-bump convention

Behavior changes (paradigm shifts, agent rule changes, skill behavior changes) bump patch (+0.0.1) in the same commit as the change, on all THREE manifest version fields in lockstep: `.claude-plugin/plugin.json` `.version`, `.claude-plugin/marketplace.json` `.version`, and `.claude-plugin/marketplace.json` `.plugins[0].version` — bumping the two files but missing the second marketplace field ships a stale plugin entry.

Choose the bump base deterministically, immediately before editing: `git fetch origin`, read all three version values from `origin/main`'s manifests, require them to agree, and bump that base by one patch. If local and origin differ, rebase onto `origin/main` and take its manifests as the base — never reuse a version literal planned earlier in the session.

Tooling-only changes (pre-commit hooks, formatter config), pure sync changes (e.g., normalizing an embedded baseline back to canonical), and editing-primer doc updates (this file) do not bump.

Do not add or backfill `CHANGELOG.md` entries for routine patch bumps.

## Skill frontmatter

Single-quote any SKILL.md frontmatter value containing `: ` (colon-space) — `description` and `metadata.short-description` alike. Unquoted colon-space in a plain scalar is invalid YAML (PyYAML: `mapping values are not allowed here`); Claude Code's lenient loader masks the defect, so it ships silently broken for strict parsers.

## Verification: format-only

Run `prek run --all-files` as the sole gate (`prek` is the Rust drop-in for `pre-commit`, brew-installed at `/home/linuxbrew/.linuxbrew/bin/prek`; hooks defined in `.pre-commit-config.yaml`). Never invent `pytest` / `cargo test` / language test commands — there is no build, unit-test suite, or `.github/` CI here; don't add CI without an explicit ask.

## Active-style reload semantics

Run functional smoke tests of persona/doctrine edits in a fresh Claude Code session; `system-prompt-baseline.md` and `output-styles/*.md` load only at session start, so in-session verification of those files proves nothing.

## Writing-style defaults [LOAD-BEARING]

When editing or generating content under this tree (skills, agents, commands, READMEs, AGENTS docs, commit bodies):

- **Avoid previous-pointing jargon by default.** Phrases like "as discussed earlier", "the prior workstream", "see X above", "previously noted", "per the earlier section", and "do not duplicate that content here; refer to it" force readers to chase context. State the rule directly each time it's needed; a reader landing in the middle of the doc must be able to act without scrolling backward or opening another file.
- **Avoid cross-referencing jargon by default.** Phrases like "sibling codex/AGENTS.md", "consult the X document", "the canonical Y file", and inter-file pointers that exist only to compare-and-contrast belong out of editing primers and rule docs. If two files share a concept, name the concept directly in each — duplication of one short rule beats one round-trip through a pointer chain. Cross-references are allowed when the target is the literal source-of-truth that the reader must read (e.g., "the canonical baseline at `system-prompt-baseline.md` from `<role>` onward"), but not as decorative coupling.
- These two avoidances are the default. Override only when the cross-reference is genuinely load-bearing for behavior (e.g., "embedded baseline span MUST be byte-identical to `system-prompt-baseline.md` from `<role>` onward" — that pointer IS the rule).
