# ODIN Release

ODIN workflows for cutting, gating, publishing, and announcing releases.

13 skills, category Coding. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-release@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-release@odin-marketplace
```

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one with `/skill:<name>`.

| Skill | Trigger |
|---|---|
| autoship | Use when the user says release this, publish this package, or cut a release for a changesets-based npm package. |
| changelog-updates | Use when a release or a since-tag window needs user-facing release notes drafted. |
| cherrypick-to-release | Use when the user asks to cherry-pick, backport, or apply a hotfix to a release branch. |
| cut-new-release-candidate | Use when the user asks to cut, trigger, or start a release candidate for a release branch. |
| merge-and-deploy | Use when a human runs /merge-and-deploy to merge a PR and trigger or verify deployment. |
| open-source-license-selection | Use when the user asks to choose, reconcile, or apply an open-source license and package metadata. |
| open-source-readiness-audit | Use when the user asks whether a repository is ready for public release or wants a gap assessment. |
| post-release-status | Use when a user asks to post, update, or check cherry-pick status for a release as a single Slack Block Kit board. |
| prepare-repository-for-public-release | Use when asked to prepare a repository for public launch or open source it. |
| release-gate | Use when the user decides to ship a release as a signed tag or a redaction-gated PR. |
| release-landing-report | Use when the user runs /release-landing-report to summarize landed changes and return a landing summary report. |
| secure-npm-package | Use when creating or hardening an npm release with Trusted or Staged Publishing, including E404 packages sequenced after first publish. |
| shipping | Use when deploying to production, planning a feature release, setting up launch safeguards, or running a canary release. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
