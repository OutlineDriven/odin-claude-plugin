# Outline-Driven Development for Claude Code

> Formerly known as the ODIN Claude Plugin. The repository URL stays the same.

**Outline-Driven Development** (nicknamed ODIN) is a code agent system for Claude Code with surgical precision, diagram-first engineering, and workflow automation.

**Methodology**: [outline-driven-development](https://github.com/OutlineDriven/outline-driven-development) &nbsp;·&nbsp; **Codex CLI**: [odin-codex-plugin](https://github.com/OutlineDriven/odin-codex-plugin) &nbsp;·&nbsp; **Gemini CLI**: [odin-gemini-cli-extension](https://github.com/OutlineDriven/odin-gemini-cli-extension) &nbsp;·&nbsp; **Site**: [outlinedriven.github.io](https://outlinedriven.github.io)

## Overview

**Key capabilities:**

- **Diagram-First Engineering**: Architecture, concurrency, memory, data flow, optimization
- **Surgical Code Editing**: AST-based transformations with ast-grep
- **Confidence-Driven Execution**: Adaptive behavior based on complexity and risk
- **Deep Investigation**: Mandatory file reading before code modifications
- **Atomic Commits**: Conventional Commits protocol with incremental approvals

## Installation

Claude Code is the proved install target on this source branch. The repository
is a private npm workspace of 29 packages: 28 runtime packages and 1 informational
package, `@outlinedriven/odin`. Skills live once at `skills/<slug>/SKILL.md`.
Package trees copy those skills only at pack time.

### Claude Code marketplace

The shared catalog is `.claude-plugin/marketplace.json`. Every entry is an
exact npm source at `2.0.0`. Install the 28 runtime modules; do not install
informational `odin`.

```shell
claude plugin marketplace add OutlineDriven/odin-claude-plugin
claude plugin install odin-core@odin-marketplace
```

Per-skill installs work over two routes; both read the same canonical
`skills/<slug>/SKILL.md` tree at an immutable tag:

```shell
# npx route (skills CLI, pinned)
npx --yes skills@1.5.23 add https://github.com/OutlineDriven/odin-claude-plugin/tree/v2.0.0/skills/<skill-name> -a claude-code -g -y

# gh route (GitHub CLI 2.90.0+)
gh skill install OutlineDriven/odin-claude-plugin skills/<skill-name> --pin v2.0.0 --agent claude-code --scope user
```

Install every skill with `--skill '*'` (npx) or `--all` (gh).
`node scripts/check-skill-routes.mjs` proves the tree shape both routes require.
The universal current-user installer remains Claude-specific and lives in
[OutlineDriven/outline-driven](https://github.com/OutlineDriven/outline-driven).
It is not this repository.

### Other harnesses

Codex, Cursor, Grok, Kimi, Devin, and Antigravity consume a generated
`distribution` projection (`npm run generate:distribution`), staged on the
`distribution-candidate/2.0.0` branch, not this source branch. Devin and
Antigravity consume `plugins/odin-complete/` from that projection. Those
catalogs are not published from this commit.

### Skills

There are 779 public skills in 28 runtime packages. Identity and ownership
are in `catalog/packages.json`; the skill registry `catalog/provenance-rows.json`
pins the count (`skill_count` == directory count == `rows.length`). Do not scan
`packages/*/skills`; that path is not authored.

## Core Philosophy

ODIN follows engineering principles:

1. **Investigate Before Acting**: Never speculate about code you haven't read
2. **Diagram-First Design**: Five mandatory diagrams before any implementation
3. **Surgical Precision**: Minimal, targeted changes using AST-based tools
4. **Atomic Commits**: One logical change per commit, properly typed
5. **Confidence-Driven**: Adapt behavior based on familiarity and risk
6. **Tool Selection**: ast-grep > native-patch > ripgrep (never sed for edits)

### Five Required Diagrams

Before any non-trivial implementation:

1. **Architecture**: Components, interfaces, contracts, dependencies
2. **Data Flow**: Sources, transformations, sinks, state transitions
3. **Concurrency**: Threads, synchronization, happens-before relationships
4. **Memory**: Ownership, lifetimes, allocation patterns, safety guarantees
5. **Optimization**: Bottlenecks, targets, complexity bounds, resource budgets

## Output styles

Output styles shape how the agent communicates. Switch via Claude Code's `/config` or by setting `outputStyle` in `settings.json`.

- `ODIN`: Default. Skeptic register, scope discipline, no reflexive validation.
- `AxiomMode`: Formal-logic English with predicate-form claims, Hoare-triple framing, ASCII shortened-English keywords. Daily-driver register for coding work.
- `Builder`: For non-technical builders (PMs, founders, designers, no-code users). Outcome-first, plain-language, progressive disclosure.
- `Duet`: Companion to the `duet` skill. Decisions before prose, structural/taste framing first, jargon on demand, silent mechanics / loud forks. Enforces `duet` skill invocation.
- `Linus`: Torvalds review discipline. Good taste as special-case elimination, blunt about the work, show the corrected code rather than describe it.
- `Eval`: Benchmark harness register (`output-styles/benchmark.md`). Auto-generated by margin-runner; do not hand-edit above the doctrine cascade.

## Configuration

### Settings.json

`settings.json` includes:

- **Tool Permissions**: Pre-approved tools (ast-grep, fd, rg, cargo, npm, git, etc.)
- **MCP Integration**: Time, browser, git, context7, tavily, and more
- **Security**: Denied operations (sed -i, force push, destructive commands)
- **Hooks**: Event-driven automation
- **Defaults**: Bypass permissions mode, always thinking enabled

### CLAUDE.md

Global instructions defining:

- ODIN methodology and principles
- Tool selection mandates (ast-grep preferred)
- Git commit strategy (Conventional Commits)
- Diagram-first engineering requirements
- Language-specific guidelines
- UI/UX design principles
- Verification and refinement patterns

## Methodology

### Surgical Editing Workflow

1. **Find**: Use ast-grep (code), ripgrep (text), fd (files)
2. **Copy**: Extract minimal context with precise offsets
3. **Paste**: Apply surgically with AST-based transformations

### Confidence-Driven Execution

```
Confidence = (familiarity + (1-complexity) + (1-risk) + (1-scope)) / 4
```

- **High (0.8-1.0)**: Direct action → Verify
- **Medium (0.5-0.8)**: Iterative action → Expand → Verify
- **Low (0.3-0.5)**: Research → Plan → Test → Expand
- **Very Low (<0.3)**: Decompose → Propose → Seek guidance

### Atomic Commit Protocol

**Conventional Commits v1.0.0:**

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types**: feat, fix, build, chore, ci, docs, perf, refactor, style, test

**Rules**:

- One logical change per commit
- Never mix types or scopes
- Each commit must build and pass tests
- Independently testable and reversible

### Tool Selection Mandate

**Discovery → Text search → Structural search → Transform**:

1. **fd** - File discovery (NEVER use `find`)
2. **git grep** - Primary text search within the repo (respects .gitignore, fast)
3. **rg (ripgrep)** - Text-search fallback when outside git or for richer flags
4. **ast-grep** - Structural/AST search and rewrite (metavariable patterns)
5. **native-patch / Edit** - Final precise edits when Find → Transform → Verify converges
6. **eza** - Directory listing (NEVER use `ls`)
7. **bat -P -p -n** - File display (NEVER use `cat`)

### Tool Permission Issues

Check `settings.json` for tool permissions. ODIN pre-configures safe tool usage.

## License

See LICENSE file for details.

## Support

- **Issues**: https://github.com/OutlineDriven/odin-claude-plugin/issues
- **Repository**: https://github.com/OutlineDriven/odin-claude-plugin

## Acknowledgments

Built on Claude Code's plugin system.

---

**Outline-Driven Development** for Claude Code: [outlinedriven.github.io](https://outlinedriven.github.io)
