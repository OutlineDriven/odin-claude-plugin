# ODIN Critique

ODIN workflows for pressure-testing a decision from independent seats and lenses.

21 skills, category Productivity. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-critique@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-critique@odin-marketplace
```

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one with `/skill:<name>`.

| Skill | Trigger |
|---|---|
| attack-shape | Use when the user wants adversarial stress-testing of a proposed architecture, structure, or shape. |
| council | Use when the user asks for a council, second opinions, or parallel investigation. |
| cross-critique | Use when independent proposals on a contested decision need cross-critique before choosing, reusing the original authors. |
| cross-lens-converge | Use when one reviewer is not enough because failure modes are heterogeneous, or a claim needs cross-lens pressure before it ships. |
| decision-rationale-gaps | Use when a current decision needs pressure-testing until the rationale is clear to a skeptic. |
| doubt-driven | Use when a non-trivial decision sits under uncertainty and correctness matters more than speed. |
| from-breaking-perspective | Use when a user wants an answer only from the breaking seat (stakeholders, dependencies, accounting, compatibility under destructive pressure). |
| from-business-perspective | Use when the user wants an answer only from the business seat: money, customers, timing. |
| from-career-perspective | Use when a user wants an answer only from the career seat: effects on human trajectories. |
| from-codebase-perspective | Use when asked to answer only from the codebase seat: what existing code tolerates or punishes. |
| from-human-perspective | Use when a user wants an answer only from the human seat: what a person can love, trust, and tolerate. |
| from-impact-perspective | Use when asked to answer only from the impact seat: who and what actually moves. |
| from-innovation-perspective | Use when the user wants an answer only from the innovation seat. |
| from-moat-perspective | Use when the user wants an answer only from the moat seat: building, keeping, and thickening defensibility. |
| from-rentseeking-perspective | Use when the user wants an answer only from the rent-seeking seat: extraction without building. |
| from-skeptic-perspective | Use when the user wants an answer only from the skeptic seat: cold reasoning without project loyalty. |
| from-stability-perspective | Use when the user wants an answer only from the stability seat: preservation of the working machine. |
| load-bearing-assumption-test | Use when the user asks why a plan is wrong or says "poke holes in this". |
| prism | Use when one reviewer angle is insufficient or the user suspects a direction is tunnel-visioned or inherited its framing. |
| punishing-practices | Use when a workflow, plan, diff, or completed work cycle must be checked for practices that punish the project later. |
| taste | Use when asking "overkill?", "elegant?", "audit", or "taste-test this", or setting a taste register. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
