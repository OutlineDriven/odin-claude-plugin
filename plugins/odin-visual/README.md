# ODIN Visual

ODIN workflows for diagrams, decks, canvases, and visual explainers.

19 skills, category Design. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-visual@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-visual@odin-marketplace
```

### Individual (gh skill)

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-visual/skills/<skill> \
  --agent claude-code --scope user
```

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one as `/odin-visual:<name>` in Claude Code, `$<name>` in Codex, or type `/` and pick it in Cursor.

| Skill | Trigger |
|---|---|
| architecture-diagram | Use when the user asks to visualize an architecture as a self-contained HTML artifact, or compare two architecture snapshots. |
| automatic-cybernetic-flow-design | Use when the user wants a cybernetic flow design document for an interactive system. |
| automatic-freeform-graphs-design | Use when a user wants a looser conceptual graph for exploratory work. |
| compile-3d-workflow | Use when the user asks for direction and a compilable 3D workflow from an interview. |
| dataflow-diagram | Use when asked to visualize data movement, ETL or ELT, lineage, transformations, custody, governance, stores, sources, or consumers. |
| diagramming-code | Use when asked for a call graph, class hierarchy, dependency map, containment or complexity view, or data-flow view. |
| docs-canvas | Use when asked to render documentation as an interactive, navigable HTML canvas. |
| embed-diagram | Use when the user runs /embed-diagram to render a Mermaid diagram offline and embed it into a document. |
| lifecycle-diagram | Use when states, waits, retries, decisions, transitions, and terminals need a lifecycle view. |
| pr-review-canvas | Use when asked to render a PR review as a Cursor Canvas artifact or a standalone HTML page served on localhost (mode: html), with risky hunks foregrounded. |
| pr-walkthrough | Use when a user asks for a zoomable PR map or graph-canvas orientation. |
| presentation-creator | Use when asked to create a presentation, pitch deck, or slides from a topic and audience, or to format supplied source items into a 16:9 HTML slide deck. |
| sequence-diagram | Use when a user asks to visualize a time-ordered interaction. |
| show-me | Use when the user says show this or diagram this about the current topic. |
| snippet-image-rendering | Use when the user explicitly names snipgrapher and wants code rendered to a polished PNG, SVG, or WebP at an explicit local path. |
| visual-argument-diagram | Use when a user wants a conceptual, workflow, or architecture diagram, a layout repair, or a PNG render of an existing .excalidraw file. |
| visual-diagram | Use when asked to diagram, or a tool or --quick flag renders a structured spec to HTML. |
| visualise-widget | Use when a user requests a comparison table, data record, metric card, stepper, or mockup widget, a numeric chart, or an interactive explainer. |
| workflow-diagram | Use when a user asks to visualize a process, approval flow, runbook, CI/CD path, responsibility lanes, or tool calls. |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
