# Architecture decision records (ADRs)

ADRs record the reasoning behind significant technical decisions.

## When to write an ADR

Write an ADR only when all three conditions hold:

1. **Hard to reverse.** The cost of changing your mind later is meaningful.
2. **Surprising without context.** A future reader will wonder why it was done this way.
3. **The result of a real trade-off.** Genuine alternatives existed, and one was picked for specific reasons.

If any condition is missing, skip the ADR.

Decisions that often pass this gate include:

- Choosing a framework, library, or major dependency
- Designing a data model or database schema
- Selecting an authentication strategy
- Deciding on an API architecture (REST vs. GraphQL vs. tRPC)
- Choosing between build tools, hosting platforms, or infrastructure
- Any decision that would be expensive to reverse

Qualifying categories include:

- Architectural shape
- Integration patterns between contexts
- Technology choices that carry lock-in
- Boundary and scope decisions
- Deliberate deviations from the obvious path
- Constraints not visible in the code
- Rejected alternatives whose rejection is not obvious

An ADR may be a single paragraph stating the context, decision, and reason. The value is recording that a decision was made and why, not filling out sections.

## ADR template, full form

Store ADRs in `docs/decisions/` with sequential numbering:

Status, Date, Alternatives Considered, and Consequences are optional. Include them only when they add value.

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

## ADR lifecycle

```
PROPOSED → ACCEPTED → (SUPERSEDED or DEPRECATED)
```

- **Keep old ADRs.** They capture historical context.
- When a decision changes, write a new ADR that references and supersedes the old one.
