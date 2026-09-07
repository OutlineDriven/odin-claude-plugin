# ODIN Planning

ODIN workflows for shaping intent into approved plans, specs, and task lists.

39 skills, category Productivity. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-planning@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-planning@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-planning/skills/<skill> \
  --agent <agent> --scope user
```

`<agent>` is `claude-code`, `codex`, `cursor`, `grok`, or `kimi-cli`.

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-planning:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| abstract-well | Use when the user wants to classify abstractions as useful, bad, or busy and keep one shallow level. |
| all-scenarios-storm | Use when a user wants to enumerate plausible designs, configurations, scenarios, and paths and diagram the field before choosing. |
| askme | Use when a task is ambiguous or intent needs eliciting: exhaustive/collaborative/adversarial askme, batch questions, interview, ambiguity scan, or intent proposal. |
| autoplan | Use when the user runs /autoplan on a plan or idea. |
| backlog | Use when asked to park an undecided idea without representing it as decided or active work. |
| brainstorm | Use when the user begins knowledge work with notes, a transcript, or a brain dump, asks for divergent ideas (mode: ideate), or wants options shown in a local browser (mode: visual). |
| converge | Use when the user wants to collapse an open decision field to one decision and record its rationale locally. |
| decide | Use when the user has a fork and wants it resolved and applied, not explored: "decide this", "choose the path", or "decide and fix it". |
| define-goalstate | Use when the user wants the finished-system contract for a piece of work: behavior, protocols, allowed, forbidden, and impossible states with a state-space proof. |
| diverge | Use when the user wants to expand a decision field with additional options and dimensions. |
| entropy-assisted-planning | Use when the user explicitly requests a Tarot draw or casually delegates an ambiguous choice among multiple valid approaches. |
| fail-design | Use when a user wants to define failure states, recovery actions, bypasses, and degraded modes for a component during design. |
| from-first-principle | Use when a user wants to rebuild a design, organization, or API from primitives. |
| generalize | Use when asked to derive the general rule a request carries as examples instead of a stated rule, then bound it. |
| goal-init | Use when a durable effort needs an approved, checkable success predicate before work starts. |
| graph-backbone | Use when defining, revising, or gate-replanning the project structural backbone in project-root graph.yaml. |
| idea-sparkbox | Use when the user asks to park ideas or inspiration for later. |
| leave-only-first-principle | Use when asked to prune a design or codebase until only primitives remain, producing a first-principles map. |
| loop-me | Use when the user says "loop me" or asks to design a recurring workflow. |
| minimap | Use when the user needs a compact read-only current-work view from Git state, recorded test evidence, and optional graph.yaml. |
| next-best-action | Use when a project is between phases, the author asks what to do next, too many threads are open, or work needs re-entry. |
| plan | Use when a user commits to a direction and asks to plan, brief, or research it; modes score, breakdown, shape, visual. |
| plan-review | Use when a plan path or text is supplied for audit against the current codebase, or when tuning which plan-review questions fire. |
| possible-worlds | Use when a design dispute has at least two live interpretations and the caller wants worlds made explicit or a plain-language recommendation. |
| pov | Use when asked to judge whether to adopt, switch, reject, or revisit technology, library, pattern, or architecture, or a second opinion. |
| readiness-assessment | Use when a user asks for a gut-check on a decision or action, or asks whether enough is known to proceed. |
| show-way | Use when the user asks for a flattened view of roadmaps and next actions. |
| solidate | Use when the user wants to harden a chosen but tentative artifact into one durable result. |
| spec-driven | Use when starting a project or feature, requirements are unclear, or a change crosses modules. |
| state-machine-workflow | Use when work has distinct modes and the user wants states, events, guards, outcomes, illegal transitions, not a prose todo list. |
| tasty-abstraction | Use when a user wants to design an abstraction boundary that collapses a complex implementation into a simpler interface without leaking internal state. |
| to-questionnaire | Use when user wants an async questionnaire, a discovery questionnaire, or a knowledge gap needs answers outside the repo. |
| to-spec | Use when settled conversation decisions need synthesis into an agent-ready implementation spec, stopping before publication. |
| to-tickets | Use when a settled plan needs implementation tickets published as blocker-linked slices, tracer bullets, or expand-contract sequencing. |
| todo-add | Use when a message contains `TODO ADD: <requirement>`. |
| todos-enhance | Use when tasks are too vague, read as headings, or the user asks to sophisticate the todos. |
| todos-update | Use when user asks to update todos, resync the task list, say what to do next, or plan and tree have drifted apart. |
| waterfall-guide | Use when a user wants to lock greenfield architecture and interfaces early for coherent parallel execution. |
| wayfinder | Use when a greenfield project or large feature build will not fit in a single agent session. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
