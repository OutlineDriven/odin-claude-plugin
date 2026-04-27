# ADR Format

ADRs live in `docs/adr/` and use sequential numbering: `0001-slug.md`, `0002-slug.md`, etc.

Create the `docs/adr/` directory lazily — only when the first ADR is needed.

## Template

```md
# {Short title of the decision}

{1-3 sentences: what's the context, what did the team decide, and why.}
```

That's it. An ADR can be a single paragraph. The value is in recording *that* a decision was made and *why* — not in filling out sections.

## Optional sections

Only include these when they add genuine value. Most ADRs do not need them.

- **Status** frontmatter (`proposed | accepted | deprecated | superseded by ADR-NNNN`) — useful when decisions are revisited
- **Considered Options** — only when the rejected alternatives are worth remembering
- **Consequences** — only when non-obvious downstream effects need to be called out

## Numbering

Scan `docs/adr/` for the highest existing number and increment by one.

## When to offer an ADR

All three of these must be true:

1. **Hard to reverse** — the cost of changing direction later is meaningful
2. **Surprising without context** — a future reader will look at the code and wonder "why was it done this way?"
3. **The result of a real trade-off** — genuine alternatives existed and the team picked one for specific reasons

If a decision is easy to reverse, skip the ADR — the team will just reverse it later. If it is not surprising, nobody will wonder why. If there was no real alternative, there is nothing to record beyond "the obvious thing."

### What qualifies

- **Architectural shape.** "Monorepo." "The write model is event-sourced, the read model is projected into Postgres."
- **Integration patterns between contexts.** "Ordering and Billing communicate via domain events, not synchronous HTTP."
- **Technology choices that carry lock-in.** Database, message bus, auth provider, deployment target. Not every library — only the ones that would take a quarter to swap out.
- **Boundary and scope decisions.** "Customer data is owned by the Customer context; other contexts reference it by ID only." The explicit no-s are as valuable as the yes-s.
- **Deliberate deviations from the obvious path.** "Manual SQL instead of an ORM because X." Anything where a reasonable reader would assume the opposite. These stop the next engineer from "fixing" something that was deliberate.
- **Constraints not visible in the code.** "AWS is unavailable due to compliance requirements." "Response times must stay under 200ms because of the partner API contract."
- **Rejected alternatives when the rejection is non-obvious.** If GraphQL was considered and REST was picked for subtle reasons, record it — otherwise someone will suggest GraphQL again in six months.

### What does not qualify

- Library choices that are easy to swap (test runner, lint config, log formatter).
- Coding conventions covered by lint rules.
- Decisions captured by code or types directly (the type definition IS the decision).

## Review cadence

Re-read recent ADRs at the start of any architectural conversation. They are the project's institutional memory; ignoring them re-litigates settled decisions.
