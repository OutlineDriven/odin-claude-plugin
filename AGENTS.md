# AGENTS.md — `~/.claude/claude` (ODIN plugin source for Claude Code)

Primer for ODIN agents editing this submodule. Self-contained: every rule needed to commit safely lives below; no chase-the-link required.

Edit `AGENTS.md` only; `CLAUDE.md` is a symlink to it. Never `write` CLAUDE.md directly — a write-replace severs the link and silently forks the two files.

## Output-styles edit rule [DEFAULT]

Treat `system-prompt-baseline.md` as the single source of truth for the agent's persona/doctrine: make every doctrine change there first, never in an output-style file alone.

`output-styles/{axiom-mode,builder,duet,linus,odin,benchmark}.md` are persona files Claude Code loads as system instructions. Each is a style-specific lead `<role>` block plus voice sections, followed by the canonical baseline embedded at the tail. Files are self-contained — the loader does not resolve refs.

The embedded baseline begins at the **charter `<role>`** — the `<role>` block whose body is `You are a minimal-output entropy manipulator …`. That block is the cascade anchor (the SECOND `<role>` in every output-style file, which each carry a lead persona voice `<role>` first; the FIRST/only `<role>` in `system-prompt-baseline.md`).

**Always propagate `system-prompt-baseline.md` changes to `output-styles/*.md` files.** Every edit to the canonical (`system-prompt-baseline.md`) MUST land as a single atomic commit that ALSO updates the embedded cascade in EVERY output-style file (`{axiom-mode,builder,duet,linus,odin}.md` AND `benchmark.md`). Edit at-once, never separately. Per-file commits and per-style sequential agents are the anti-pattern; one commit, one operation, one diff scope. The embedded baseline span MUST be byte-identical to `system-prompt-baseline.md` from the charter `<role>` onward; drift is a CI-less invariant enforced by review.

Procedural recipe (apply on every canonical edit):
1. Edit `system-prompt-baseline.md`.
2. Re-extract canonical from the charter `<role>` onward (the whole file — `system-prompt-baseline.md` begins at the charter `<role>`; e.g. `cp system-prompt-baseline.md /tmp/canon.md`).
3. For each output-style, locate the charter `<role>` line (the line before `You are a minimal-output entropy manipulator`).
4. Replace each output-style's cascade region (from its charter `<role>` line through EOF) with `/tmp/canon.md` content, keeping the persona voice prefix intact.
5. Verify byte-equivalence per file — the tail must equal canonical: `diff -q /tmp/canon.md <(tail -c "$(wc -c < /tmp/canon.md)" output-styles/X.md)` returns identical for all 6.
6. Stage and commit canonical + all 6 output-styles in ONE commit.

`output-styles/benchmark.md` carries a do-not-modify auto-gen header (margin-runner v0.5.5). Default: never hand-edit. Override only on explicit user authorization, and only the embedded canonical-baseline cascade region beneath the runner-specific preamble.

## Submodule handling

This tree is a git submodule of `~/.claude`. Edits commit inside here. Push from inside:

```bash
cd /home/alpha/.claude/claude && git push origin main
```

Force-push is denied at the Claude permissions layer — `git push -f`, `--force`, and every `--force-with-lease*` variant are blocked. Plain `git push` only.

## Patch-bump convention

Behavior changes (paradigm shifts, agent rule changes, skill behavior changes) bump patch (+0.0.1) on both `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` in the same commit. Tooling-only changes (pre-commit hooks, formatter config), pure sync changes (e.g., normalizing an embedded baseline back to canonical), and editing-primer doc updates (this file) do not bump.

## Verification: format-only

The sole gate is `prek run --all-files` (`prek` is the Rust drop-in for `pre-commit`; brew-installed at `/home/linuxbrew/.linuxbrew/bin/prek`; hooks defined in `.pre-commit-config.yaml`). There is no build, no unit-test suite, and no `.github/` CI. Don't invent `pytest` / `cargo test` / language test commands; don't add CI without an explicit ask.

## Active-style reload semantics

Edits to `system-prompt-baseline.md` and `output-styles/*.md` take effect on the next Claude Code session — there is no in-session reload. Functional smoke tests must run in a fresh session.

## Writing-style defaults [LOAD-BEARING]

When editing or generating content under this tree (skills, agents, commands, READMEs, AGENTS docs, commit bodies):

- **Avoid previous-pointing jargon by default.** Phrases like "as discussed earlier", "the prior workstream", "see X above", "previously noted", "per the earlier section", and "do not duplicate that content here; refer to it" force readers to chase context. State the rule directly each time it's needed; a reader landing in the middle of the doc must be able to act without scrolling backward or opening another file.
- **Avoid cross-referencing jargon by default.** Phrases like "sibling codex/AGENTS.md", "consult the X document", "the canonical Y file", and inter-file pointers that exist only to compare-and-contrast belong out of editing primers and rule docs. If two files share a concept, name the concept directly in each — duplication of one short rule beats one round-trip through a pointer chain. Cross-references are allowed when the target is the literal source-of-truth that the reader must read (e.g., "the canonical baseline at `system-prompt-baseline.md` from `<role>` onward"), but not as decorative coupling.
- These two avoidances are the default. Override only when the cross-reference is genuinely load-bearing for behavior (e.g., "embedded baseline span MUST be byte-identical to `system-prompt-baseline.md` from `<role>` onward" — that pointer IS the rule).
