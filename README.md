# Outline-Driven Development

> Formerly the ODIN Claude Plugin. The repository URL is unchanged.

Outline-Driven Development, nicknamed ODIN, is a code-agent skill library: diagram-first
engineering, surgical editing, and workflow automation, published as installable plugins. It gives
you a drop-in skill set with five discipline layers. Skills are authored once in-tree, and every
supported client discovers them from that same layout, so nothing is copied or republished.

Methodology: [outline-driven-development](https://github.com/OutlineDriven/outline-driven-development)
· Site: [outlinedriven.github.io](https://outlinedriven.github.io)

- 613 skills in 28 plugins, each authored once at `plugins/<plugin>/skills/<slug>/SKILL.md`
- Five harness surfaces from one tree: Claude Code, Codex, Cursor, Grok, and Kimi
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
marketplace ships at one `releaseVersion`, currently 2.0.4, held in `catalog/plugins.json`.

Each harness resolves components from fixed conventions at the plugin root, so this layout is the
one every supported client already discovers. Nothing is copied at publish time, and nothing is
published to a package registry.

```
plugins/odin-core/
  .claude-plugin/plugin.json   Claude Code manifest
  .codex-plugin/plugin.json    Codex manifest
  .cursor-plugin/plugin.json   Cursor manifest
  .grok-plugin/plugin.json     Grok manifest
  .kimi-plugin/plugin.json     Kimi manifest
  skills/askme/SKILL.md        authored skill
  skills/askme/agents/openai.yaml   generated from the frontmatter
  mcp.json                     MCP servers, odin-core only
  output-styles/               Claude output styles, odin-core only
```

> `odin-core` carries the six output styles and the planning skills; `odin-code` carries the day-to-day engineering skills. Install the rest by working domain.


## Core philosophy

> 1. Investigate before acting. Never speculate about code you have not read.
> 2. Draw the structure before building it.
> 3. Match rigor to risk.
> 4. One logical change per commit.
> 5. Show the code, not a description of the code.

## Install

Six install surfaces are supported; each installs from this repository.

### Claude Code

```shell
claude plugin marketplace add OutlineDriven/odin-claude-plugin
claude plugin install odin-core@odin-marketplace

# Your selected plugin modules; Keep it lean, only for you.
claude plugin install odin-code@odin-marketplace
claude plugin install odin-run@odin-marketplace
claude plugin install odin-create@odin-marketplace
claude plugin install odin-planning@odin-marketplace
claude plugin install odin-research@odin-marketplace
claude plugin install odin-loop@odin-marketplace

# More ...
```

### Codex

```shell
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-core@odin-marketplace

# Your selected plugin modules; Keep it lean, only for you.
codex plugin add odin-code@odin-marketplace
codex plugin add odin-run@odin-marketplace
codex plugin add odin-create@odin-marketplace
codex plugin add odin-planning@odin-marketplace
codex plugin add odin-research@odin-marketplace
codex plugin add odin-loop@odin-marketplace

# More ...
```

### Cursor

Add the marketplace, then `/plugin install odin-core`. Cursor reads the
`.cursor-plugin/plugin.json` manifest at each plugin root.

```
/plugin install odin-core

# Your selected plugin modules; Keep it lean, only for you.
/plugin install odin-code
/plugin install odin-run
/plugin install odin-create
/plugin install odin-planning
/plugin install odin-research
/plugin install odin-loop

# More ...
```

### Individual (gh skill)

`gh skill` installs a single skill for any of its supported agents. Passing the exact path skips a
full tree traversal, which matters at this repository's size.

```shell
gh skill install OutlineDriven/odin-claude-plugin plugins/odin-core/skills/askme \
  --agent claude-code --scope user
```

### Grok

```shell
grok plugin marketplace add OutlineDriven/odin-claude-plugin
grok plugin install OutlineDriven/odin-claude-plugin#plugins/odin-core
```

The `#plugins/<plugin>` suffix selects one plugin subdirectory from the repository.

### Kimi

From a local clone; Kimi cannot install a subdirectory of a GitHub repository.

```shell
/plugins marketplace /path/to/odin-claude-plugin/.kimi-plugin/marketplace.json
/plugins install /path/to/odin-claude-plugin/plugins/odin-core
```

Both paths are absolute: Kimi rejects a relative plugin root.

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

## Output styles (Claude-code Specific)

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

`.pre-commit-config.yaml` is the gate list. Every gate audits the whole tree and runs
unconditionally, so none of them can be skipped by touching the wrong file. `docs/specs/gates.md`
explains what each generator writes, what each gate proves, and how to read a failure.

## License

See LICENSE. Third-party attribution is in `licenses/NOTICE`.

Issues: https://github.com/OutlineDriven/odin-claude-plugin/issues
