# Outline-Driven Development

> Formerly the ODIN Claude Plugin. The repository URL is unchanged.

Outline-Driven Development, nicknamed ODIN, is a code-agent skill library: diagram-first
engineering, surgical editing, and workflow automation, published as installable plugins. It gives
you a drop-in skill set with five discipline layers. Skills are authored once in-tree, and every
supported client discovers them from that same layout, so nothing is copied or republished.

Methodology: [outline-driven-development](https://github.com/OutlineDriven/outline-driven-development)
· Site: [outlinedriven.github.io](https://outlinedriven.github.io)

- 613 skills in 28 plugins, each authored once at `plugins/<plugin>/skills/<slug>/SKILL.md`
- Four surfaces from one tree: Claude Code, Codex, Cursor, and the Agent Plugins standard
- No package manager for the tooling; every script is dependency-free Node ESM or standard-library Python
- Six output styles in odin-core, each embedding the canonical doctrine byte-identically
- Pre-commit gates that audit the whole tree on every commit, listed in `.pre-commit-config.yaml`

## Contents

- [What is this](#what-is-this)
- [Install](#install)
- [Quick start](#quick-start)
- [Choose your plugins](#choose-your-plugins)
- [Plugins](#plugins)
- [Core philosophy](#core-philosophy)
- [Output styles](#output-styles)
- [Development](#development)
- [License](#license)

## What is this

613 skills in 28 plugins. A skill is authored once, at
`plugins/<plugin>/skills/<slug>/SKILL.md`, and that path is its only home. The directory states
which plugin owns the skill, so no registry has to answer that question. Every plugin and
marketplace ships at one `releaseVersion`, currently 2.0.0, held in `catalog/plugins.json`.

The Agent Plugins specification fixes components at the plugin root, so this layout is also the one
every supported client already discovers. Nothing is copied at publish time, and nothing is
published to a package registry.

```
plugins/odin-core/
  plugin.json                  Agent Plugins 1.0.0 manifest
  .claude-plugin/plugin.json   Claude Code manifest
  skills/askme/SKILL.md        authored skill
  skills/askme/agents/openai.yaml   generated from the frontmatter
  mcp.json                     MCP servers, odin-core only
  output-styles/               Claude output styles, odin-core only
```

## Install

Four surfaces are supported, and no others. Each installs from this repository.

### Claude Code

```shell
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-core@odin-marketplace
```

### Codex

```shell
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-core@odin-marketplace
```

### Cursor

Add the marketplace, then `/plugin install odin-core`. Cursor reads the Agent Plugins manifest at
each plugin root.

### Agent Plugins standard

Any client implementing [Agent Plugins 1.0.0](https://github.com/agentplugins/agent-plugins-spec)
can consume a plugin directory as it stands: the manifest is `plugins/<plugin>/plugin.json`, skills are
at `skills/<slug>/SKILL.md`, and MCP servers are at `mcp.json`.

### One skill at a time

`gh skill` installs a single skill for any of its supported agents. Passing the exact path skips a
full tree traversal, which matters at this repository's size.

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-core/skills/askme \
  --agent claude-code --scope user
```

`just validate-skills` runs `gh skill publish --dry-run`, which validates every skill against the
Agent Skills specification.

## Quick start

```shell
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-core@odin-marketplace
/plugin install odin-code@odin-marketplace
/commit

# /commit reads your staged diff and writes one conventional commit per concern.
```

`odin-core` carries the six output styles and the planning skills; `odin-code` carries the
day-to-day engineering skills. Install the rest by working domain.

## Choose your plugins

Nothing here is all-or-nothing. `odin-core` and `odin-code` are the base from Quick start; every
row below is what you add on top for that kind of work, and the rest of the 28 stay uninstalled.

| Working on | Add |
|---|---|
| Everyday code changes | `odin-run` |
| Large refactors, audits, bounded iteration | `odin-code-advanced`, `odin-run-advanced`, `odin-loop` |
| A specific language | `odin-python`, `odin-typescript`, `odin-native`, `odin-apple`, or `odin-lean` |
| Web and interface work | `odin-web`, `odin-design`, `odin-design-advanced` |
| Security review and hardening | `odin-security`, `odin-security-advanced` |
| Research and technical writing | `odin-research`, `odin-research-advanced`, `odin-writing`, `odin-writing-advanced` |
| Product, planning, and new artifacts | `odin-planning`, `odin-product`, `odin-create`, `odin-create-advanced` |
| Building agents | `odin-agent` |
| Infrastructure and data | `odin-terraform`, `odin-prometheus`, `odin-bigquery` |

Each name installs with the same command:

```shell
/plugin install odin-security@odin-marketplace
```

The largest plugins are `odin-research` at 102 skills, `odin-run` at 74, and `odin-code` at 52.
Install one skill instead of a whole plugin with `gh skill install`, shown under Install above.

## Plugins

| Plugin | Category | Plugin | Category |
|---|---|---|---|
| odin-core | Coding | odin-writing | Writing |
| odin-code | Coding | odin-writing-advanced | Writing |
| odin-code-advanced | Coding | odin-product | Productivity |
| odin-create | Productivity | odin-loop | Coding |
| odin-create-advanced | Productivity | odin-planning | Productivity |
| odin-research | Research | odin-python | Coding |
| odin-research-advanced | Research | odin-typescript | Coding |
| odin-run | Coding | odin-web | Coding |
| odin-run-advanced | Coding | odin-native | Coding |
| odin-agent | Productivity | odin-apple | Coding |
| odin-security | Security | odin-lean | Coding |
| odin-security-advanced | Security | odin-terraform | Infrastructure |
| odin-design | Design | odin-bigquery | Data |
| odin-design-advanced | Design | odin-prometheus | Infrastructure |

`catalog/plugins.json` is the identity ledger: it holds each plugin's name, description, category,
and tags, and every manifest and registry is generated from it.

## Core philosophy

1. Investigate before acting. Never speculate about code you have not read.
2. Draw the structure before building it.
3. Match rigor to risk.
4. One logical change per commit.
5. Show the code, not a description of the code.

Before any non-trivial implementation, five diagrams: architecture, data flow, concurrency,
memory, and optimization.

## Output styles

Output styles shape how the agent communicates. Switch through Claude Code's `/config` or by
setting `outputStyle` in `settings.json`. They ship in `odin-core`.

- `ODIN`: default. Skeptic register, scope discipline, no reflexive validation.
- `AxiomMode`: formal-logic English with predicate-form claims and ASCII keywords.
- `Builder`: for non-technical builders. Outcome-first, plain language, progressive disclosure.
- `Duet`: companion to the `duet` skill. Decisions before prose, forks stated loudly.
- `Linus`: Torvalds review discipline. Good taste as special-case elimination.
- `Eval`: benchmark harness register, generated by margin-runner. Do not hand-edit.

Every style embeds a byte-identical copy of `system-prompt-baseline.md`, because the Claude Code
loader does not resolve references. `scripts/sync-baseline.py` owns that copy.

## Development

There is no package manager here. Every script is dependency-free Node ESM or standard-library
Python.

```shell
just              # list tasks
just render       # regenerate skill manifests, plugin manifests, and registries
just check        # every gate
just verify       # every gate plus Agent Skills validation
```

`.pre-commit-config.yaml` is the gate list. Every gate below audits the whole tree and runs
unconditionally, so none of them can be skipped by touching the wrong file:

| Gate | What it proves |
|---|---|
| `sync-baseline` | every output style carries the canonical doctrine, and resyncs it when not |
| `check-plugin-surfaces` | retired surfaces stay dead, no plugin ships without skills, no manifest relocates a fixed component |
| `render-plugin-surfaces --check` | every manifest and registry matches `catalog/plugins.json` |
| `check-skill-routes` | frontmatter name equals the directory, descriptions state a trigger, display names are unique |
| `render-skill-manifests --check` | every `agents/openai.yaml` matches its SKILL.md frontmatter |
| `check-skill-frontmatter` | every frontmatter is a flat mapping whose scalars a strict parser accepts |
| `check-voice` | authored prose meets the voice contract |
| `check-voice --self-test` | the voice gate's own rules still catch what they claim |
| `check-skill-frontmatter --self-test` | the frontmatter gate's own rules still catch what they claim |
| `check-carriers` | the external harness carriers hold the canonical doctrine |
| `check-carriers --self-test` | the carrier gate still catches a planted divergence |

Trailing whitespace, line endings, byte-order marks, JSON syntax, and TOML formatting are handled
by upstream hooks in the same run.

`docs/specs/distribution-surfaces.md` records the specification for each surface, with citations
and the date each version was read.

## License

See LICENSE. Third-party attribution is in `licenses/NOTICE`.

Issues: https://github.com/OutlineDriven/odin-claude-plugin/issues
