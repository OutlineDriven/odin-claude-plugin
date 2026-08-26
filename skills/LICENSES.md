# Third-Party Attribution Registry

Single source of attribution for skills and reference documents adapted from upstream open-source projects. Individual skill files do not carry per-file copyright headers — attribution is consolidated here so SKILL.md prose stays clean. The license terms apply to the original upstream content; ODIN-style adaptations (rewording, language-agnostic generalization, voice changes, structural reorganization) are made under the same license.

Upstream reference: https://github.com/mattpocock/skills (Matt Pocock).

## Skills

Each row covers the SKILL.md (and any skill-internal references the upstream skill ships) at the listed path.

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `~~domain-model/SKILL.md~~` | https://github.com/mattpocock/skills/tree/main/domain-model | MIT | © 2026 Matt Pocock | Adapted in ODIN voice; English-mandate; ODIN integration appendix added; reference paths rewritten to `references/`. |
| `~~ubiquitous-language/SKILL.md~~` | https://github.com/mattpocock/skills/tree/main/ubiquitous-language | MIT | © 2026 Matt Pocock | ODIN voice; modality disambiguation against `domain-model` and `askme`; `disable-model-invocation: true` preserved verbatim. |
| `~~grill-me/SKILL.md~~` | https://github.com/mattpocock/skills/tree/main/grill-me | MIT | © 2026 Matt Pocock | ODIN voice; explicit modality table vs `askme` and `domain-model`; banned-tooling references replaced with mandated alternatives; language-neutral examples. |
| `~~design-an-interface/SKILL.md~~` | https://github.com/mattpocock/skills/tree/main/design-an-interface | MIT | © 2026 Matt Pocock | ODIN voice; TypeScript interface examples regeneralized to ≥2 language families; "Design It Twice" framing preserved. |
| `improve-architecture/SKILL.md` | https://github.com/mattpocock/skills/tree/main/improve-codebase-architecture | MIT | © 2026 Matt Pocock | ODIN voice; cross-linked from `contexts/SKILL.md` per canonical-homes map. |
| `~~zoom-out/SKILL.md~~` | https://github.com/mattpocock/skills/tree/main/zoom-out | MIT | © 2026 Matt Pocock | ODIN voice; `disable-model-invocation: true` preserved verbatim; aligned with `odin:duet` director pattern. |
| `~~caveman/SKILL.md~~` | https://github.com/mattpocock/skills/tree/main/caveman | MIT | © 2026 Matt Pocock | Caveman-adapted: grammar-fragmentation dropped; verbosity reduction preserved; English-mandate honored. |
| `~~write-a-skill/SKILL.md~~` | https://github.com/mattpocock/skills/tree/main/write-a-skill | MIT | © 2026 Matt Pocock | ODIN voice; scope disambiguation against `odin:init` and `skill-creator:skill-creator`; language-neutral framing. |
| `~~git-guardrails-claude-code/SKILL.md~~` | https://github.com/mattpocock/skills/tree/main/git-guardrails-claude-code | MIT | © 2026 Matt Pocock | ODIN voice; cross-harness installation note added; safety-critical hook script (see `hook.sh` row below). |
| `~~git-guardrails-claude-code/hook.sh~~` | https://github.com/mattpocock/skills/tree/main/git-guardrails-claude-code | MIT | © 2026 Matt Pocock | Bash hook script ported verbatim. Pattern list and exit-2 contract are upstream's; install path adapted for ODIN harness. |
| `~~to-prd/SKILL.md~~` | https://github.com/mattpocock/skills/tree/main/to-prd | MIT | © 2026 Matt Pocock | ODIN voice; flipped-row reconciliation: GitHub-issue emission abstracted to optional `--emit-issue` flag; default emits markdown PRD file. |
| `~~to-issues/SKILL.md~~` | https://github.com/mattpocock/skills/tree/main/to-issues | MIT | © 2026 Matt Pocock | ODIN voice; tracer-bullet vertical-slice framing preserved; emission modes (file vs `--emit-issue`) added. |
| `~~qa/SKILL.md~~` | https://github.com/mattpocock/skills/tree/main/qa | MIT | © 2026 Matt Pocock | ODIN voice; modality differentiation table vs `odin:review` and `odin:pr-review`. |
| `~~request-refactor-plan/SKILL.md~~` | https://github.com/mattpocock/skills/tree/main/request-refactor-plan | MIT | © 2026 Matt Pocock | ODIN voice; scope fence vs `odin:refactor-break-compat`; emission modes added. |
| `github-triage/SKILL.md` | https://github.com/mattpocock/skills/tree/main/github-triage | MIT | © 2026 Matt Pocock | ODIN voice; flipped-row reconciliation: hard-coded label names abstracted to a configurable label-map at the top of SKILL.md. |
| `github-triage/references/awaiting-info-template.md` | https://github.com/mattpocock/skills/tree/main/github-triage | MIT | © 2026 Matt Pocock | Extracted verbatim from `github-triage/SKILL.md` in the router/reference split; heading dedented one level. |
| `setup-pre-commit/SKILL.md` | https://github.com/mattpocock/skills/tree/main/setup-pre-commit | MIT | © 2026 Matt Pocock | ODIN voice; generalized from Husky+lint-staged to project's hook tool of choice (Husky, pre-commit, lefthook, cargo-husky, dune hooks). |
| `setup-pre-commit/references/hook-recipes.md` | https://github.com/mattpocock/skills/tree/main/setup-pre-commit | MIT | © 2026 Matt Pocock | Extracted verbatim from `setup-pre-commit/SKILL.md`'s "Per-ecosystem hook contents" section in the router/reference split; heading dedented one level. |
| `writing-skills/SKILL.md` | https://github.com/mattpocock/skills/tree/release/v1.2/skills/productivity/writing-for-agents | MIT | © 2026 Matt Pocock | ODIN voice; upstream `writing-for-agents` content kept under the established `writing-skills` invocation name; scope broadened to every agent-consumed document; disclosed mechanics moved under `references/`. |
| `~~writing-skills/references/GLOSSARY.md~~` | https://github.com/mattpocock/skills/blob/main/skills/productivity/writing-great-skills/GLOSSARY.md | MIT | © 2026 Matt Pocock | Disclosed glossary moved from sibling to `references/`; ODIN voice; self-references repointed to `writing-skills`/`../SKILL.md`. |
| `batch-ask-me/SKILL.md` | https://github.com/mattpocock/skills/tree/main/skills/in-progress/batch-grill-me | MIT | © 2026 Matt Pocock | Renamed from upstream `batch-grill-me`; ODIN voice; grill framing replaced with design-tree frontier rounds and the `askme` question contract; model invocation enabled. |
| `loop-me/SKILL.md` | https://github.com/mattpocock/skills/tree/main/skills/in-progress/loop-me | MIT | © 2026 Matt Pocock | ODIN voice; stateful grilling reference rewired to `askme` (adversarial); cwd workflow workspace and loop vocabulary preserved; model invocation enabled. |
| `to-questionnaire/SKILL.md` | https://github.com/mattpocock/skills/tree/main/skills/in-progress/to-questionnaire | MIT | © 2026 Matt Pocock | ODIN voice; send-focused questionnaire flow and inline template preserved; model invocation enabled. |
| `~~writing-fragments/SKILL.md~~` | https://github.com/mattpocock/skills/tree/main/skills/in-progress/writing-fragments | MIT | © 2026 Matt Pocock | ODIN voice; grilling reference rewired to `askme`; heterogeneous append-only fragment mining preserved; model invocation enabled. Removed from the plugin; no successor. |
| `~~writing-shape/SKILL.md~~` | https://github.com/mattpocock/skills/tree/main/skills/in-progress/writing-shape | MIT | © 2026 Matt Pocock | ODIN voice; grilling reference rewired to `askme`; read-only-pile, format-argued shaping preserved; model invocation enabled. Removed from the plugin; no successor. |
| `~~writing-beats/SKILL.md~~` | https://github.com/mattpocock/skills/tree/main/skills/in-progress/writing-beats | MIT | © 2026 Matt Pocock | ODIN voice; grounding-gated beat journey preserved; model invocation enabled. Removed from the plugin; no successor. |
| `setup-ts-deep-modules/SKILL.md` | https://github.com/mattpocock/skills/tree/main/skills/in-progress/setup-ts-deep-modules | MIT | © 2026 Matt Pocock | ODIN voice; `/codebase-design` pointer returned from `improve-architecture`; config link repointed to `references/`; model invocation enabled. |
| `setup-ts-deep-modules/references/dependency-cruiser.config.cjs` | https://github.com/mattpocock/skills/tree/main/skills/in-progress/setup-ts-deep-modules | MIT | © 2026 Matt Pocock | Deployable dependency-cruiser template copied verbatim. |
| `teach/SKILL.md` | https://github.com/mattpocock/skills/tree/main/skills/productivity/teach | MIT | © 2026 Matt Pocock | ODIN voice; format links repointed to `references/`; cwd teaching workspace and learning philosophy preserved; model invocation enabled. |
| `teach/references/MISSION-FORMAT.md` | https://github.com/mattpocock/skills/tree/main/skills/productivity/teach | MIT | © 2026 Matt Pocock | Mission template moved to `references/` unchanged. |
| `teach/references/RESOURCES-FORMAT.md` | https://github.com/mattpocock/skills/tree/main/skills/productivity/teach | MIT | © 2026 Matt Pocock | Resources template moved to `references/`; SKILL back-link repointed to `../SKILL.md`. |
| `teach/references/LEARNING-RECORD-FORMAT.md` | https://github.com/mattpocock/skills/tree/main/skills/productivity/teach | MIT | © 2026 Matt Pocock | Learning-record template moved to `references/` unchanged. |
| `teach/references/GLOSSARY-FORMAT.md` | https://github.com/mattpocock/skills/tree/main/skills/productivity/teach | MIT | © 2026 Matt Pocock | Glossary template moved to `references/` unchanged. |
| `resolving-merge-conflicts/SKILL.md` | https://github.com/mattpocock/skills/tree/release/v1.2/skills/engineering/resolving-merge-conflicts | MIT | © 2026 Matt Pocock | ODIN voice; native `read :conflicts` and `difft` tooling added; scope fenced from abortable trial merges. |
| `wayfinder/SKILL.md` | https://github.com/mattpocock/skills/tree/release/v1.2/skills/engineering/wayfinder | MIT | © 2026 Matt Pocock | ODIN voice; tracker resolution adapted to GitHub child issues or local `.outline/wayfinder/`; grilling and research routes rewired to `batch-ask-me` and `research`. |
| `debug/SKILL.md` (diagnosing loop addition only) | https://github.com/mattpocock/skills/tree/release/v1.2/skills/engineering/diagnosing-bugs | MIT | © 2026 Matt Pocock | Feedback-loop-first diagnosis, minimisation, ranked falsifiable hypotheses, tagged-log cleanup, and correct-seam gating grafted onto the ODIN debugger reference. |
| `research/SKILL.md` (background artifact addition only) | https://github.com/mattpocock/skills/tree/release/v1.2/skills/engineering/research | MIT | © 2026 Matt Pocock | Background subagent dispatch and a persistent cited Markdown artifact grafted onto ODIN's five-tier source ladder. |
| `domain-modeling/SKILL.md` | https://github.com/mattpocock/skills/tree/release/v1.2/skills/engineering/domain-modeling | MIT | © 2026 Matt Pocock | ODIN voice; ADR format removed in favor of the single `docs-and-adrs` contract; name-collision fence against `contexts` added; supersedes the struck `domain-model` and `ubiquitous-language` rows. |
| `to-tickets/SKILL.md` | https://github.com/mattpocock/skills/tree/release/v1.2/skills/engineering/to-tickets | MIT | © 2026 Matt Pocock | ODIN voice; tracker resolution adapted to the `wayfinder` GitHub-or-`.outline/` rule; the `setup-matt-pocock-skills` dependency removed; label application made conditional; supersedes the struck `to-issues` row. |
| `prototype-logic/SKILL.md` | https://github.com/mattpocock/skills/tree/release/v1.2/skills/engineering/prototype | MIT | © 2026 Matt Pocock | ODIN voice; the logic branch of upstream's two-branch `prototype` was ported under a branch-specific name; the UI branch and `UI.md` were not ported; the six shared parent rules were folded in so the skill stands alone. |
| `wizard/SKILL.md` | https://github.com/mattpocock/skills/tree/release/v1.2/skills/in-progress/wizard | MIT | © 2026 Matt Pocock | ODIN voice; the never-run-it headless fence was added for ODIN's stdin prohibition; the procedure-scoping and stage-authoring contract was retained. |
| `spec-driven/SKILL.md` (seam-sketch addition only) | https://github.com/mattpocock/skills/tree/release/v1.2/skills/engineering/to-spec | MIT | © 2026 Matt Pocock | The highest-seam and fewest-seams rule was grafted onto the existing Addy Osmani-derived spec workflow; the rest of `to-spec` was not ported because `spec-driven` already owns spec authoring; supersedes the struck `to-prd` row. |
| `batch-ask-me/SKILL.md` (frontier-overflow addition only) | https://github.com/mattpocock/skills/tree/release/v1.2/skills/productivity/grilling | MIT | © 2026 Matt Pocock | The Markdown overflow format was grafted onto the existing `batch-ask-me` port so a wide frontier is asked in one round instead of being truncated to the question-tool cap. |
| `setup-git-guardrails/SKILL.md` | https://github.com/mattpocock/skills/tree/release/v1.2/skills/misc/git-guardrails-claude-code | MIT | © 2026 Matt Pocock | ODIN voice; renamed into the `setup-` installer family; the stdin and exit-2 hook contract and BLOCKED message were preserved; the blocklist was narrowed to irreversible operations so plain pushes remain available; the bash regex matcher was replaced with quote-aware `shlex`, dropping the `jq` dependency; malformed payloads fail open; supersedes the struck `git-guardrails-claude-code` rows. |
| `codebase-design/SKILL.md` | https://github.com/mattpocock/skills/tree/release/v1.2/skills/engineering/codebase-design | MIT | © 2026 Matt Pocock | ODIN-adapted vocabulary moved out of `improve-architecture`; deep-versus-shallow contrast, testability rules, and the relationships list folded in; upstream ASCII diagrams dropped; model invocation enabled. |
| `wait-what/SKILL.md` | https://github.com/mattpocock/skills/tree/8b36d4f/skills/productivity/wait-what | MIT | © 2026 Matt Pocock | ODIN voice; the re-pitch trigger and the context-first, glossary-bound restatement were retained; the ASD-STE100 instruction was replaced with ISO 24495-1 because the re-pitch is conversation with the user, and ASD-STE100 governs maintainer documentation only; `CONTEXT.md` resolution bound to the `domain-modeling` root-or-per-context rule; `disable-model-invocation: true` preserved verbatim. |
| `test-driven/SKILL.md` (design-vocabulary pointer addition only) | https://github.com/mattpocock/skills/blob/8b36d4f/skills/engineering/tdd/SKILL.md | MIT | © 2026 Matt Pocock | The paragraph routing interface-shape questions to the shared deep-module vocabulary was grafted onto the existing seams section; the `/codebase-design` command reference was rewritten as a bare `codebase-design` skill reference. |
| `wizard/SKILL.md` (description rewrite only) | https://github.com/mattpocock/skills/blob/8b36d4f/skills/engineering/wizard/SKILL.md | MIT | © 2026 Matt Pocock | The four trigger branches and the agent-can-do-it-itself exclusion were taken from upstream's model-invocation rewrite; the ODIN `Author it, never run it` fence was retained and the exclusion re-cast with a positive target. |

## Reference documents

Reference documents cross-linked across multiple skills per the canonical-homes map. The owner skill carries the `references/` subdirectory; consumer skills link via relative paths.

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `~~domain-model/references/ADR-FORMAT.md~~` | https://github.com/mattpocock/skills/blob/main/domain-model/ADR-FORMAT.md | MIT | © 2026 Matt Pocock | Language-agnostic ADR template; ODIN voice. |
| `~~domain-model/references/CONTEXT-FORMAT.md~~` | https://github.com/mattpocock/skills/blob/main/domain-model/CONTEXT-FORMAT.md | MIT | © 2026 Matt Pocock | Glossary entry format; ODIN voice; cross-linked from `contexts/SKILL.md`. |
| `~~improve-codebase-architecture/references/LANGUAGE.md~~` | https://github.com/mattpocock/skills/blob/main/improve-codebase-architecture/LANGUAGE.md | MIT | © 2026 Matt Pocock | Architecture vocabulary (module, seam, adapter, depth, leverage, locality); TS examples regeneralized to ≥2 language families. |
| `~~improve-architecture/references/LANGUAGE.md~~` | https://github.com/mattpocock/skills/blob/main/improve-codebase-architecture/LANGUAGE.md | MIT | © 2026 Matt Pocock | Architecture vocabulary (module, seam, adapter, depth, leverage, locality); TS examples regeneralized to ≥2 language families. Removed from the plugin; superseded by `codebase-design`. |
| `improve-architecture/references/DEEPENING.md` | https://github.com/mattpocock/skills/blob/main/improve-codebase-architecture/DEEPENING.md | MIT | © 2026 Matt Pocock | Dependency taxonomy and seam discipline; TS examples regeneralized to ≥2 language families. |
| `improve-architecture/references/INTERFACE-DESIGN.md` | https://github.com/mattpocock/skills/blob/main/improve-codebase-architecture/INTERFACE-DESIGN.md | MIT | © 2026 Matt Pocock | "Design It Twice" parallel-generation workflow; TS examples regeneralized to ≥2 language families; cross-linked from `contexts/SKILL.md`. |
| `test-driven/references/mocking.md` | https://github.com/mattpocock/skills/blob/main/tdd/mocking.md | MIT | © 2026 Matt Pocock | Fold-in into existing `odin:test-driven`; JS mocking examples regeneralized to ≥2 language families. |
| `~~test-driven/references/interface-design.md~~` | https://github.com/mattpocock/skills/blob/main/tdd/interface-design.md | MIT | © 2026 Matt Pocock | Fold-in; TS interface examples regeneralized to ≥2 language families. |
| `~~test-driven/references/refactoring.md~~` | https://github.com/mattpocock/skills/blob/main/tdd/refactoring.md | MIT | © 2026 Matt Pocock | Fold-in; ODIN voice. |
| `~~test-driven/references/deep-modules.md~~` | https://github.com/mattpocock/skills/blob/main/tdd/deep-modules.md | MIT | © 2026 Matt Pocock | Fold-in; npm-flavored examples regeneralized; ODIN voice. |
| `test-driven/references/tests.md` | https://github.com/mattpocock/skills/blob/main/tdd/tests.md | MIT | © 2026 Matt Pocock | Fold-in; ODIN voice. |
| `writing-skills/references/SKILL-MECHANICS.md` | https://github.com/mattpocock/skills/blob/release/v1.2/skills/productivity/writing-for-agents/SKILL-MECHANICS.md | MIT | © 2026 Matt Pocock | Skill-only invocation, splitting, and router mechanics disclosed from the broadened `writing-skills` reference. |
| `writing-skills/agents/openai.yaml` | https://github.com/mattpocock/skills/blob/main/skills/productivity/writing-for-agents/agents/openai.yaml | MIT | © 2026 Matt Pocock | OpenAI/Codex harness UI metadata; `display_name` retitled for the local `writing-skills` invocation name; upstream `short_description` retained. |
| `review/references/smell-baseline.md` | https://github.com/mattpocock/skills/blob/release/v1.2/skills/engineering/code-review/SKILL.md | MIT | © 2026 Matt Pocock | Twelve-smell Fowler baseline extracted for ODIN's project-standards reviewer; repo-override and judgement-call rules preserved. |
| `debug/scripts/hitl-loop.template.sh` | https://github.com/mattpocock/skills/blob/release/v1.2/skills/engineering/diagnosing-bugs/scripts/hitl-loop.template.sh | MIT | © 2026 Matt Pocock | Human-in-the-loop reproduction template ported for the ODIN debug workflow. |
| `~~review/references/refactoring.md~~` | https://github.com/mattpocock/skills/blob/main/tdd/refactoring.md | MIT | © 2026 Matt Pocock | Moved from `test-driven` to the review stage when refactoring left the red → green loop; deep-module link repointed. Removed from the plugin; unreachable from any skill pointer. |
| `~~improve-architecture/references/deep-modules.md~~` | https://github.com/mattpocock/skills/blob/main/tdd/deep-modules.md | MIT | © 2026 Matt Pocock | Moved from `test-driven` to the architecture reference home; npm examples remain language-generalized. Removed from the plugin; unreachable from any skill pointer. |
| `~~improve-architecture/references/tdd-interface-design.md~~` | https://github.com/mattpocock/skills/blob/main/tdd/interface-design.md | MIT | © 2026 Matt Pocock | Moved from `test-driven` to the architecture reference home; kept distinct from the Design It Twice reference. Removed from the plugin; unreachable from any skill pointer. |
| `docs-and-adrs/references/adrs.md` (three-criteria gate addition only) | https://github.com/mattpocock/skills/blob/release/v1.2/skills/engineering/domain-modeling/ADR-FORMAT.md | MIT | © 2026 Matt Pocock | The three-criteria gate and single-paragraph floor were grafted onto the existing Addy Osmani-derived reference; its `docs/decisions/` path and full template were retained. |
| `domain-modeling/references/CONTEXT-FORMAT.md` | https://github.com/mattpocock/skills/tree/release/v1.2/skills/engineering/domain-modeling | MIT | © 2026 Matt Pocock | ODIN voice; glossary and multi-context map formats retained; ADR material omitted in favor of the single `docs-and-adrs` contract; supersedes the struck `domain-model` reference row. |
| `wizard/scripts/wizard-template.sh` | https://github.com/mattpocock/skills/tree/release/v1.2/skills/in-progress/wizard | MIT | © 2026 Matt Pocock | The bash library was ported with logic unchanged and renamed from `template.sh`; the existing `/wizard` generator header was retained. |
| `setup-git-guardrails/scripts/block-dangerous-git.py` | https://github.com/mattpocock/skills/tree/release/v1.2/skills/misc/git-guardrails-claude-code | MIT | © 2026 Matt Pocock | The upstream stdin, exit-2, and BLOCKED-message contract was retained; the blocklist excludes plain pushes; the bash regex matcher was replaced with a quote-aware Python `shlex` token scan with bounded shell-code recursion and fail-open malformed-input handling. |
| `handoff/references/phase-boundaries.md` | https://github.com/mattpocock/skills/blob/8b36d4f/skills/engineering/ask-matt/PHASE-BOUNDARIES.md | MIT | © 2026 Matt Pocock | The ordered boundary tree, the five options, and the primary/secondary source trade were retained; upstream's `ask-matt` router was not ported, so the reference was rehomed under the `handoff` skill it gates; the Claude Code slash commands were generalized to capability names for the six shipped harnesses; the external smart-zone link was replaced with an inline definition. |

## agentsys ports

Skills and reference/script files ported from the `agent-sh` plugin marketplace (https://github.com/agent-sh), which the maintainer is decommissioning. Upstream is MIT. ODIN adaptations — removal of the external `agent-analyzer` binary, `repo-intel.json` cache, editor shims, bespoke JS `lib/`, and model routing; substitution of native tooling (codegraph MCP, `git`/`ast-grep`/`git grep`, repomix, generic ODIN agents, the `ask` tool); ODIN voice; structural reorganization — are made under the same MIT terms. License text is the standard MIT reproduced below; only the copyright holder differs (© 2026 Avi Fenesh).

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `deslop/SKILL.md` | https://github.com/agent-sh/deslop (main) | MIT | © 2026 Avi Fenesh | ODIN voice; three-phase certainty scan via native search/ast-grep; HIGH-only guarded autofix. Language-agnostic generalization: detection bullets restated as behavioral categories with parenthetical family enumeration; the per-language Native Recipes block removed as duplication of the catalog's detection column. |
| `deslop/references/slop-catalog.md` | https://github.com/agent-sh/deslop (main) | MIT | © 2026 Avi Fenesh | Slop pattern + certainty + autofix-strategy table. Language-agnostic generalization: re-indexed from per-language sections to behavioral categories, with language demoted to a row key (`Any` where the signal is language-independent); the category that named a language ("Unsafe Error Handling (Rust)") split into crash-on-failure and swallow-on-failure; coverage broadened to C#, Ruby, PHP, and Swift; category index added. Every original detection recipe preserved. |
| `sync-docs/SKILL.md` | https://github.com/agent-sh/sync-docs (main) | MIT | © 2026 Avi Fenesh | ODIN voice; git-diff drift detection; safe-fix limited to version bump + CHANGELOG. |
| `sync-docs/references/doc-issues.md` | https://github.com/agent-sh/sync-docs (main) | MIT | © 2026 Avi Fenesh | Doc-issue taxonomy + per-issue detection recipes + ignore list. |
| `sync-docs/references/detection-recipes.md` | https://github.com/agent-sh/sync-docs (main) | MIT | © 2026 Avi Fenesh | Extracted verbatim from `sync-docs/SKILL.md`'s Native Detection Recipes section (Manifest versions, CHANGELOG evidence; Code graph first stayed inline) in the router/reference split; headings dedented one level (## → #, ### → ##). |
| `drift-detect/SKILL.md` | https://github.com/agent-sh/drift-detect (main) | MIT | © 2026 Avi Fenesh | ODIN voice; gh/docs/code collection; generic-agent synthesis (model routing removed). |
| `drift-detect/references/drift-taxonomy.md` | https://github.com/agent-sh/drift-detect (main) | MIT | © 2026 Avi Fenesh | Drift/gap taxonomy, prioritization weights, cross-ref matching, report template. |
| `audit-project/SKILL.md` | https://github.com/agent-sh/audit-project (v1.0.2) | MIT | © 2026 Avi Fenesh | ODIN voice; iterative multi-agent audit via generic ODIN reviewers. |
| `audit-project/references/review-roster.md` | https://github.com/agent-sh/audit-project (v1.0.2) | MIT | © 2026 Avi Fenesh | The 10 reviewer role prompts + false-positive-contract clause. |
| `audit-project/references/false-positive-contract.md` | https://github.com/agent-sh/audit-project (v1.0.2) | MIT | © 2026 Avi Fenesh | Consolidation algorithm, blocked-ratio gate, decision-gate options, signal routing. |
| `onboard/SKILL.md` | https://github.com/agent-sh/onboard (v0.1.1) | MIT | © 2026 Avi Fenesh | ODIN voice; codebase orientation via native signals + repomix; `ask`-driven guidance. |
| `onboard/references/orientation.md` | https://github.com/agent-sh/onboard (v0.1.1) | MIT | © 2026 Avi Fenesh | Collection checklist, 7-section orientation template, depth matrix, degradation table. |
| `can-i-help/SKILL.md` | https://github.com/agent-sh/can-i-help (v0.1.1) | MIT | © 2026 Avi Fenesh | ODIN voice; contribution routing via native signals + mandatory `ask`. |
| `can-i-help/references/interest-routing.md` | https://github.com/agent-sh/can-i-help (v0.1.1) | MIT | © 2026 Avi Fenesh | Interest→signal map, four-field recommendation template, slop-verification rules. |
| `can-i-help/references/slop-cleanup-gate.md` | https://github.com/agent-sh/can-i-help (v0.1.1) | MIT | © 2026 Avi Fenesh | Extracted verbatim from `can-i-help/SKILL.md` in the router/reference split; headings dedented one level. |
| `enhance/SKILL.md` | https://github.com/agent-sh/enhance (main) | MIT | © 2026 Avi Fenesh | ODIN voice; parallel certainty-graded analyzers; auto-suppression learning dropped. |
| `enhance/references/analyzer-checks.md` | https://github.com/agent-sh/enhance (main) | MIT | © 2026 Avi Fenesh | The 8 analyzer check tables (check / certainty / autoFix). |

## Jia-Ethan skill port

`github-solution-research` adapted from the upstream Codex skill at https://github.com/Jia-Ethan/github-solution-research (created 2026-06-12). Upstream is MIT; ODIN adaptations — porting from a Codex skill to the ODIN/Claude Code skill surface, ODIN voice, and retention of the GitHub-CLI-first (`gh`) search/inspection doctrine with the conditional-subagent research guidance — are made under the same MIT terms. The bundled `LICENSE` (MIT, © 2026 Jia-Ethan) is retained verbatim in the skill directory to honor the MIT obligation; upstream's bilingual `README.md` and Codex `agents/openai.yaml` are also retained verbatim as upstream artifacts. License text is the standard MIT reproduced below; only the copyright holder differs (© 2026 Jia-Ethan).

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `github-solution-research/SKILL.md` | https://github.com/Jia-Ethan/github-solution-research | MIT | © 2026 Jia-Ethan | Codex skill ported to ODIN/Claude Code; `gh`-CLI-first search/inspection surface and conditional-subagent research guidance retained; ODIN voice. |
| `github-solution-research/references/extraction-playbook.md` | https://github.com/Jia-Ethan/github-solution-research | MIT | © 2026 Jia-Ethan | Retained; deep-read extraction playbook turning GitHub evidence into a local solution. |
| `github-solution-research/references/research-rubric.md` | https://github.com/Jia-Ethan/github-solution-research | MIT | © 2026 Jia-Ethan | Retained; problem-fit and project-maturity ranking rubric. |

## ODIN-only-gap skills (not Matt-derived)

The following skills are authored by ODIN and do not carry upstream attribution: `debug`, `security-review`, `deps-upgrade`. They are governed by the ODIN project license, not MIT.

## addyosmani agent-skills ports

Skills cherry-picked from the `agent-skills` plugin (https://github.com/addyosmani/agent-skills). Upstream is MIT (© 2026 Addy Osmani). ODIN adaptations — frontmatter normalized; cross-skill references removed for standalone use; referenced checklists relocated into each skill's own `references/`; ODIN voice and ≥2-language-family example generalization applied to the distinct-angle skills; broken `/mnt/skills/...` paths made relative — are made under the same MIT terms. License text is the standard MIT reproduced below; only the copyright holder differs (© 2026 Addy Osmani).

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `~~api-and-interface-design/SKILL.md~~` | https://github.com/addyosmani/agent-skills/tree/main/skills/api-and-interface-design | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `~~api-design/SKILL.md~~` | https://github.com/addyosmani/agent-skills/tree/main/skills/api-and-interface-design | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. Removed from the plugin; superseded by `codebase-design`. |
| `~~api-design/references/rest-patterns.md~~` | https://github.com/addyosmani/agent-skills/tree/main/skills/api-and-interface-design | MIT | © 2026 Addy Osmani | Extracted verbatim from `api-design/SKILL.md` in the router/reference split; headings dedented one level. Removed from the plugin; superseded by `codebase-design`. |
| `~~api-design/references/typescript-patterns.md~~` | https://github.com/addyosmani/agent-skills/tree/main/skills/api-and-interface-design | MIT | © 2026 Addy Osmani | Extracted verbatim from `api-design/SKILL.md` in the router/reference split; headings dedented one level. Removed from the plugin; superseded by `codebase-design`. |
| `browser-testing/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/browser-testing-with-devtools | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `browser-testing/references/accessibility.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/browser-testing-with-devtools | MIT | © 2026 Addy Osmani | Extracted verbatim from `browser-testing/SKILL.md` in the router/reference split; headings dedented one level. |
| `browser-testing/references/debugging-workflows.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/browser-testing-with-devtools | MIT | © 2026 Addy Osmani | Extracted verbatim from `browser-testing/SKILL.md` in the router/reference split; three symptom-specific subsections bundled into one file; headings dedented one level. |
| `browser-testing/references/test-plans.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/browser-testing-with-devtools | MIT | © 2026 Addy Osmani | Extracted verbatim from `browser-testing/SKILL.md` in the router/reference split; headings dedented one level (fenced-example headings inside the code block left unchanged). |
| `ci-cd/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/ci-cd-and-automation | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `ci-cd/references/github-actions.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/ci-cd-and-automation | MIT | © 2026 Addy Osmani | Extracted verbatim from `ci-cd/SKILL.md` in the router/reference split; headings dedented one level. |
| `ci-cd/references/deployment-strategies.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/ci-cd-and-automation | MIT | © 2026 Addy Osmani | Extracted verbatim from `ci-cd/SKILL.md` in the router/reference split; headings dedented one level. |
| `ci-cd/references/automation-and-environments.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/ci-cd-and-automation | MIT | © 2026 Addy Osmani | Extracted from `ci-cd/SKILL.md` in the router/reference split; two sibling sections merged under a new title; `Build Cop Role` dropped. |
| `ci-cd/references/ci-optimization.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/ci-cd-and-automation | MIT | © 2026 Addy Osmani | Extracted verbatim from `ci-cd/SKILL.md` in the router/reference split; headings dedented one level. |
| `ci-cd/references/ci-failure-feedback-loop.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/ci-cd-and-automation | MIT | © 2026 Addy Osmani | Extracted verbatim from `ci-cd/SKILL.md` in the router/reference split; headings dedented one level. |
| `docs-and-adrs/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/documentation-and-adrs | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `docs-and-adrs/references/adrs.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/documentation-and-adrs | MIT | © 2026 Addy Osmani | Extracted verbatim from `docs-and-adrs/SKILL.md` in the router/reference split; headings dedented one level. |
| `docs-and-adrs/references/api-documentation.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/documentation-and-adrs | MIT | © 2026 Addy Osmani | Extracted verbatim from `docs-and-adrs/SKILL.md` in the router/reference split; headings dedented one level. |
| `docs-and-adrs/references/changelog.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/documentation-and-adrs | MIT | © 2026 Addy Osmani | Extracted verbatim from `docs-and-adrs/SKILL.md` in the router/reference split; headings dedented one level. |
| `docs-and-adrs/references/inline-comments.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/documentation-and-adrs | MIT | © 2026 Addy Osmani | Extracted verbatim from `docs-and-adrs/SKILL.md` in the router/reference split; headings dedented one level. |
| `docs-and-adrs/references/readme-structure.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/documentation-and-adrs | MIT | © 2026 Addy Osmani | Extracted verbatim from `docs-and-adrs/SKILL.md` in the router/reference split; headings dedented one level. |
| `observability/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/observability-and-instrumentation | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `observability/references/observability-checklist.md` | https://github.com/addyosmani/agent-skills/tree/main/references/observability-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `shipping/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/shipping-and-launch | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `shipping/references/accessibility-checklist.md` | https://github.com/addyosmani/agent-skills/tree/main/references/accessibility-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `shipping/references/performance-checklist.md` | https://github.com/addyosmani/agent-skills/tree/main/references/performance-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `shipping/references/security-checklist.md` | https://github.com/addyosmani/agent-skills/tree/main/references/security-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `shipping/references/feature-flags.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/shipping-and-launch | MIT | © 2026 Addy Osmani | Extracted verbatim from `shipping/SKILL.md`'s "Feature Flag Strategy" section in the router/reference split; heading dedented one level. |
| `deprecate-and-migrate/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/deprecation-and-migration | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `deprecate-and-migrate/references/migration-patterns.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/deprecation-and-migration | MIT | © 2026 Addy Osmani | Extracted verbatim from `deprecate-and-migrate/SKILL.md` in the router/reference split; headings dedented one level. |
| `doubt-driven/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/doubt-driven-development | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `doubt-driven/references/orchestration-patterns.md` | https://github.com/addyosmani/agent-skills/tree/main/references/orchestration-patterns.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `doubt-driven/references/cross-model-invocation.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/doubt-driven-development | MIT | © 2026 Addy Osmani | Extracted verbatim from `doubt-driven/SKILL.md` in the router/reference split; source used a bold-text step label rather than a markdown heading, promoted to an H1 title (no dedent applicable). |
| `frontend-ui/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/frontend-ui-engineering | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `frontend-ui/references/accessibility-checklist.md` | https://github.com/addyosmani/agent-skills/tree/main/references/accessibility-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `frontend-ui/references/component-architecture.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/frontend-ui-engineering | MIT | © 2026 Addy Osmani | Extracted verbatim from `frontend-ui/SKILL.md` in the router/reference split; headings dedented one level. |
| `frontend-ui/references/design-system.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/frontend-ui-engineering | MIT | © 2026 Addy Osmani | Extracted verbatim from `frontend-ui/SKILL.md` in the router/reference split; headings dedented and given a title. |
| `frontend-ui/references/accessibility-patterns.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/frontend-ui-engineering | MIT | © 2026 Addy Osmani | Extracted verbatim from `frontend-ui/SKILL.md` in the router/reference split; headings dedented and given a title. |
| `frontend-ui/references/responsive-and-loading.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/frontend-ui-engineering | MIT | © 2026 Addy Osmani | Extracted verbatim from `frontend-ui/SKILL.md` in the router/reference split; two sibling sections merged under a new title. |
| `frontend-ui/references/state-management.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/frontend-ui-engineering | MIT | © 2026 Addy Osmani | Extracted verbatim from `frontend-ui/SKILL.md` in the router/reference split; heading dedented one level. |
| `incremental/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/incremental-implementation | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `incremental/references/feature-flags.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/incremental-implementation | MIT | © 2026 Addy Osmani | Extracted verbatim from `incremental/SKILL.md` in the router/reference split; examples and their closing rationale only (enumerated `### Rule 3` heading and its lead rule sentence kept inline to preserve the Rule 0–5 sequence). |
| `incremental/references/slicing-strategies.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/incremental-implementation | MIT | © 2026 Addy Osmani | Extracted verbatim from `incremental/SKILL.md` in the router/reference split; headings dedented one level, no top-level title added. |
| `security-hardening/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/security-and-hardening | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `security-hardening/references/security-checklist.md` | https://github.com/addyosmani/agent-skills/tree/main/references/security-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed; CORS checkbox restored from the skill's inline checklist. |
| `security-hardening/references/owasp-patterns.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/security-and-hardening | MIT | © 2026 Addy Osmani | Extracted verbatim from `security-hardening/SKILL.md` in the router/reference split; headings dedented one level. |
| `security-hardening/references/input-validation.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/security-and-hardening | MIT | © 2026 Addy Osmani | Extracted verbatim from `security-hardening/SKILL.md` in the router/reference split; headings dedented one level. |
| `security-hardening/references/dependency-audit.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/security-and-hardening | MIT | © 2026 Addy Osmani | Extracted verbatim from `security-hardening/SKILL.md` in the router/reference split; headings dedented one level. |
| `security-hardening/references/operational-controls.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/security-and-hardening | MIT | © 2026 Addy Osmani | Extracted verbatim from `security-hardening/SKILL.md` in the router/reference split; two sibling sections merged under a new title. |
| `security-hardening/references/llm-security.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/security-and-hardening | MIT | © 2026 Addy Osmani | Extracted verbatim from `security-hardening/SKILL.md` in the router/reference split; headings dedented one level. |
| `source-driven/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/source-driven-development | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `source-driven/references/stack-examples.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/source-driven-development | MIT | © 2026 Addy Osmani | Extracted verbatim: the per-step stack-specific illustration blocks (Steps 1–4) from `source-driven/SKILL.md` in the router/reference split, grouped under added organizational headings; the Step 3 lead-in `**When the docs conflict with existing project code:**` was copied rather than moved, and remains live in `source-driven/SKILL.md`; no heading dedent needed (blocks carried no headings of their own). |
| `spec-driven/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/spec-driven-development | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `spec-driven/references/domain-examples.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/spec-driven-development | MIT | © 2026 Addy Osmani | Extracted verbatim: the Commands/Project-structure/Reframe example pairs from `spec-driven/SKILL.md` Phase 1 in the router/reference split, grouped under added organizational headings; no heading dedent needed (blocks carried no headings of their own). |

## obra/superpowers port (subagent-driven)

`subagent-driven` was originally fused from obra's `subagent-driven-development` skill (https://github.com/obra/superpowers) with structural ideas from the `compound-engineering` plugin's `ce-subagent-driven` skill, rewritten in ODIN/Linus voice; a later pass restyled the skill back toward upstream's leaner section set, keeping parallel-when-independent as a first-class path upstream itself forbids. obra/superpowers is MIT (© 2025 Jesse Vincent). ODIN adaptations — workspace `.superpowers/sdd` → `.outline/sdd`; `sdd-workspace` → `sd-workspace`; reviewer dispatched as a fresh tailored subagent with a local `task-reviewer-prompt.md` (no external named-agent dependency); obra's branch-finishing / code-review-request refs replaced with the ODIN commit-push ship path — are made under the same MIT terms. The three bash scripts keep upstream's logic verbatim except the workspace retarget. License text is the standard MIT reproduced below; only the copyright holder differs (© 2025 Jesse Vincent).

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `subagent-driven/SKILL.md` | https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development | MIT | © 2025 Jesse Vincent | Per-task implementer→reviewer loop fused with `ce-subagent-driven` dispatch-brief/parallel/tree-clean/validation-gate; ODIN voice adaptations. |
| `subagent-driven/implementer-prompt.md` | https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development | MIT | © 2025 Jesse Vincent | Implementer contract ported; four statuses preserved; ODIN voice + self-review adaptations. |
| `subagent-driven/task-reviewer-prompt.md` | https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development | MIT | © 2025 Jesse Vincent | Reviewer contract ported; the audit gate. Dispatched to a fresh tailored subagent. |
| `subagent-driven/scripts/review-package` | https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development | MIT | © 2025 Jesse Vincent | Logic verbatim; default OUTFILE repointed to `.outline/sdd` via `sd-workspace`. |
| `subagent-driven/scripts/task-brief` | https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development | MIT | © 2025 Jesse Vincent | Logic verbatim; default OUTFILE repointed to `.outline/sdd` via `sd-workspace`. |
| `subagent-driven/scripts/sd-workspace` | https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development | MIT | © 2025 Jesse Vincent | `sdd-workspace` renamed; `.superpowers/sdd` → `.outline/sdd`; self-ignoring `.gitignore` mechanism preserved. |
| `subagent-driven/references/parallel-dispatch.md` | https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development | MIT | © 2025 Jesse Vincent | Extracted from `subagent-driven/SKILL.md`'s Parallel Dispatch and Red Flags sections in the router/reference split; headings dedented one level (## → #); each original section kept as its own H1, none merged. |
| `subagent-driven/references/recovery.md` | https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development | MIT | © 2025 Jesse Vincent | Extracted verbatim from `subagent-driven/SKILL.md`'s Tree-Clean Recovery section in the router/reference split; headings dedented one level (## → #). |

## EveryInc compound-engineering port (autolearn)

`autolearn` is a trimmed port of the `compound-engineering-plugin` `ce-compound` skill (https://github.com/EveryInc/compound-engineering-plugin), fused with the reject-by-default lesson filter from the `agent-skills` learn skill (https://github.com/WhatIfWeDigDeeper/agent-skills). compound-engineering-plugin is MIT (© 2025 Every); agent-skills is MIT (© 2026 What If We Dig Deeper). ODIN adaptations — Rails-specific `component` enum + `rails_version` generalized to language-agnostic fields; multi-assistant config routing, Lightweight mode, session-history integration, and specialized ce reviewers dropped; the CONCEPTS.md shared-vocabulary capture + refresh loop grafted back in (see `references/concepts.md`); auto-memory writes delegated to the `memory-update` skill (single writer — `autolearn` never writes `memory/` or `MEMORY.md`); ODIN voice and `Op:` trailers — are made under the same MIT terms. License text is the standard MIT reproduced below; only the copyright holders differ (© 2025 Every; © 2026 What If We Dig Deeper).

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |

## EveryInc compound-engineering port (doc-review)

`doc-review` is a port of the `compound-engineering-plugin` `ce-doc-review` skill (https://github.com/EveryInc/compound-engineering-plugin), keeping the content-shape classification, conditional-persona selection, parallel read-only dispatch, confidence-anchored rubric, cross-persona-agreement merge, and the four-tier finding routing (safe-auto / gated-auto / manual / FYI). compound-engineering-plugin is MIT (© 2025 Every). ODIN adaptations — the reviewer is **read-only on the reviewed document** (CE edits the doc in place and auto-applies `safe_auto` fixes; ODIN records the tier as a recommendation and writes nothing to the reviewed doc); the sole write is an optional single review-record file, staged alone (never `git add -A`); the `design-lens` persona is folded into `product` (adoption / cognitive-load leg); the decision-primer, four-option interactive walk-through, bulk-preview, and synthesis-suppression machinery are dropped to the four-tier routing core; persona prompt files are trimmed to lens + reject criteria + confidence anchors; ODIN voice + `Op:` trailers — are made under the same MIT terms. License text is the standard MIT reproduced below; only the copyright holder differs (© 2025 Every).

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `doc-review/SKILL.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | `ce-doc-review` ported; read-only-on-reviewed-doc invariant (no in-place edits, no `safe_auto` auto-apply); optional single review-record staged alone; four-tier routing retained; ODIN voice. |
| `doc-review/references/personas/coherence.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | Internal-consistency lens; safe-auto candidate patterns + strawman-resistance retained; trimmed to lens + reject criteria + anchors. |
| `doc-review/references/personas/feasibility.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | Buildability lens; requirements-vs-plan calibration + shadow-path tracing retained; trimmed. |
| `doc-review/references/personas/product.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | Premise/strategy lens fused with the dropped `design-lens` (adoption / cognitive-load sub-lens); origin-gated suppression retained; trimmed. |
| `doc-review/references/personas/security.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | Plan-level threat-surface lens; attack-surface inventory + plan-level threat model retained; trimmed. |
| `doc-review/references/personas/scope-guardian.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | Right-sizing lens; "what already exists" + completeness principle retained; origin-gated suppression retained; trimmed. |
| `doc-review/references/personas/adversarial.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | Falsification lens; 5-technique protocol + depth calibration retained; origin-gated suppression retained; trimmed. |

## EveryInc compound-engineering port (ideate)

`ideate` is a port of the `compound-engineering-plugin` `ce-ideate` skill (https://github.com/EveryInc/compound-engineering-plugin), keeping the generate-many → critique-all → explain-survivors flow, the axis × frame divergence matrix, the reject-by-default gate, and the parallel read-only generator/critic dispatch. The opt-in HTML view is ported from the same plugin's `ce-plan` `html-rendering.md`. compound-engineering-plugin is MIT (© 2025 Every). ODIN adaptations — markdown is the always-written canonical surface and HTML is a derived opt-in view (CE defaults HTML); the tiered model fleet, surprise-me/go-deep depth overrides, scratch evidence dossiers, and post-ideation pipeline routing trimmed to the `askme` handoff; Reviewer-gated single-adjudication merge; ODIN voice — are made under the same MIT terms. License text is the standard MIT reproduced below; only the copyright holder differs (© 2025 Every).

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `ideate/SKILL.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | `ce-ideate` ported; generate→critique→survivor-rationale flow, axis × frame matrix, reject-by-default gate retained; markdown-default with opt-in HTML view; ODIN voice. |
| `ideate/references/ideation-method.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | Divergence matrix + verbatim generator/critic prompts + adjudicated output schema + markdown section structure. |
| `ideate/references/html-rendering.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | Ported from `ce-plan` `html-rendering.md`; trimmed to the ideate doc shape; HTML reframed as a derived view of the canonical markdown (markdown stays source of truth). |

## EveryInc compound-engineering port (strategy)

`strategy` is a port of the `compound-engineering-plugin` `ce-strategy` skill (https://github.com/EveryInc/compound-engineering-plugin) — an interview-driven STRATEGY.md generator routed by file state (new vs update vs section-revisit). compound-engineering-plugin is MIT (© 2025 Every). ODIN adaptations — a VS preamble pins intent before the interview; reject-by-default pushback replaces transcription of weak answers; the trigger evaluates while the gate decides whether to write; gated auto-commit stages only `STRATEGY.md` (never `git add -A`); ODIN voice — are made under the same MIT terms.

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `strategy/SKILL.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | `ce-strategy` ported; VS preamble + reject-by-default pushback + resume-in-place; gated auto-commit of `STRATEGY.md` only; ODIN voice. |
| `strategy/references/interview.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | Interview question bank/flow; language-agnostic; ODIN voice. |
| `strategy/assets/strategy-template.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | `STRATEGY.md` section skeleton (target problem, approach, persona, metrics, tracks, milestones, non-goals, marketing). |

## EveryInc compound-engineering port (autopilot)

`autopilot` is an ODIN-renamed port of the `compound-engineering-plugin` `lfg` skill (https://github.com/EveryInc/compound-engineering-plugin) — a hands-off end-to-end delivery pipeline. compound-engineering-plugin is MIT (© 2025 Every). ODIN adaptations — entry is execution-only, gated on a precondition that an approved plan already exists; it chains existing ODIN skills (work → simplify → review → fix → commit-push → gh-fix-ci → report) and never reimplements them; greenfield strategy/ideation chaining is excluded; gated phase sequencing with an autofix-then-halt posture; local-only mode when no remote; ODIN voice — are made under the same MIT terms.

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `autopilot/SKILL.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | `lfg` ported and renamed; execution-only chaining of existing ODIN skills; autofix-then-halt phase gates; local-only fallback; ODIN voice. |
| `autopilot/references/pipeline-gates.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | Per-phase gate definitions + the autofix-then-halt state machine. |

## EveryInc compound-engineering grafts (review / plan / optimize enhancements)

Three existing ODIN skills gained opt-in capabilities grafted from `compound-engineering-plugin` (https://github.com/EveryInc/compound-engineering-plugin); their original ODIN-authored cores are unchanged and are not MIT-derived. compound-engineering-plugin is MIT (© 2025 Every). Each row covers **only the grafted addition** named in its provenance. ODIN adaptations — `review`: single-pass base preserved as the floor, deep mode a strict superset (no Sever), gated risk-escalation with a `mode:shallow`/`mode:fast` pin, read-only routing to `fix`/`review-fix-grill-loop`, P0-P3 by observable behavioral impact; `optimize`: log/recovery/stopping-rules wrap the existing benchmark loop without removing a phase; ODIN voice — are made under the same MIT terms.

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `review/SKILL.md` (deep-mode addition only) | https://github.com/EveryInc/compound-engineering-plugin `ce-code-review` | MIT | © 2025 Every | Opt-in deep multi-persona mode, confidence-anchored severity, action-class routing grafted onto the ODIN single-pass review; single-pass base is ODIN-original. |
| `review/references/personas/*.md` (`_contract` + 7 lenses) | https://github.com/EveryInc/compound-engineering-plugin `ce-code-review` | MIT | © 2025 Every | Shared output/severity/action-class contract + correctness/testing/maintainability/security/performance/api-contract/adversarial lens prompts. |
| `~~plan/SKILL.md~~` (artifact + grounding addition only) | https://github.com/EveryInc/compound-engineering-plugin `ce-plan` | MIT | © 2025 Every | Opt-in `docs/plans/<slug>.md` implementation-unit artifact + opt-in STRATEGY.md grounding grafted onto the ODIN read-only planner; base is ODIN-original. |
| `optimize/SKILL.md` (persistence + stopping-rules addition only) | https://github.com/EveryInc/compound-engineering-plugin `ce-optimize` | MIT | © 2025 Every | Disk-first append-only experiment log + crash-recovery markers + stopping rules grafted onto the ODIN benchmark loop; base is ODIN-original. |

## EveryInc compound-engineering port (CE-to-ODIN adaptation)

Skills adapted from the `compound-engineering-plugin` (https://github.com/EveryInc/compound-engineering-plugin). compound-engineering-plugin is MIT (© 2025 Every). ODIN adaptations — ODIN voice, CE branding removed, cross-skill references rewritten, temp paths and artifact identifiers ODIN-branded — are made under the same MIT terms.

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `brainstorm/SKILL.md` | `ce-brainstorm` | MIT | © 2025 Every | ODIN voice; CE branding removed; repo-profiling and visual-probe agents adapted. |
| `brainstorm/references/` | `ce-brainstorm/references/` | MIT | © 2025 Every | Reference docs adapted to ODIN voice. |
| `brainstorm/scripts/` | `ce-brainstorm/scripts/` | MIT | © 2025 Every | Helper scripts adapted; temp paths ODIN-branded. |
| `pov/SKILL.md` | `ce-pov` | MIT | © 2025 Every | ODIN voice; CE branding removed; technology-decision verdict workflow adapted. |
| `pov/references/` | `ce-pov/references/` | MIT | © 2025 Every | Reference docs adapted to ODIN voice. |
| `work/SKILL.md` | `ce-work` | MIT | © 2025 Every | ODIN voice; CE branding removed; plan-execution engine adapted. |
| `work/references/` | `ce-work/references/` | MIT | © 2025 Every | Reference docs adapted to ODIN voice. |
| `work/references/parallel-dispatch.md` | `ce-work` | MIT | © 2025 Every | Extracted byte-for-byte (including original 3-space list-nesting indentation) from `work/SKILL.md`'s Parallel Safety Check and After-a-parallel-batch passages (Phase 1 step 4) in the router/reference split; no heading markers existed in source (bold lead-ins inside a numbered list item), so no dedent was applicable and none was applied. |
| `worktree/SKILL.md` | `ce-worktree` | MIT | © 2025 Every | ODIN voice; harness-native EnterWorktree semantics. |
| `worktree/references/git-fallback.md` | `ce-worktree` | MIT | © 2025 Every | Extracted verbatim from `worktree/SKILL.md`'s Step 2: Git fallback, Other worktree operations, and Troubleshooting sections (non-contiguous in the source) in the router/reference split; headings dedented one level (## → #). |
| `commit/SKILL.md` | `ce-commit` | MIT | © 2025 Every | ODIN voice; commit-message generation only. |
| `commit-push-pr/SKILL.md` | `ce-commit-push-pr` | MIT | © 2025 Every | ODIN voice; branch/PR description flow adapted. |
| `commit-push-pr/references/` | `ce-commit-push-pr/references/` | MIT | © 2025 Every | Reference docs adapted to ODIN voice. |
| `resolve-pr-feedback/SKILL.md` | `ce-resolve-pr-feedback` | MIT | © 2025 Every | ODIN voice; judge/fix/reply/resolve loop adapted. |
| `resolve-pr-feedback/references/` | `ce-resolve-pr-feedback/references/` | MIT | © 2025 Every | Reference docs adapted to ODIN voice. |
| `resolve-pr-feedback/scripts/` | `ce-resolve-pr-feedback/scripts/` | MIT | © 2025 Every | GraphQL scripts adapted; executable modes set. |
| `compound/SKILL.md` | `ce-compound` | MIT | © 2025 Every | Minimal schema-only port; session-history agents dropped; refresh workflow in autolearn. |
| `compound/references/` | `ce-compound/references/` | MIT | © 2025 Every | Schema and concept-entry docs adapted. |
| `compound/assets/` | `ce-compound/assets/` | MIT | © 2025 Every | Solution template adapted. |
| `compound/scripts/` | `ce-compound/scripts/` | MIT | © 2025 Every | Frontmatter validator adapted. |
| `review/references/personas/learnings-researcher.md` | `ce-code-review/references/personas/learnings-researcher.md` | MIT | © 2025 Every | Persona adapted to ODIN review contract. |
| `review/references/personas/previous-comments-reviewer.md` | `ce-code-review/references/personas/previous-comments-reviewer.md` | MIT | © 2025 Every | Persona adapted to ODIN review contract. |
| `review/references/personas/data-migration-reviewer.md` | `ce-code-review/references/personas/data-migration-reviewer.md` | MIT | © 2025 Every | Persona adapted to ODIN review contract. |
| `review/references/personas/reliability-reviewer.md` | `ce-code-review/references/personas/reliability-reviewer.md` | MIT | © 2025 Every | Persona adapted to ODIN review contract. |
| `review/references/personas/deployment-verification.md` | `ce-code-review/references/personas/deployment-verification-agent.md` | MIT | © 2025 Every | Persona adapted to ODIN review contract. |
| `review/references/personas/project-standards.md` | `ce-code-review/references/personas/project-standards-reviewer.md` | MIT | © 2025 Every | Persona adapted to ODIN review contract. |
| `review/references/action-class-rubric.md` | `ce-code-review/references/action-class-rubric.md` | MIT | © 2025 Every | Routing criteria adapted. |
| `review/references/diff-scope.md` | `ce-code-review/references/diff-scope.md` | MIT | © 2025 Every | Scope rules adapted. |
| `review/references/findings-schema.json` | `ce-code-review/references/findings-schema.json` | MIT | © 2025 Every | JSON schema adapted. |
| `review/references/review-output-template.md` | `ce-code-review/references/review-output-template.md` | MIT | © 2025 Every | Output template adapted. |
| `review/references/subagent-template.md` | `ce-code-review/references/subagent-template.md` | MIT | © 2025 Every | Subagent template adapted. |
| `review/references/validator-template.md` | `ce-code-review/references/validator-template.md` | MIT | © 2025 Every | Validator template adapted. |
| `debug/references/anti-patterns.md` | `ce-debug/references/` | MIT | © 2025 Every | Anti-patterns adapted to ODIN voice. |
| `debug/references/defense-in-depth.md` | `ce-debug/references/` | MIT | © 2025 Every | Defense-in-depth adapted to ODIN voice. |
| `debug/references/investigation-techniques.md` | `ce-debug/references/` | MIT | © 2025 Every | Investigation techniques adapted to ODIN voice. |
| `doc-review/references/bulk-preview.md` | `ce-doc-review/references/` | MIT | © 2025 Every | Bulk-preview adapted to ODIN voice. |
| `doc-review/references/open-questions-defer.md` | `ce-doc-review/references/` | MIT | © 2025 Every | Open-questions deferral adapted. |
| `doc-review/references/walkthrough.md` | `ce-doc-review/references/` | MIT | © 2025 Every | Walkthrough adapted to ODIN voice. |
| `doc-review/references/synthesis-and-presentation.md` | `ce-doc-review/references/` | MIT | © 2025 Every | Synthesis adapted to ODIN voice. |
| `doc-review/references/findings-schema.json` | `ce-doc-review/references/` | MIT | © 2025 Every | JSON schema adapted. |
| `doc-review/references/review-output-template.md` | `ce-doc-review/references/` | MIT | © 2025 Every | Output template adapted. |
| `doc-review/references/subagent-template.md` | `ce-doc-review/references/` | MIT | © 2025 Every | Subagent template adapted. |
| `ideate/references/divergent-ideation.md` | `ce-ideate/references/` | MIT | © 2025 Every | Divergent-ideation matrix adapted. |
| `ideate/references/ideation-sections.md` | `ce-ideate/references/` | MIT | © 2025 Every | Ideation sections adapted. |
| `ideate/references/post-ideation-workflow.md` | `ce-ideate/references/` | MIT | © 2025 Every | Post-ideation workflow adapted. |
| `ideate/references/web-research-cache.md` | `ce-ideate/references/` | MIT | © 2025 Every | Web-research cache adapted. |
| `optimize/references/experiment-mode.md` | `ce-optimize/references/` | MIT | © 2025 Every | Metric-driven experiment heuristics adapted. |
| `~~plans/references/approach-altitude.md~~` | `ce-plan/references/` | MIT | © 2025 Every | Approach-altitude adapted. |
| `~~plans/references/deepening-workflow.md~~` | `ce-plan/references/` | MIT | © 2025 Every | Deepening workflow adapted. |
| `~~plans/references/plan-handoff.md~~` | `ce-plan/references/` | MIT | © 2025 Every | Plan handoff adapted. |
| `~~plans/references/plan-sections.md~~` | `ce-plan/references/` | MIT | © 2025 Every | Plan sections adapted. |
| `~~plans/references/synthesis-summary.md~~` | `ce-plan/references/` | MIT | © 2025 Every | Synthesis summary adapted. |
| `~~plans/references/universal-planning.md~~` | `ce-plan/references/` | MIT | © 2025 Every | Universal planning adapted. |
| `simplify/references/quality.md` | `ce-simplify-code/references/` | MIT | © 2025 Every | Quality checks adapted. Language-agnostic generalization: the JSX-only nesting pattern regeneralized to redundant structural nesting (finding-enum value renamed accordingly), the C-family ternary detector restated as conditional nesting depth, and the five-ecosystem linter list replaced by a manifest-detection ladder. |
| `simplify/references/reuse.md` | `ce-simplify-code/references/` | MIT | © 2025 Every | Reuse checks adapted. Language-agnostic generalization: TypeScript-specific "type guards" restated as the language's narrowing construct with instances across families. |

## humanlayer/skills port (show-me)

`show-me` is a port of the `show-me` skill from the humanlayer skills marketplace (https://github.com/humanlayer/skills). Upstream is MIT (© 2026 HumanLayer). ODIN adaptations — the view catalogue restated as a routing table under an explicit smallest-view rule; product-specific example labels replaced with neutral ones and the example set spread across two language families; the HTML-artifact branch and its `Bash(open …)` launch removed for the headless mandate, with the layout and clickable cases routed to `diagram-contract` and `prototype-logic`; the concept-teaching case fenced off to `explain-concept`; em-dash emphasis removed — are made under the same MIT terms. License text is the standard MIT reproduced below; only the copyright holder differs (© 2026 HumanLayer).

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `show-me/SKILL.md` | https://github.com/humanlayer/skills/tree/main/plugins/show-me/skills/show-me | MIT | © 2026 HumanLayer | ODIN voice; view catalogue restated as a routing table; examples de-branded across two language families; the HTML `open` branch removed for the headless mandate and rerouted; scope fenced against `explain-concept`, `diagram-contract`, and `prototype-logic`; `"show me"` trigger taken over from `explain-concept`. |

## cursor/plugins pstack port (why, unslop)

`why` and `unslop` are ports of the `pstack/skills/why` and `pstack/skills/unslop` skills from https://github.com/cursor/plugins (subtree `pstack/`, ref `main`, pinned commit `63d938c2e4a165a0fec1bd0f61a8e325f0cb751e`). Upstream is MIT at `pstack/LICENSE` — note the repository ROOT has no LICENSE file; the license lives in the `pstack/` subtree, so a reader checking the repository root will find nothing. Copyright: `Copyright (c) 2026 Lauren Tan`. ODIN adaptations — `why/SKILL.md`: Cursor subagent spawning (`subagent_type: generalPurpose`) rewritten for this harness's `task` tool with `scout` investigators; Cursor `mcps/` directory discovery rewritten for `xd://mcp__*` device routes; references to a companion `how` skill retargeted to the local `contexts` skill, which has no upstream counterpart here. `unslop/SKILL.md`: the em-dash pattern narrowed from a blanket ban to overuse, and five entries (`surface`, `harness`, `scaffolding`, `primitive`, `gold-plating`) removed from the abstract-noun ban list because all five are load-bearing vocabulary in this repo's own doctrine; the upstream `Must always apply` always-on description replaced with a trigger-shaped one. The 12 `why/references/**` files port verbatim. License text is the standard MIT reproduced below; only the copyright holder differs (© 2026 Lauren Tan).

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `why/SKILL.md` | `pstack/skills/why/SKILL.md` | MIT | © 2026 Lauren Tan | ODIN adaptations listed above; Cursor subagent/mcp routing and `how`-skill retarget. |
| `why/references/epistemics.md` | `pstack/skills/why/references/epistemics.md` | MIT | © 2026 Lauren Tan | Ported verbatim. |
| `why/references/investigator-prompt.md` | `pstack/skills/why/references/investigator-prompt.md` | MIT | © 2026 Lauren Tan | Ported verbatim. |
| `why/references/source-playbook.md` | `pstack/skills/why/references/source-playbook.md` | MIT | © 2026 Lauren Tan | Ported verbatim. |
| `why/references/synthesizer-prompt.md` | `pstack/skills/why/references/synthesizer-prompt.md` | MIT | © 2026 Lauren Tan | Ported verbatim. |
| `why/references/sources/code-archaeology.md` | `pstack/skills/why/references/sources/code-archaeology.md` | MIT | © 2026 Lauren Tan | Ported verbatim. |
| `why/references/sources/databricks.md` | `pstack/skills/why/references/sources/databricks.md` | MIT | © 2026 Lauren Tan | Ported verbatim. |
| `why/references/sources/datadog.md` | `pstack/skills/why/references/sources/datadog.md` | MIT | © 2026 Lauren Tan | Ported verbatim. |
| `why/references/sources/incident-postmortem.md` | `pstack/skills/why/references/sources/incident-postmortem.md` | MIT | © 2026 Lauren Tan | Ported verbatim. |
| `why/references/sources/linear.md` | `pstack/skills/why/references/sources/linear.md` | MIT | © 2026 Lauren Tan | Ported verbatim. |
| `why/references/sources/notion.md` | `pstack/skills/why/references/sources/notion.md` | MIT | © 2026 Lauren Tan | Ported verbatim. |
| `why/references/sources/sentry.md` | `pstack/skills/why/references/sources/sentry.md` | MIT | © 2026 Lauren Tan | Ported verbatim. |
| `why/references/sources/slack.md` | `pstack/skills/why/references/sources/slack.md` | MIT | © 2026 Lauren Tan | Ported verbatim. |

## Leonxlnx unlazy port

`unlazy` is a port of https://github.com/Leonxlnx/unlazy (ref `main`, pinned commit `ed9e8d2b5919698cf2c54bda270d507e10b69617`). Upstream is MIT, `Copyright (c) 2026 Leonxlnx`. ODIN adaptations, made under the same MIT terms — full structural re-derive in ODIN voice: upstream's four references collapsed to two (`method.md` merges upstream `method.md` + `orchestration.md`; `gates.md` merges the format spec and writing guide); upstream's three templates (`PLAN.md`, `gates-leaf.md`, `gates-node.md`) consolidated into one `templates/gates.md`; `token-economy.md` dropped as a file with its operative advice distilled into the method reference; the Claude Code Stop-hook machinery (`stop-hook.mjs`, `install-hooks.mjs`) not carried because it mutates user settings, with SKILL.md noting upstream offers it; all research citations dropped; the trigger description reworded to compose with the local `work`/`incremental`/`subagent-driven` skills. `scripts/gate_check.py` is a Python re-implementation of upstream `scripts/gate-check.mjs`: behavior-preserving CLI and gate semantics, with JS `/regex/` EXPECT flags mapped to Python `re`; the upstream bug that dropped the first file argument when `--timeout` was absent does not carry over; and the default gate-file locations move from the working directory root to `.outline/`. License text is the standard MIT reproduced below; only the copyright holder differs (© 2026 Leonxlnx).

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `unlazy/SKILL.md` | `SKILL.md` | MIT | © 2026 Leonxlnx | ODIN-voice re-derive; adaptations listed above. |
| `unlazy/references/method.md` | `references/method.md` + `references/orchestration.md` | MIT | © 2026 Leonxlnx | Two upstream references merged; token-economy advice distilled in. |
| `unlazy/references/gates.md` | `references/gates.md` | MIT | © 2026 Leonxlnx | Format spec and writing guide merged; ODIN voice. |
| `unlazy/templates/gates.md` | `templates/PLAN.md` + `templates/gates-leaf.md` + `templates/gates-node.md` | MIT | © 2026 Leonxlnx | Three templates consolidated into one file; upstream path references adjusted. |
| `unlazy/scripts/gate_check.py` | `scripts/gate-check.mjs` | MIT | © 2026 Leonxlnx | Python re-implementation; CLI and gate semantics preserved; defaults moved to `.outline/`. |

## LilMGenius/paperthin port

15 skills and one shared reference ported from https://github.com/LilMGenius/paperthin (ref `main`, pinned commit `3bca079a51bcfff5dafb53d1d7f9f523d66ee317`). Upstream is MIT, `Copyright (c) 2026 LilMGenius`. 7 upstream mechanisms grafted into 6 existing ODIN skills rather than shipped standalone; 6 upstream skills not carried because ODIN already covers them or they are specific to upstream's install path. ODIN adaptations, made under the same MIT terms — region taxonomy (`depth`/`breadth`/`coil`/`mesh`) flattened into ODIN's single flat `skills/` namespace; body skeleton (`## Goal`/`## Workflow`/`## Rules`/`## Verification`) re-derived into `## Method`/`## Completion`; 13 opaque upstream names renamed under the hybrid naming rule (real words kept, compressions described); four inline idioms reduced to one shared reference (`clean-and-true/references/idioms.md`) plus one inline criterion; `nba`'s package-specific phase vocabulary generalized to the reconciled task list; `sip`'s chain rewired to ODIN skill names; per-skill emoji and em-dash emphasis removed. No ported body carries verbatim substrate vendored from `mattpocock/skills` that upstream credits in its NOTICE. License text is the standard MIT reproduced below; only the copyright holder differs (© 2026 LilMGenius).

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
|---|---|---|---|---|
| `rewrite-clean-v0/SKILL.md` | https://github.com/LilMGenius/paperthin/tree/main/skills/depth/re0 | MIT | © 2026 LilMGenius | Renamed from `re0`; re-derived into `## Method`/`## Completion`; idiom via `clean-and-true/references/idioms.md`. |
| `size-the-run/SKILL.md` | https://github.com/LilMGenius/paperthin/tree/main/skills/depth/modelchk | MIT | © 2026 LilMGenius | Renamed from `modelchk`; tier and effort re-derived; machine-readable output kept. |
| `hate/SKILL.md` | https://github.com/LilMGenius/paperthin/tree/main/skills/depth/hate | MIT | © 2026 LilMGenius | Name kept; re-derived. |
| `fan-out-fresh-reads/SKILL.md` | https://github.com/LilMGenius/paperthin/tree/main/skills/depth/macrothink | MIT | © 2026 LilMGenius | Renamed from `macrothink`; divergence-first reporting preserved. |
| `feynman/SKILL.md` | https://github.com/LilMGenius/paperthin/tree/main/skills/depth/feynman | MIT | © 2026 LilMGenius | Name kept; clean-room critic preserved. |
| `autobahn/SKILL.md` | https://github.com/LilMGenius/paperthin/tree/main/skills/depth/autobahn | MIT | © 2026 LilMGenius | Name kept; carve-guard-run-ledger re-derived. |
| `reorder/SKILL.md` | https://github.com/LilMGenius/paperthin/tree/main/skills/depth/reorder | MIT | © 2026 LilMGenius | Name kept; move-only re-derived. |
| `debloat/SKILL.md` | https://github.com/LilMGenius/paperthin/tree/main/skills/depth/debloat | MIT | © 2026 LilMGenius | Name kept; density pass re-derived. |
| `shower/SKILL.md` | https://github.com/LilMGenius/paperthin/tree/main/skills/depth/shower | MIT | © 2026 LilMGenius | Name kept; clean-room read preserved. |
| `verify-both-ways/SKILL.md` | https://github.com/LilMGenius/paperthin/tree/main/skills/depth/factchk | MIT | © 2026 LilMGenius | Renamed from `factchk`; both-directions verification preserved. |
| `mandela/SKILL.md` | https://github.com/LilMGenius/paperthin/tree/main/skills/depth/mandela | MIT | © 2026 LilMGenius | Name kept; 8-pattern taxonomy preserved. |
| `clean-and-true/SKILL.md` | https://github.com/LilMGenius/paperthin/tree/main/skills/depth/sip | MIT | © 2026 LilMGenius | Renamed from `sip` (avoids collision with `taste`); routing table re-derived to ODIN names. |
| `consolidate-to-one-home/SKILL.md` | https://github.com/LilMGenius/paperthin/tree/main/skills/breadth/ssotize | MIT | © 2026 LilMGenius | Renamed from `ssotize`; audit-then-approve preserved. |
| `restart-keeping-lessons/SKILL.md` | https://github.com/LilMGenius/paperthin/tree/main/skills/coil/re0-work | MIT | © 2026 LilMGenius | Renamed from `re0-work`; keep-discard re-derived. |
| `prism/SKILL.md` | https://github.com/LilMGenius/paperthin/tree/main/skills/mesh/prism | MIT | © 2026 LilMGenius | Name kept; lens convergence preserved. |
| `clean-and-true/references/idioms.md` | https://github.com/LilMGenius/paperthin/tree/main/skills (shared idioms across re0/reorder/debloat/ssotize etc.) | MIT | © 2026 LilMGenius | Extracted from four idioms duplicated inline upstream; three sections shared, restraint stays inline. |
| `clarify/SKILL.md` (restate addition only) | https://github.com/LilMGenius/paperthin/tree/main/skills/depth/readchk | MIT | © 2026 LilMGenius | Restate-the-read gate (step 1) and completion criterion (c) grafted onto the existing ODIN clarity scan; rest grafted into `## Method` head. |
| `generalize-from-cases/SKILL.md` (data-drop addition only) | https://github.com/LilMGenius/paperthin/tree/main/skills/depth/aim | MIT | © 2026 LilMGenius | Data-drop case type and emit-variant grafted onto the existing case-set/method; plan-mandated trigger phrase generalized from upstream `aim`. |
| `mutual-sync/SKILL.md` (cold-re-entry addition only) | https://github.com/LilMGenius/paperthin/tree/main/skills/coil/catchup | MIT | © 2026 LilMGenius | Cold re-entry entry situation grafted onto the existing two-situation workflow; vocabulary-inclusion carried. |
| `autolearn/SKILL.md` (failed-branch addition only) | https://github.com/LilMGenius/paperthin/tree/main/skills/coil/re0-memo | MIT | © 2026 LilMGenius | Finished-failure qualification of precondition 1 and trigger phrase grafted onto the existing compound gate. |
| `unslop/SKILL.md` (dedash + detool additions only) | https://github.com/LilMGenius/paperthin/tree/main/skills/depth/dedash + https://github.com/LilMGenius/paperthin/tree/main/skills/depth/detool | MIT | © 2026 LilMGenius | Per-occurrence dash replacement procedure and incidental-stack-noun portability section grafted onto the existing tell catalog. |
| `update-todos/SKILL.md` (next-action addition only) | https://github.com/LilMGenius/paperthin/tree/main/skills/coil/nba | MIT | © 2026 LilMGenius | Next-action single-answer section grafted onto the existing reconcile workflow; package-specific phase vocabulary generalized. |

## Full upstream license text (MIT)

```
MIT License

Copyright (c) 2026 Matt Pocock

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Maintenance notes

- New ports: add a row before merging the SKILL.md.
- Renamed paths: drop the old row once the new path's row carries the same upstream origin, license, and copyright; the successor row is the attribution of record.
- Removed ports: keep the row with a "removed" provenance note for audit trail.
- Struck rows are frozen audit records: keep the row and its provenance text as written, and do not maintain the inline cross-references inside it when the skills they name are later removed.
- Upstream relicensing: re-evaluate the entire registry; do not silently bump license fields.
