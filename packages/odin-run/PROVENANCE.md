# Provenance — @outlinedriven/odin-run

OutlineDriven-authored material in this package is Apache-2.0. See the repository `LICENSE`.

This package ships 81 public skills from the canonical `skills/<slug>/` tree. Package-local skill copies are generated only at pack time.

| Skill | Strategy | Adaptation | Target | Origin |
|---|---|---|---|---|
| `append-run-log` | B | byte-reuse | `skills/append-run-log/` | cobusgreyling/loop-engineering @ `d03dcb92cc1e0efb59789a2557131c6ad5897ccc` (MIT) |
| `atomic-issues-prs` | B | byte-reuse | `skills/atomic-issues-prs/` | odin-1.x-current-skill @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `autobahn` | B | byte-reuse | `skills/autobahn/` | odin-1.x-current-skill @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `autoship` | B | byte-reuse | `skills/autoship/` | mblode/agent-skills @ `e97a3b383f5944f90d41eb92b24b4fb3b917a7f9` (MIT) |
| `babysit` | B | byte-reuse | `skills/babysit/` | project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `browser-cookie-store` | R | rename-only | `skills/browser-cookie-store/` | - Origin: https://github.com/garrytan/gstack, path setup-browser-cookies/SKILL.md. - Revision: 07b59e396c6be5a86619a43151cb9ed62a15ae69. - License: MIT, Copyright (c) 2026 Garry Tan; retain the copyright and permission notice in copies. - Adaptation: clean-room re-derivation of the cookie-import procedure; no third-party expressive prose copied. |
| `browser-qa` | G | structured-merge-rewrite | `skills/browser-qa/` | Adapted from the QA pass in https://github.com/garrytan/gstack (revision 07b59e396c6be5a86619a43151cb9ed62a15ae69), licensed MIT (Copyright (c) 2026 Garry Tan). Clean-room re-derivation of the report-only variant that skips the fix loop; no upstream expression copied wholesale. |
| `canary-deploy` | R | rename-only | `skills/canary-deploy/` | Origin: https://github.com/garrytan/gstack, path canary/SKILL.md, revision 07b59e396c6be5a86619a43151cb9ed62a15ae69. License: MIT (Copyright (c) 2026 Garry Tan), blob 35029511144443297cad2d26e4bac17d0e352f93. Clean-room adaptation: the canary deploy, metric watch, and promote-or-rollback-with-evidence mechanism is re-derived, not copied. |
| `cherrypick-to-release` | B | byte-reuse | `skills/cherrypick-to-release/` | https://github.com/warpdotdev/client-release-agent-oss @ `9c1394804c5148820a9bab6c01802fde4330d725` (MIT) |
| `chrome-mcp-troubleshooting` | B | byte-reuse | `skills/chrome-mcp-troubleshooting/` | https://github.com/trailofbits/skills @ `d1f1575cff97816e5cc08af66cd2506099c681d3` (CC-BY-SA-4.0; source https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3; preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding.) |
| `close-done` | B | byte-reuse | `skills/close-done/` | project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `create-pull-request` | B | byte-reuse | `skills/create-pull-request/` | https://github.com/warpdotdev/oz-skills @ `6c08c49fc6c51b8f768bf8c53c041bc06a160765` (MIT) |
| `cut-new-release-candidate` | B | byte-reuse | `skills/cut-new-release-candidate/` | https://github.com/warpdotdev/client-release-agent-oss @ `9c1394804c5148820a9bab6c01802fde4330d725` (MIT) |
| `cycle-memo` | B | byte-reuse | `skills/cycle-memo/` | https://github.com/LilMGenius/paperthin @ `3bca079a51bcfff5dafb53d1d7f9f523d66ee317` (MIT) |
| `deployment-setup` | R | rename-only | `skills/deployment-setup/` | Adapted from the `setup-deploy` skill in github.com/garrytan/gstack at revision 07b59e396c6be5a86619a43151cb9ed62a15ae69 (MIT, Copyright (c) 2026 Garry Tan). Expressive prose and code were re-derived; no third-party expression was copied wholesale. |
| `do-it-now` | B | byte-reuse | `skills/do-it-now/` | odin-1.x-current-skill @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `duet` | B | byte-reuse | `skills/duet/` | odin-1.x-current-skill @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `fail-recover` | B | byte-reuse | `skills/fail-recover/` | project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `finish-branch-menu` | B | byte-reuse | `skills/finish-branch-menu/` | https://github.com/obra/superpowers @ `b36e0829c6d0140e93cfef2ca599b1b07d4a7797` (MIT) |
| `fix-p0-issues` | B | byte-reuse | `skills/fix-p0-issues/` | warpdotdev/competitive-intelligence-agent-oss @ `9e0363e810a14405ef876fb354562735002797fb` (MIT) |
| `gate-and-merge` | G | structured-merge-rewrite | `skills/gate-and-merge/` | odin-1.x-current-skill @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `gh-review-requests` | B | byte-reuse | `skills/gh-review-requests/` | getsentry/skills @ `c2f99a5b04b4cd992ec3022d7c2c3e23e938d241` (Apache-2.0) |
| `git-cleanup` | B | byte-reuse | `skills/git-cleanup/` | https://github.com/trailofbits/skills @ `d1f1575cff97816e5cc08af66cd2506099c681d3` (CC-BY-SA-4.0; source https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3; preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding.) |
| `git-workflow-and-versioning` | B | byte-reuse | `skills/git-workflow-and-versioning/` | addyosmani/agent-skills @ `d2c37ef6225dd8726cdd369a8030307f48592d26` (MIT) |
| `github-backlog-triage` | B | byte-reuse | `skills/github-backlog-triage/` | https://github.com/trailofbits/skills @ `d1f1575cff97816e5cc08af66cd2506099c681d3` (CC-BY-SA-4.0; source https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3; preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding.) |
| `github-bug-report-triage` | B | byte-reuse | `skills/github-bug-report-triage/` | https://github.com/warpdotdev/oz-skills @ `6c08c49fc6c51b8f768bf8c53c041bc06a160765` (MIT) |
| `github-gh-cli-operations` | B | byte-reuse | `skills/github-gh-cli-operations/` | mcollina/skills @ `856efd268ae85482d882f3d0bed869fd020b5c06` (MIT) |
| `github-issue-dedupe` | B | byte-reuse | `skills/github-issue-dedupe/` | https://github.com/warpdotdev/oz-skills @ `6c08c49fc6c51b8f768bf8c53c041bc06a160765` (MIT) |
| `goal-init` | B | byte-reuse | `skills/goal-init/` | cobusgreyling/loop-engineering @ `d03dcb92cc1e0efb59789a2557131c6ad5897ccc` (MIT) |
| `guardrail-carve-run` | B | byte-reuse | `skills/guardrail-carve-run/` | https://github.com/LilMGenius/paperthin @ `3bca079a51bcfff5dafb53d1d7f9f523d66ee317` (MIT) |
| `implement-spec` | B | byte-reuse | `skills/implement-spec/` | mattpocock/skills @ `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76` (MIT) |
| `interactive-drop-selector` | B | byte-reuse | `skills/interactive-drop-selector/` | project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `issue-intake` | R | rename-only | `skills/issue-intake/` | Origin: https://github.com/garrytan/gstack at revision 07b59e396c6be5a86619a43151cb9ed62a15ae69. License: MIT (Copyright (c) 2026 Garry Tan). Adaptation: clean-room re-derivation of the interrogation-through-redaction-gates-into-a-filed-issue-with-optional-worktree-implementer mechanism; no third-party expressive prose or code copied. |
| `issue-now` | B | byte-reuse | `skills/issue-now/` | project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `issue-triage` | G | structured-merge-rewrite | `skills/issue-triage/` | cobusgreyling/loop-engineering @ `d03dcb92cc1e0efb59789a2557131c6ad5897ccc` (MIT) |
| `land-contribution` | B | byte-reuse | `skills/land-contribution/` | https://github.com/LilMGenius/paperthin @ `3bca079a51bcfff5dafb53d1d7f9f523d66ee317` (MIT) |
| `loop-me` | G | structured-merge-rewrite | `skills/loop-me/` | odin-1.x-current-skill @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `make-pr-easy-to-review` | B | byte-reuse | `skills/make-pr-easy-to-review/` | cursor/plugins @ `68836ddaf5697224520f1847d90cdb90ca8babaa` (MIT) |
| `new-branch-and-pr` | B | byte-reuse | `skills/new-branch-and-pr/` | cursor/plugins @ `68836ddaf5697224520f1847d90cdb90ca8babaa` (MIT) |
| `new-space` | B | byte-reuse | `skills/new-space/` | project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `next-best-action` | B | byte-reuse | `skills/next-best-action/` | https://github.com/LilMGenius/paperthin @ `3bca079a51bcfff5dafb53d1d7f9f523d66ee317` (MIT) |
| `notion-writer` | B | byte-reuse | `skills/notion-writer/` | warpdotdev/competitive-intelligence-agent-oss @ `9e0363e810a14405ef876fb354562735002797fb` (MIT) |
| `open-source-license-selection` | B | byte-reuse | `skills/open-source-license-selection/` | https://github.com/trailofbits/skills @ `d1f1575cff97816e5cc08af66cd2506099c681d3` (CC-BY-SA-4.0; source https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3; preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding.) |
| `planning` | B | byte-reuse | `skills/planning/` | mblode/agent-skills @ `e97a3b383f5944f90d41eb92b24b4fb3b917a7f9` (MIT) |
| `post-daily-new-issues` | B | byte-reuse | `skills/post-daily-new-issues/` | https://github.com/warpdotdev/client-release-agent-oss @ `9c1394804c5148820a9bab6c01802fde4330d725` (MIT) |
| `post-merge-cleanup` | B | byte-reuse | `skills/post-merge-cleanup/` | cobusgreyling/loop-engineering @ `d03dcb92cc1e0efb59789a2557131c6ad5897ccc` (MIT) |
| `post-release-status` | B | byte-reuse | `skills/post-release-status/` | https://github.com/warpdotdev/client-release-agent-oss @ `9c1394804c5148820a9bab6c01802fde4330d725` (MIT) |
| `post-to-slack` | B | byte-reuse | `skills/post-to-slack/` | warpdotdev/competitive-intelligence-agent-oss @ `9e0363e810a14405ef876fb354562735002797fb` (MIT) |
| `pr-link-issue` | B | byte-reuse | `skills/pr-link-issue/` | getsentry/skills @ `c2f99a5b04b4cd992ec3022d7c2c3e23e938d241` (Apache-2.0) |
| `prepare-repository-for-public-release` | B | byte-reuse | `skills/prepare-repository-for-public-release/` | https://github.com/trailofbits/skills @ `d1f1575cff97816e5cc08af66cd2506099c681d3` (CC-BY-SA-4.0; source https://github.com/trailofbits/skills/tree/d1f1575cff97816e5cc08af66cd2506099c681d3; preserve Trail of Bits attribution and source link, mark modifications, license adaptations ShareAlike, claim no trademark rights, and never reuse trail-of-bits-mark.svg as branding.) |
| `propose-issue` | B | byte-reuse | `skills/propose-issue/` | odin-current @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `publish-branch` | G | structured-merge-rewrite | `skills/publish-branch/` | Origin: ODIN 1.x `commit-push-current` skill (`skills/commit-push-current/SKILL.md`). Revision: unpinned (current). License: project-owned. Adaptation: restated to the ODIN 2.0 contract format with the complete atomic-commit mechanism inlined (concern grouping, revert test, mechanism split via filtered patch and `git apply --cached` with first-split confirmation, sweep and build-order rules, native verification gate, named-file staging over `git add -A`, heredoc message preservation, post-commit status and hash proof), cross-skill pointers removed, and the human-only invocation gate and push-to-origin contract added. |
| `publish-pr` | G | structured-merge-rewrite | `skills/publish-pr/` | Adapted from `getsentry/skills`, path `skills/pr-writer/SKILL.md`, pinned at revision `c2f99a5b04b4cd992ec3022d7c2c3e23e938d241` under Apache-2.0. This version preserves the `gh`-based remote PR creation and update mechanism, draft publication boundary, conventional title, concise reviewer-facing body, and optional review aids while restating the procedure for this contract. |
| `release-gate` | B | byte-reuse | `skills/release-gate/` | https://github.com/LilMGenius/paperthin @ `3bca079a51bcfff5dafb53d1d7f9f523d66ee317` (MIT) |
| `release-landing-report` | R | rename-only | `skills/release-landing-report/` | Origin: https://github.com/garrytan/gstack at revision 07b59e396c6be5a86619a43151cb9ed62a15ae69. License: MIT, Copyright (c) 2026 Garry Tan. Adapted clean-room from landing-report/SKILL.md: the landed-change summarizing mechanism is re-derived, not copied wholesale. |
| `repo-health-triage` | B | byte-reuse | `skills/repo-health-triage/` | cobusgreyling/loop-engineering @ `d03dcb92cc1e0efb59789a2557131c6ad5897ccc` (MIT) |
| `resolve` | B | byte-reuse | `skills/resolve/` | odin-current @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `resolve-pr-feedback` | G | structured-merge-rewrite | `skills/resolve-pr-feedback/` | odin-current @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `respond-to-pr-comments-in-blocklist` | B | byte-reuse | `skills/respond-to-pr-comments-in-blocklist/` | https://github.com/warpdotdev/common-skills @ `f589e224907eda566c13755529f59db563090d14` (MIT) |
| `respond-to-slack-thread` | B | byte-reuse | `skills/respond-to-slack-thread/` | https://github.com/warpdotdev/client-release-agent-oss @ `9c1394804c5148820a9bab6c01802fde4330d725` (MIT) |
| `review-and-ship` | B | byte-reuse | `skills/review-and-ship/` | cursor/plugins @ `68836ddaf5697224520f1847d90cdb90ca8babaa` (MIT) |
| `scheduler` | B | byte-reuse | `skills/scheduler/` | https://github.com/warpdotdev/oz-skills @ `6c08c49fc6c51b8f768bf8c53c041bc06a160765` (MIT) |
| `secure-npm-package` | B | byte-reuse | `skills/secure-npm-package/` | https://github.com/evilmartians/agent-skills @ `a2a83b280a2c5b9a6176c5934298fad0224bbce4` (MIT) |
| `seed-casebook` | B | byte-reuse | `skills/seed-casebook/` | https://github.com/LilMGenius/paperthin @ `3bca079a51bcfff5dafb53d1d7f9f523d66ee317` (MIT) |
| `session-resurrection` | B | byte-reuse | `skills/session-resurrection/` | project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `setup-release-tooling` | B | byte-reuse | `skills/setup-release-tooling/` | https://github.com/warpdotdev/client-release-agent-oss @ `9c1394804c5148820a9bab6c01802fde4330d725` (MIT) |
| `setup-repo-skills` | B | byte-reuse | `skills/setup-repo-skills/` | mattpocock/skills @ `6654f6b60cd9d5be8b54c6fafe44346dabeb3b76` (MIT) |
| `shipping` | B | byte-reuse | `skills/shipping/` | odin-current @ `project-owned` (Project-owned or clean-room only; no copied source text)<br>addyosmani/agent-skills @ `d2c37ef6225dd8726cdd369a8030307f48592d26` (MIT) |
| `show-me-your-work` | B | byte-reuse | `skills/show-me-your-work/` | cursor/plugins @ `68836ddaf5697224520f1847d90cdb90ca8babaa` (MIT) |
| `size-the-run` | G | structured-merge-rewrite | `skills/size-the-run/` | current-odin-skill-tree @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `sred-project-organizer` | B | byte-reuse | `skills/sred-project-organizer/` | getsentry/skills @ `c2f99a5b04b4cd992ec3022d7c2c3e23e938d241` (Apache-2.0) |
| `sred-work-summary` | B | byte-reuse | `skills/sred-work-summary/` | getsentry/skills @ `c2f99a5b04b4cd992ec3022d7c2c3e23e938d241` (Apache-2.0) |
| `unlazy` | B | byte-reuse | `skills/unlazy/` | current-odin-skill-tree @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `watch-for` | B | byte-reuse | `skills/watch-for/` | project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `watch-for-structured` | B | byte-reuse | `skills/watch-for-structured/` | project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `weekly-wynk` | B | byte-reuse | `skills/weekly-wynk/` | warpdotdev/competitive-intelligence-agent-oss @ `9e0363e810a14405ef876fb354562735002797fb` (MIT) |
| `wizard` | B | byte-reuse | `skills/wizard/` | current-odin-skill-tree @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `wontfix` | B | byte-reuse | `skills/wontfix/` | project-owned:user-curated-skill-ideas @ `project-owned` (Project-owned or clean-room only; no copied source text) |
| `work` | G | structured-merge-rewrite | `skills/work/` | current-odin-skill-tree @ `project-owned` (Project-owned or clean-room only; no copied source text)<br>https://github.com/obra/superpowers @ `b36e0829c6d0140e93cfef2ca599b1b07d4a7797` (MIT) |
| `write-google-doc` | B | byte-reuse | `skills/write-google-doc/` | warpdotdev/competitive-intelligence-agent-oss @ `9e0363e810a14405ef876fb354562735002797fb` (MIT) |
| `write-pr-description` | B | byte-reuse | `skills/write-pr-description/` | https://github.com/warpdotdev/common-skills @ `f589e224907eda566c13755529f59db563090d14` (MIT) |

