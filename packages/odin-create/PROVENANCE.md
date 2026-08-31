# Provenance — @outlinedriven/odin-create

OutlineDriven-authored material in this package is Apache-2.0. See the repository `LICENSE`.

This package ships 50 public skills from the canonical `skills/<slug>/` tree. Package-local skill copies are generated only at pack time.

| Skill | Strategy | Adaptation | Target | Origin |
|---|---|---|---|---|
| `architecture-diagram` | G | structured-merge-rewrite | `skills/architecture-diagram/` | https://github.com/tt-a1i/archify @ `b36d79fdbc3aec3728744341485a7e79f03c0071` (MIT) |
| `buzzword-hijack` | B | byte-reuse | `skills/buzzword-hijack/` | project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `changelog-updates` | B | byte-reuse | `skills/changelog-updates/` | cobusgreyling/loop-engineering @ `d03dcb92cc1e0efb59789a2557131c6ad5897ccc` (MIT) |
| `clean-and-true` | B | byte-reuse | `skills/clean-and-true/` | odin-1.x-current-skill @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `compile-3d-workflow` | B | byte-reuse | `skills/compile-3d-workflow/` | project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text)<br>project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `converge` | B | byte-reuse | `skills/converge/` | project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `dataflow-diagram` | B | byte-reuse | `skills/dataflow-diagram/` | https://github.com/tt-a1i/archify @ `b36d79fdbc3aec3728744341485a7e79f03c0071` (MIT) |
| `debloat-respect-richness` | B | byte-reuse | `skills/debloat-respect-richness/` | https://github.com/LilMGenius/paperthin @ `3bca079a51bcfff5dafb53d1d7f9f523d66ee317` (MIT) |
| `define-goalstate` | B | byte-reuse | `skills/define-goalstate/` | project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `diagram-contract` | G | structured-merge-rewrite | `skills/diagram-contract/` | odin-1.x-current-skill @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `diataxis-docs-authoring` | B | byte-reuse | `skills/diataxis-docs-authoring/` | mcollina/skills @ `856efd268ae85482d882f3d0bed869fd020b5c06` (MIT) |
| `diverge` | B | byte-reuse | `skills/diverge/` | project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `doc-coauthoring` | B | byte-reuse | `skills/doc-coauthoring/` | getsentry/skills @ `c2f99a5b04b4cd992ec3022d7c2c3e23e938d241` (Apache-2.0) |
| `docs-update` | B | byte-reuse | `skills/docs-update/` | https://github.com/warpdotdev/oz-skills @ `6c08c49fc6c51b8f768bf8c53c041bc06a160765` (MIT) |
| `docs-writing` | B | byte-reuse | `skills/docs-writing/` | mblode/agent-skills @ `e97a3b383f5944f90d41eb92b24b4fb3b917a7f9` (MIT) |
| `document-generate` | R | rename-only | `skills/document-generate/` | Origin https://github.com/garrytan/gstack, revision 07b59e396c6be5a86619a43151cb9ed62a15ae69, MIT license (Copyright (c) 2026 Garry Tan). Clean-room adaptation: the documentation and diagram generation procedure is re-derived from the source mechanism; no source expression is copied. |
| `document-release` | R | rename-only | `skills/document-release/` | Adapted from the `document-release` skill in garrytan/gstack (revision 07b59e396c6be5a86619a43151cb9ed62a15ae69), MIT licensed, Copyright (c) 2026 Garry Tan. Clean-room re-derivation: the clobber-protected CHANGELOG voice polish, Diataxis coverage map, auto-update versus ask classification, VERSION bump gate, redaction scan, and named-file local commit are preserved as mechanism. All gstack runtime binaries, preamble, telemetry, codex cross-model review, AskUserQuestion tool format, PR/MR body update, and push steps were removed to fit reversible-local authority with no runtime dependencies. The MIT copyright and permission notice are retained. |
| `good-readme` | B | byte-reuse | `skills/good-readme/` | https://github.com/evilmartians/agent-skills @ `a2a83b280a2c5b9a6176c5934298fad0224bbce4` (MIT) |
| `ideate` | G | structured-merge-rewrite | `skills/ideate/` | odin-1.x-current-skill @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `lifecycle-diagram` | B | byte-reuse | `skills/lifecycle-diagram/` | https://github.com/tt-a1i/archify @ `b36d79fdbc3aec3728744341485a7e79f03c0071` (MIT) |
| `markdown-to-pdf` | R | rename-only | `skills/markdown-to-pdf/` | Origin: https://github.com/garrytan/gstack, revision `07b59e396c6be5a86619a43151cb9ed62a15ae69`, file `make-pdf/SKILL.md`. License: MIT (Copyright (c) 2026 Garry Tan). Adaptation: re-derived the Chromium PDF rendering procedure with the emoji, diagram, landscape, and combined gates as a self-contained ODIN skill; no third-party expressive prose or code copied wholesale. |
| `pr-walkthrough` | B | byte-reuse | `skills/pr-walkthrough/` | https://github.com/warpdotdev/common-skills @ `f589e224907eda566c13755529f59db563090d14` (MIT) |
| `prototype` | G | structured-merge-rewrite | `skills/prototype/` | mattpocock/skills @ `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76` (MIT) |
| `prototype-logic` | B | byte-reuse | `skills/prototype-logic/` | odin-current @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `purge-slop-docs` | B | byte-reuse | `skills/purge-slop-docs/` | odin-current @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `render-excalidraw-diagram` | B | byte-reuse | `skills/render-excalidraw-diagram/` | https://github.com/coleam00/excalidraw-diagram-skill @ `8646fcc9f74f38539c6cdb4c969723336a96ddcd` (NOASSERTION — no LICENSE/LICENSE.md/COPYING file exists; default all-rights-reserved) |
| `reorder` | B | byte-reuse | `skills/reorder/` | odin-current @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `reorder-respect-deliberate` | B | byte-reuse | `skills/reorder-respect-deliberate/` | https://github.com/LilMGenius/paperthin @ `3bca079a51bcfff5dafb53d1d7f9f523d66ee317` (MIT) |
| `rewrite-clean-v0` | B | byte-reuse | `skills/rewrite-clean-v0/` | odin-current @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `rewrite-denoise-v0` | B | byte-reuse | `skills/rewrite-denoise-v0/` | https://github.com/LilMGenius/paperthin @ `3bca079a51bcfff5dafb53d1d7f9f523d66ee317` (MIT) |
| `save-md` | B | byte-reuse | `skills/save-md/` | mblode/agent-skills @ `e97a3b383f5944f90d41eb92b24b4fb3b917a7f9` (MIT) |
| `sequence-diagram` | B | byte-reuse | `skills/sequence-diagram/` | https://github.com/tt-a1i/archify @ `b36d79fdbc3aec3728744341485a7e79f03c0071` (MIT) |
| `show-me` | B | byte-reuse | `skills/show-me/` | odin-current @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `show-way` | B | byte-reuse | `skills/show-way/` | project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `solidate` | B | byte-reuse | `skills/solidate/` | project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `state-machine-workflow` | B | byte-reuse | `skills/state-machine-workflow/` | project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `sync-docs` | B | byte-reuse | `skills/sync-docs/` | current-odin-skill-tree @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `taste` | B | byte-reuse | `skills/taste/` | current-odin-skill-tree @ `project-owned` (Project-owned or clean-room only; no copied source text)<br>current-odin-skill-tree @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `technical-writing` | B | byte-reuse | `skills/technical-writing/` | cursor/plugins @ `68836ddaf5697224520f1847d90cdb90ca8babaa` (MIT) |
| `visual-argument-diagram` | B | byte-reuse | `skills/visual-argument-diagram/` | https://github.com/coleam00/excalidraw-diagram-skill @ `8646fcc9f74f38539c6cdb4c969723336a96ddcd` (NOASSERTION — no LICENSE/LICENSE.md/COPYING file exists; default all-rights-reserved) |
| `visual-diagram` | B | byte-reuse | `skills/visual-diagram/` | nicobailon/visual-explainer @ `7163c3e10660912e0b89e1af465db9f387282b88` (MIT) |
| `visual-plan` | B | byte-reuse | `skills/visual-plan/` | nicobailon/visual-explainer @ `7163c3e10660912e0b89e1af465db9f387282b88` (MIT) |
| `visual-render-tool` | B | byte-reuse | `skills/visual-render-tool/` | nicobailon/visual-explainer @ `7163c3e10660912e0b89e1af465db9f387282b88` (MIT) |
| `visualise-chart` | B | byte-reuse | `skills/visualise-chart/` | https://github.com/bentossell/visualise @ `35cd185b58af5db2f9d0fe13d9872b544a467483` (MIT) |
| `visualise-diagram` | B | byte-reuse | `skills/visualise-diagram/` | https://github.com/bentossell/visualise @ `35cd185b58af5db2f9d0fe13d9872b544a467483` (MIT) |
| `visualise-widget` | B | byte-reuse | `skills/visualise-widget/` | https://github.com/bentossell/visualise @ `35cd185b58af5db2f9d0fe13d9872b544a467483` (MIT) |
| `workflow-diagram` | B | byte-reuse | `skills/workflow-diagram/` | https://github.com/tt-a1i/archify @ `b36d79fdbc3aec3728744341485a7e79f03c0071` (MIT) |
| `write-feature-docs` | B | byte-reuse | `skills/write-feature-docs/` | https://github.com/warpdotdev/common-skills @ `f589e224907eda566c13755529f59db563090d14` (MIT) |
| `write-prd` | B | byte-reuse | `skills/write-prd/` | warpdotdev/competitive-intelligence-agent-oss @ `9e0363e810a14405ef876fb354562735002797fb` (MIT) |
| `write-tech-spec` | B | byte-reuse | `skills/write-tech-spec/` | https://github.com/warpdotdev/common-skills @ `f589e224907eda566c13755529f59db563090d14` (MIT) |

