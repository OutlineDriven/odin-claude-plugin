# Third-Party Attribution Registry

Single source of attribution for skills and reference documents adapted from upstream open-source projects. Individual skill files do not carry per-file copyright headers — attribution is consolidated here so SKILL.md prose stays clean. The license terms apply to the original upstream content; ODIN-style adaptations (rewording, language-agnostic generalization, voice changes, structural reorganization) are made under the same license.

Upstream reference: https://github.com/mattpocock/skills (Matt Pocock).

## Skills

Each row covers the SKILL.md (and any skill-internal references the upstream skill ships) at the listed path.

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `domain-model/SKILL.md` | https://github.com/mattpocock/skills/tree/main/domain-model | MIT | © 2026 Matt Pocock | Adapted in ODIN voice; English-mandate; ODIN integration appendix added; reference paths rewritten to `references/`. |
| `ubiquitous-language/SKILL.md` | https://github.com/mattpocock/skills/tree/main/ubiquitous-language | MIT | © 2026 Matt Pocock | ODIN voice; modality disambiguation against `domain-model` and `askme`; `disable-model-invocation: true` preserved verbatim. |
| `grill-me/SKILL.md` | https://github.com/mattpocock/skills/tree/main/grill-me | MIT | © 2026 Matt Pocock | ODIN voice; explicit modality table vs `askme` and `domain-model`; banned-tooling references replaced with mandated alternatives; language-neutral examples. |
| `design-an-interface/SKILL.md` | https://github.com/mattpocock/skills/tree/main/design-an-interface | MIT | © 2026 Matt Pocock | ODIN voice; TypeScript interface examples regeneralized to ≥2 language families; "Design It Twice" framing preserved. |
| `~~improve-codebase-architecture/SKILL.md~~` | https://github.com/mattpocock/skills/tree/main/improve-codebase-architecture | MIT | © 2026 Matt Pocock | ODIN voice; cross-linked from `plan/SKILL.md` and `contexts/SKILL.md` per canonical-homes map. |
| `improve-architecture/SKILL.md` | https://github.com/mattpocock/skills/tree/main/improve-codebase-architecture | MIT | © 2026 Matt Pocock | ODIN voice; cross-linked from `plan/SKILL.md` and `contexts/SKILL.md` per canonical-homes map. |
| `zoom-out/SKILL.md` | https://github.com/mattpocock/skills/tree/main/zoom-out | MIT | © 2026 Matt Pocock | ODIN voice; `disable-model-invocation: true` preserved verbatim; aligned with `odin:duet` director pattern. |
| `caveman/SKILL.md` | https://github.com/mattpocock/skills/tree/main/caveman | MIT | © 2026 Matt Pocock | Caveman-adapted: grammar-fragmentation dropped; verbosity reduction preserved; English-mandate honored. |
| `write-a-skill/SKILL.md` | https://github.com/mattpocock/skills/tree/main/write-a-skill | MIT | © 2026 Matt Pocock | ODIN voice; scope disambiguation against `odin:init` and `skill-creator:skill-creator`; language-neutral framing. |
| `git-guardrails-claude-code/SKILL.md` | https://github.com/mattpocock/skills/tree/main/git-guardrails-claude-code | MIT | © 2026 Matt Pocock | ODIN voice; cross-harness installation note added; safety-critical hook script (see `hook.sh` row below). |
| `git-guardrails-claude-code/hook.sh` | https://github.com/mattpocock/skills/tree/main/git-guardrails-claude-code | MIT | © 2026 Matt Pocock | Bash hook script ported verbatim. Pattern list and exit-2 contract are upstream's; install path adapted for ODIN harness. |
| `to-prd/SKILL.md` | https://github.com/mattpocock/skills/tree/main/to-prd | MIT | © 2026 Matt Pocock | ODIN voice; flipped-row reconciliation: GitHub-issue emission abstracted to optional `--emit-issue` flag; default emits markdown PRD file. |
| `to-issues/SKILL.md` | https://github.com/mattpocock/skills/tree/main/to-issues | MIT | © 2026 Matt Pocock | ODIN voice; tracer-bullet vertical-slice framing preserved; emission modes (file vs `--emit-issue`) added. |
| `qa/SKILL.md` | https://github.com/mattpocock/skills/tree/main/qa | MIT | © 2026 Matt Pocock | ODIN voice; modality differentiation table vs `odin:review` and `odin:pr-review`. |
| `request-refactor-plan/SKILL.md` | https://github.com/mattpocock/skills/tree/main/request-refactor-plan | MIT | © 2026 Matt Pocock | ODIN voice; scope fence vs `odin:plan` and `odin:refactor-break-compat`; emission modes added. |
| `github-triage/SKILL.md` | https://github.com/mattpocock/skills/tree/main/github-triage | MIT | © 2026 Matt Pocock | ODIN voice; flipped-row reconciliation: hard-coded label names abstracted to a configurable label-map at the top of SKILL.md. |
| `github-triage/references/awaiting-info-template.md` | https://github.com/mattpocock/skills/tree/main/github-triage | MIT | © 2026 Matt Pocock | Extracted verbatim from `github-triage/SKILL.md` in the router/reference split; heading dedented one level. |
| `setup-pre-commit/SKILL.md` | https://github.com/mattpocock/skills/tree/main/setup-pre-commit | MIT | © 2026 Matt Pocock | ODIN voice; generalized from Husky+lint-staged to project's hook tool of choice (Husky, pre-commit, lefthook, cargo-husky, dune hooks). |
| `setup-pre-commit/references/hook-recipes.md` | https://github.com/mattpocock/skills/tree/main/setup-pre-commit | MIT | © 2026 Matt Pocock | Extracted verbatim from `setup-pre-commit/SKILL.md`'s "Per-ecosystem hook contents" section in the router/reference split; heading dedented one level. |
| `writing-skills/SKILL.md` | https://github.com/mattpocock/skills/tree/main/skills/productivity/writing-great-skills | MIT | © 2026 Matt Pocock | ODIN voice; renamed from upstream `writing-great-skills` (successor to the phantom flat-layout `write-a-skill` row above); `disable-model-invocation: true` preserved verbatim; disclosed reference link repointed to `references/`. |
| `writing-skills/references/GLOSSARY.md` | https://github.com/mattpocock/skills/blob/main/skills/productivity/writing-great-skills/GLOSSARY.md | MIT | © 2026 Matt Pocock | Disclosed glossary moved from sibling to `references/`; ODIN voice; self-references repointed to `writing-skills`/`../SKILL.md`. |

## Reference documents

Reference documents cross-linked across multiple skills per the canonical-homes map. The owner skill carries the `references/` subdirectory; consumer skills link via relative paths.

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `domain-model/references/ADR-FORMAT.md` | https://github.com/mattpocock/skills/blob/main/domain-model/ADR-FORMAT.md | MIT | © 2026 Matt Pocock | Language-agnostic ADR template; ODIN voice. |
| `domain-model/references/CONTEXT-FORMAT.md` | https://github.com/mattpocock/skills/blob/main/domain-model/CONTEXT-FORMAT.md | MIT | © 2026 Matt Pocock | Glossary entry format; ODIN voice; cross-linked from `contexts/SKILL.md`. |
| `~~improve-codebase-architecture/references/LANGUAGE.md~~` | https://github.com/mattpocock/skills/blob/main/improve-codebase-architecture/LANGUAGE.md | MIT | © 2026 Matt Pocock | Architecture vocabulary (module, seam, adapter, depth, leverage, locality); TS examples regeneralized to ≥2 language families; cross-linked from `plan/SKILL.md`. |
| `improve-architecture/references/LANGUAGE.md` | https://github.com/mattpocock/skills/blob/main/improve-codebase-architecture/LANGUAGE.md | MIT | © 2026 Matt Pocock | Architecture vocabulary (module, seam, adapter, depth, leverage, locality); TS examples regeneralized to ≥2 language families; cross-linked from `plan/SKILL.md`. |
| `~~improve-codebase-architecture/references/DEEPENING.md~~` | https://github.com/mattpocock/skills/blob/main/improve-codebase-architecture/DEEPENING.md | MIT | © 2026 Matt Pocock | Dependency taxonomy and seam discipline; TS examples regeneralized to ≥2 language families; cross-linked from `plan/SKILL.md`. |
| `improve-architecture/references/DEEPENING.md` | https://github.com/mattpocock/skills/blob/main/improve-codebase-architecture/DEEPENING.md | MIT | © 2026 Matt Pocock | Dependency taxonomy and seam discipline; TS examples regeneralized to ≥2 language families; cross-linked from `plan/SKILL.md`. |
| `~~improve-codebase-architecture/references/INTERFACE-DESIGN.md~~` | https://github.com/mattpocock/skills/blob/main/improve-codebase-architecture/INTERFACE-DESIGN.md | MIT | © 2026 Matt Pocock | "Design It Twice" parallel-generation workflow; TS examples regeneralized to ≥2 language families; cross-linked from `contexts/SKILL.md`. |
| `improve-architecture/references/INTERFACE-DESIGN.md` | https://github.com/mattpocock/skills/blob/main/improve-codebase-architecture/INTERFACE-DESIGN.md | MIT | © 2026 Matt Pocock | "Design It Twice" parallel-generation workflow; TS examples regeneralized to ≥2 language families; cross-linked from `contexts/SKILL.md`. |
| `test-driven/references/mocking.md` | https://github.com/mattpocock/skills/blob/main/tdd/mocking.md | MIT | © 2026 Matt Pocock | Fold-in into existing `odin:test-driven`; JS mocking examples regeneralized to ≥2 language families. |
| `test-driven/references/interface-design.md` | https://github.com/mattpocock/skills/blob/main/tdd/interface-design.md | MIT | © 2026 Matt Pocock | Fold-in; TS interface examples regeneralized to ≥2 language families. |
| `test-driven/references/refactoring.md` | https://github.com/mattpocock/skills/blob/main/tdd/refactoring.md | MIT | © 2026 Matt Pocock | Fold-in; ODIN voice. |
| `test-driven/references/deep-modules.md` | https://github.com/mattpocock/skills/blob/main/tdd/deep-modules.md | MIT | © 2026 Matt Pocock | Fold-in; npm-flavored examples regeneralized; ODIN voice. |
| `test-driven/references/tests.md` | https://github.com/mattpocock/skills/blob/main/tdd/tests.md | MIT | © 2026 Matt Pocock | Fold-in; ODIN voice. |

## agentsys ports

Skills and reference/script files ported from the `agent-sh` plugin marketplace (https://github.com/agent-sh), which the maintainer is decommissioning. Upstream is MIT. ODIN adaptations — removal of the external `agent-analyzer` binary, `repo-intel.json` cache, editor shims, bespoke JS `lib/`, and model routing; substitution of native tooling (codegraph MCP, `git`/`ast-grep`/`git grep`, repomix, generic ODIN agents, the `ask` tool); ODIN voice; structural reorganization — are made under the same MIT terms. License text is the standard MIT reproduced below; only the copyright holder differs (© 2026 Avi Fenesh).

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `deslop/SKILL.md` | https://github.com/agent-sh/deslop (main) | MIT | © 2026 Avi Fenesh | ODIN voice; three-phase certainty scan via native search/ast-grep; HIGH-only guarded autofix. |
| `deslop/references/slop-catalog.md` | https://github.com/agent-sh/deslop (main) | MIT | © 2026 Avi Fenesh | Per-language slop pattern + certainty + autofix-strategy table. |
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
| `api-design/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/api-and-interface-design | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `api-design/references/rest-patterns.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/api-and-interface-design | MIT | © 2026 Addy Osmani | Extracted verbatim from `api-design/SKILL.md` in the router/reference split; headings dedented one level. |
| `api-design/references/typescript-patterns.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/api-and-interface-design | MIT | © 2026 Addy Osmani | Extracted verbatim from `api-design/SKILL.md` in the router/reference split; headings dedented one level. |
| `~~browser-testing-with-devtools/SKILL.md~~` | https://github.com/addyosmani/agent-skills/tree/main/skills/browser-testing-with-devtools | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `browser-testing/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/browser-testing-with-devtools | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `browser-testing/references/accessibility.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/browser-testing-with-devtools | MIT | © 2026 Addy Osmani | Extracted verbatim from `browser-testing/SKILL.md` in the router/reference split; headings dedented one level. |
| `browser-testing/references/debugging-workflows.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/browser-testing-with-devtools | MIT | © 2026 Addy Osmani | Extracted verbatim from `browser-testing/SKILL.md` in the router/reference split; three symptom-specific subsections bundled into one file; headings dedented one level. |
| `browser-testing/references/test-plans.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/browser-testing-with-devtools | MIT | © 2026 Addy Osmani | Extracted verbatim from `browser-testing/SKILL.md` in the router/reference split; headings dedented one level (fenced-example headings inside the code block left unchanged). |
| `~~ci-cd-and-automation/SKILL.md~~` | https://github.com/addyosmani/agent-skills/tree/main/skills/ci-cd-and-automation | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `ci-cd/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/ci-cd-and-automation | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `ci-cd/references/github-actions.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/ci-cd-and-automation | MIT | © 2026 Addy Osmani | Extracted verbatim from `ci-cd/SKILL.md` in the router/reference split; headings dedented one level. |
| `ci-cd/references/deployment-strategies.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/ci-cd-and-automation | MIT | © 2026 Addy Osmani | Extracted verbatim from `ci-cd/SKILL.md` in the router/reference split; headings dedented one level. |
| `ci-cd/references/automation-and-environments.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/ci-cd-and-automation | MIT | © 2026 Addy Osmani | Extracted from `ci-cd/SKILL.md` in the router/reference split; two sibling sections merged under a new title; `Build Cop Role` dropped. |
| `ci-cd/references/ci-optimization.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/ci-cd-and-automation | MIT | © 2026 Addy Osmani | Extracted verbatim from `ci-cd/SKILL.md` in the router/reference split; headings dedented one level. |
| `ci-cd/references/ci-failure-feedback-loop.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/ci-cd-and-automation | MIT | © 2026 Addy Osmani | Extracted verbatim from `ci-cd/SKILL.md` in the router/reference split; headings dedented one level. |
| `~~documentation-and-adrs/SKILL.md~~` | https://github.com/addyosmani/agent-skills/tree/main/skills/documentation-and-adrs | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `docs-and-adrs/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/documentation-and-adrs | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `docs-and-adrs/references/adrs.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/documentation-and-adrs | MIT | © 2026 Addy Osmani | Extracted verbatim from `docs-and-adrs/SKILL.md` in the router/reference split; headings dedented one level. |
| `docs-and-adrs/references/api-documentation.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/documentation-and-adrs | MIT | © 2026 Addy Osmani | Extracted verbatim from `docs-and-adrs/SKILL.md` in the router/reference split; headings dedented one level. |
| `docs-and-adrs/references/changelog.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/documentation-and-adrs | MIT | © 2026 Addy Osmani | Extracted verbatim from `docs-and-adrs/SKILL.md` in the router/reference split; headings dedented one level. |
| `docs-and-adrs/references/inline-comments.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/documentation-and-adrs | MIT | © 2026 Addy Osmani | Extracted verbatim from `docs-and-adrs/SKILL.md` in the router/reference split; headings dedented one level. |
| `docs-and-adrs/references/readme-structure.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/documentation-and-adrs | MIT | © 2026 Addy Osmani | Extracted verbatim from `docs-and-adrs/SKILL.md` in the router/reference split; headings dedented one level. |
| `~~observability-and-instrumentation/SKILL.md~~` | https://github.com/addyosmani/agent-skills/tree/main/skills/observability-and-instrumentation | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `observability/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/observability-and-instrumentation | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `~~observability-and-instrumentation/references/observability-checklist.md~~` | https://github.com/addyosmani/agent-skills/tree/main/references/observability-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `observability/references/observability-checklist.md` | https://github.com/addyosmani/agent-skills/tree/main/references/observability-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `~~shipping-and-launch/SKILL.md~~` | https://github.com/addyosmani/agent-skills/tree/main/skills/shipping-and-launch | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `shipping/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/shipping-and-launch | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `~~shipping-and-launch/references/accessibility-checklist.md~~` | https://github.com/addyosmani/agent-skills/tree/main/references/accessibility-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `shipping/references/accessibility-checklist.md` | https://github.com/addyosmani/agent-skills/tree/main/references/accessibility-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `~~shipping-and-launch/references/performance-checklist.md~~` | https://github.com/addyosmani/agent-skills/tree/main/references/performance-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `shipping/references/performance-checklist.md` | https://github.com/addyosmani/agent-skills/tree/main/references/performance-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `~~shipping-and-launch/references/security-checklist.md~~` | https://github.com/addyosmani/agent-skills/tree/main/references/security-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `shipping/references/security-checklist.md` | https://github.com/addyosmani/agent-skills/tree/main/references/security-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `shipping/references/feature-flags.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/shipping-and-launch | MIT | © 2026 Addy Osmani | Extracted verbatim from `shipping/SKILL.md`'s "Feature Flag Strategy" section in the router/reference split; heading dedented one level. |
| `~~deprecation-and-migration/SKILL.md~~` | https://github.com/addyosmani/agent-skills/tree/main/skills/deprecation-and-migration | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `deprecate-and-migrate/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/deprecation-and-migration | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `deprecate-and-migrate/references/migration-patterns.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/deprecation-and-migration | MIT | © 2026 Addy Osmani | Extracted verbatim from `deprecate-and-migrate/SKILL.md` in the router/reference split; headings dedented one level. |
| `~~doubt-driven-development/SKILL.md~~` | https://github.com/addyosmani/agent-skills/tree/main/skills/doubt-driven-development | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `doubt-driven/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/doubt-driven-development | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `~~doubt-driven-development/references/orchestration-patterns.md~~` | https://github.com/addyosmani/agent-skills/tree/main/references/orchestration-patterns.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `doubt-driven/references/orchestration-patterns.md` | https://github.com/addyosmani/agent-skills/tree/main/references/orchestration-patterns.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `doubt-driven/references/cross-model-invocation.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/doubt-driven-development | MIT | © 2026 Addy Osmani | Extracted verbatim from `doubt-driven/SKILL.md` in the router/reference split; source used a bold-text step label rather than a markdown heading, promoted to an H1 title (no dedent applicable). |
| `~~frontend-ui-engineering/SKILL.md~~` | https://github.com/addyosmani/agent-skills/tree/main/skills/frontend-ui-engineering | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `frontend-ui/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/frontend-ui-engineering | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `~~frontend-ui-engineering/references/accessibility-checklist.md~~` | https://github.com/addyosmani/agent-skills/tree/main/references/accessibility-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `frontend-ui/references/accessibility-checklist.md` | https://github.com/addyosmani/agent-skills/tree/main/references/accessibility-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `frontend-ui/references/component-architecture.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/frontend-ui-engineering | MIT | © 2026 Addy Osmani | Extracted verbatim from `frontend-ui/SKILL.md` in the router/reference split; headings dedented one level. |
| `frontend-ui/references/design-system.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/frontend-ui-engineering | MIT | © 2026 Addy Osmani | Extracted verbatim from `frontend-ui/SKILL.md` in the router/reference split; headings dedented and given a title. |
| `frontend-ui/references/accessibility-patterns.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/frontend-ui-engineering | MIT | © 2026 Addy Osmani | Extracted verbatim from `frontend-ui/SKILL.md` in the router/reference split; headings dedented and given a title. |
| `frontend-ui/references/responsive-and-loading.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/frontend-ui-engineering | MIT | © 2026 Addy Osmani | Extracted verbatim from `frontend-ui/SKILL.md` in the router/reference split; two sibling sections merged under a new title. |
| `frontend-ui/references/state-management.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/frontend-ui-engineering | MIT | © 2026 Addy Osmani | Extracted verbatim from `frontend-ui/SKILL.md` in the router/reference split; heading dedented one level. |
| `~~incremental-implementation/SKILL.md~~` | https://github.com/addyosmani/agent-skills/tree/main/skills/incremental-implementation | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `incremental/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/incremental-implementation | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `incremental/references/feature-flags.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/incremental-implementation | MIT | © 2026 Addy Osmani | Extracted verbatim from `incremental/SKILL.md` in the router/reference split; examples and their closing rationale only (enumerated `### Rule 3` heading and its lead rule sentence kept inline to preserve the Rule 0–5 sequence). |
| `incremental/references/slicing-strategies.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/incremental-implementation | MIT | © 2026 Addy Osmani | Extracted verbatim from `incremental/SKILL.md` in the router/reference split; headings dedented one level, no top-level title added. |
| `~~security-and-hardening/SKILL.md~~` | https://github.com/addyosmani/agent-skills/tree/main/skills/security-and-hardening | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `security-hardening/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/security-and-hardening | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `~~security-and-hardening/references/security-checklist.md~~` | https://github.com/addyosmani/agent-skills/tree/main/references/security-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `security-hardening/references/security-checklist.md` | https://github.com/addyosmani/agent-skills/tree/main/references/security-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed; CORS checkbox restored from the skill's inline checklist. |
| `security-hardening/references/owasp-patterns.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/security-and-hardening | MIT | © 2026 Addy Osmani | Extracted verbatim from `security-hardening/SKILL.md` in the router/reference split; headings dedented one level. |
| `security-hardening/references/input-validation.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/security-and-hardening | MIT | © 2026 Addy Osmani | Extracted verbatim from `security-hardening/SKILL.md` in the router/reference split; headings dedented one level. |
| `security-hardening/references/dependency-audit.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/security-and-hardening | MIT | © 2026 Addy Osmani | Extracted verbatim from `security-hardening/SKILL.md` in the router/reference split; headings dedented one level. |
| `security-hardening/references/operational-controls.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/security-and-hardening | MIT | © 2026 Addy Osmani | Extracted verbatim from `security-hardening/SKILL.md` in the router/reference split; two sibling sections merged under a new title. |
| `security-hardening/references/llm-security.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/security-and-hardening | MIT | © 2026 Addy Osmani | Extracted verbatim from `security-hardening/SKILL.md` in the router/reference split; headings dedented one level. |
| `~~source-driven-development/SKILL.md~~` | https://github.com/addyosmani/agent-skills/tree/main/skills/source-driven-development | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `source-driven/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/source-driven-development | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `source-driven/references/stack-examples.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/source-driven-development | MIT | © 2026 Addy Osmani | Extracted verbatim: the per-step stack-specific illustration blocks (Steps 1–4) from `source-driven/SKILL.md` in the router/reference split, grouped under added organizational headings; the Step 3 lead-in `**When the docs conflict with existing project code:**` was copied rather than moved, and remains live in `source-driven/SKILL.md`; no heading dedent needed (blocks carried no headings of their own). |
| `~~spec-driven-development/SKILL.md~~` | https://github.com/addyosmani/agent-skills/tree/main/skills/spec-driven-development | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
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
| `autolearn/SKILL.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | `ce-compound` create+refresh modes trimmed; hermes reject-by-default gate folded in (© 2026 What If We Dig Deeper); memory-handoff routing to `memory-update`; ODIN voice + `Op:` trailers. |
| `autolearn/references/schema.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | Folds ce `schema.yaml` + `yaml-schema.md`; bug/knowledge tracks; Rails-specific fields generalized. |
| `autolearn/references/refresh.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | Folds ce `refresh-workflow.md` + `per-action-flows.md`; five-outcome model; headless `status: stale` variant. |
| `autolearn/assets/solution-template.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | Section structure for a new learning doc; both tracks. |
| `autolearn/scripts/validate-frontmatter.py` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | Frontmatter parser-safety check; logic ported verbatim, docstring ODIN-genericized; stdlib only. |
| `autolearn/references/concepts.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | CONCEPTS.md entry schema + one-definition-per-concept reconciliation/refresh rules; grafted from `ce-compound`'s concept-map feature; wired into the existing reject-by-default gate; ODIN voice. |

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

`strategy` is a port of the `compound-engineering-plugin` `ce-strategy` skill (https://github.com/EveryInc/compound-engineering-plugin) — an interview-driven STRATEGY.md generator routed by file state (new vs update vs section-revisit). compound-engineering-plugin is MIT (© 2025 Every). ODIN adaptations — a VS preamble pins intent before the interview; reject-by-default pushback replaces transcription of weak answers; the trigger evaluates while the gate decides whether to write; gated auto-commit stages only `STRATEGY.md` (never `git add -A`); read as optional grounding by `plan`/`ideate`; ODIN voice — are made under the same MIT terms.

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `strategy/SKILL.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | `ce-strategy` ported; VS preamble + reject-by-default pushback + resume-in-place; gated auto-commit of `STRATEGY.md` only; ODIN voice. |
| `strategy/references/interview.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | Interview question bank/flow; language-agnostic; ODIN voice. |
| `strategy/assets/strategy-template.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | `STRATEGY.md` section skeleton (target problem, approach, persona, metrics, tracks, milestones, non-goals, marketing). |

## EveryInc compound-engineering port (autopilot)

`autopilot` is an ODIN-renamed port of the `compound-engineering-plugin` `lfg` skill (https://github.com/EveryInc/compound-engineering-plugin) — a hands-off end-to-end delivery pipeline. compound-engineering-plugin is MIT (© 2025 Every). ODIN adaptations — entry is execution-only (plan onward); it chains existing ODIN skills (plan → proceed → simplify → review → fix → commit-push → gh-fix-ci → report) and never reimplements them; greenfield strategy/ideation chaining is excluded; gated phase sequencing with an autofix-then-halt posture; local-only mode when no remote; ODIN voice — are made under the same MIT terms.

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `autopilot/SKILL.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | `lfg` ported and renamed; execution-only chaining of existing ODIN skills; autofix-then-halt phase gates; local-only fallback; ODIN voice. |
| `autopilot/references/pipeline-gates.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | Per-phase gate definitions + the autofix-then-halt state machine. |

## EveryInc compound-engineering grafts (review / plan / optimize enhancements)

Three existing ODIN skills gained opt-in capabilities grafted from `compound-engineering-plugin` (https://github.com/EveryInc/compound-engineering-plugin); their original ODIN-authored cores are unchanged and are not MIT-derived. compound-engineering-plugin is MIT (© 2025 Every). Each row covers **only the grafted addition** named in its provenance. ODIN adaptations — `review`: single-pass base preserved as the floor, deep mode a strict superset (no Sever), gated risk-escalation with a `mode:shallow`/`mode:fast` pin, read-only routing to `fix`/`review-fix-grill-loop`, P0-P3 by observable behavioral impact; `plan`: read-only ephemeral default preserved, `docs/plans/<slug>.md` artifact + STRATEGY.md grounding both opt-in and non-blocking; `optimize`: log/recovery/stopping-rules wrap the existing benchmark loop without removing a phase; ODIN voice — are made under the same MIT terms.

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `review/SKILL.md` (deep-mode addition only) | https://github.com/EveryInc/compound-engineering-plugin `ce-code-review` | MIT | © 2025 Every | Opt-in deep multi-persona mode, confidence-anchored severity, action-class routing grafted onto the ODIN single-pass review; single-pass base is ODIN-original. |
| `review/references/personas/*.md` (`_contract` + 7 lenses) | https://github.com/EveryInc/compound-engineering-plugin `ce-code-review` | MIT | © 2025 Every | Shared output/severity/action-class contract + correctness/testing/maintainability/security/performance/api-contract/adversarial lens prompts. |
| `plan/SKILL.md` (artifact + grounding addition only) | https://github.com/EveryInc/compound-engineering-plugin `ce-plan` | MIT | © 2025 Every | Opt-in `docs/plans/<slug>.md` implementation-unit artifact + opt-in STRATEGY.md grounding grafted onto the ODIN read-only planner; base is ODIN-original. |
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
| `reviews/references/personas/learnings-researcher.md` | `ce-code-review/references/personas/learnings-researcher.md` | MIT | © 2025 Every | Persona adapted to ODIN review contract. |
| `reviews/references/personas/previous-comments-reviewer.md` | `ce-code-review/references/personas/previous-comments-reviewer.md` | MIT | © 2025 Every | Persona adapted to ODIN review contract. |
| `reviews/references/personas/data-migration-reviewer.md` | `ce-code-review/references/personas/data-migration-reviewer.md` | MIT | © 2025 Every | Persona adapted to ODIN review contract. |
| `reviews/references/personas/reliability-reviewer.md` | `ce-code-review/references/personas/reliability-reviewer.md` | MIT | © 2025 Every | Persona adapted to ODIN review contract. |
| `reviews/references/personas/deployment-verification.md` | `ce-code-review/references/personas/deployment-verification-agent.md` | MIT | © 2025 Every | Persona adapted to ODIN review contract. |
| `reviews/references/personas/project-standards.md` | `ce-code-review/references/personas/project-standards-reviewer.md` | MIT | © 2025 Every | Persona adapted to ODIN review contract. |
| `reviews/references/action-class-rubric.md` | `ce-code-review/references/action-class-rubric.md` | MIT | © 2025 Every | Routing criteria adapted. |
| `reviews/references/diff-scope.md` | `ce-code-review/references/diff-scope.md` | MIT | © 2025 Every | Scope rules adapted. |
| `reviews/references/findings-schema.json` | `ce-code-review/references/findings-schema.json` | MIT | © 2025 Every | JSON schema adapted. |
| `reviews/references/review-output-template.md` | `ce-code-review/references/review-output-template.md` | MIT | © 2025 Every | Output template adapted. |
| `reviews/references/subagent-template.md` | `ce-code-review/references/subagent-template.md` | MIT | © 2025 Every | Subagent template adapted. |
| `reviews/references/validator-template.md` | `ce-code-review/references/validator-template.md` | MIT | © 2025 Every | Validator template adapted. |
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
| `plans/references/approach-altitude.md` | `ce-plan/references/` | MIT | © 2025 Every | Approach-altitude adapted. |
| `plans/references/deepening-workflow.md` | `ce-plan/references/` | MIT | © 2025 Every | Deepening workflow adapted. |
| `plans/references/plan-handoff.md` | `ce-plan/references/` | MIT | © 2025 Every | Plan handoff adapted. |
| `plans/references/plan-sections.md` | `ce-plan/references/` | MIT | © 2025 Every | Plan sections adapted. |
| `plans/references/synthesis-summary.md` | `ce-plan/references/` | MIT | © 2025 Every | Synthesis summary adapted. |
| `plans/references/universal-planning.md` | `ce-plan/references/` | MIT | © 2025 Every | Universal planning adapted. |
| `simplify/references/quality.md` | `ce-simplify-code/references/` | MIT | © 2025 Every | Quality checks adapted. |
| `simplify/references/reuse.md` | `ce-simplify-code/references/` | MIT | © 2025 Every | Reuse checks adapted. |

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
- Renamed paths: keep the old row with strikethrough and add the new path.
- Removed ports: keep the row with a "removed" provenance note for audit trail.
- Upstream relicensing: re-evaluate the entire registry; do not silently bump license fields.
