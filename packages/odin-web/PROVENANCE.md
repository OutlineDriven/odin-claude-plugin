# Provenance — @outlinedriven/odin-web

OutlineDriven-authored material in this package is Apache-2.0. See the repository `LICENSE`.

This package ships 9 public skills from the canonical `skills/<slug>/` tree. Package-local skill copies are generated only at pack time.

| Skill | Strategy | Adaptation | Target | Origin |
|---|---|---|---|---|
| `browser-testing` | M | move-only | `skills/browser-testing/` | odin-1.x-current-skill @ `project-owned` (Project-owned or clean-room only; no copied source text)<br>addyosmani/agent-skills @ `d2c37ef6225dd8726cdd369a8030307f48592d26` (MIT) |
| `changed-route-browser-testing` | R | rename-only | `skills/changed-route-browser-testing/` | Origin: https://github.com/EveryInc/compound-engineering-plugin, revision a1f601f17137f648be439965f8fdd9123303de5d, file skills/ce-test-browser/SKILL.md. License: MIT (Copyright (c) 2025 Every). Mechanisms extracted and rewritten in ODIN style, not copied verbatim; the obligation reduces to preserving attribution in the root provenance ledger. |
| `chrome-extension` | M | move-only | `skills/chrome-extension/` | samber/cc-skills @ `f9953962e135235137628ea92d06ea085688031f` (MIT) |
| `diff-scoped-browser-qa` | R | rename-only | `skills/diff-scoped-browser-qa/` | - Origin: https://github.com/EveryInc/compound-engineering-plugin, `skills/ce-dogfood/SKILL.md`. - Pinned revision: `a1f601f17137f648be439965f8fdd9123303de5d`. - License: MIT (Copyright (c) 2025 Every). Mechanisms extracted and rewritten in ODIN style, not copied verbatim; attribution is preserved in the root provenance ledger. - Adaptation: the phase, matrix, report-template, isolation, and fix-loop mechanics that the source delegated to reference files and peer CE skills are inlined here so the skill is self-contained with no runtime peer dependency. |
| `llms-visibility` | M | move-only | `skills/llms-visibility/` | https://github.com/evilmartians/agent-skills @ `a2a83b280a2c5b9a6176c5934298fad0224bbce4` (MIT) |
| `seo-aeo-audit` | M | move-only | `skills/seo-aeo-audit/` | https://github.com/warpdotdev/oz-skills @ `6c08c49fc6c51b8f768bf8c53c041bc06a160765` (MIT) |
| `site-launch-checklist` | M | move-only | `skills/site-launch-checklist/` | samber/cc-skills @ `f9953962e135235137628ea92d06ea085688031f` (MIT) |
| `web-performance-audit` | M | move-only | `skills/web-performance-audit/` | https://github.com/warpdotdev/oz-skills @ `6c08c49fc6c51b8f768bf8c53c041bc06a160765` (MIT) |
| `webapp-testing` | M | move-only | `skills/webapp-testing/` | https://github.com/warpdotdev/oz-skills @ `6c08c49fc6c51b8f768bf8c53c041bc06a160765` (Apache-2.0) |

