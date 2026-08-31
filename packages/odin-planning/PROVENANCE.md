# Provenance — @outlinedriven/odin-planning

OutlineDriven-authored material in this package is Apache-2.0. See the repository `LICENSE`.

This package ships 17 public skills from the canonical `skills/<slug>/` tree. Package-local skill copies are generated only at pack time.

| Skill | Strategy | Adaptation | Target | Origin |
|---|---|---|---|---|
| `askme` | M | move-only | `skills/askme/` | odin-1.x-current-skill @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `autoplan` | G | structured-merge-rewrite | `skills/autoplan/` | Origin: https://github.com/garrytan/gstack, revision 07b59e396c6be5a86619a43151cb9ed62a15ae69. License: MIT, Copyright (c) 2026 Garry Tan. Adapted clean-room from the autoplan multi-phase review pipeline (CEO, design, DX, engineering phases, six-principle decision register, aggregated task ledger); expressive prose re-derived, not copied. |
| `backlog` | M | move-only | `skills/backlog/` | project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `batch-ask-me` | M | move-only | `skills/batch-ask-me/` | odin-1.x-current-skill @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `brainstorm` | G | structured-merge-rewrite | `skills/brainstorm/` | odin-1.x-current-skill @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `clarify` | M | move-only | `skills/clarify/` | odin-1.x-current-skill @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `decide` | M | move-only | `skills/decide/` | odin-1.x-current-skill @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `generalize` | G | structured-merge-rewrite | `skills/generalize/` | Origin: ODIN 1.x current skill `skills/generalize-from-cases/SKILL.md` (project-owned, no third-party license evidence). Revision: unpinned current. License: project-owned. Adaptation: clean-room rewrite to the ODIN 2.0 self-contained literal contract; rule-recovery mechanism (case set, feature split, invariant/incidental, rival rules, evidence-first probe, bounded rule) preserved, peer-skill and tool-contract pointers removed. |
| `plan` | G | structured-merge-rewrite | `skills/plan/` | Origin: https://github.com/EveryInc/compound-knowledge-plugin \| Revision: 766942e9eaee5204adbfe180f1d0651ffecf2575 \| License: MIT — adaptation of the compound-knowledge-plugin planning mechanism. Both researcher-agent functions (past-work research and knowledge-base research) are preserved as parallel read-only research steps in Procedure. Local reversible write confirmed per source. Mechanism rewrites recorded in the root provenance ledger are permitted under the license. |
| `plan-review` | G | structured-merge-rewrite | `skills/plan-review/` | Origin: nicobailon/visual-explainer (MIT); pinned revision: 7163c3e10660912e0b89e1af465db9f387282b88. License: MIT. Adaptation: Audit procedure and verdict taxonomy are rederived from independent clean-room analysis of the codebase. No third-party expression is copied. MIT notice retained per license treatment. |
| `pov` | M | move-only | `skills/pov/` | odin-current @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `shape` | M | move-only | `skills/shape/` | odin-current @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `to-tickets` | M | move-only | `skills/to-tickets/` | current-odin-skill-tree @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `todo-add` | N | genuine-new-rewrite | `skills/todo-add/` | project-owned; genuine-new rewrite; no third-party source |
| `todos-enhance` | G | structured-merge-rewrite | `skills/todos-enhance/` | Origin: current-odin-skill-tree. Project-owned. Adapted from `skills/sophisticate-todos/SKILL.md`. Edits were driven by the task-decomposition end state, not the source verbatim. Distinct from `update-todos`, which reconciles stale lists rather than deepening coarse ones. |
| `todos-update` | G | structured-merge-rewrite | `skills/todos-update/` | Origin: current ODIN skill tree, candidate `current:current-d:current:update-todos`. Revision: none pinned. License: project-owned. Adaptation: clean-room rewrite preserving the three-way reconciliation mechanism, classification taxonomy, proof requirement, single-next-action tiebreak, and delta-only report from the source skill. |
| `wayfinder` | M | move-only | `skills/wayfinder/` | current-odin-skill-tree @ `project-owned` (Project-owned or clean-room only; no copied source text) |

