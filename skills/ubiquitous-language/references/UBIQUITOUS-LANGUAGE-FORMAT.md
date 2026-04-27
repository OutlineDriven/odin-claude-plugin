# UBIQUITOUS_LANGUAGE.md — format reference

Persistent glossary written from `ubiquitous-language`. Language-agnostic. Decision-oriented; no narrative.

## File skeleton

```md
# Ubiquitous Language

Captured from working dialogue. Source of truth for domain terminology — defer to this file when terms collide elsewhere.

## Terms

<one or more tables — see "Table layout" below>

## Relationships

<bulleted statements — see "Relationship syntax" below>

## Example dialogue

<3–5 exchanges — see "Dialogue template" below>

## Flagged ambiguities

<each entry: term + recommendation + override note — see "Flagged-ambiguities format">
```

## Table layout

One sentence per definition. Define what the term *is*, not what it *does*. Aliases listed and explicitly rejected.

```md
| Term | Definition | Aliases (do not use) |
| --- | --- | --- |
| **Order** | A customer's confirmed intent to purchase one or more items at fixed prices. | Cart, Basket |
| **Cart** | An in-progress selection prior to confirmation; lifecycle ends at order creation. | Order (pre-confirmation), Wishlist |
```

Rules:

- Bold the term in the first column. Bare term names lose visual anchoring across long files.
- Group into multiple tables when natural clusters exist (subdomain, lifecycle, actor). Single table when the set reads cleanly as one cohesive group.
- Aliases column is mandatory whenever the term has known synonyms in the dialogue or codebase. Empty when no collision exists.
- No implementation detail (class names, columns, framework primitives) unless they carry domain meaning beyond their technical role.

## Relationship syntax

Express domain relationships as bulleted statements. Bold the term names. Surface explicit cardinality wherever obvious.

Form: `**Term A** <relationship> **exactly one** | **one or more** | **optional** **Term B**.`

Examples:

- An **Order** contains **one or more** **LineItems**.
- A **Customer** holds **exactly one** **BillingAddress** at any given time.
- A **Subscription** has an **optional** **TrialPeriod**.
- A **LineItem** references **exactly one** **Product** (by SKU, immutable on the line).

Rules:

- Cardinality must be one of: `exactly one`, `one or more`, `optional`. No fuzzy quantifiers.
- Bold every term referenced. Reads as a graph; bold preserves nodes.
- Skip relationships that add no constraint — list only those that bound the model.

## Dialogue template

Three to five exchanges that exercise the terms in context. Demonstrates correct usage and clarifies boundaries between adjacent concepts.

```md
> **Director:** Confirm the **Order** for customer A123 — apply the active **Promotion** before charging.
> **Executor:** **Promotion** `SUMMER10` is active and stackable; applies a 10% discount to **LineItems** flagged eligible. Remaining **LineItems** charge at list price. Proceed?
> **Director:** Proceed. After charge, transition the **Order** to `Fulfilling`.
> **Executor:** **Order** `O-7781` charged 89.10 USD; state advanced to `Fulfilling`. **Cart** archived.
```

Rules:

- 3–5 exchanges. Fewer = insufficient resolution; more = noise.
- Use bold for every glossary term. Reinforces the canonical surface.
- Show at least one boundary case — adjacent concepts (e.g. **Cart** vs **Order**) clearly separated.
- Refresh on every re-invocation so the dialogue tracks the current term set.

## Flagged-ambiguities format

Each ambiguity carries a recommendation. The skill resolves; the user overrides.

```md
### `Account` — overloaded

- **Recommendation:** split into **Customer** (billing entity) and **User** (auth subject). Different aggregates.
- **Why:** the codebase mixes both meanings under `Account`. Splitting prevents leak across module boundaries.
- **Override:** if the project rejects the split, document the chosen meaning here and treat the other as forbidden in code.
```

Rules:

- One heading per flagged term. Sub-bullets for `Recommendation`, `Why`, `Override`.
- Recommendation is a directive sentence, not a question.
- Override block records the user's decision when it diverges from the recommendation. Empty until exercised.
- Demote resolved ambiguities to a closed note or remove them once the glossary stabilises (handled in `Re-invocation` of `SKILL.md`).
