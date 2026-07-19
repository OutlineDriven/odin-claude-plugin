# Architecture Decision Records (ADRs)

ADRs capture the reasoning behind significant technical decisions. They're the highest-value documentation you can write.

## When to Write an ADR

- Choosing a framework, library, or major dependency
- Designing a data model or database schema
- Selecting an authentication strategy
- Deciding on an API architecture (REST vs. GraphQL vs. tRPC)
- Choosing between build tools, hosting platforms, or infrastructure
- Any decision that would be expensive to reverse

## ADR Template

Store ADRs in `docs/decisions/` with sequential numbering:

```markdown
# ADR-001: Use PostgreSQL for primary database

## Status
Accepted | Superseded by ADR-XXX | Deprecated

## Date
2025-01-15

## Context
We need a primary database for the task management application. Key requirements:
- Relational data model (users, tasks, teams with relationships)
- ACID transactions for task state changes
- Support for full-text search on task content
- Managed hosting available (for small team, limited ops capacity)

## Decision
Use PostgreSQL with Prisma ORM.

## Alternatives Considered

### MongoDB
- Pros: Flexible schema, easy to start with
- Cons: Our data is inherently relational; would need to manage relationships manually
- Rejected: Relational data in a document store leads to complex joins or data duplication

### SQLite
- Pros: Zero configuration, embedded, fast for reads
- Cons: Limited concurrent write support, no managed hosting for production
- Rejected: Not suitable for multi-user web application in production

### MySQL
- Pros: Mature, widely supported
- Cons: PostgreSQL has better JSON support, full-text search, and ecosystem tooling
- Rejected: PostgreSQL is the better fit for our feature requirements

## Consequences
- Prisma provides type-safe database access and migration management
- We can use PostgreSQL's full-text search instead of adding Elasticsearch
- Team needs PostgreSQL knowledge (standard skill, low risk)
- Hosting on managed service (Supabase, Neon, or RDS)
```

> **Restricted-write harness fallback:** when the harness blocks working-tree writes but exposes session-local artifacts (for example omp plan mode's `local://`), write this ADR to `local://adr-<slug>.md` (no sequence number in the draft name) and record only the intended directory as a first-line `<!-- intended_dir: docs/decisions/ -->` comment; do not pin `ADR-<NNN>` yet, because the next number can change before materialization. Read it back to confirm it landed. The `local://` copy is a working draft, not persistence: never report the ADR as saved to `docs/decisions/`. When a writes-allowed session materializes it, recompute the next sequential number then, write `docs/decisions/<NNN>-<slug>.md` only if that path does not already exist (never overwrite), read it back, and only then report the final path. An explicit user-given `local://` destination is honored in any mode.

## ADR Lifecycle

```
PROPOSED → ACCEPTED → (SUPERSEDED or DEPRECATED)
```

- **Keep old ADRs.** They capture historical context.
- When a decision changes, write a new ADR that references and supersedes the old one.
