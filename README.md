# ODIN Claude Plugin

**ODIN** (Outline Driven INtelligence) - Advanced code agent system for Claude Code with surgical precision, diagram-first engineering, and comprehensive workflow automation.

## Overview

ODIN is a professional-grade Claude Code plugin that transforms Claude into a sophisticated code agent with specialized capabilities across 15+ programming languages, comprehensive workflow automation, and rigorous engineering methodology.

**Key Capabilities:**
- 🤖 **57 Specialized Agents** - Language experts, architects, analyzers, and domain specialists
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
# Clone the repository
git clone https://github.com/OutlineDriven/odin-claude-plugin.git

# Copy the contents of the repository to the .claude-plugin directory
cp ./odin-claude-plugin/CLAUDE.md ~/.claude/CLAUDE.md
cp ./odin-claude-plugin/settings.json ~/.claude/settings.json

# Add the ODIN repository as a marketplace
claude plugin marketplace add OutlineDriven/odin-claude-plugin

# Install ODIN plugin
claude plugin install odin-claude-plugin@odin-marketplace
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

**ODIN** - Outline Driven INtelligence for Claude Code
