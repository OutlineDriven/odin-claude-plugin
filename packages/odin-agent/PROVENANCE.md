# Provenance — @outlinedriven/odin-agent

OutlineDriven-authored material in this package is Apache-2.0. See the repository `LICENSE`.

This package ships 57 public skills from the canonical `skills/<slug>/` tree. Package-local skill copies are generated only at pack time.

| Skill | Strategy | Adaptation | Target | Origin |
|---|---|---|---|---|
| `agents-md` | G | structured-merge-rewrite | `skills/agents-md/` | mblode/agent-skills @ `e97a3b383f5944f90d41eb92b24b4fb3b917a7f9` (MIT)<br>mcollina/skills @ `856efd268ae85482d882f3d0bed869fd020b5c06` (MIT)<br>getsentry/skills @ `c2f99a5b04b4cd992ec3022d7c2c3e23e938d241` (Apache-2.0) |
| `audit-loop-scaffold` | G | structured-merge-rewrite | `skills/audit-loop-scaffold/` | cobusgreyling/loop-engineering @ `d03dcb92cc1e0efb59789a2557131c6ad5897ccc` (MIT) |
| `automate-me` | B | byte-reuse | `skills/automate-me/` | cursor/plugins @ `68836ddaf5697224520f1847d90cdb90ca8babaa` (MIT) |
| `ax-audit` | B | byte-reuse | `skills/ax-audit/` | mblode/agent-skills @ `e97a3b383f5944f90d41eb92b24b4fb3b917a7f9` (MIT) |
| `book-to-skill` | B | byte-reuse | `skills/book-to-skill/` | odin-1.x-current-skill @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `cascade-dedup` | B | byte-reuse | `skills/cascade-dedup/` | odin-1.x-current-skill @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `cheapen-with-gates` | B | byte-reuse | `skills/cheapen-with-gates/` | https://github.com/obra/superpowers @ `b36e0829c6d0140e93cfef2ca599b1b07d4a7797` (MIT) |
| `check-agent-compatibility` | B | byte-reuse | `skills/check-agent-compatibility/` | cursor/plugins @ `68836ddaf5697224520f1847d90cdb90ca8babaa` (MIT) |
| `claude-settings-audit` | B | byte-reuse | `skills/claude-settings-audit/` | getsentry/skills @ `c2f99a5b04b4cd992ec3022d7c2c3e23e938d241` (Apache-2.0) |
| `cli-for-agents` | B | byte-reuse | `skills/cli-for-agents/` | cursor/plugins @ `68836ddaf5697224520f1847d90cdb90ca8babaa` (MIT) |
| `create-plugin-scaffold` | B | byte-reuse | `skills/create-plugin-scaffold/` | cursor/plugins @ `68836ddaf5697224520f1847d90cdb90ca8babaa` (MIT) |
| `cursor-sdk` | B | byte-reuse | `skills/cursor-sdk/` | cursor/plugins @ `68836ddaf5697224520f1847d90cdb90ca8babaa` (MIT) |
| `dedup-skills` | B | byte-reuse | `skills/dedup-skills/` | odin-1.x-current-skill @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `enhance` | B | byte-reuse | `skills/enhance/` | odin-1.x-current-skill @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `factory-mcp-bootstrap` | B | byte-reuse | `skills/factory-mcp-bootstrap/` | https://github.com/warpdotdev/warp-factories-skills @ `d91db3403d27c85adf2a57bd642047e29e98a51a` (no-explicit-license) |
| `fixture-eval-harness` | B | byte-reuse | `skills/fixture-eval-harness/` | https://github.com/microsoft/skill-recorder @ `c7f2fe4402527a0eb7f4fc1b653bf438229bac61` (MIT) |
| `generate-my-taste` | B | byte-reuse | `skills/generate-my-taste/` | odin-1.x-current-skill @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `git-guardrails` | G | structured-merge-rewrite | `skills/git-guardrails/` | Origin: `odin-current`, source path `skills/setup-git-guardrails/SKILL.md`, candidate `current:current-c:current:setup-git-guardrails`. No pinned upstream revision. License: project-owned; no third-party license applies. Adapted from the odin-current skill body into this section order; `scripts/block-dangerous-git.py` is retained verbatim from the same candidate. |
| `goal-prompt-drafting` | B | byte-reuse | `skills/goal-prompt-drafting/` | https://github.com/trailofbits/skills @ `d1f1575cff97816e5cc08af66cd2506099c681d3` (CC-BY-SA-4.0; source https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3; preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding.) |
| `handoff-prompt` | B | byte-reuse | `skills/handoff-prompt/` | https://github.com/openclaw/agent-skills @ `ae75f60e8d454f1cf44ec4613e10ec9ea7f2ade7` (MIT) |
| `harness-port-guide` | B | byte-reuse | `skills/harness-port-guide/` | https://github.com/obra/superpowers @ `b36e0829c6d0140e93cfef2ca599b1b07d4a7797` (MIT) |
| `humansense2system` | B | byte-reuse | `skills/humansense2system/` | project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `inits` | R | rename-only | `skills/inits/` | Adapted from the project-owned ODIN 1.x `init` skill at `skills/init/SKILL.md` (candidate `current:current-b:current:init`). No source revision or license identifier was supplied. This clean adaptation retains the normative-first admission gate, the non-derivability test, evidence from files actually read, descriptive-line removal, and the prohibition on fabricated rules or rationale. |
| `instruction-phrasing-microtest` | B | byte-reuse | `skills/instruction-phrasing-microtest/` | https://github.com/obra/superpowers @ `b36e0829c6d0140e93cfef2ca599b1b07d4a7797` (MIT) |
| `keep-why-autostart-examples` | B | byte-reuse | `skills/keep-why-autostart-examples/` | https://github.com/oliver-zehentleitner/keep-the-why @ `c01597a506efa24652d7ecb9e18b6a8ccc97b175` (MIT) |
| `llm-self-loop` | B | byte-reuse | `skills/llm-self-loop/` | odin-1.x-current-skill @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `lockstep-version-guard` | B | byte-reuse | `skills/lockstep-version-guard/` | nicobailon/visual-explainer @ `7163c3e10660912e0b89e1af465db9f387282b88` (MIT) |
| `mcp-builder` | B | byte-reuse | `skills/mcp-builder/` | https://github.com/warpdotdev/oz-skills @ `6c08c49fc6c51b8f768bf8c53c041bc06a160765` (Apache-2.0) |
| `native-capability-catalogue` | B | byte-reuse | `skills/native-capability-catalogue/` | https://github.com/microsoft/skill-recorder @ `c7f2fe4402527a0eb7f4fc1b653bf438229bac61` (MIT) |
| `plan-review-tune` | G | structured-merge-rewrite | `skills/plan-review-tune/` | Origin: https://github.com/garrytan/gstack at revision 07b59e396c6be5a86619a43151cb9ed62a15ae69, path plan-tune/SKILL.md. License: MIT, Copyright (c) 2026 Garry Tan. Clean-room adaptation: the per-question preference vocabulary, dual-track developer profile, and question-tuning enable/disable mechanism are re-derived; no source expression is copied. |
| `prohibit-bad-habits` | B | byte-reuse | `skills/prohibit-bad-habits/` | project-owned:user-supplied-source-brief @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `prompt-optimizer` | B | byte-reuse | `skills/prompt-optimizer/` | getsentry/skills @ `c2f99a5b04b4cd992ec3022d7c2c3e23e938d241` (Apache-2.0) |
| `reflect` | B | byte-reuse | `skills/reflect/` | cursor/plugins @ `68836ddaf5697224520f1847d90cdb90ca8babaa` (MIT) |
| `retro` | B | byte-reuse | `skills/retro/` | mattpocock/skills @ `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76` (MIT) |
| `review-plugin-submission` | B | byte-reuse | `skills/review-plugin-submission/` | cursor/plugins @ `68836ddaf5697224520f1847d90cdb90ca8babaa` (MIT) |
| `setup` | B | byte-reuse | `skills/setup/` | warpdotdev/competitive-intelligence-agent-oss @ `9e0363e810a14405ef876fb354562735002797fb` (MIT) |
| `setup-benny` | B | byte-reuse | `skills/setup-benny/` | cursor/plugins @ `68836ddaf5697224520f1847d90cdb90ca8babaa` (MIT) |
| `setup-pstack` | B | byte-reuse | `skills/setup-pstack/` | cursor/plugins @ `68836ddaf5697224520f1847d90cdb90ca8babaa` (MIT) |
| `skill-benchmark` | R | rename-only | `skills/skill-benchmark/` | Adapted from garrytan/gstack benchmark/SKILL.md at revision 07b59e396c6be5a86619a43151cb9ed62a15ae69 (MIT, Copyright (c) 2026 Garry Tan). Clean-room re-derivation: the source measures web page performance via a browse daemon; this skill measures agent skill quality via LLM judges. Preserved mechanisms: baseline capture, relative-threshold regression detection, trend analysis, graded report, read-only non-mutation. Copyright and permission notice retained per MIT. |
| `skill-benchmark-gate` | B | byte-reuse | `skills/skill-benchmark-gate/` | mcollina/skills @ `856efd268ae85482d882f3d0bed869fd020b5c06` (MIT) |
| `skill-creator` | G | structured-merge-rewrite | `skills/skill-creator/` | Origin: https://github.com/garrytan/gstack, revision 07b59e396c6be5a86619a43151cb9ed62a15ae69, file `skillify/SKILL.md`. License: MIT, Copyright (c) 2026 Garry Tan. Clean-room adaptation: expressive prose and procedure re-derived from the source mechanism; no third-party expression copied wholesale. The iron contract (temp-dir stage, test gate, approval gate, atomic commit or discard) and the pure-parser-with-fixture-test pattern are preserved as the distinguishing source mechanisms. |
| `skill-doctor` | B | byte-reuse | `skills/skill-doctor/` | https://github.com/warpdotdev/common-skills @ `f589e224907eda566c13755529f59db563090d14` (MIT) |
| `skill-model-benchmark` | R | rename-only | `skills/skill-model-benchmark/` | Adapted from `benchmark-models/SKILL.md` in github.com/garrytan/gstack at revision 07b59e396c6be5a86619a43151cb9ed62a15ae69 (MIT, Copyright (c) 2026 Garry Tan). Expressive prose and procedure re-derived; the gstack model-versus-model comparison mechanism preserved. Copyright and permission notice retained per the MIT reuse constraints. |
| `skill-plan-first-builder` | B | byte-reuse | `skills/skill-plan-first-builder/` | https://github.com/microsoft/skill-recorder @ `c7f2fe4402527a0eb7f4fc1b653bf438229bac61` (MIT) |
| `skill-progressive-disclosure-design` | B | byte-reuse | `skills/skill-progressive-disclosure-design/` | samber/cc-skills @ `f9953962e135235137628ea92d06ea085688031f` (MIT) |
| `skill-scanner` | B | byte-reuse | `skills/skill-scanner/` | getsentry/skills @ `c2f99a5b04b4cd992ec3022d7c2c3e23e938d241` (Apache-2.0) |
| `skill-writer` | B | byte-reuse | `skills/skill-writer/` | getsentry/skills @ `c2f99a5b04b4cd992ec3022d7c2c3e23e938d241` (Apache-2.0) |
| `skills-visibility` | B | byte-reuse | `skills/skills-visibility/` | https://github.com/evilmartians/agent-skills @ `a2a83b280a2c5b9a6176c5934298fad0224bbce4` (MIT) |
| `snyk-agent-scan-compliance` | B | byte-reuse | `skills/snyk-agent-scan-compliance/` | samber/cc-skills @ `f9953962e135235137628ea92d06ea085688031f` (MIT) |
| `testing-handbook-generator` | B | byte-reuse | `skills/testing-handbook-generator/` | https://github.com/trailofbits/skills @ `d1f1575cff97816e5cc08af66cd2506099c681d3` (CC-BY-SA-4.0; source https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3; preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding.) |
| `toolchain-health` | R | rename-only | `skills/toolchain-health/` | Origin: https://github.com/garrytan/gstack, revision 07b59e396c6be5a86619a43151cb9ed62a15ae69, file health/SKILL.md. License MIT, copyright "Copyright (c) 2026 Garry Tan", retained per the license notice. Clean-room adaptation: the toolchain auto-detection, per-category 0–10 scoring, weighted composite with weight redistribution, status-labeled dashboard, and ranked-repairs mechanism are re-derived; the green/yellow/red verdict and read-only installation-audit framing are adapted for this skill; no source expression is copied wholesale. |
| `upgrade-catalog` | G | structured-merge-rewrite | `skills/upgrade-catalog/` | https://github.com/LilMGenius/paperthin @ `3bca079a51bcfff5dafb53d1d7f9f523d66ee317` (MIT) |
| `validation-self-audit` | B | byte-reuse | `skills/validation-self-audit/` | https://github.com/LilMGenius/paperthin @ `3bca079a51bcfff5dafb53d1d7f9f523d66ee317` (MIT) |
| `watch-for-harness-mode` | B | byte-reuse | `skills/watch-for-harness-mode/` | project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `workspace-unfreeze` | G | structured-merge-rewrite | `skills/workspace-unfreeze/` | Adapted from the gstack freeze/unfreeze guardrail (https://github.com/garrytan/gstack, revision 07b59e396c6be5a86619a43151cb9ed62a15ae69, source path unfreeze/SKILL.md). License MIT, copyright (c) 2026 Garry Tan (LICENSE blob sha 35029511144443297cad2d26e4bac17d0e352f93). This is a clean-room re-derivation of the procedure; no third-party expression is copied verbatim. |
| `writing-for-agents` | B | byte-reuse | `skills/writing-for-agents/` | mattpocock/skills @ `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76` (MIT) |
| `writing-skills` | G | structured-merge-rewrite | `skills/writing-skills/` | current-odin-skill-tree @ `project-owned` (Project-owned or clean-room only; no copied source text)<br>https://github.com/obra/superpowers @ `b36e0829c6d0140e93cfef2ca599b1b07d4a7797` (MIT) |

