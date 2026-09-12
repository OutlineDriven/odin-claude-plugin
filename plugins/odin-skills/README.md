# ODIN Skills

ODIN workflows for authoring, auditing, benchmarking, and publishing agent skills.

21 skills, category Productivity. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-skills@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-skills@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-skills/skills/<skill> \
  --agent <agent> --scope user
```

`<agent>` is `claude-code`, `codex`, `cursor`, `grok`, or `kimi-cli`.

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-skills:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| agent-surface-forge | Use when asked to audit or repair agent surfaces (plugins, agents, skills, CLAUDE.md/AGENTS.md, docs, prompts, commands, hooks) or improve one skill at depth. |
| automate-me | Use when asked to create or refresh a personal mode skill and open a reviewable PR. |
| book-to-skill | Use when the user names one book, course, paper, or source document and asks to distill it into a reusable skill. |
| cascade-dedup | Use when prompt-doctrine is duplicated, drifted, or conflicting across output-style embeds and external harness AGENTS files. |
| create-plugin-scaffold | Use when asked to create a local agent-plugin directory tree or marketplace package. |
| dedup-skills | Use when asked to deduplicate a skill tree, fold overlapping skills, or cut the skill count: analyze, gate per family, then fold. |
| generate-my-taste | Use when asked to generate a personal taste skill from local evidence. |
| humansense2system | Use when the user wants to compile taste and "this feels wrong" signals into machine-consumable tokens, rules, forbidden combinations, and examples. |
| instruction-phrasing-microtest | Use when changing the wording of a rule in a skill, prompt template, or agent instruction where the change is meant to alter model output. |
| lockstep-version-guard | Use when a human invokes the release gate to prove every ODIN plugin shares one canonical version. |
| model-challenge | Use when a user requests an independent Codex or Gemini review of uncommitted code, a branch diff, or a specific commit. |
| model-retuning | Use when asked to run /model-retuning to retune a skill corpus for a new model, measurement-first. |
| prompt-optimizer | Use when asked to improve, optimize, rewrite, tune, or port a prompt, skill, or tool description. |
| reflect | Use when a completed task needs reflection on invoked skills to propose and apply approved improvements. |
| retaxonomize-plugins | Use when skills must move between plugins, or plugins be created, merged, or retired. |
| review-plugin-submission | Use when asked to review a plugin for marketplace readiness via a read-only audit of published quality gates. |
| skill-benchmark | Use when the user runs /skill-benchmark to score skills, compare models, or gate a skill release. |
| skill-scanner | Use when a user asks to scan, audit, or validate a skill for security issues. |
| skills-visibility | Use when a publisher wants a discoverable, integrity-protected agent-skill catalog served from a domain they control. |
| testing-handbook-generator | Use when the user asks to discover, generate, refresh, or validate skills from the Trail of Bits Testing Handbook or appsec.guide. |
| writing-for-agents | Use when authoring or restructuring an agent-consumed document, a SKILL.md or skill directory, writing skills, or deciding a skill split-or-monolith disclosure question. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
