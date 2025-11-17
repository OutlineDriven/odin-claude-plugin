# ODIN Claude Plugin

**ODIN** (Outline Driven INtelligence) - Advanced code agent system for Claude Code with surgical precision, diagram-first engineering, and comprehensive workflow automation.

## Overview

ODIN is a professional-grade Claude Code plugin that transforms Claude into a sophisticated code agent with specialized capabilities across 15+ programming languages, comprehensive workflow automation, and rigorous engineering methodology.

**Key Capabilities:**
- 🤖 **57 Specialized Agents** - Language experts, architects, analyzers, and domain specialists
- ⚡ **127 Organized Commands** - Workflow automation from scaffolding to deployment
- 📐 **Diagram-First Engineering** - Architecture, concurrency, memory, data flow, optimization
- 🎯 **Surgical Code Editing** - AST-based transformations with ast-grep
- 🔒 **Atomic Commits** - Conventional Commits protocol with type safety
- 🧠 **Confidence-Driven Execution** - Adaptive behavior based on complexity and risk
- 🔍 **Deep Investigation** - Mandatory file reading before code modifications

## Installation

### Prerequisites

- Claude Code installed and running
- Git (for marketplace installation)

### Manual Copy & Paste [MANDATORY FIRST STEP]

```shell
# Clone the repository
git clone https://github.com/OutlineDriven/odin-claude-plugin.git

# Copy the contents of the repository to the .claude-plugin directory
cp .odin-claude-plugin/CLAUDE.md ~/.claude/CLAUDE.md
cp .odin-claude-plugin/settings.json ~/.claude/settings.json
```

### Install the MCPs [MANDATORY SECOND STEP]

```shell
claude mcp add -s user ast-grep -- uvx --from git+https://github.com/ast-grep/ast-grep-mcp ast-grep-server
claude mcp add -s user context7 npx @upstash/context7-mcp@latest
claude mcp add -s user time uvx mcp-server-time
claude mcp add -s user sequentialthinking-tools npx mcp-sequentialthinking-tools
claude mcp add -s user actor-critic-thinking -- npx -y mcp-server-actor-critic-thinking
claude mcp add -s user shannon-thinking -- npx -y server-shannon-thinking@latest
```

### Via GitHub (Recommended)

```shell
# Add the ODIN repository as a marketplace
/plugin marketplace add OutlineDriven/odin-claude-plugin

# Install ODIN plugin
/plugin install odin-claude-plugin@odin-marketplace
```

### Via Local Path

```shell
# Add local repository as marketplace
/plugin marketplace add /path/to/odin-claude-plugin

# Install plugin
/plugin install odin-claude-plugin@odin-marketplace
```

### Verify Installation

```shell
# List available agents
/agents

# View all commands
/help

# Test with a simple command
/analyze/code/map
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

## Agents

### Language Specialists (16 agents)

**Modern Languages:**
- `rust-pro` / `rust-pro-ultimate` - Rust Edition 2024, zero-cost abstractions, ownership
- `typescript-pro` - Strict mode, discriminated unions, no any/unknown
- `python-pro` - Type hints, asyncio, pathlib, dataclasses
- `golang-pro` - Context-first, goroutines, structured concurrency
- `java-pro` - Java 21+, records, virtual threads, sealed classes
- `kotlin-pro` - K2, coroutines, null safety, immutability

**Systems Programming:**
- `cpp-pro` / `cpp-pro-ultimate` - C++20+, RAII, smart pointers, ranges
- `c-pro` / `c-pro-ultimate` - Modern C, memory safety, systems programming

**Web & Enterprise:**
- `javascript-pro` - ES6+, async patterns, Node.js
- `php-pro` - Modern PHP, generators, SPL structures
- `csharp-pro` - C# latest, async/await, LINQ

**Database:**
- `sql-pro` / `sql-query-engineer` - Complex queries, optimization, schema design

### Architecture & Design (7 agents)

- `architect` - System architecture, technical decisions, scalability
- `backend-architect` - Backend systems, APIs, service architecture
- `graphql-architect` - GraphQL schemas, resolvers, federation
- `docs-architect` - Technical documentation, architecture guides
- `ui-ux-designer` - Interface design, user experience, design systems
- `artistic-designer` - Visual design, aesthetics, branding elements
- `branding-specialist` - Brand identity, visual language, corporate identity

### Code Quality (10 agents)

- `code-reviewer` - Expert code review, quality, security, maintainability
- `debugger` - Root cause analysis, error resolution, stack trace interpretation
- `refactorer` - Code restructuring, design improvements
- `refactor-planner` - Strategic refactoring plans, technical debt reduction
- `test-writer` - Comprehensive test suites, unit/integration testing
- `test-designer-advanced` - Edge cases, chaos engineering, property-based testing
- `modernizer` - Legacy code updates, modern practices adoption
- `investigator` - Deep debugging, root cause analysis
- `criticizer` - Critical analysis, constructive feedback
- `reflector` - Deep reflection, retrospectives, continuous improvement

### Performance (4 agents)

- `performance` - Holistic performance optimization, profiling, benchmarking
- `concurrency-expert` - Thread safety, synchronization, parallel patterns
- `memory-expert` - Memory optimization, leak detection, allocation analysis
- `database-optimizer` - Query optimization, indexing, schema efficiency

### Specialized Domains (13+ agents)

**Machine Learning & Data:**
- `ml-engineer` - ML pipelines, model serving, feature engineering
- `mlops-engineer` - ML infrastructure, experiment tracking, model registries
- `data-engineer` - ETL pipelines, data warehouses, streaming architectures
- `quant-researcher` - Financial models, trading strategies, market analysis
- `trading-system-architect` - HFT systems, market making, order execution

**Security & Compliance:**
- `security-auditor` - Vulnerability review, OWASP compliance, secure authentication

**Migration & Modernization:**
- `migrator` - System migrations, schema changes, version upgrades
- `porter` - Cross-platform code porting, language transitions

**Development Tools:**
- `docs` - Comprehensive technical documentation from codebases
- `reference-builder` - Exhaustive technical references, API documentation
- `meta-programming-pro` - Code generation, DSLs, abstractions
- `prompt-engineer` - LLM prompts optimization, AI features
- `sales-automator` - Sales outreach, proposal templates, pricing pages

### Frontend & Mobile (4 agents)

- `react-specialist` - React components, hooks, state management
- `flutter-specialist` - Flutter widgets, state management, platform channels
- `ios-developer` - Swift/SwiftUI, UIKit, Core Data, App Store optimization
- `mobile-developer` - React Native/Flutter, offline sync, push notifications

### Infrastructure (2 agents)

- `terraform-specialist` - IaC best practices, modules, state management
- `analyzer` - Deep analysis, pattern recognition, codebase insights

### Maintenance (1 agent)

- `tech-debt-resolver` - Technical debt identification and strategic resolution

## Commands

### Analysis Commands

**Code Analysis (`/analyze/code/`)**
- `elaborate` - Deep code elaboration and explanation
- `map` - Map codebase architecture and structure
- `schema` - Extract and document data schemas

**Data Analysis (`/analyze/data/`)**
- `data-flow` - Analyze data flow patterns
- `data-viz` - Create data visualizations
- `visualize` - Generate visual representations

**Database (`/analyze/db/`)**
- `db-optimize` - Database optimization recommendations

**Research (`/analyze/research/`)**
- `deep-dive` - Comprehensive research with web sources
- `deep-web-research` - Extensive web research with citations
- `investigate` - Investigative analysis of complex topics
- `quick-web-research` - Fast web research for quick answers

**Thinking (`/analyze/think/`)**
- `think` - Structured thinking with sequential analysis

### Code Commands

**Code Analysis (`/code/analyze/`)**
- `analyze-deps` - Comprehensive dependency analysis
- `bottleneck` - Identify performance bottlenecks
- `dependencies` - Dependency graph analysis
- `deps` - Quick dependency check
- `technical-debt` - Technical debt assessment

**Fixes (`/code/fix/`)**
- `bug-fix` - Systematic bug fixing workflow

**Generation (`/code/generate/`)**
- `api` - Generate API implementations

**Migration (`/code/migrate/`)**
- `deno-ify` - Migrate code to Deno
- `migrate` - General migration workflows

**Navigation (`/code/navigate/`)**
- `related` - Navigate to related files intelligently

**Refactoring (`/code/refactor/`)**
- `refactor` - Code refactoring workflow
- `simplify` - Simplify complex code
- `standardize` - Standardize code patterns

### Context Commands

Load framework-specific context for better assistance:

**Databases (`/context/db/`)**
- `context-load-dragonfly`, `context-load-postgres`, `context-load-redpanda`, `context-load-scylla`

**Deno (`/context/deno/`)**
- `context-load-deno-fresh`, `context-load-deno-scripting`

**Go (`/context/go/`)**
- `context-load-go-concurrency`, `context-load-go-connectrpc`, `context-load-go-web`

**Java (`/context/java/`)**
- `context-load-java-quarkus`, `context-load-java-spring`, `context-load-java-temporal`

**Kubernetes (`/context/k8s/`)**
- `context-load-cilium`, `context-load-flux`, `context-load-k8s`, `context-load-talos`

**Observability (`/context/observability/`)**
- `context-load-logging`, `context-load-observability`

**Project (`/context/project/`)**
- `auto` - Automatically detect and load project context

**Rust (`/context/rust/`)**
- `context-load-rust-async`, `context-load-rust-db`, `context-load-rust-web`

**Security (`/context/security/`)**
- `context-load-security`

**Testing (`/context/testing/`)**
- `context-load-testing-deno`, `context-load-testing-go`, `context-load-testing-java`, `context-load-testing-rust`

**Web (`/context/web/`)**
- `context-load-fresh-connect-stack`, `context-load-gh-cli`, `context-load-github-actions`
- `context-load-offline-data-platform`, `context-load-tailwind`, `context-load-temporal`

### Documentation Commands

**Analysis (`/docs/analyze/`)**
- `explain` - Explain code and documentation

**Generation (`/docs/generate/`)**
- `api-docs` - Generate API documentation
- `changelog` - Generate changelog from commits
- `document` - Generate comprehensive documentation
- `onboard` - Create onboarding documentation

**Management (`/docs/manage/`)**
- `docs-add` - Add new documentation sections
- `docs-init` - Initialize documentation structure
- `docs-update` - Update existing documentation

### Git Commands

**Commits (`/git/commit/`)**
- `commit` - Create atomic commits with Conventional Commits
- `commit-push` - Commit and push to remote

**Pull Requests (`/git/pr/`)**
- `pr-check` - Check PR status and CI/CD state
- `pr-create` - Create PR with intelligent analysis
- `pr-review` - Review and manage PRs
- `pr-update` - Update existing PRs

**Review (`/git/review/`)**
- `review-git` - Comprehensive git history review

### Meta Commands

**Command Management (`/meta/command/`)**
- `generate-command` - Generate new slash commands
- `ideate-commands` - Brainstorm command ideas

**Knowledge (`/meta/extract/`)**
- `knowledge-extract` - Extract knowledge from codebases

**Ideation (`/meta/ideate/`)**
- `ideate-new` - Ideate new features and approaches

**Reflection (`/meta/reflect/`)**
- `reflection` - Deep reflection on decisions and outcomes

**Search (`/meta/search/`)**
- `search-smart` - Intelligent codebase search

**Utilities (`/meta/util/`)**
- `scratch` - Scratch pad for quick notes
- `translate` - Translate content between languages

### Scaffolding Commands

**Deno (`/scaffold/deno/`)**
- `scaffold-deno-fresh` - Scaffold Deno Fresh app
- `scaffold-deno-script` - Scaffold Deno script

**Go (`/scaffold/go/`)**
- `scaffold-go-connect` - Scaffold Go Connect RPC service
- `scaffold-go-http-server` - Scaffold Go HTTP server

**Java (`/scaffold/java/`)**
- `scaffold-java-quarkus` - Scaffold Quarkus application

**Rust (`/scaffold/rust/`)**
- `scaffold-rust-axum` - Scaffold Axum web service
- `scaffold-rust-cli` - Scaffold Rust CLI application

### Security Commands

**Audit (`/security/audit/`)**
- `audit` - Comprehensive security audit
- `secrets-audit` - Scan for exposed secrets

**Modeling (`/security/model/`)**
- `harden` - Security hardening recommendations
- `threat-model` - Generate threat models (STRIDE methodology)

### Task Commands

**Management (`/task/manage/`)**
- `add-code-reviews-to-task`, `task-archive`, `task-create`, `task-list`
- `task-log`, `task-search`, `task-show`, `task-update`

**View (`/task/view/`)**
- `task` - View task details

### Test Commands

**Analysis (`/test/analyze/`)**
- `coverage` - Test coverage analysis

**Fixes (`/test/fix/`)**
- `flaky-fix` - Fix flaky tests

**Generation (`/test/generate/`)**
- `integration-test` - Generate integration tests
- `test-gen` - Generate test suites

**Execution (`/test/run/`)**
- `load-test` - Load testing
- `tdd` - Test-driven development workflow
- `validate` - Comprehensive validation with auto-detection

### Tool Commands

- `cpr` - Code, PR, and review workflows
- `diagram` - Generate diagrams (nomnoml/mermaid)
- `five` - Five-question analysis framework
- `review` - Comprehensive code review
- `zed-task` - Zed editor task integration

### Workflow Commands

**Creation (`/workflow/create/`)**
- `epic` - Create epic with sub-tasks
- `prototype` - Rapid prototyping workflow

**Management (`/workflow/manage/`)**
- `clean` - Clean up temporary files and artifacts
- `integrate` - Integration workflows
- `organize` - Organize project structure
- `plan` - Strategic planning
- `release` - Release management
- `sync` - Synchronization workflows

**Start (`/workflow/start/`)**
- `start` - Start new project/feature workflow

**View (`/workflow/view/`)**
- `next-steps` - Suggest next steps
- `options` - View available options
- `progress` - Show progress
- `summary` - Generate summary
- `tldr` - Quick summary

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

**Priority**:
1. **ast-grep** - Code structure, refactoring (HIGHLY PREFERRED)
2. **native-patch** - File edits, multi-file changes
3. **ripgrep** - Text, comments, strings
4. **fd** - File discovery (NEVER use find)
5. **lsd** - Directory listing (NEVER use ls)

**Banned**: sed for edits (analysis OK), find, ls, grep for code patterns

## Quick Start Examples

### Analyze Codebase

```shell
# Map architecture
/analyze/code/map

# Check dependencies
/code/analyze/deps

# Identify bottlenecks
/code/analyze/bottleneck

# Technical debt assessment
/code/analyze/technical-debt
```

### Development Workflow

```shell
# Load project context
/context/project/auto

# Scaffold new service
/scaffold/rust/scaffold-rust-axum

# Generate tests
/test/generate/test-gen

# Run validation
/test/run/validate
```

### Code Quality

```shell
# Code review
/tool/review

# Refactor code
/code/refactor/refactor

# Fix bugs
/code/fix/bug-fix

# Security audit
/security/audit/audit
```

### Git Workflow

```shell
# Atomic commit
/git/commit/commit

# Create PR
/git/pr/pr-create

# Review PR
/git/pr/pr-review

# Check PR status
/git/pr/pr-check
```

### Documentation

```shell
# Generate API docs
/docs/generate/api-docs

# Create changelog
/docs/generate/changelog

# Onboarding guide
/docs/generate/onboard

# Explain code
/docs/analyze/explain
```

## Best Practices

### Before You Start

1. **Load Context** - Use `/context/project/auto` for framework awareness
2. **Map Architecture** - Run `/analyze/code/map` to understand structure
3. **Check Dependencies** - Use `/code/analyze/deps` before major changes

### During Development

1. **Think First** - Use `/analyze/think/think` for complex problems
2. **Diagram Always** - Request diagrams before implementation
3. **Test Incrementally** - Use `/test/run/tdd` for test-driven development
4. **Review Often** - Use `/tool/review` before commits

### Before Committing

1. **Validate** - Run `/test/run/validate` for comprehensive checks
2. **Review Changes** - Use `/git/review/review-git` to review commits
3. **Atomic Commits** - Use `/git/commit/commit` for proper commit workflow
4. **Security Check** - Run `/security/audit/secrets-audit` before pushing

## Troubleshooting

### Commands Not Appearing

```shell
# Reinstall plugin
/plugin uninstall odin-claude-plugin@odin-marketplace
/plugin install odin-claude-plugin@odin-marketplace
```

### Agent Not Available

```shell
# Check installed agents
/agents

# Verify plugin is enabled
/plugin
```

### Tool Permission Issues

Check `settings.json` for tool permissions. ODIN pre-configures safe tool usage.

## Contributing

Contributions welcome! Areas of interest:

- Additional specialized agents
- New command workflows
- Framework context loaders
- Documentation improvements
- Bug fixes and enhancements

## License

See LICENSE file for details.

## Support

- **Issues**: https://github.com/OutlineDriven/odin-claude-plugin/issues
- **Repository**: https://github.com/OutlineDriven/odin-claude-plugin
- **Documentation**: This README and CLAUDE.md

## Acknowledgments

Built on Claude Code's powerful plugin system with focus on professional software engineering practices, surgical precision, and comprehensive workflow automation.

---

**ODIN** - Outline Driven INtelligence for Claude Code
