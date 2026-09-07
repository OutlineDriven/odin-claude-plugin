# ODIN Learn

ODIN workflows for teaching, explaining, drilling, and onboarding.

14 skills, category Productivity. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-learn@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-learn@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-learn/skills/<skill> \
  --agent claude-code --scope user
```

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-learn:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| capstone | Use when the learner is ready to apply cleared concepts in a real project. |
| create-learning-path | Use when asked to create a multi-session learning plan. |
| drill | Use when a concept needs practising: the user asks for an exercise, quiz, recall, or gap probe. |
| explain-concept | Use when a concept needs making clear rather than practising: explain simply, why does this exist, draw it, or simplify for a beginner. |
| explainer-artifact | Use when asked to create an explainer document for a concept, diff, idea, or work recap. |
| infrastructure-mentor | Use when a user, especially a new hire, asks for mentoring, guidance, or explanation of infrastructure or engineering practices. |
| learning-retrospective | Use when asked to review learning progress after a milestone. |
| map-corpus | Use when the user points to a study-material folder and asks to make it teachable. |
| onboard | Use when the user asks for onboarding, orientation, a repository tour, or where to start. |
| paced-explanation | Use when asked to explain or teach a subsystem, module, pattern, or change in progressive layers from purpose to code depth. |
| scaffold-exercises | Use when a course needs numbered problem, solution, and explainer scaffolds. |
| teach | Use when the user wants a course, a learning workspace, or ongoing teaching across sessions, with cited lessons and retention-gated advancement. |
| wait-what | Use when the user says "wait, what", "the explanation is unclear", "say that again", or asks to restate the last response in plain language. |
| walk-with-me | Use when the user wants to be walked through code, not handed a report: "walk through this", "guided code walk", or "explain this codebase". |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
