# AGENTS.md — `~/.claude/claude` (ODIN plugin source for Claude Code)

Primer for ODIN agents editing this submodule. Self-contained: every rule needed to commit safely lives below; no chase-the-link required.

## What this repo is

The ODIN plugin source for Claude Code. `.claude-plugin/{plugin,marketplace}.json` declare it; `system-prompt-baseline.md` is the single source of truth for the agent's persona/doctrine. Components live under `commands/` (via skills), `hooks/`, `skills/`. No build, no test runner, no CI.

## Agent paradigm — Minimal-Loss Semantic Compressor/Extender

Every patch is one of three operations:

- **Compress** — preserve behavior + invariants; reduce entropy across control-flow / state-surface / API-surface / dependency / review burden.
- **Extend** — add capability; entropy growth must be load-bearing for the new contract.
- **Correct** — restore a named invariant (drift OR defect); cite it in the `Restores:` body trailer.

Three rejection grounds: **Excess**, **Graft**, **Sprawl** — defined in canonical `<execution>` Axiom `<reject_patches>` block.

ODIN naming and the "Outline Driven INtelligence" expansion remain the identity surface. Four named doctrine fields govern operations: **Minimal Sufficient Change** (patch rule), **Entropy/Aesthetics Axiom** (axiom), **Shape → Compress → Measure → Repair** (loop — the verb `Compress` here names the loop's entropy-reduction step, distinct from the op-axis value `compress`), **PASS/FAIL gates**. Each behavior-changing commit body carries an `Op:` trailer naming the op (`compress | extend | correct`); `correct` commits additionally carry a `Restores:` trailer citing the named invariant (`ref:<commit> | test:<name> | spec:<invariant>`). Free-form prose in the body explains rationale and evidence; the trailer is the structural identifier.

## Output-styles edit rule [DEFAULT]

`output-styles/{axiom-mode,builder,duet,linus,odin}.md` are persona files Claude Code loads as system instructions. Each is a style-specific `<role>` block followed by the canonical baseline embedded at the tail. Files are self-contained — the loader does not resolve refs.

**Always propagate `system-prompt-baseline.md` changes to `output-styles/*.md` files.** Every edit to the canonical (`system-prompt-baseline.md`) MUST land as a single atomic commit that ALSO updates the embedded canonical-baseline cascade in EVERY output-style file (`{axiom-mode,builder,duet,linus,odin}.md` AND `benchmark.md`'s cascade region beneath the `# [baseline]` H1 anchor). Edit at-once, never separately. Per-file commits and per-style sequential agents are the anti-pattern; one commit, one operation, one diff scope. The embedded baseline span MUST be byte-identical to `system-prompt-baseline.md` from `<role>` onward; drift is a CI-less invariant enforced by review.

Procedural recipe (apply on every canonical edit):
1. Edit `system-prompt-baseline.md`.
2. Re-extract canonical from `<role>` onward (e.g., `awk '/^<role>$/{flag=1} flag' system-prompt-baseline.md > /tmp/canon.md`).
3. Locate each output-style's cascade `<role>` line (the SECOND `<role>` for files with a style-specific lead `<role>`; in `benchmark.md`, the `<role>` immediately beneath the `# [baseline]` H1 anchor).
4. Replace each output-style's cascade region (from its cascade `<role>` line through EOF) with `/tmp/canon.md` content.
5. Verify byte-equivalence per file: `diff -q /tmp/canon.md <(awk '/^<role>$/{c++; if(c==2){flag=1}} flag' output-styles/X.md)` should return identical for all 5 non-benchmark styles AND `benchmark.md` (whose runner-specific lead `<role>` makes its cascade `<role>` also the second match).
6. Stage and commit canonical + all 6 output-styles in ONE commit.

`output-styles/benchmark.md` carries a do-not-modify auto-gen header (margin-runner v0.5.5). Default: never hand-edit. Override only on explicit user authorization, and only the embedded canonical-baseline cascade region beneath the runner-specific preamble.

## Submodule handling

This tree is a git submodule of `~/.claude`. Edits commit inside here. Push from inside:

```bash
cd /home/alpha/.claude/claude && git push origin main
```

Force-push is denied at the Claude permissions layer — `git push -f`, `--force`, and every `--force-with-lease*` variant are blocked. Plain `git push` only.

## Patch-bump convention

Behavior changes (paradigm shifts, agent rule changes, skill behavior changes) bump patch (+0.0.1) on both `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` in the same commit. Tooling-only changes (pre-commit hooks, formatter config), pure sync changes (e.g., normalizing an embedded baseline back to canonical), and editing-primer doc updates (this file, CLAUDE.md) do not bump.

## Verification: format-only

The sole gate is `prek run --all-files` (`prek` is the Rust drop-in for `pre-commit`; brew-installed at `/home/linuxbrew/.linuxbrew/bin/prek`). Hooks: `pre-commit-hooks` v6.0.0 (trailing whitespace, JSON validity, line endings, BOM — markdown/json only) plus `tombi-pre-commit` v0.11.0 (TOML lint + format). No build, no unit tests, no `.github/` CI. Don't invent `pytest` / `cargo test` / language test commands; don't add CI without an explicit ask.

## Active-style reload semantics

Edits to `system-prompt-baseline.md` and `output-styles/*.md` take effect on the next Claude Code session — there is no in-session reload. Functional smoke tests must run in a fresh session.

## Writing-style defaults [LOAD-BEARING]

When editing or generating content under this tree (skills, agents, commands, READMEs, AGENTS docs, commit bodies):

- **Avoid previous-pointing jargon by default.** Phrases like "as discussed earlier", "the prior workstream", "see X above", "previously noted", "per the earlier section", and "do not duplicate that content here; refer to it" force readers to chase context. State the rule directly each time it's needed; a reader landing in the middle of the doc must be able to act without scrolling backward or opening another file.
- **Avoid cross-referencing jargon by default.** Phrases like "sibling codex/AGENTS.md", "consult the X document", "the canonical Y file", and inter-file pointers that exist only to compare-and-contrast belong out of editing primers and rule docs. If two files share a concept, name the concept directly in each — duplication of one short rule beats one round-trip through a pointer chain. Cross-references are allowed when the target is the literal source-of-truth that the reader must read (e.g., "the canonical baseline at `system-prompt-baseline.md` from `<role>` onward"), but not as decorative coupling.
- These two avoidances are the default. Override only when the cross-reference is genuinely load-bearing for behavior (e.g., "embedded baseline span MUST be byte-identical to `system-prompt-baseline.md` from `<role>` onward" — that pointer IS the rule).
