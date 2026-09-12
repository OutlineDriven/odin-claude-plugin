# ODIN Critique

ODIN workflows for pressure-testing a decision from independent seats and lenses.

11 skills, category Productivity. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-critique@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-critique@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-critique/skills/<skill> \
  --agent <agent> --scope user
```

`<agent>` is `claude-code`, `codex`, `cursor`, `grok`, or `kimi-cli`.

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-critique:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| attack-shape | Use when the user wants adversarial stress-testing of a proposed architecture, structure, or shape. |
| council | Use when the user asks for a council, second opinions, or parallel investigation. |
| cross-critique | Use when independent proposals on a contested decision need cross-critique before choosing, reusing the original authors. |
| cross-lens-converge | Use when one reviewer is not enough because failure modes are heterogeneous, or a claim needs cross-lens pressure before it ships. |
| decision-rationale-gaps | Use when a current decision needs pressure-testing until the rationale is clear to a skeptic. |
| doubt-driven | Use when a non-trivial decision sits under uncertainty and correctness matters more than speed. |
| from-perspective | Use when an answer is wanted from one named seat only: breaking, business, career, codebase, human, impact, innovation, moat, rent-seeking, skeptic, or stability. |
| load-bearing-assumption-test | Use when the user asks why a plan is wrong or says "poke holes in this". |
| prism | Use when one reviewer angle is insufficient or the user suspects a direction is tunnel-visioned or inherited its framing. |
| punishing-practices | Use when a workflow, plan, diff, or completed work cycle must be checked for practices that punish the project later. |
| taste | Use when asking "overkill?", "elegant?", "audit", or "taste-test this", or setting a taste register. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
