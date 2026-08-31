# Provenance — @outlinedriven/odin-run-advanced

OutlineDriven-authored material in this package is Apache-2.0. See the repository `LICENSE`.

This package ships 21 public skills from the canonical `skills/<slug>/` tree. Package-local skill copies are generated only at pack time.

| Skill | Strategy | Adaptation | Target | Origin |
|---|---|---|---|---|
| `arena` | B | byte-reuse | `skills/arena/` | cursor/plugins @ `68836ddaf5697224520f1847d90cdb90ca8babaa` (MIT) |
| `autopilot` | G | structured-merge-rewrite | `skills/autopilot/` | odin-1.x-current-skill @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `corroborate-by-independent-reruns` | B | byte-reuse | `skills/corroborate-by-independent-reruns/` | cobusgreyling/loop-engineering @ `d03dcb92cc1e0efb59789a2557131c6ad5897ccc` (MIT) |
| `diagnose-loop-health` | B | byte-reuse | `skills/diagnose-loop-health/` | cobusgreyling/loop-engineering @ `d03dcb92cc1e0efb59789a2557131c6ad5897ccc` (MIT) |
| `feedback-sweep` | R | rename-only | `skills/feedback-sweep/` | Origin: https://github.com/EveryInc/compound-engineering-plugin, revision `a1f601f17137f648be439965f8fdd9123303de5d`, source skill `skills/ce-sweep/SKILL.md`. License MIT (Copyright (c) 2025 Every): mechanisms are extracted and rewritten in ODIN style, not copied verbatim, so the obligation reduces to preserving attribution in the root provenance ledger. Adaptation: the bundled state engine and reference files are not shipped; the state schema, single-writer lease discipline, ordering invariant, approved-only acknowledgment, fix-ref shape validation, private media scratch, plan reconciliation rules, and lfg handoff rendering are restated inline as a self-contained procedure. |
| `figure-it-out` | B | byte-reuse | `skills/figure-it-out/` | cursor/plugins @ `68836ddaf5697224520f1847d90cdb90ca8babaa` (MIT) |
| `gate-proposed-change` | B | byte-reuse | `skills/gate-proposed-change/` | cobusgreyling/loop-engineering @ `d03dcb92cc1e0efb59789a2557131c6ad5897ccc` (MIT) |
| `merge-and-deploy` | R | rename-only | `skills/merge-and-deploy/` | Origin: https://github.com/garrytan/gstack, revision 07b59e396c6be5a86619a43151cb9ed62a15ae69. License: MIT, Copyright (c) 2026 Garry Tan. Adapted from the `land-and-deploy` skill (SKILL.md, sections/first-run-validation.md, sections/merge-and-deploy.md, sections/readiness-gate.md). Expressive prose and procedure re-derived under clean-room adaptation; gstack-specific tooling replaced with standard `gh`, `git`, and `curl` commands. The MIT copyright and permission notice is retained. |
| `negotiate-run-budget` | B | byte-reuse | `skills/negotiate-run-budget/` | cobusgreyling/loop-engineering @ `d03dcb92cc1e0efb59789a2557131c6ad5897ccc` (MIT) |
| `orchestrate` | B | byte-reuse | `skills/orchestrate/` | cursor/plugins @ `68836ddaf5697224520f1847d90cdb90ca8babaa` (MIT) |
| `orchestration-patterns` | B | byte-reuse | `skills/orchestration-patterns/` | addyosmani/agent-skills @ `d2c37ef6225dd8726cdd369a8030307f48592d26` (MIT) |
| `parallel-launch` | B | byte-reuse | `skills/parallel-launch/` | odin-current @ `project-owned` (Project-owned or clean-room only; no copied source text)<br>https://github.com/obra/superpowers @ `b36e0829c6d0140e93cfef2ca599b1b07d4a7797` (MIT) |
| `partition-scopes-to-subagents` | B | byte-reuse | `skills/partition-scopes-to-subagents/` | project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `poteto-mode` | B | byte-reuse | `skills/poteto-mode/` | cursor/plugins @ `68836ddaf5697224520f1847d90cdb90ca8babaa` (MIT) |
| `propose-external-change` | B | byte-reuse | `skills/propose-external-change/` | cobusgreyling/loop-engineering @ `d03dcb92cc1e0efb59789a2557131c6ad5897ccc` (MIT) |
| `publish-release-pr` | R | rename-only | `skills/publish-release-pr/` | Origin: https://github.com/garrytan/gstack, revision 07b59e396c6be5a86619a43151cb9ed62a15ae69. License: MIT (Copyright (c) 2026 Garry Tan; LICENSE blob 35029511144443297cad2d26e4bac17d0e352f93). Reuse constraints require retaining the copyright and permission notice and re-deriving expressive prose and code rather than copying wholesale. This skill is a clean-room adaptation: the release-pipeline mechanism (base merge, evidence-ledged tests with ownership triage, coverage audit with regression rule, pre-landing and adversarial review, queue-aware version bump, theme-grouped changelog, bisectable commits, verification gate, redaction-gated PR, and the App Store durable-effect adapter) is re-derived in self-contained procedure form; no gstack expression is copied. |
| `saga` | B | byte-reuse | `skills/saga/` | https://github.com/warpdotdev/common-skills @ `f589e224907eda566c13755529f59db563090d14` (MIT) |
| `subagent-driven` | B | byte-reuse | `skills/subagent-driven/` | current-odin-skill-tree @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `swarm` | B | byte-reuse | `skills/swarm/` | cursor/plugins @ `68836ddaf5697224520f1847d90cdb90ca8babaa` (MIT) |
| `thin-repo-pulse` | B | byte-reuse | `skills/thin-repo-pulse/` | cobusgreyling/loop-engineering @ `d03dcb92cc1e0efb59789a2557131c6ad5897ccc` (MIT) |
| `workflows-driven` | G | structured-merge-rewrite | `skills/workflows-driven/` | current-odin-skill-tree @ `project-owned` (Project-owned or clean-room only; no copied source text) |

