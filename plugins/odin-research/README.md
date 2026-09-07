# ODIN Research

ODIN workflows for source-backed investigation, verification, and design rationale.

13 skills, category Research. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-research@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-research@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-research/skills/<skill> \
  --agent <agent> --scope user
```

`<agent>` is `claude-code`, `codex`, `cursor`, `grok`, or `kimi-cli`.

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-research:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| deep-research | Use when the user asks to research a topic and produce a thorough sourced report. |
| drift-detect | Use when roadmap, plans, or docs may have drifted from code, or when restarting a stalled project. |
| genealogical-proof | Use when a genealogical identity or relationship needs correlation, conflict analysis, and negative-search proof. |
| github-solution-research | Use when a bug, integration failure, dependency issue, unclear API usage, implementation blocker, or tool-capability need calls for GitHub solutions. |
| ground-latest | Use when starting or scaffolding a codebase or service, migrating, refactoring, or picking language, framework, or dependency, or latest, LTS, or modern way. |
| how | Use when the user asks "how does X work" and wants an architecture walkthrough of the code path or subsystem, including its gotchas. |
| readout | Use when a user wants a readable, shareable HTML document of findings. |
| repo-qa-investigate | Use when a research-backed answer requires codebase and docs investigation, reading many files, or a wide survey. |
| research | Use when researching a named library, framework, SDK, API, or service, or finding a migration guide. |
| scrape | Use when the user runs /scrape with a URL to extract page data and media through a browser and save assets with a manifest locally. |
| summarize-document-set | Use when the user asks to summarize a set of documents, identify themes and conflicts across multiple files, or synthesize internal docs. |
| verify-both-ways | Use when a claim needs checking both ways, "fact-check this", or an artifact or HTML document needs claims verified and corrected in place. |
| why | Use when asked why something works this way, for design rationale, a postmortem, a data-backed threshold, or a source-tiered evidence report. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
