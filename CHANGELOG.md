# Changelog

All notable changes to the ODIN Claude Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-09-04

### Changed

- Plugins are reorganized by job. Twelve ids that named a tier (`-advanced`) or a
  grab bag (`odin-create`, `odin-loop`) are retired, and twelve job-named plugins
  are created: `odin-critique`, `odin-fuzzing`, `odin-git`, `odin-infra`,
  `odin-knowledge`, `odin-learn`, `odin-people`, `odin-release`, `odin-review`,
  `odin-skills`, `odin-testing`, and `odin-visual`. 442 skills moved by `git mv`:
  225 out of the retired ids and 217 between surviving ids; 275 of them landed
  in the new plugins and the rest in surviving ones. Every skill keeps its slug, and
  the move touched no body except one description (`lockstep-version-guard`, which
  dropped a hardcoded plugin count). The 28
  plugins are ordered in the catalog by workflow with kin adjacent: think, build,
  ship, operate, protect, know, tooling, communicate, stacks. A plugin id now names
  a job or a stack, never a tier; `check-plugin-surfaces` rejects a tier suffix.
- The doctrine cascade is converged. `system-prompt-baseline.md` loses its duplicate
  rule families (delete-not-deprecate into Posture, wrappers into Craft), its
  reading clamp, its `[MANDATORY]`, `[HARD-REJECT]`, `[REJECT]`, and `[INTERNAL]`
  tags, its arrow-chain and pseudo-math jargon, and the harness tool layer, which
  splits into a shared `<change_discipline>` section and a per-carrier
  `<code_tools>` layer. `<languages>` is rewritten to one row per stack: the LTS
  or current-stable target and one first principle. The six output styles carry
  the regenerated tail; the two external carriers are realigned in place.
- Every skill body passed three prose waves and one judgment wave: em-dashes
  replaced by the punctuation their grammatical role needs, incidental harness
  nouns replaced by the mechanism they stood for, stale `packages/` paths fixed,
  the Contract `Authority` row canonized to four leads (`Read-only.`,
  `Reversible local:`, `Human-gated:`, `Remote:`) with each skill's specifics kept,
  a full unslop pass, and a prompt-optimizer audit with one skill-improver cycle
  per skill: 104 audit findings, 60 applied and the rest recorded in the plugin
  reports, plus 34 skill-improver fixes. A pre-push review then
  restored 46 Authority rows the canon had narrowed or widened.

### Fixed

- `lockstep-version-guard` no longer requires exactly 28 catalog entries; the
  catalog is the member list.
- Install examples name a skill's real plugin (`askme` lives in `odin-planning`),
  the README contents list points only at sections that exist, and
  `docs/specs/skill-lifecycle.md` describes the five dotdir manifests and five
  registries the tree ships.
- `AGENTS.md` names the gate commands (`just check`, `just verify`), the carrier
  generator, the tier-suffix assertion, and the worktree gotcha in the Devin mirror
  target.
- Nine review findings repaired eight skill contracts whose Authority rows
  contradicted their bodies: memory-clean and memory-update claimed version
  control as the rollback for data outside version control;
  github-bug-report-triage, docs-update, saga, and poteto-mode misplaced their
  write or approval boundaries; resolve-merge-conflicts orders
  `git stash drop` after the resolution is committed; and
  influence-and-negotiation permits a conditional sub-step to be skipped with
  a reason.
- `watch-for-harness-mode` regains its no-VCS-commit, no-remote-call,
  no-credential-use, no-published-artifact ban, which the Authority canon had
  compressed to a weaker no-remote-mutation clause.
- cubic P1: `refactor-break-compat` now previews the demolition and waits
  for confirmation before deleting, and deletes only flags used by the old
  path; `gh-review-requests` drops the invalid `requestedReviewers` field;
  `setup-tool-credentials` never echoes a colliding `.env` value and
  refuses to write credentials into a tracked or unignored path.
- Codex P1: the Everyday code changes install row includes `odin-git`; `spec-driven` names
  `odin-testing` for `tdd`; `model-retuning` restores the first-match
  outcome classifier; `retaxonomize-plugins` leaves the generated README
  plugin table to `just render`; tournament failure terminals map onto
  the cascade set (`stalled`, `blocked`).
- Tournament Output listed `capped` and `pending`, terminals no procedure
  step produces. Output now matches the four defined terminals.
- `memory-update` and `memory-clean` claimed `$MEMORY_DIR` is outside
  version control; that is true for the default (gitignored) path and
  false for an override git would track. The resolver refuses a path
  git would track, including a missing directory inside a work tree;
  it canonicalizes a relative override against the caller's directory
  rather than the repository root, and it treats a leading hyphen as a
  pathname.
- `setup-tool-credentials` can start in a directory with no `.gitignore`
  by creating ignore coverage for `.env` after confirmation, and it
  checks tracked vs ignored with `git ls-files` and `git check-ignore`
  rather than ordinary `git status`, which omits ignored files.
- `retaxonomize-plugins` writes catalog entries with `index`,
  `display_name`, `homepage`, and `directory`, the fields the generators
  require.
- `sync-carriers --check` reuses the `check-carriers` audit, so a carrier
  with an unknown section, a missing tool layer, or a malformed overlay
  fails even when shared bodies already match. An overlay-only `<role>`
  is kept and the canonical block is inserted after it. An existing
  non-file `--carrier` override is an error, not a traceback.

### Added

- `retaxonomize-plugins` (odin-skills): moves skills between plugins and creates,
  merges, or retires plugins in a catalog-generated marketplace, then proves the
  gates.
- `scripts/sync-carriers.py`, run as `just sync-carriers`: rewrites each external
  carrier's shared doctrine from the baseline; `--check` is the gate.
- `docs/specs/skill-index.md`, generated by `scripts/render-skill-index.mjs`: one
  row per skill with its plugin and category, the migration index for per-skill
  installs.

### Removed

- `AST-GREP-AGENT-REFERENCE.md`: a third copy of the `ast-grep` reference already
  carried by the `ast-grep` skill and the baseline.
- `docs/specs/graph.yaml` and its pointer in `docs/specs/skill-lifecycle.md`: a
  hand-maintained second model of the tree with no executable consumer.
- The historical 657-skill, 2.0.0 proof blocks in `docs/specs/install-proof.md` and
  `docs/specs/distribution-surfaces.md`, replaced by proofs run against this tree.
- Duplicate root copies of `implementer-prompt.md` and `task-reviewer-prompt.md`
  under `subagent-driven`; only the `references/` copies were cited.

### Migration

Retired id to successor; the count is how many of the retired plugin's skills
went to the named successor.

| Retired | Successor | Skills |
|---|---|---|
| `odin-bigquery` | `odin-infra` | 2 of 2 |
| `odin-code-advanced` | `odin-code` | 17 of 50; the rest to `odin-testing` (17), `odin-review` (5), `odin-git` (2), `odin-security` (2), `odin-knowledge` (2), `odin-skills` (2), `odin-planning` (1), `odin-infra` (1), `odin-design` (1) |
| `odin-create` | `odin-writing` | 15 of 45; the rest to `odin-visual` (15), `odin-planning` (10), `odin-design` (2), `odin-critique` (1), `odin-product` (1), `odin-release` (1) |
| `odin-create-advanced` | `odin-visual` | 10 of 22; the rest to `odin-planning` (6), `odin-writing` (2), `odin-critique` (1), `odin-product` (1), `odin-code` (1), `odin-learn` (1) |
| `odin-design-advanced` | `odin-design` | 4 of 4 |
| `odin-loop` | `odin-design` | 4 of 21; the rest to `odin-review` (3), `odin-testing` (3), `odin-infra` (2), `odin-product` (1), `odin-code` (1), `odin-git` (1), `odin-run` (1), `odin-research` (1), `odin-knowledge` (1), `odin-agent` (1), `odin-skills` (1), `odin-web` (1) |
| `odin-prometheus` | `odin-infra` | 1 of 1 |
| `odin-research-advanced` | `odin-critique` | 6 of 13; the rest to `odin-research` (4), `odin-product` (2), `odin-review` (1) |
| `odin-run-advanced` | `odin-run` | 19 of 21; the rest to `odin-release` (2) |
| `odin-security-advanced` | `odin-security` | 27 of 39; the rest to `odin-fuzzing` (12) |
| `odin-terraform` | `odin-infra` | 1 of 1 |
| `odin-writing-advanced` | `odin-writing` | 6 of 6 |

To find a moved skill's new plugin, look up its slug in `docs/specs/skill-index.md`.
Reinstall a single skill from its new path:

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/<new-id>/skills/<slug> \
  --agent claude-code --scope user
```

## [2.0.4] - 2026-09-03

### Fixed

- `resolve-pr-feedback`: the entry-point document named five dispositions where
  the rubric, both mode files, and the fixer prompt name six. It called the fix
  verdict `fix` where every other file calls it `fixed`, and omitted
  `fixed-differently`, so an agent reading only `SKILL.md` emitted a verdict the
  fixer prompt does not accept and had no verdict for the better-repair case the
  fixer is told to take. The four drifted sites now cite the rubric and carry
  its six names.

## [2.0.3] - 2026-09-03

### Added

- `gate-and-merge` references: `feedback-sweep.md` carries the sweep procedure
  and the six verdict names, taken from the `resolve-pr-feedback` rubric rather
  than coined a second time; `reviewer-subagent.md` carries the subagent
  assignment and the six diff classes; `gotchas.md` carries the evidence only a
  failing branch reaches, for the listing 502, `mergeStateStatus`, and the
  conflict path.

### Changed

- `gate-and-merge`: the one-axis severity table becomes two axes and four
  terminals. Direction decides `close`, repair bound decides `repair`, `hold`,
  or `merge`. `minor` had welded harmless to locally fixable, so a reachable
  defect with a bounded repair was held with a comment instead of fixed and
  merged. The bound is now three conditions rather than a `--name-only` file
  allowlist.
- `gate-and-merge`: `reviewDecision: "CHANGES_REQUESTED"` routes to the new
  review-feedback gate instead of terminating, which had made a feedback sweep
  unreachable. The reading gates run in a fresh-context subagent that never
  sees the merge decision, gate ordinals are gone, and the checks gate runs
  last against the head that will actually merge.

## [2.0.2] - 2026-09-03

### Added

- `prompt-optimizer` audit mode: finds dated instructions in prompts, skills,
  output styles, and tool descriptions; returns a confidence-ordered report and
  a proposed diff carrying only high- and medium-confidence hunks. Pattern
  groups and keep list in `references/audit-patterns.md`; per-vendor guide
  index in `references/prompt-guides.md`.
- `AGENTS.md` requires the audit on behavior change and at each model release,
  and states the patch-bump rule for `releaseVersion`.

### Changed

- `generate-my-taste`: the influence catalogue heading drops its caps tag; the
  criteria below it carry the reason.

### Removed

- Five retired-campaign write-ups under `docs/solutions/` and `docs/ideation/`.

## [2.0.1] - 2026-09-03

The Agent Plugins surface is retired; four native harness surfaces join the three
existing ones. Every harness now gets its own registry and per-plugin manifest,
all generated from the catalog.

### Added

- Per-plugin manifests for Codex (`.codex-plugin/plugin.json`), Cursor
  (`.cursor-plugin/plugin.json`), Grok (`.grok-plugin/plugin.json`), and Kimi
  (`.kimi-plugin/plugin.json`).
- Registries `.codex-plugin/marketplace.json`, `.grok-plugin/marketplace.json`,
  and `.kimi-plugin/marketplace.json`.

### Removed

- The Agent Plugins surface: `.agents/plugins/marketplace.json` and the 28 root
  `plugins/<id>/plugin.json` manifests.

### Changed

- Codex now loads plugins in Legacy format from `.codex-plugin/plugin.json`;
  `mcpServers` is declared explicitly because the Legacy default filename is
  `.mcp.json` with a dot.
- `policy` is added to `.claude-plugin/marketplace.json` entries so Codex, which
  parses that file, keeps first-use authentication instead of prompting at
  install time.

## [2.0.0] - 2026-09-01

The repository becomes a multi-plugin marketplace. Skills move out of one flat
directory into the plugin that owns them, npm distribution is retired, and the
gate set becomes unconditional.

### Added

- 28 plugins, each carrying its own skills, `plugin.json`, `README.md`, `LICENSE`,
  and `NOTICE`, generated from `catalog/plugins.json` as the single source of
  plugin identity.
- Three marketplace registries generated from that catalog: `.claude-plugin`,
  `.agents/plugins`, and `.cursor-plugin`.
- `docs/specs/graph.yaml`, the structural backbone as a compiled graph, and
  `docs/specs/skill-lifecycle.md`, the skill lifecycle as a state machine.
- `scripts/check-voice.py` and `scripts/check-skill-frontmatter.py`, each carrying
  its own fixtures, plus surface and route checkers. Every gate is
  dependency-free Node ESM or standard-library Python.

### Changed

- Skills move from a flat `skills/<slug>/` root to `plugins/<plugin>/skills/<slug>/`.
  The directory now states which plugin owns a skill; no membership registry
  records it.
- 148 skills become 613, re-derived against a bound contract: each states its
  trigger, authority, side effect, and done condition, and each procedure step
  carries a criterion an agent can check.
- Attribution consolidates into `licenses/NOTICE` with a per-plugin `NOTICE`
  generated beside each plugin.
- Every whole-tree gate runs unconditionally. A `files:` selector on a gate that
  audits the whole tree was a second model of its own dependencies, and it drifted.

### Removed

- `catalog/skill-membership.json` and the flat `skills/` tree it indexed. The
  directory a skill lives in is now the only record of which plugin owns it.

## [1.15.49] - 2026-06-14

### Removed

- **`srgn` purged from tool doctrine**: removed the `srgn` tool from the agent persona/doctrine (`system-prompt-baseline.md` + the cascaded `output-styles/*.md`) and deleted the `skills/srgn-cli` skill. Structural search/rewrite is now served solely by `ast-grep`.

### Changed

- **Enriched `ast-grep` guidance**: replaced the single-line `ast-grep` code-manipulation bullet with a structural reference block (cascaded byte-identically across `system-prompt-baseline.md` and all six output-styles): patterns-are-code (not regex), the metavar table, the two-pass `--json`-disables-`-U` apply gotcha, `stopBy: neighbor` defaults for relational YAML rules, strictness levels, and the `ast-grep`-not-`sg` binary note (Linux `sg`/`setgroups` collision).

### Added

- **`AST-GREP-AGENT-REFERENCE.md`**: self-contained ast-grep field reference distilled from `code-yeongyu/ast-grep-skill`: patterns-as-code rules, metavariable semantics, valid-code fixes, strictness levels, context/selector objects, CLI two-pass apply + debug recipes, YAML rule anatomy with a verbatim `no-console` skeleton, per-language rewrite recipes, and a 14-item pitfalls guide.

## [1.15.43] - 2026-06-05

### Added

**15 skills ported from the `agent-sh` plugin marketplace**: re-homed as native, self-contained ODIN skills. All external dependencies (the `agent-analyzer` binary, `repo-intel.json` cache, editor shims, bespoke JS `lib/`, and opus/sonnet/haiku model routing) are replaced by native tooling: codegraph MCP, `git`/`ast-grep`/`git grep` recipes, repomix, generic ODIN agents, and the `ask` tool. Attribution in `skills/LICENSES.md`.

- `repo-intel`: native repository intelligence (hotspots, coupling, bus factor, bugspots, ownership, entry points) from git history + codegraph; no cache, every signal recomputed on demand.
- `agnix`: native agent-config lint pass (skill frontmatter, CLAUDE.md/AGENTS.md, hooks, MCP, plugin manifests, agent files) graded HIGH/MEDIUM/LOW.
- `deslop`: three-phase certainty-graded AI-slop detection; HIGH-only guarded autofix with test-verify and rollback.
- `sync-docs`: diff-driven doc-vs-code drift detection; safe-fix limited to version bumps + CHANGELOG, everything else flagged.
- `banthis`: persist hard user prohibitions into a managed AGENTS.md/CLAUDE.md section (dep-free node script).
- `drift-detect`: plan-vs-reality reality check across GitHub + docs + code with a prioritized reconstruction plan.
- `audit-project`: iterative multi-agent code audit with a false-positive contract; loops until critical/high findings clear.
- `onboard`: new-codebase orientation tour: bounded context collection, 7-section synthesis, interactive guidance.
- `can-i-help`: route contributors to data-backed contribution opportunities matched to stated interest.
- `learn`: online research → scored sources → summaries-only → RAG-optimized learning guide + retrieval index.
- `system-prompt-curator`: create or improve autonomous-agent system prompts from research-backed principles.
- `skillers`: mine local agent transcripts (sanitized first) into automation recommendations; never auto-creates files.
- `agent-surface-forge` (formerly `enhance`): certainty-graded enhancement of agent, plugin, and instruction surfaces through parallel analyzers; HIGH-only `--apply`.
- `perf-investigate`: self-contained multi-phase performance investigation (baseline → hypotheses → profile → one-change optimization).
- `next-task` (explicit-only): self-contained backlog orchestrator: selects the next task and drives it through isolated git-branchless implementation, review, docs, and verification gates.

## [1.15.29] - 2026-05-15

### Changed

**Output styles**

- `Linus`: register idiom standardized to "code" across body sections and principle lines; cross-domain reach (any work-product: code, analysis, knowledge work, documents, decisions) anchored in the `<role>` block.

## [1.15.28] - 2026-05-15

### Changed

**Output styles**

- `Linus`: generalized register scope beyond code/kernel/C to any artifact-producing work (code in any language, analysis, knowledge work, documents, decisions). Doctrine reframed in the register's own voice without primary-source citations or URLs. Section retitled `# Don't break the consumer's contract` (replaces kernel-specific "we don't break userspace"); section retitled `# Blunt about the work, never about people`. Principle tags `[coding-style]` → `[complexity]`, `[no-typedef]` → `[no-hidden-shape]`; `[no-break]` contract list compressed; cross-domain widening anchored once in `<role>` block per /taste audit (sections B/C/D/E speak artifact-agnostically without per-section domain enumeration). The C linked-list code snippets stay as the canonical teach-by-example, unattributed. Concrete complexity rules (≤3 indentation, ≤10 locals, one-or-two screens) retained; goto-pattern bullet generalized to "centralized cleanup at meaningful labels". Cascade byte-equivalence with `system-prompt-baseline.md` preserved.

## [1.15.27] - 2026-05-15

### Added

**New output styles**

- `Linus`: Linus Torvalds maintainer-reviewer register as a taste qualifier. Applies as a judgment lens on top of any code work: special-case elimination as compression (TED 2016 linked-list doctrine), the "we don't break userspace" contract covenant (LKML 2012-12-23), kernel coding-style discipline (`Documentation/process/coding-style.rst`), blunt about code never about people (LKML 2018-09-16 register-guard). Sixth output-style; fills the taste-and-rejection lens slot left open by the five existing implementer registers (ODIN, AxiomMode, Builder, Duet, Eval). `AGENTS.md` enumeration and cascade-count references updated in the same atomic commit so future canonical edits cannot silently skip `linus.md`.

## [1.15.9] - 2026-05-05

### Changed

- 13 skills: removed `disable-model-invocation: true` per cluster-level auto-invocation decisions: `axiom-mode`, `caveman`, `gh-address-comments`, `gh-fix-ci`, `memory-clean`, `memory-sanitize`, `memory-update`, `request-refactor-plan`, `to-issues`, `to-prd`, `triage-issue`, `ubiquitous-language`, `generate-my-taste/assets/template`. 7 skills retain explicit-only invocation: `ai-collab-protocols`, `edit-article`, `generate-my-taste`, `improve-codebase-architecture`, `strict-validation-setup`, `write-a-skill`, `zoom-out`.

## [1.15.8] - 2026-05-04

### Changed

- 39 skills: added `disable-model-invocation: true` to frontmatter: `ai-collab-protocols`, `ast-grep`, `axiom-mode`, `caveman`, `cleanup-codebase`, `deps-upgrade`, `design-an-interface`, `design-by-contract`, `duet`, `edit-article`, `gh-address-comments`, `gh-fix-ci`, `git-branchless`, `git-guardrails-claude-code`, `github-triage`, `improve-codebase-architecture`, `llm-self-loop`, `memory-clean`, `memory-sanitize`, `memory-update`, `perf-profile`, `pr-merge-base`, `pr-merge-temporal`, `pr-review`, `proof-driven`, `refactor-break-bw-compat`, `request-refactor-plan`, `setup-gitignore`, `setup-pre-commit`, `srgn-cli`, `taste`, `tests-adversarial`, `tests-purge-unneeded`, `to-issues`, `to-prd`, `triage-issue`, `type-driven`, `validation-first`, `write-a-skill`. These skills require explicit `/skill-name` invocation; auto-discovery disabled. 18 cross-cutting verb skills remain auto-discoverable: `askme`, `atomic-commit`, `atomic-commit-and-push`, `contexts`, `debug`, `design`, `explore`, `fix`, `init`, `parallel-launch`, `plan`, `proceed`, `qa`, `research`, `resolve`, `review`, `security-review`, `test-driven`.

## [1.5.2] - 2026-04-20

### Changed

- `duet` skill: added `## VS-gated question protocol [MANDATORY]` section. Every `AskUserQuestion` (Phase 1 elicitation, Phase 2 fork, Phase 3 checkpoint) is now preceded by a compressed visible Verbalized Sampling block (`VS (N→M): 1. ...`). Survivors-only render; weakness/contradiction/oversight stays internal. Phase 2 single-survivor short-circuit defined; Phase 1 and Phase 3 always fire `AskUserQuestion`. >4-survivor cap added. `odin:askme` owns the canonical VS+actor-critic spec.
- `Duet` output style: `# Decisions before prose` updated: VS block is now the only permitted preamble before `AskUserQuestion`. Skill-load block cross-references the VS-gated question protocol section.

## [1.5.0] - 2026-04-19

### Added

**New skills**

- `duet`: two-party working posture where the user is director and the agent is executor. Surfaces every fork, tradeoff, and taste choice via batched `AskUserQuestion` with structural framing, a recommended default, and concrete previews when comparison is visual. Eliminates the review-bottleneck (review distributed across picks, not piled at the end) and prevents codebase-understanding debt (user remembers the architecture because they picked it). Three-phase loop: adaptive intent elicitation → execution with fork-surfacing → irreversible checkpoints.

**New output styles**

- `Duet`: presentation half of the duet posture. Decisions before prose, structural/taste framing first with jargon on demand, concrete previews when comparison is visual, silent mechanics / loud forks, no validation language or recap. Enforces `duet` skill invocation whenever active.

**Skill multi-language expansion (10-language support)**

- `test-driven`: conditionalized test commands across 10 languages (previously single-language lock-in).
- `proof-driven`: replaced Lean 4 default with property-based testing; 10-language support.
- `design-by-contract`: expanded to 10 languages; added verification dispatch; integrated LLM context.
- `type-driven`: removed tool lock-in; 10-language support.
- `validation-first`: removed tool lock-in; 10-language support.

**Skill enhancements**

- `parallel-launch`: refined strategy; added explicit review step between worker phases.
- `refactor-break-bw-compat`: enhanced guide with strategy section.

### Changed

**CLAUDE.md methodology**

- Clarified scope targeting; added post-agent verification step (read back modified files, confirm line-count expectations).
- Refined Verbalized Sampling section: dynamic hypothesis sampling (baseline N≥5, trivial N≥3, high-ambiguity N≥7, architectural N≥10, no hard cap).
- Simplified editing workflow (removed `edit_file` partial-snippet specifics in favor of the general Find → Transform → Verify discipline).
- Updated banned tools list; enhanced token-efficiency guidelines (per-tool flags, discovery-then-targeted-read pattern).
- Revised orchestration and delegation sections: task splitting, parallel vs sequence criteria, delegation mandatory thresholds.
- Revised role/tidy-first/VS sections for clarity.

**Tooling**

- Adopted repository-aware search defaults: `git grep` as primary text-search, `rg` as fallback, `ast-grep` for structural queries, `srgn` for grammar-aware scoped regex.
- Revised `srgn` and `nomino` command documentation (usage, options, glob syntax).

**Output styles**

- `builder`: enhanced communication guidelines for non-technical builders (outcome-first, plain-language, progressive-disclosure).

**Infrastructure**

- Installation script simplified (single-line install).
- `mcp.json` streamlined: cleaner server configuration keys.

### Fixed

- `refactor-break-bw-compat`: replaced stale `git grep` invocations with `rg` where appropriate.

### Removed

**Skills**

- `hodd-rust`, `outline-strong`, `plan-now`, deprecated and replaced by the broader `plan` / `proceed` / language-agnostic skill set.
- `code-simplifier`: merged behavior into `refactoring` agent.

**Hooks**

- `UserPromptSubmit` hook removed (replaced by explicit skill invocation patterns).

## [1.4.0] - 2026-02-25

### Changed

**Agent Consolidation (57 → 46 agents)**

Removed redundancy by merging overlapping agents and eliminating agents outside the code agent scope.

**Created:**

- `devil-advocate` - Adversarial technical challenger for pre-decision challenge (pre-mortem, assumption dismantling, red-teaming)
- `database` - Unified database agent (merged sql-pro + sql-query-engineer + database-optimizer)
- `refactoring` - Full refactoring lifecycle (merged refactorer + refactor-planner + tech-debt-resolver + modernizer)

**Merged/Absorbed:**

- `docs-architect` now absorbs docs and reference-builder capabilities (API references, configuration guides, exhaustive coverage)
- `debugger` now absorbs investigator capabilities (hypothesis-driven debugging, incident investigation, report templates)
- `migrator` now absorbs porter capabilities (cross-platform porting, language transitions, library equivalents)
- `criticizer` rewritten with sharpened identity (severity-driven, post-implementation systemic critique)

**Removed:**

- `docs` (exact duplicate of docs-architect)
- `reference-builder` (absorbed into docs-architect)
- `sql-pro`, `sql-query-engineer`, `database-optimizer` (merged into database)
- `refactorer`, `refactor-planner`, `tech-debt-resolver`, `modernizer` (merged into refactoring)
- `investigator` (absorbed into debugger)
- `porter` (absorbed into migrator)
- `sales-automator` (outside code agent scope)
- `reflector` (overlaps general reasoning)
- `meta-programming-pro` (niche, absorbed into language-specific agents)

**Enhanced:**

- All surviving agent descriptions updated with cross-references and PROACTIVELY trigger conditions
- Fixed analyzer.md registration gap (file existed but was not registered in plugin.json)

### Fixed

- `analyzer` agent now registered in plugin.json (was missing since v1.0.0)

## [1.0.0] - 2025-11-17

### Added

**Consolidated Repository Structure**

- Single repository serves as both plugin and marketplace
- Marketplace manifest included in `.claude-plugin/marketplace.json`
- Simplified installation: add repository once, access all features
- No separate marketplace repository needed

#### Agents (57 total)

**Language Specialists (16)**

- rust-pro - Rust Edition 2024 with ownership, lifetimes, zero-cost abstractions
- rust-pro-ultimate - Grandmaster-level Rust for complex scenarios
- typescript-pro - Strict TypeScript with discriminated unions, no any/unknown
- python-pro - Modern Python with type hints, asyncio, dataclasses
- golang-pro - Idiomatic Go with context-first APIs, goroutines
- java-pro - Java 21+ with records, virtual threads, sealed classes
- kotlin-pro - Kotlin K2 with coroutines, null safety, immutability
- cpp-pro - Modern C++20+ with RAII, smart pointers, ranges
- cpp-pro-ultimate - Grandmaster-level C++ with template metaprogramming
- c-pro - Modern C with memory safety, systems programming
- c-pro-ultimate - Master-level C for kernel programming, extreme optimization
- javascript-pro - ES6+ with async patterns, Node.js APIs
- php-pro - Modern PHP with generators, SPL structures
- csharp-pro - Modern C# with async/await, LINQ, .NET 6+
- sql-pro - Complex SQL queries, optimization, schema design
- sql-query-engineer - BigQuery, data analysis, and insights

**Architecture & Design (7)**

- architect - System architecture, scalability, technical decisions
- backend-architect - Backend systems, APIs, database design
- graphql-architect - GraphQL schemas, resolvers, federation
- docs-architect - Technical documentation, architecture guides
- ui-ux-designer - Interface design, user experience, design systems
- artistic-designer - Visual design, aesthetics, beautiful interfaces
- branding-specialist - Brand identity, visual language, corporate identity

**Code Quality (10)**

- code-reviewer - Expert code review, quality, security, maintainability
- debugger - Root cause analysis, error resolution, debugging workflows
- refactorer - Code restructuring, design improvements
- refactor-planner - Strategic refactoring plans, technical debt reduction
- test-writer - Test suites, TDD workflows
- test-designer-advanced - Edge cases, chaos engineering, property-based testing
- modernizer - Legacy code updates, modern practices adoption
- investigator - Deep debugging, root cause analysis
- criticizer - Critical analysis, constructive feedback
- reflector - Deep reflection, retrospectives, continuous improvement

**Performance (4)**

- performance - Whole-system performance optimization, profiling, benchmarking
- concurrency-expert - Thread safety, synchronization, parallel patterns
- memory-expert - Memory optimization, leak detection, allocation analysis
- database-optimizer - Query optimization, indexing, schema efficiency

**Specialized (13)**

- ml-engineer - ML pipelines, model serving, feature engineering
- mlops-engineer - ML infrastructure, experiment tracking, model registries
- data-engineer - ETL pipelines, data warehouses, streaming architectures
- quant-researcher - Financial models, trading strategies, market analysis
- trading-system-architect - HFT systems, market making, order execution
- security-auditor - Vulnerability review, OWASP compliance, secure auth
- migrator - System migrations, schema changes, version upgrades
- porter - Cross-platform code porting, language transitions
- docs - Technical documentation from codebases
- reference-builder - Exhaustive technical references, API docs
- meta-programming-pro - Code generation, DSLs, abstractions
- prompt-engineer - LLM prompts optimization, AI features
- sales-automator - Sales outreach, proposal templates, pricing pages

**Frontend & Mobile (4)**

- react-specialist - React components, hooks, state management
- flutter-specialist - Flutter widgets, state management, platform channels
- ios-developer - Swift/SwiftUI, UIKit, Core Data, App Store optimization
- mobile-developer - React Native/Flutter, offline sync, push notifications

**Infrastructure (2)**

- terraform-specialist - IaC best practices, modules, state management
- analyzer - Deep analysis, pattern recognition, codebase insights

**Maintenance (1)**

- tech-debt-resolver - Technical debt identification and strategic resolution

#### Commands (127 total)

**Analysis (12 commands)**

- analyze/code/elaborate - Deep code elaboration and explanation
- analyze/code/map - Map codebase architecture and structure
- analyze/code/schema - Extract and document data schemas
- analyze/data/data-flow - Analyze data flow patterns
- analyze/data/data-viz - Create data visualizations
- analyze/data/visualize - Generate visual representations
- analyze/db/db-optimize - Database optimization recommendations
- analyze/research/deep-dive - Research with web sources
- analyze/research/deep-web-research - Extensive web research with citations
- analyze/research/investigate - Investigative analysis of complex topics
- analyze/research/quick-web-research - Fast web research
- analyze/think/think - Structured thinking with sequential analysis

**Code (14 commands)**

- code/analyze/analyze-deps - Dependency analysis
- code/analyze/bottleneck - Identify performance bottlenecks
- code/analyze/dependencies - Dependency graph analysis
- code/analyze/deps - Quick dependency check
- code/analyze/technical-debt - Technical debt assessment
- code/fix/bug-fix - Systematic bug fixing workflow
- code/generate/api - Generate API implementations
- code/migrate/deno-ify - Migrate code to Deno
- code/migrate/migrate - General migration workflows
- code/navigate/related - Navigate to related files intelligently
- code/refactor/refactor - Code refactoring workflow
- code/refactor/simplify - Simplify complex code
- code/refactor/standardize - Standardize code patterns

**Context (25 commands)**

- Context loaders for Dragonfly, PostgreSQL, RedPanda, ScyllaDB
- Deno Fresh and Deno scripting contexts
- Go concurrency, ConnectRPC, and web contexts
- Java Quarkus, Spring, and Temporal contexts
- Kubernetes (Cilium, Flux, K8s, Talos) contexts
- Observability and logging contexts
- Project auto-detection context
- Rust async, database, and web contexts
- Security context
- Testing contexts for Deno, Go, Java, and Rust
- Web contexts (Fresh, GitHub CLI, GitHub Actions, Tailwind, Temporal, etc.)

**Documentation (8 commands)**

- docs/analyze/explain - Explain code and documentation
- docs/generate/api-docs - Generate API documentation
- docs/generate/changelog - Generate changelog from commits
- docs/generate/document - Generate full documentation
- docs/generate/onboard - Create onboarding documentation
- docs/manage/docs-add - Add new documentation sections
- docs/manage/docs-init - Initialize documentation structure
- docs/manage/docs-update - Update existing documentation

**Git (6 commands)**

- git/commit/commit - Create atomic commits with Conventional Commits
- git/commit/commit-push - Commit and push to remote
- git/pr/pr-check - Check PR status and CI/CD state
- git/pr/pr-create - Create PR with intelligent analysis
- git/pr/pr-review - Review and manage PRs
- git/pr/pr-update - Update existing PRs
- git/review/review-git - Git history review

**Meta (10 commands)**

- meta/command/generate-command - Generate new slash commands
- meta/command/ideate-commands - Brainstorm command ideas
- meta/extract/knowledge-extract - Extract knowledge from codebases
- meta/ideate/ideate-new - Ideate new features and approaches
- meta/reflect/reflection - Deep reflection on decisions and outcomes
- meta/search/search-smart - Intelligent codebase search
- meta/util/scratch - Scratch pad for quick notes
- meta/util/translate - Translate content between languages

**Scaffolding (8 commands)**

- scaffold/deno/scaffold-deno-fresh - Scaffold Deno Fresh app
- scaffold/deno/scaffold-deno-script - Scaffold Deno script
- scaffold/go/scaffold-go-connect - Scaffold Go Connect RPC service
- scaffold/go/scaffold-go-http-server - Scaffold Go HTTP server
- scaffold/java/scaffold-java-quarkus - Scaffold Quarkus application
- scaffold/rust/scaffold-rust-axum - Scaffold Axum web service
- scaffold/rust/scaffold-rust-cli - Scaffold Rust CLI application

**Security (4 commands)**

- security/audit/audit - Security audit
- security/audit/secrets-audit - Scan for exposed secrets
- security/model/harden - Security hardening recommendations
- security/model/threat-model - Generate threat models (STRIDE methodology)

**Task Management (9 commands)**

- task/manage/add-code-reviews-to-task - Add code reviews to tasks
- task/manage/task-archive - Archive completed tasks
- task/manage/task-create - Create new tasks
- task/manage/task-list - List all tasks
- task/manage/task-log - Log task activities
- task/manage/task-search - Search through tasks
- task/manage/task-show - Show task details
- task/manage/task-update - Update existing tasks
- task/view/task - View task information

**Testing (10 commands)**

- test/analyze/coverage - Test coverage analysis
- test/fix/flaky-fix - Fix flaky tests
- test/generate/integration-test - Generate integration tests
- test/generate/test-gen - Generate test suites
- test/run/load-test - Load testing
- test/run/tdd - Test-driven development workflow
- test/run/validate - Validation with auto-detection

**Tools (5 commands)**

- tool/cpr - Code, PR, and review workflows
- tool/diagram - Generate diagrams (nomnoml/mermaid)
- tool/five - Five-question analysis framework
- tool/review - Code review
- tool/zed-task - Zed editor task integration

**Workflow (17 commands)**

- workflow/create/epic - Create epic with sub-tasks
- workflow/create/prototype - Rapid prototyping workflow
- workflow/manage/clean - Clean up temporary files and artifacts
- workflow/manage/integrate - Integration workflows
- workflow/manage/organize - Organize project structure
- workflow/manage/plan - Strategic planning
- workflow/manage/release - Release management
- workflow/manage/sync - Synchronization workflows
- workflow/start/start - Start new project/feature workflow
- workflow/view/next-steps - Suggest next steps
- workflow/view/options - View available options
- workflow/view/progress - Show progress
- workflow/view/summary - Generate summary
- workflow/view/tldr - Quick summary

#### Core Features

**Diagram-First Engineering**

- Five mandatory diagrams: Architecture, Data Flow, Concurrency, Memory, Optimization
- Nomnoml for conversations, Mermaid for documentation
- Non-negotiable requirement for non-trivial implementations

**Surgical Editing Workflow**

- Find → Copy → Paste pattern
- AST-based transformations with ast-grep (highly preferred)
- Minimal context extraction with precise targeting
- Preview → Validate → Apply workflow

**Atomic Commit Protocol**

- Conventional Commits v1.0.0 compliance
- Type-classified commits (feat, fix, build, chore, ci, docs, perf, refactor, style, test)
- One logical change per commit
- Independent testability and reversibility

**Confidence-Driven Execution**

- Adaptive behavior based on familiarity, complexity, risk, and scope
- Four confidence levels with distinct patterns
- Automatic confidence calibration based on outcomes

**Tool Selection Mandate**

- ast-grep (HIGHLY PREFERRED) for code operations
- native-patch for file edits
- ripgrep for text/comments/strings
- fd for file discovery (NEVER find)
- eza for directory listing (NEVER ls)
- Banned: sed for edits, find, ls, grep for code patterns

#### Configuration

**settings.json**

- Full tool permissions (ast-grep, fd, rg, cargo, npm, git, etc.)
- MCP integration (time, browser, git, context7, tavily, etc.)
- Security denials (sed -i, force push, destructive commands)
- Hooks for event-driven automation
- Bypass permissions mode by default
- Always thinking enabled

**CLAUDE.md**

- ODIN methodology and principles
- Language-specific guidelines (Rust 2024, TypeScript, Python, Go, Java, Kotlin, C++, C, JavaScript, PHP, C#, SQL)
- UI/UX design guidelines
- Verification and refinement patterns
- Decision heuristics and frameworks

#### Documentation

- Full README with installation, usage, and methodology
- CHANGELOG for version tracking
- Plugin manifest with full registry
- Marketplace structure for distribution

### Philosophy

**Core Principles**

1. Investigate Before Acting - Never speculate about unread code
2. Diagram-First Design - Five diagrams mandatory before implementation
3. Surgical Precision - Minimal, targeted changes using AST-based tools
4. Atomic Commits - One logical change per commit, properly typed
5. Confidence-Driven - Adapt behavior based on familiarity and risk
6. Tool Selection - ast-grep > native-patch > ripgrep

**Quality Standards**

- Functional accuracy ≥ 95%
- Code quality ≥ 90%
- Design excellence ≥ 95%
- Performance within budgets
- Error recovery 100%
- Security compliance 100%

[1.0.0]: https://github.com/OutlineDriven/odin-claude-plugin/releases/tag/v1.0.0
