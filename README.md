# Outline-Driven Development for Claude Code

> Formerly known as the ODIN Claude Plugin. The repo URL stays the same; the brand has matured.

**Outline-Driven Development** (nicknamed ODIN) — Advanced code agent system for Claude Code with surgical precision, diagram-first engineering, and comprehensive workflow automation.

**Methodology**: [outline-driven-development](https://github.com/OutlineDriven/outline-driven-development) &nbsp;·&nbsp; **Codex CLI**: [odin-codex-plugin](https://github.com/OutlineDriven/odin-codex-plugin) &nbsp;·&nbsp; **Gemini CLI**: [odin-gemini-cli-extension](https://github.com/OutlineDriven/odin-gemini-cli-extension) &nbsp;·&nbsp; **Site**: [outlinedriven.github.io](https://outlinedriven.github.io)

## Overview

ODIN is a professional-grade Claude Code plugin that transforms Claude into a sophisticated code agent with comprehensive workflow automation and rigorous engineering methodology.

**Key Capabilities:**

- 📐 **Diagram-First Engineering** - Architecture, concurrency, memory, data flow, optimization
- 🎯 **Surgical Code Editing** - AST-based transformations with ast-grep
- 🧠 **Confidence-Driven Execution** - Adaptive behavior based on complexity and risk
- 🔍 **Deep Investigation** - Mandatory file reading before code modifications
- 🔒 **Atomic Commits** - Conventional Commits protocol with incremental approvals

## Installation

### Prerequisites

- Claude Code installed and running
- Git (for marketplace installation)

### Full Install Script (Recommended)

```shell
wget -O ~/.claude/CLAUDE.md https://raw.githubusercontent.com/OutlineDriven/odin-claude-plugin/refs/heads/main/CLAUDE.md && claude plugin marketplace add OutlineDriven/odin-claude-plugin && claude plugin install odin@odin-marketplace
```

### Verify Installation

```shell
# List available agents
/agents

# View all commands
/help

# See the installed plugins
/plugin
```

## Core Philosophy

ODIN follows strict engineering principles:

1. **Investigate Before Acting** - Never speculate about code you haven't read
2. **Diagram-First Design** - Five mandatory diagrams before any implementation
3. **Surgical Precision** - Minimal, targeted changes using AST-based tools
4. **Atomic Commits** - One logical change per commit, properly typed
5. **Confidence-Driven** - Adapt behavior based on familiarity and risk
6. **Tool Selection** - ast-grep > native-patch > ripgrep (never sed for edits)

### Five Required Diagrams

Before any non-trivial implementation:

1. **Architecture** - Components, interfaces, contracts, dependencies
2. **Data Flow** - Sources, transformations, sinks, state transitions
3. **Concurrency** - Threads, synchronization, happens-before relationships
4. **Memory** - Ownership, lifetimes, allocation patterns, safety guarantees
5. **Optimization** - Bottlenecks, targets, complexity bounds, resource budgets

## Skills (77 total — selected highlights below)

Skills are invokable workflows that extend ODIN with process- and domain-specific protocols. Invoke with `/<skill-name>`; many also trigger on natural language cues described in their frontmatter.

### Planning & Exploration (4 skills)

- `askme` - Verbalized Sampling protocol for deep intent exploration before planning
- `plan` - Thorough read-only planning before any action
- `contexts` - Coordinate context sweep before coding
- `init` - Analyze a codebase and create or improve AGENTS.md

### Working Posture (1 skill)

- `duet` - Two-party posture: user as director, agent as executor. Surfaces every fork via AskUserQuestion with structural framing and a recommended default. Eliminates the review-bottleneck and prevents codebase-understanding debt. Pair with the `Duet` output style.

### Engineering Methodologies (6 skills)

- `test-driven` - TDD with 10-language support
- `type-driven` - Type-driven development (Idris 2, with 10-language support)
- `proof-driven` - Proof-driven development (Lean 4, with property-based testing fallback and 10-language support)
- `design-by-contract` - DbC with 10-language support and verification dispatch
- `validation-first` - Validation-first (Quint spec) with 10-language support
- `tests-purge-unneeded` - Delete tests that don't catch real bugs (the inverse of TDD); load-bearing principles, static-vs-dynamic carve-out, language-specific examples

### Tooling (2 skills)

- `ast-grep` - Structural code search, analysis, and refactoring
- `srgn-cli` - Grammar-aware scoped regex transforms

### Execution (3 skills)

- `proceed` - Execute an implementation plan with surgical precision
- `parallel-launch` - Decompose a task into independent concerns and execute via agents
- `tests-adversarial` - Adversarial tests that stress failure paths

### Review & Resolution (2 skills)

- `review` - Review code changes on the current branch
- `resolve` - Resolve code review comments with validity checks

### Cleanup & Refactoring (2 skills)

- `refactor-break-bw-compat` - Refactor by removing backward-compatibility and legacy layers (public API surface)
- `cleanup-codebase` - Internal micro-hygiene: dead fields, redundant wrappers, stale config flags, identity passthrough — applied while touching nearby code, not as standalone PRs

### GitHub Integration (5 skills)

- `pr-review` - Review code on a GitHub PR using `gh`
- `pr-merge-base` - Merge PRs into the base branch with queue-like sequencing
- `pr-merge-temporal` - Merge multiple PRs into a temporal integration branch first
- `gh-address-comments` - Help address review/issue comments on the current PR
- `gh-fix-ci` - Inspect failing CI checks, pull logs, propose fixes

### Codebase Intelligence & Workflow (15 skills, ported from agent-sh)

- `repo-intel` - Native repo intelligence: hotspots, coupling, bus factor, bugspots, ownership, entry points from git history + codegraph
- `agnix` - Native agent-config lint (frontmatter, CLAUDE.md/AGENTS.md, hooks, MCP, manifests) with certainty grading
- `deslop` - Three-phase certainty-graded AI-slop detection with HIGH-only guarded autofix
- `sync-docs` - Diff-driven doc-vs-code drift detection; safe version/CHANGELOG fixes, rest flagged
- `banthis` - Persist hard user prohibitions into a managed AGENTS.md/CLAUDE.md section
- `drift-detect` - Plan-vs-reality reality check across GitHub, docs, and code
- `audit-project` - Iterative multi-agent code audit with a false-positive contract
- `onboard` - New-codebase orientation tour with interactive guidance
- `can-i-help` - Route contributors to data-backed contribution opportunities
- `learn` - Online research into a RAG-optimized learning guide + retrieval index
- `system-prompt-curator` - Create or improve autonomous-agent system prompts
- `skillers` - Mine sanitized transcripts into automation recommendations
- `enhance` - Certainty-graded enhancement of agent/plugin surfaces via parallel analyzers
- `perf-investigate` - Self-contained multi-phase performance investigation
- `next-task` - Explicit-only backlog orchestrator with isolated git-branchless gates

## Output Styles (4 total)

Output styles shape *how* the agent communicates. Switch via Claude Code's `/config` or by setting `outputStyle` in `settings.json`.

- `ODIN` - Default. Skeptic register, scope discipline, systematic skepticism, no reflexive validation.
- `AxiomMode` - Formal-logic English with predicate-form claims, Hoare-triple framing, ASCII shortened-English keywords. Daily-driver register for coding work.
- `Builder` - For non-technical builders (PMs, founders, designers, no-code users). Outcome-first, plain-language, progressive disclosure.
- `Duet` - Companion to the `duet` skill. Decisions before prose, structural/taste framing first, jargon on demand, silent mechanics / loud forks. Enforces `duet` skill invocation.

## Configuration

### Settings.json

ODIN includes comprehensive `settings.json` with:

- **Tool Permissions** - Pre-approved tools (ast-grep, fd, rg, cargo, npm, git, etc.)
- **MCP Integration** - Time, browser, git, context7, tavily, and more
- **Security** - Denied operations (sed -i, force push, destructive commands)
- **Hooks** - Event-driven automation
- **Defaults** - Bypass permissions mode, always thinking enabled

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

1. **Find** - Use ast-grep (code), ripgrep (text), fd (files)
2. **Copy** - Extract minimal context with precise offsets
3. **Paste** - Apply surgically with AST-based transformations

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
5. **srgn** - Grammar-aware scoped regex transforms (AST-scoped, multi-language)
6. **native-patch / Edit** - Final precise edits when Find → Transform → Verify converges
7. **eza** - Directory listing (NEVER use `ls`)
8. **bat -P -p -n** - File display (NEVER use `cat`)

### Tool Permission Issues

Check `settings.json` for tool permissions. ODIN pre-configures safe tool usage.

## License

See LICENSE file for details.

## Support

- **Issues**: https://github.com/OutlineDriven/odin-claude-plugin/issues
- **Repository**: https://github.com/OutlineDriven/odin-claude-plugin

## Acknowledgments

Built on Claude Code's powerful plugin system with focus on professional software engineering practices, surgical precision, and comprehensive workflow automation.

---

**Outline-Driven Development** for Claude Code — [outlinedriven.github.io](https://outlinedriven.github.io)
