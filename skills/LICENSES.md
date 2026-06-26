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
| `improve-codebase-architecture/SKILL.md` | https://github.com/mattpocock/skills/tree/main/improve-codebase-architecture | MIT | © 2026 Matt Pocock | ODIN voice; cross-linked from `plan/SKILL.md` and `contexts/SKILL.md` per canonical-homes map. |
| `zoom-out/SKILL.md` | https://github.com/mattpocock/skills/tree/main/zoom-out | MIT | © 2026 Matt Pocock | ODIN voice; `disable-model-invocation: true` preserved verbatim; aligned with `odin:duet` director pattern. |
| `caveman/SKILL.md` | https://github.com/mattpocock/skills/tree/main/caveman | MIT | © 2026 Matt Pocock | Caveman-adapted: grammar-fragmentation dropped; verbosity reduction preserved; English-mandate honored. |
| `write-a-skill/SKILL.md` | https://github.com/mattpocock/skills/tree/main/write-a-skill | MIT | © 2026 Matt Pocock | ODIN voice; scope disambiguation against `odin:init` and `skill-creator:skill-creator`; language-neutral framing. |
| `git-guardrails-claude-code/SKILL.md` | https://github.com/mattpocock/skills/tree/main/git-guardrails-claude-code | MIT | © 2026 Matt Pocock | ODIN voice; cross-harness installation note added; safety-critical hook script (see `hook.sh` row below). |
| `git-guardrails-claude-code/hook.sh` | https://github.com/mattpocock/skills/tree/main/git-guardrails-claude-code | MIT | © 2026 Matt Pocock | Bash hook script ported verbatim. Pattern list and exit-2 contract are upstream's; install path adapted for ODIN harness. |
| `to-prd/SKILL.md` | https://github.com/mattpocock/skills/tree/main/to-prd | MIT | © 2026 Matt Pocock | ODIN voice; flipped-row reconciliation: GitHub-issue emission abstracted to optional `--emit-issue` flag; default emits markdown PRD file. |
| `to-issues/SKILL.md` | https://github.com/mattpocock/skills/tree/main/to-issues | MIT | © 2026 Matt Pocock | ODIN voice; tracer-bullet vertical-slice framing preserved; emission modes (file vs `--emit-issue`) added. |
| `qa/SKILL.md` | https://github.com/mattpocock/skills/tree/main/qa | MIT | © 2026 Matt Pocock | ODIN voice; modality differentiation table vs `odin:review` and `odin:pr-review`. |
| `request-refactor-plan/SKILL.md` | https://github.com/mattpocock/skills/tree/main/request-refactor-plan | MIT | © 2026 Matt Pocock | ODIN voice; scope fence vs `odin:plan` and `odin:refactor-break-bw-compat`; emission modes added. |
| `github-triage/SKILL.md` | https://github.com/mattpocock/skills/tree/main/github-triage | MIT | © 2026 Matt Pocock | ODIN voice; flipped-row reconciliation: hard-coded label names abstracted to a configurable label-map at the top of SKILL.md. |
| `setup-pre-commit/SKILL.md` | https://github.com/mattpocock/skills/tree/main/setup-pre-commit | MIT | © 2026 Matt Pocock | ODIN voice; generalized from Husky+lint-staged to project's hook tool of choice (Husky, pre-commit, lefthook, cargo-husky, dune hooks). |

## Reference documents

Reference documents cross-linked across multiple skills per the canonical-homes map. The owner skill carries the `references/` subdirectory; consumer skills link via relative paths.

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `domain-model/references/ADR-FORMAT.md` | https://github.com/mattpocock/skills/blob/main/domain-model/ADR-FORMAT.md | MIT | © 2026 Matt Pocock | Language-agnostic ADR template; ODIN voice. |
| `domain-model/references/CONTEXT-FORMAT.md` | https://github.com/mattpocock/skills/blob/main/domain-model/CONTEXT-FORMAT.md | MIT | © 2026 Matt Pocock | Glossary entry format; ODIN voice; cross-linked from `contexts/SKILL.md`. |
| `improve-codebase-architecture/references/LANGUAGE.md` | https://github.com/mattpocock/skills/blob/main/improve-codebase-architecture/LANGUAGE.md | MIT | © 2026 Matt Pocock | Architecture vocabulary (module, seam, adapter, depth, leverage, locality); TS examples regeneralized to ≥2 language families; cross-linked from `plan/SKILL.md`. |
| `improve-codebase-architecture/references/DEEPENING.md` | https://github.com/mattpocock/skills/blob/main/improve-codebase-architecture/DEEPENING.md | MIT | © 2026 Matt Pocock | Dependency taxonomy and seam discipline; TS examples regeneralized to ≥2 language families; cross-linked from `plan/SKILL.md`. |
| `improve-codebase-architecture/references/INTERFACE-DESIGN.md` | https://github.com/mattpocock/skills/blob/main/improve-codebase-architecture/INTERFACE-DESIGN.md | MIT | © 2026 Matt Pocock | "Design It Twice" parallel-generation workflow; TS examples regeneralized to ≥2 language families; cross-linked from `contexts/SKILL.md`. |
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
| `drift-detect/SKILL.md` | https://github.com/agent-sh/drift-detect (main) | MIT | © 2026 Avi Fenesh | ODIN voice; gh/docs/code collection; generic-agent synthesis (model routing removed). |
| `drift-detect/references/drift-taxonomy.md` | https://github.com/agent-sh/drift-detect (main) | MIT | © 2026 Avi Fenesh | Drift/gap taxonomy, prioritization weights, cross-ref matching, report template. |
| `audit-project/SKILL.md` | https://github.com/agent-sh/audit-project (v1.0.2) | MIT | © 2026 Avi Fenesh | ODIN voice; iterative multi-agent audit via generic ODIN reviewers. |
| `audit-project/references/review-roster.md` | https://github.com/agent-sh/audit-project (v1.0.2) | MIT | © 2026 Avi Fenesh | The 10 reviewer role prompts + false-positive-contract clause. |
| `audit-project/references/false-positive-contract.md` | https://github.com/agent-sh/audit-project (v1.0.2) | MIT | © 2026 Avi Fenesh | Consolidation algorithm, blocked-ratio gate, decision-gate options, signal routing. |
| `onboard/SKILL.md` | https://github.com/agent-sh/onboard (v0.1.1) | MIT | © 2026 Avi Fenesh | ODIN voice; codebase orientation via native signals + repomix; `ask`-driven guidance. |
| `onboard/references/orientation.md` | https://github.com/agent-sh/onboard (v0.1.1) | MIT | © 2026 Avi Fenesh | Collection checklist, 7-section orientation template, depth matrix, degradation table. |
| `can-i-help/SKILL.md` | https://github.com/agent-sh/can-i-help (v0.1.1) | MIT | © 2026 Avi Fenesh | ODIN voice; contribution routing via native signals + mandatory `ask`. |
| `can-i-help/references/interest-routing.md` | https://github.com/agent-sh/can-i-help (v0.1.1) | MIT | © 2026 Avi Fenesh | Interest→signal map, four-field recommendation template, slop-verification rules. |
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
| `api-and-interface-design/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/api-and-interface-design | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `browser-testing-with-devtools/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/browser-testing-with-devtools | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `ci-cd-and-automation/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/ci-cd-and-automation | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `documentation-and-adrs/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/documentation-and-adrs | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `observability-and-instrumentation/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/observability-and-instrumentation | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `observability-and-instrumentation/references/observability-checklist.md` | https://github.com/addyosmani/agent-skills/tree/main/references/observability-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `shipping-and-launch/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/shipping-and-launch | MIT | © 2026 Addy Osmani | Structural port; frontmatter normalized; cross-skill references removed. |
| `shipping-and-launch/references/accessibility-checklist.md` | https://github.com/addyosmani/agent-skills/tree/main/references/accessibility-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `shipping-and-launch/references/performance-checklist.md` | https://github.com/addyosmani/agent-skills/tree/main/references/performance-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `shipping-and-launch/references/security-checklist.md` | https://github.com/addyosmani/agent-skills/tree/main/references/security-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `deprecation-and-migration/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/deprecation-and-migration | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `doubt-driven-development/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/doubt-driven-development | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `doubt-driven-development/references/orchestration-patterns.md` | https://github.com/addyosmani/agent-skills/tree/main/references/orchestration-patterns.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `frontend-ui-engineering/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/frontend-ui-engineering | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `frontend-ui-engineering/references/accessibility-checklist.md` | https://github.com/addyosmani/agent-skills/tree/main/references/accessibility-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `incremental-implementation/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/incremental-implementation | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `security-and-hardening/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/security-and-hardening | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `security-and-hardening/references/security-checklist.md` | https://github.com/addyosmani/agent-skills/tree/main/references/security-checklist.md | MIT | © 2026 Addy Osmani | Relocated into skill's `references/` (self-contained); cross-skill references removed. |
| `source-driven-development/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/source-driven-development | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |
| `spec-driven-development/SKILL.md` | https://github.com/addyosmani/agent-skills/tree/main/skills/spec-driven-development | MIT | © 2026 Addy Osmani | ODIN voice; cross-skill references removed; examples generalized to ≥2 language families. |

## obra/superpowers port (subagent-driven)

`subagent-driven` fuses obra's `subagent-driven-development` skill (https://github.com/obra/superpowers) with structural ideas from the `compound-engineering` plugin's `ce-subagent-driven` skill, rewritten in ODIN/Linus voice. obra/superpowers is MIT (© 2025 Jesse Vincent). ODIN adaptations — workspace `.superpowers/sdd` → `.outline/sdd`; `sdd-workspace` → `sd-workspace`; reviewer dispatched as a generic `general-purpose` subagent with a local `task-reviewer-prompt.md` (no external named-agent dependency; `ce-adversarial-reviewer` noted only as an optional drop-in); op-classification + four rejection grounds (Excess/Graft/Sprawl/Sever) + `Op:` trailers injected; obra's branch-finishing / code-review-request refs replaced with the ODIN atomic-commit ship path — are made under the same MIT terms. The three bash scripts keep upstream's logic verbatim except the workspace retarget. License text is the standard MIT reproduced below; only the copyright holder differs (© 2025 Jesse Vincent).

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `subagent-driven/SKILL.md` | https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development | MIT | © 2025 Jesse Vincent | Per-task implementer→reviewer loop fused with `ce-subagent-driven` dispatch-brief/parallel/tree-clean/validation-gate; ODIN voice + `Op:` trailers + rejection grounds. |
| `subagent-driven/implementer-prompt.md` | https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development | MIT | © 2025 Jesse Vincent | Implementer contract ported; four statuses preserved; ODIN voice + self-review against rejection grounds + `Op:` trailer. |
| `subagent-driven/task-reviewer-prompt.md` | https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development | MIT | © 2025 Jesse Vincent | Reviewer contract ported; the audit gate. Dispatched to `general-purpose`; rejection-ground checks added. |
| `subagent-driven/scripts/review-package` | https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development | MIT | © 2025 Jesse Vincent | Logic verbatim; default OUTFILE repointed to `.outline/sdd` via `sd-workspace`. |
| `subagent-driven/scripts/task-brief` | https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development | MIT | © 2025 Jesse Vincent | Logic verbatim; default OUTFILE repointed to `.outline/sdd` via `sd-workspace`. |
| `subagent-driven/scripts/sd-workspace` | https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development | MIT | © 2025 Jesse Vincent | `sdd-workspace` renamed; `.superpowers/sdd` → `.outline/sdd`; self-ignoring `.gitignore` mechanism preserved. |

## EveryInc compound-engineering port (autolearn)

`autolearn` is a trimmed port of the `compound-engineering-plugin` `ce-compound` skill (https://github.com/EveryInc/compound-engineering-plugin), fused with the reject-by-default lesson filter from the `agent-skills` learn skill (https://github.com/WhatIfWeDigDeeper/agent-skills). compound-engineering-plugin is MIT (© 2025 Every); agent-skills is MIT (© 2026 What If We Dig Deeper). ODIN adaptations — Rails-specific `component` enum + `rails_version` generalized to language-agnostic fields; the CONCEPTS.md concept-map feature, multi-assistant config routing, Lightweight mode, session-history integration, and specialized ce reviewers all dropped; auto-memory writes delegated to the `memory-update` skill (single writer — `autolearn` never writes `memory/` or `MEMORY.md`); ODIN voice and `Op:` trailers — are made under the same MIT terms. License text is the standard MIT reproduced below; only the copyright holders differ (© 2025 Every; © 2026 What If We Dig Deeper).

| Path under `/home/alpha/.claude/claude/skills/` | Upstream origin | License | Copyright | Provenance |
| ----------------------------------------------- | --------------- | ------- | --------- | ---------- |
| `autolearn/SKILL.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | `ce-compound` create+refresh modes trimmed; hermes reject-by-default gate folded in (© 2026 What If We Dig Deeper); memory-handoff routing to `memory-update`; ODIN voice + `Op:` trailers. |
| `autolearn/references/schema.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | Folds ce `schema.yaml` + `yaml-schema.md`; bug/knowledge tracks; Rails-specific fields generalized. |
| `autolearn/references/refresh.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | Folds ce `refresh-workflow.md` + `per-action-flows.md`; five-outcome model; headless `status: stale` variant. |
| `autolearn/assets/solution-template.md` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | Section structure for a new learning doc; both tracks. |
| `autolearn/scripts/validate-frontmatter.py` | https://github.com/EveryInc/compound-engineering-plugin | MIT | © 2025 Every | Frontmatter parser-safety check; logic ported verbatim, docstring ODIN-genericized; stdlib only. |

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
