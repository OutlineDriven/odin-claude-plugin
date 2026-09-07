# ODIN Python

ODIN workflows for modern Python development.

3 skills, category Coding. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-python@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-python@odin-marketplace
```

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one with `/skill:<name>`.

| Skill | Trigger |
|---|---|
| django-perf-review | Use when reviewing Django performance, N+1 queries, or queryset behavior. |
| modern-python | Use when creating or migrating a Python project or script to uv, Ruff, ty, and pytest. |
| typing-exclusion-worker | Use when removing modules from pyproject mypy exclusions or running a typing-debt worker batch. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
