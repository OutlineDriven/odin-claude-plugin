# ODIN People

ODIN workflows for team dynamics, culture profiles, and negotiation.

7 skills, category Productivity. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-people@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-people@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-people/skills/<skill> \
  --agent claude-code --scope user
```

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-people:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| culture-burnout-detection | Use when Survey and Job Culture Index profiles need analysis for stress, burnout, disengagement, or flight-risk signals. |
| culture-conflict-mediation | Use when two colleagues' working friction needs trait-based explanation, accommodations, process changes, and escalation boundaries, or for manager-report friction. |
| culture-interview-debrief | Use when a Culture Index profile needs comparison with role requirements, team composition, and manager profile for hiring. |
| culture-interview-profile-prediction | Use when asked to predict Culture Index traits from an interview transcript before a survey exists, including sparse or contradictory evidence. |
| culture-manager-coaching | Use when a manager needs profile-specific communication, one-on-one, motivation, and energy guidance for a direct report. |
| culture-onboarding-plan | Use when a signed new hire's Culture Index profile and team profiles need a first-90-days plan. |
| influence-and-negotiation | Use when an agreement-seeking interaction arises, including mid-conversation moments the model detects. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
