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

One repository serves every harness below. There is no build step and no converter —
each tool reads `skills/` directly.

### Prerequisites

- Claude Code installed and running
- Git (for marketplace installation)

### Full Install Script (Claude Code)

```shell
claude plugin marketplace add OutlineDriven/odin-claude-plugin && claude plugin install odin@odin-marketplace
```

### Other coding agents

| Harness | Install | Extra files needed |
|---|---|---|
| Codex CLI | `codex plugin marketplace add OutlineDriven/odin-claude-plugin` then `codex plugin add odin@odin-marketplace` | none — Codex reads `.claude-plugin/` |
| Grok Build CLI | `grok plugin install OutlineDriven/odin-claude-plugin` | none — Grok reads Claude Code plugins with zero configuration |
| Devin CLI | `devin plugins install OutlineDriven/odin-claude-plugin` | `.devin-plugin/` |
| Antigravity (`agy`) | `agy plugin install https://github.com/OutlineDriven/odin-claude-plugin` | root `plugin.json` |
| Cursor | `/add-plugin odin` in Cursor Agent chat | `.cursor-plugin/` |
| Kimi Code CLI | `/plugins install https://github.com/OutlineDriven/odin-claude-plugin` then `/reload` | `.kimi-plugin/` |
| opencode | local checkout only — see below | `.opencode/plugins/odin.js` |

Codex and Grok need no ODIN-specific manifest: both resolve `.claude-plugin/plugin.json`,
and Codex additionally reads `.claude-plugin/marketplace.json`.
`.agents/plugins/marketplace.json` is shipped as Codex's current (non-legacy) marketplace
path.

**Devin** documents a `.claude-plugin/` fallback from 3000.3.22, but builds before that
hard-fail without `.devin-plugin/plugin.json`, so ODIN ships one. Devin also gates plugins
behind a closed beta — request access from Cognition first. Skills surface as
`/odin:<skill>`.

**opencode** documents `plugin[]` entries for npm packages only, so there is no
one-command install from this repository. Clone it and point `opencode.json` at the
plugin file:

```json
{
  "plugin": ["/path/to/odin-claude-plugin/.opencode/plugins/odin.js"]
}
```

The plugin registers `skills/` on `config.skills.paths` and adds one command per skill,
skipping the six marked `disable-model-invocation` because opencode has no manual-only
gate.

Verified at `1.17.101` on Linux: Devin from a clean local clone of this repository, Codex
from the published marketplace at the same revision, the rest against the working tree.
Every version below was read from the installed binary with `--version`, not assumed:

| Harness | Installed version | Check | Result |
|---|---|---|---|
| Codex CLI | `codex-cli 0.147.0` | `plugin marketplace upgrade` + `plugin add` | installed at `1.17.101`, 127 skills in plugin root |
| Devin CLI | `devin 3000.2.17` | `devin plugins install` | installed, 127 skills exposed as `/odin:<skill>` |
| Antigravity | `agy 1.1.12` | `agy plugin validate .` | ok, 128 processed: the 127 skills plus `skills/LICENSES.md`, which agy counts as a skill |
| Grok Build | `grok 0.2.118 [stable]` | `grok plugin validate .` | manifest valid, 1 skill dir, 0 command dirs, 0 agent dirs |
| Claude Code | `2.1.228` | `claude plugin validate .` | passed with warnings |
| opencode | not installed | module exercised directly | 121 commands, 6 manual-only excluded |

**Cursor and Kimi installs are unproven.** `kimi 0.28.1` has no `plugin` subcommand, so its
plugin install is untested, but its skills do load headlessly: `kimi -p '<prompt>'
--skills-dir <repo>/skills` resolved `show-me` from its description at `1.17.101`.
`cursor-agent 2026.07.23` does expose `plugin marketplace add <gitUrl>`, but marketplaces
there are account-scoped, so installing would mutate account state and was not exercised.
Both manifests match the vendors' published schemas; treat first install as unproven.

`claude plugin validate --strict` fails on this repo, and did so before any harness work:
`repository` in `.claude-plugin/plugin.json`, and `metadata.lastUpdated`, `.maintainer`,
`.website` and `.support` in `.claude-plugin/marketplace.json`, are unknown to Claude Code,
which ignores them at load time. Non-strict validation passes with those five warnings.

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

## Skills (127 total)

Skills are invokable workflows that extend ODIN with process- and domain-specific protocols. Invoke with `/<skill-name>`; many also trigger on natural language cues described in their frontmatter.

### Planning & Exploration (22 skills)

- `askme` - Verbalized Sampling protocol for deep intent exploration before planning
- `batch-ask-me` - Walk a dependency-aware design tree in batched question rounds until shared understanding
- `wayfinder` - Chart a multi-session effort into a destination, mapped fog, and decision tickets on the frontier
- `mutual-sync` - Three-way grounding: verify user, agent, and codebase share one picture of current state before proceeding
- `loop-me` - Design recurring workflows through a stateful `askme` session and cwd specs
- `to-questionnaire` - Turn a knowledge gap into an async questionnaire for the person who can answer it
- `clarify` - Scan a request, document, or conversation for ambiguities and unstated assumptions; certainty-tiered findings with defaults
- `generalize-from-cases` - Derive the rule the user means from the examples they gave, with rival readings and a stated boundary
- `exhaustive` - Prove a decision, state, or requirement space is fully covered by enumerating every cell as covered, gap, or deferred
- `shape` - Shape Up shaping: appetite, breadboard, rabbit holes, no-gos for a bet on work
- `to-tickets` - Break a plan into tracer-bullet tickets with blocking edges, on GitHub or in `.outline/`
- `contexts` - Coordinate context sweep before coding
- `domain-modeling` - Build and sharpen a project's ubiquitous language, glossary, and domain decisions as you design
- `init` - Analyze a codebase and create or improve AGENTS.md
- `brainstorm` - Explore vague or ambitious ideas into a right-sized requirements-only plan
- `explore` - Read-only codebase exploration to map structure, symbols, and dependencies
- `strategy` - Sharp interview to write or maintain STRATEGY.md as the product anchor
- `ideate` - Generate grounded, divergent ideas from the codebase into docs/ideation
- `design` - Set visual and interaction direction for UI surfaces before writing code
- `prototype-logic` - Throwaway single-file HTML demo that answers one question about a state model
- `pov` - Decisive, project-grounded verdict on adopting or switching technology
- `research` - Gather external knowledge from authoritative sources with verified citations

### Writing & Learning (7 skills)

- `teach` - Run a persistent cwd teaching workspace, and route to the corpus skills when the material already exists
- `map-corpus` - Inventory a folder of your own study material into one CORPUS.md with prerequisite-ordered concepts
- `explain-concept` - Make one concept clear from a chosen angle: intuition, motivation, origin, picture, or contrast
- `drill` - Practise a concept and get graded: scaffolded exercises, quizzes, spaced recall, and gap probes
- `capstone` - Scope and judge a real project sized to what the learner has actually cleared
- `writing-skills` - Reference for writing agent-consumed documents so they run predictably: context load, hierarchy, leading words, and pruning
- `book-to-skill` - Distil a book or comparable source into a validated, trigger-probed agent skill

### Working Posture (7 skills)

- `duet` - Two-party posture: user as director, agent as executor. Surfaces every fork via AskUserQuestion with structural framing and a recommended default. Eliminates the review-bottleneck and prevents codebase-understanding debt. Pair with the `Duet` output style.
- `axiom-mode` - Compact formal-logic English register using predicate claims and ASCII keywords
- `ai-collab-protocols` - Surface in-task AI collaboration protocols one tactic at a time
- `taste` - Apply distinctive judgment to prose, code, design, or decisions instead of AI mediocrity
- `do-it-now` - Single-pass posture: ship the whole ask now, with no phases, stubs, or follow-up remainders
- `necessary-work` - Gate every candidate action on the delete test: outcome unmet or unproven, or the action is rejected
- `wait-what` - Re-pitch a message that did not land, with context, plain-language phrasing, and the project's own vocabulary

### Engineering Methodologies (16 skills)

- `test-driven` - TDD with 10-language support
- `type-driven` - Type-driven development (Idris 2, with 10-language support)
- `proof-driven` - Proof-driven development (Lean 4, with property-based testing fallback and 10-language support)
- `contract-driven` - Design-by-Contract (DbC): pre/post/invariants at API boundaries, state invariants, and trust boundaries
- `validation-first-driven` - State machines, invariants, and temporal properties (Quint spec) before implementation
- `tests-purge-unneeded` - Delete tests that don't catch real bugs (the inverse of TDD); load-bearing principles, static-vs-dynamic carve-out, language-specific examples
- `spec-driven` - Write a structured spec before writing code
- `source-driven` - Ground implementation decisions in official documentation with version-aware citations
- `ground-latest` - Pin versions, stacks, and practices from today's release channels instead of from recall
- `doubt-driven` - Subject non-trivial decisions to adversarial review before they stand
- `minimalism-driven` - Minimalism as enforced doctrine: null-solution start, need-gated additions, delete > edit > add as authoring-time gates
- `verification-before-completion` - Require fresh, fully-read run evidence before any completion claim
- `lighter-checks` - Size verification to the change: one proving action, scoped, no repeat runs, gate intact
- `codebase-design` - Shared vocabulary for deep modules: module, interface, depth, seam, adapter, leverage, locality
- `security-hardening` - Harden code against vulnerabilities as you build it
- `observability` - Instrument code with logging, metrics, traces, and alerts

### Tooling (10 skills)

- `ast-grep` - Structural code search, analysis, and refactoring
- `browser-testing` - Test and debug browser code with Chrome DevTools MCP
- `diagram-contract` - Author a diagram to the house contract: nomnoml or D2 source, house palette, rendered SVG committed beside it
- `git-branchless` - Idiomatic git-branchless workflows for stack edits, rebases, and stacked-PR publishing
- `setup-gitignore` - Compose or revise .gitignore from templates, editor patterns, and confirmed untracked noise
- `setup-pre-commit` - Install ecosystem-appropriate pre-commit hooks for formatting, linting, and test gates
- `setup-git-guardrails` - Install a PreToolUse hook that blocks irreversible git operations before they run
- `setup-ts-deep-modules` - Enforce TypeScript package boundaries through entry points with dependency-cruiser
- `strict-validation-setup` - Bootstrap strict-mode tooling and per-task GOALS.md scaffolding for self-verifying agent loops
- `wizard` - Generate an interactive bash wizard that walks a human through a manual setup or migration

### Execution (17 skills)

- `parallel-launch` - Decompose a task into independent concerns and execute via agents
- `tests-adversarial` - Adversarial tests that stress failure paths
- `work` - Execute a plan or concrete work prompt end-to-end
- `subagent-driven` - Delegate a multi-task plan to fresh subagents, auditing results before proceeding
- `workflows-driven` - Deterministic phased fan-out with per-task contracts and adversarial verification; materializes on Claude Code Dynamic Workflows or omp eval orchestration
- `fix` - Iterative repair loop that fixes one thing at a time and keeps changes on green
- `resolving-merge-conflicts` - Resolve an in-progress merge or rebase conflict from both sides' primary sources, then finish the integration
- `autopilot` - Hands-off plan-to-ship pipeline chaining existing skills
- `llm-self-loop` - Restructure human-gated workflows into autonomous LLM loops with file-based outputs
- `incremental` - Deliver changes in small, testable slices
- `update-todos` - Re-sync a stale task list against what actually landed, with proof required per completion
- `sophisticate-todos` - Split compound tasks into atomic ones, order by dependency, pin an acceptance criterion to each
- `debug` - Hypothesis-driven debugging with minimal reproduction
- `frontend-ui` - Build production-quality user-facing interfaces
- `optimize` - Locate a hot path, benchmark transformations, and commit the proven winner
- `extremely-optimize` - Rebuild code from its performance floor: hot paths demolished and re-derived first, cold paths grilled after
- `shipping` - Prepare a production launch with checklists, monitoring, and rollback planning

### Review & Resolution (6 skills)

- `review` - Review code changes on the current branch
- `resolve` - Resolve code review comments with validity checks
- `doc-review` - Review requirements docs, plans, specs, and PRDs through persona-based lenses
- `security-review` - Adversarial security audit using STRIDE, OWASP, supply-chain checks, and secrets scans
- `review-fix-grill-loop` - Review and fix a diff in verified batches until no medium-or-higher finding remains
- `simplify` - Compress-op review pass on reuse, quality, and efficiency axes

### Cleanup & Refactoring (8 skills)

- `refactor-break-compat` - Refactor by removing backward-compatibility and legacy layers (public API surface)
- `breaking-driven` - Bloat-triggered demolition: state the contract, derive the replacement blind, cut the residue; interior surfaces go without asking, boundary surfaces stop for a yes
- `cleanup-codebase` - Internal micro-hygiene: dead fields, redundant wrappers, stale config flags, identity passthrough — applied while touching nearby code, not as standalone PRs
- `tidy` - Dispatch compress operations to the right domain: file, diff, memory, workspace, git stack, or doc
- `improve-architecture` - Surface deepening refactors that turn shallow modules into deep ones
- `deprecate-and-migrate` - Plan and execute deprecation and migration of old systems, APIs, or features
- `to-greenfield` - Diagnose a degraded codebase's field state (darkfield/redfield/bluefield/brownfield) and route the recovery
- `slop` - Slop front door: verdict or purge for code, prose, decisions, or UI, routed to the right domain authority

### GitHub Integration (14 skills)

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
- `propose-issue` - Turn a symptom into a source-grounded GitHub issue: evidence, analysis, self-review gate, then file
- `resolve-pr-feedback` - Resolve PR review feedback and fix code-review comments
- `worktree` - Set up isolated git worktrees for new or existing branches/PRs

### Codebase Intelligence & Workflow (20 skills)

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
- `cascade-dedup` - Strip duplicate and conflicting directives across the system-prompt cascade family
- `dedup-skills` - Ledger-first dedup of a skills/ tree: find repeated or self-conflicting rules across skill files
- `handoff` - Snapshot the current session into a resumable handoff artifact for a cold session, agent, or person
- `show-me` - Answer the current topic with the smallest visual: pseudocode, tree, diagram, or diff

## Output Styles (6 total)

Output styles shape *how* the agent communicates. Switch via Claude Code's `/config` or by setting `outputStyle` in `settings.json`.

- `ODIN` - Default. Skeptic register, scope discipline, systematic skepticism, no reflexive validation.
- `AxiomMode` - Formal-logic English with predicate-form claims, Hoare-triple framing, ASCII shortened-English keywords. Daily-driver register for coding work.
- `Builder` - For non-technical builders (PMs, founders, designers, no-code users). Outcome-first, plain-language, progressive disclosure.
- `Duet` - Companion to the `duet` skill. Decisions before prose, structural/taste framing first, jargon on demand, silent mechanics / loud forks. Enforces `duet` skill invocation.
- `Linus` - Torvalds review discipline. Good taste as special-case elimination, blunt about the work, show the corrected code rather than describe it.
- `Eval` - Benchmark harness register (`output-styles/benchmark.md`). Auto-generated by margin-runner; do not hand-edit above the doctrine cascade.

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
