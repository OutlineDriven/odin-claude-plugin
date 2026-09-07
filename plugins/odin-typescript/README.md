# ODIN TypeScript

ODIN workflows for modern TypeScript development.

16 skills, category Coding. Install the whole plugin below, or take a single skill with `gh skill install`.

## Install

```bash
# Claude Code
/plugin marketplace add OutlineDriven/odin-claude-plugin
/plugin install odin-typescript@odin-marketplace

# Codex
codex plugin marketplace add OutlineDriven/odin-claude-plugin
codex plugin add odin-typescript@odin-marketplace
```

Cursor, Grok, and Kimi install from this same tree. The repository README gives each command.

## Skills

Each row states when to reach for the skill. Invoke one with `/skill:<name>`.

| Skill | Trigger |
|---|---|
| eslint-to-biome-migration | Use when migrating a JavaScript or TypeScript project from ESLint, Prettier, Standard, or mixed legacy lint configuration to Biome 2.5. |
| fastify-inject-testing | Use when asked to test Fastify applications without network sockets. |
| fastify-production-hardening | Use when asked to prepare a Fastify service for production load and exposure. |
| fastify-schema-first-service | Use when building or extending a Fastify application: routes, plugins, hooks, database wiring. |
| multi-tenant-architecture | Use when a request concerns multi-tenant scaffolding, tenant isolation, domain wiring, or SaaS architecture on Cloudflare or Vercel. |
| node-internals-diagnosis | Use when Node.js segfaults, addon crashes, leaks, event-loop anomalies, thread-pool saturation, V8 deoptimizations, or binding.gyp failures need diagnosis. |
| nodejs-graceful-shutdown | Use when asked to implement or fix service termination: SIGTERM or SIGINT, connection draining, health-check signaling. |
| nodejs-hanging-test-diagnosis | Use when asked to diagnose Node.js tests that hang after the runner reports completion. |
| nodejs-service-foundations | Use when asked to set up or harden Node.js service foundations: env validation, logging, typed errors, type stripping, and shutdown wiring. |
| nodejs-stream-pipeline | Use when asked to build Node.js stream ETL pipelines for large-file or continuous ingestion without exceeding heap memory. |
| replace-unsafe-typescript-assertions | Use when TypeScript tests use unsafe any or as assertions for partial or intentionally invalid fixtures. |
| scaffold-cli | Use when asked to create a complete Node.js 24 TypeScript 7 command-line project. |
| scaffold-nextjs | Use when asked to scaffold a Next.js turborepo end to end and verify it. |
| setup-ts-deep-modules | Use when asked to enforce boundaries, set up deep modules, stop deep imports, mutation-prove rules, or make entry-point packages. |
| typescript-best-practices | Use when TypeScript needs shaping toward narrow types, unions, exhaustive variants, and strict flags. |
| typescript-type-hardening | Use when TypeScript has type errors, failing inference, or needs type mechanism repair (generics, infer, mapped, branded). |

## Workflows

[docs/guides/workflows.md](../../docs/guides/workflows.md) shows how these skills chain with the rest of the tree.
