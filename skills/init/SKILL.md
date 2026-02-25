---
name: inits
description: Analyze a codebase and create an AGENTS.md file for future agent instances. Use when onboarding to a new repository, when the user asks to create or improve an AGENTS.md, or when documenting build/lint/test commands and high-level architecture.
---

# Init - AGENTS.md Generator

Analyze this codebase and create an AGENTS.md file for future ODIN Code Agent instances.

## Core principle

**Only encode knowledge that is expensive to rediscover.** An agent can `fd`, `rg`, `ast-grep`, and read any file in seconds. If the information is one search away, omit it.

## What to include

1. **Non-obvious build/test incantations** — commands with flags, env vars, or ordering that aren't apparent from `package.json`/`Makefile`/`Justfile` alone (e.g., required setup steps, how to run a single test in a monorepo).
2. **Cross-cutting architecture** — relationships, conventions, and invariants that span multiple files and cannot be inferred from any single file (e.g., "handlers in `api/` must never import from `internal/repo` directly — always go through `service/`").
3. **Implicit contracts** — naming conventions, error-handling policies, module boundaries, or deployment constraints that live in tribal knowledge rather than code.

## What to omit (the agent can discover these)

- File/directory listings and per-file descriptions.
- Dependency lists or version tables (read `package.json`, `Cargo.toml`, etc.).
- Generic best practices (error messages, test coverage, secrets handling).
- Information already in README.md — reference it, don't duplicate.
- Fabricated sections ("Common Development Tasks", "Tips", "Support") with no basis in actual project files.

## Workflow

- If an AGENTS.md already exists, suggest targeted improvements rather than rewriting.
- Do not repeat yourself. Each fact appears once.
- Every statement must be grounded in files you actually read — never invent.
