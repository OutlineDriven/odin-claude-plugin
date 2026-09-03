# CONTEXT.md format

## Entry format

```markdown
# Context name

One or two sentences defining the context and why it exists.

## Language

**Order**:
A request from a customer to provide specific goods or services.
_Avoid_: Purchase, transaction

**Customer**:
A person or organization that places orders.
_Avoid_: Client, buyer, account
```

## Rules

- **Pick one word.** Be opinionated. Put rejected synonyms on the `_Avoid_` line.
- **Keep definitions tight.** Use one or two sentences. Define what the term is, not what it does.
- **Keep the glossary domain-specific.** Include only terms from this project's domain. Exclude general programming concepts.
- **Group terms when clusters emerge.** Add subheadings for natural groups. Keep a flat list when every term belongs to one area.

## CONTEXT-MAP.md shape

Use a root context map when the repository contains several contexts:

```markdown
# Context map

## Contexts

- [Ordering](./src/ordering/CONTEXT.md): receives and tracks customer orders
- [Billing](./src/billing/CONTEXT.md): generates invoices and processes payments
- [Fulfillment](./src/fulfillment/CONTEXT.md): manages warehouse picking and shipping

## Relationships

- **Ordering -> Fulfillment**: Ordering emits `OrderPlaced`; Fulfillment consumes it to start picking.
- **Fulfillment -> Billing**: Fulfillment emits `ShipmentDispatched`; Billing consumes it to create an invoice.
- **Ordering <-> Billing**: Both contexts use the `CustomerId` and `Money` domain types.
```
