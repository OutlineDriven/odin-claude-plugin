# ODIN Agent

ODIN workflows for configuring agent harnesses, MCP servers, and repository agent surfaces.

13 skills, category Productivity. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-agent@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-agent@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-agent/skills/<skill> \
  --agent claude-code --scope user
```

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-agent:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| agent-environment-retrospective | Use when a completed session needs an agent-environment retrospective. |
| agents-md | Use when a repo needs agent setup, AGENTS.md added or made lean, CLAUDE.md audited, or agent instructions scored or pruned. |
| check-agent-compatibility | Use when a human explicitly asks for a full repository agent-compatibility pass returning a scored report with prioritized fixes. |
| claude-settings-audit | Use when setting up a project, auditing agent command permissions, or asking which read-only bash commands and domains to allow. |
| cli-for-agents | Use when asked to build or review a CLI intended for coding agents and return flag-driven, pipeline-safe, idempotent design advice. |
| harness-port-guide | Use when the user asks to make the skills framework work in a new harness, IDE, or CLI. |
| inits | Use when onboarding to a repository, capturing costly conventions, constraints, or rationale, or improving AGENTS.md. |
| mcp-builder | Use when asked to create an MCP server to integrate an API or service in Python or TypeScript. |
| multi-agent-tournament-scorecard | Use when agent strategies need a reproducible finite tournament under a frozen evaluation protocol. |
| prohibit-bad-habits | Use when a user wants to define patterns the agent should not do. |
| setup | Use when the user asks to set up the agent environment. |
| skill-doctor | Use when a user wants agent setup graded from conversation history. |
| workspace-unfreeze | Use when the user runs /workspace-unfreeze on a frozen path to make it editable again. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
