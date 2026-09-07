# ODIN Core

Core ODIN gates every session runs: intent, scope, verification, and hand-off checks.

8 skills, category Coding. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-core@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-core@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-core/skills/<skill> \
  --agent <agent> --scope user
```

`<agent>` is `claude-code`, `codex`, `cursor`, `grok`, or `kimi-cli`.

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-core:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| ai-collab-protocols | Use when the user describes an AI workflow gap or uses an ambiguous cross-session reference such as 'the PR Bob mentioned'. |
| axiom-mode | Use when the user requests axiom, axiom-mode, axiom-compact, formal-logic, or compact form. |
| enforce-workflow-constraints | Use when any bounded workflow starts or reaches an action, path, proposal, or merge boundary. |
| instruction-understanding-gate | Use when a request is long, bundled, high-stakes, or has ambiguous referents. |
| necessary-work | Use when work is about to grow past the ask, the task may already be done, or the user requests only the minimum. |
| post-change-check-gate | Use when an artifact or skill has just changed and is about to be called done, committed, or handed off. |
| skill-gap-finder | Use when the user suspects no installed skill covers a task and wants proof. |
| verification-before-completion | Use when a task, feature, or fix is called done, complete, finished, or fixed, or before a commit, PR, or next task. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
