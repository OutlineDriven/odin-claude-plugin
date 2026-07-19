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

## Skills (100 total)

Skills are invokable workflows that extend ODIN with process- and domain-specific protocols. Invoke with `/<skill-name>`; many also trigger on natural language cues described in their frontmatter.

### Planning & Exploration (16 skills)

- `askme` - Verbalized Sampling protocol for deep intent exploration before planning
- `batch-ask-me` - Walk a dependency-aware design tree in batched question rounds until shared understanding
- `mutual-sync` - Three-way grounding: verify user, agent, and codebase share one picture of current state before proceeding
- `loop-me` - Design recurring workflows through a stateful `askme` session and cwd specs
- `to-questionnaire` - Turn a knowledge gap into an async questionnaire for the person who can answer it
- `plan` - Thorough read-only planning before any action
- `contexts` - Coordinate context sweep before coding
- `init` - Analyze a codebase and create or improve AGENTS.md
- `brainstorm` - Explore vague or ambitious ideas into a right-sized requirements-only plan
- `explore` - Read-only codebase exploration to map structure, symbols, and dependencies
- `zoom-out` - Step up one layer of abstraction to map surrounding modules and invariants
- `strategy` - Sharp interview to write or maintain STRATEGY.md as the product anchor
- `ideate` - Generate grounded, divergent ideas from the codebase into docs/ideation
- `design` - Set visual and interaction direction for UI surfaces before writing code
- `pov` - Decisive, project-grounded verdict on adopting or switching technology
- `research` - Gather external knowledge from authoritative sources with verified citations

### Writing & Learning (4 skills)

- `teach` - Run a persistent cwd teaching workspace across missions, lessons, resources, and learning records
- `writing-fragments` - Mine heterogeneous raw material into an append-only pile before shaping
- `writing-shape` - Shape a raw pile into an article paragraph by paragraph with argued formats
- `writing-beats` - Build a grounded article journey one candidate beat at a time

### Working Posture (5 skills)

- `duet` - Two-party posture: user as director, agent as executor. Surfaces every fork via AskUserQuestion with structural framing and a recommended default. Eliminates the review-bottleneck and prevents codebase-understanding debt. Pair with the `Duet` output style.
- `axiom-mode` - Compact formal-logic English register using predicate claims and ASCII keywords
- `caveman` - Verbosity-reduction response register for brevity under context pressure
- `ai-collab-protocols` - Surface in-task AI collaboration protocols one tactic at a time
- `taste` - Apply distinctive judgment to prose, code, design, or decisions instead of AI mediocrity

### Engineering Methodologies (14 skills)

- `test-driven` - TDD with 10-language support
- `type-driven` - Type-driven development (Idris 2, with 10-language support)
- `proof-driven` - Proof-driven development (Lean 4, with property-based testing fallback and 10-language support)
- `design-by-contract` - DbC with 10-language support and verification dispatch
- `validation-first` - Validation-first (Quint spec) with 10-language support
- `tests-purge-unneeded` - Delete tests that don't catch real bugs (the inverse of TDD); load-bearing principles, static-vs-dynamic carve-out, language-specific examples
- `spec-driven` - Write a structured spec before writing code
- `source-driven` - Ground implementation decisions in official documentation with version-aware citations
- `doubt-driven` - Subject non-trivial decisions to adversarial review before they stand
- `minimalism-driven` - Minimalism as enforced doctrine: null-solution start, need-gated additions, delete > edit > add as authoring-time gates
- `verification-before-completion` - Require fresh, fully-read run evidence before any completion claim
- `api-design` - Guide stable API and interface design across module boundaries
- `security-hardening` - Harden code against vulnerabilities as you build it
- `observability` - Instrument code with logging, metrics, traces, and alerts

### Tooling (7 skills)

- `ast-grep` - Structural code search, analysis, and refactoring
- `browser-testing` - Test and debug browser code with Chrome DevTools MCP
- `git-branchless` - Idiomatic git-branchless workflows for stack edits, rebases, and stacked-PR publishing
- `setup-gitignore` - Compose or revise .gitignore from templates, editor patterns, and confirmed untracked noise
- `setup-pre-commit` - Install ecosystem-appropriate pre-commit hooks for formatting, linting, and test gates
- `setup-ts-deep-modules` - Enforce TypeScript package boundaries through entry points with dependency-cruiser
- `strict-validation-setup` - Bootstrap strict-mode tooling and per-task GOALS.md scaffolding for self-verifying agent loops

### Execution (14 skills)

- `proceed` - Execute an implementation plan with surgical precision
- `parallel-launch` - Decompose a task into independent concerns and execute via agents
- `tests-adversarial` - Adversarial tests that stress failure paths
- `work` - Execute a plan or concrete work prompt end-to-end
- `subagent-driven` - Delegate a multi-task plan to fresh subagents, auditing results before proceeding
- `workflows-driven` - Deterministic phased fan-out with per-task contracts and adversarial verification; materializes on Claude Code Dynamic Workflows or omp task batches
- `fix` - Iterative repair loop that fixes one thing at a time and keeps changes on green
- `autopilot` - Hands-off plan-to-ship pipeline chaining existing skills
- `llm-self-loop` - Restructure human-gated workflows into autonomous LLM loops with file-based outputs
- `incremental` - Deliver changes in small, testable slices
- `debug` - Hypothesis-driven debugging with minimal reproduction
- `frontend-ui` - Build production-quality user-facing interfaces
- `optimize` - Locate a hot path, benchmark transformations, and commit the proven winner
- `shipping` - Prepare a production launch with checklists, monitoring, and rollback planning

### Review & Resolution (6 skills)

- `review` - Review code changes on the current branch
- `resolve` - Resolve code review comments with validity checks
- `doc-review` - Review requirements docs, plans, specs, and PRDs through persona-based lenses
- `security-review` - Adversarial security audit using STRIDE, OWASP, supply-chain checks, and secrets scans
- `review-fix-grill-loop` - Review and fix a diff in verified batches until no medium-or-higher finding remains
- `simplify` - Compress-op review pass on reuse, quality, and efficiency axes

### Cleanup & Refactoring (5 skills)

- `refactor-break-compat` - Refactor by removing backward-compatibility and legacy layers (public API surface)
- `cleanup-codebase` - Internal micro-hygiene: dead fields, redundant wrappers, stale config flags, identity passthrough — applied while touching nearby code, not as standalone PRs
- `tidy` - Dispatch compress operations to the right domain: file, diff, memory, workspace, git stack, or doc
- `improve-architecture` - Surface deepening refactors that turn shallow modules into deep ones
- `deprecate-and-migrate` - Plan and execute deprecation and migration of old systems, APIs, or features

### GitHub Integration (13 skills)

- `pr-review` - Review code on a GitHub PR using `gh`
- `pr-merge-base` - Merge PRs into the base branch with queue-like sequencing
- `pr-merge-temporal` - Merge multiple PRs into a temporal integration branch first
- `gh-fix-ci` - Inspect failing CI checks, pull logs, propose fixes
- `commit` - Create a git commit with a clear, value-communication message
- `commit-push` - Commit working-tree changes and push to the remote — no PR
- `commit-push-current` - Commit and push to the current branch — no branch creation, no branch switch, no PR
- `commit-push-pr` - Commit, push, and open a PR
- `atomic-issues-prs` - Publish a change-set as atomic GitHub issues or PRs
- `github-triage` - Triage GitHub issues through a configurable label-based state machine
- `github-solution-research` - Find proven open-source solutions on GitHub for concrete engineering problems
- `resolve-pr-feedback` - Resolve PR review feedback and fix code-review comments
- `worktree` - Set up isolated git worktrees for new or existing branches/PRs

### Codebase Intelligence & Workflow (16 skills)

- `deslop` - Three-phase certainty-graded AI-slop detection with HIGH-only guarded autofix
- `sync-docs` - Diff-driven doc-vs-code drift detection; safe version/CHANGELOG fixes, rest flagged
- `drift-detect` - Plan-vs-reality reality check across GitHub, docs, and code
- `audit-project` - Iterative multi-agent code audit with a false-positive contract
- `onboard` - New-codebase orientation tour with interactive guidance
- `can-i-help` - Route contributors to data-backed contribution opportunities
- `enhance` - Certainty-graded enhancement of agent/plugin surfaces via parallel analyzers
- `docs-and-adrs` - Record decisions and documentation that explain why the codebase is shaped as it is
- `ci-cd` - Set up or modify CI/CD pipelines and deployment automation
- `deps-upgrade` - Run a dependency-upgrade campaign from outdated scan through lockfile audit
- `memory-clean` - Audit memory files for structural rot and staleness, reporting before fixing
- `memory-sanitize` - Produce share-safe copies of memory files with PII and credentials redacted
- `memory-update` - Scan session history for save-worthy signals and propose memory files
- `autolearn` - Compound a solved problem into a durable in-repo learning doc
- `compound` - Document a durable solution or project concept in the repo
- `generate-my-taste` - Generate a personal taste skill from local evidence and confirmation forks

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

Built on Claude Code's powerful plugin system with focus on professional software engineering practices, surgical precision, and comprehensive workflow automation.

---

**Outline-Driven Development** for Claude Code — [outlinedriven.github.io](https://outlinedriven.github.io)
