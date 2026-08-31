# To tickets — storage templates

Use the branch matching the repository's resolved storage.

## Local file

```markdown
# <NN>: <Ticket title>

## What to build

<End-to-end behavior from the user's point of view, not a layer-by-layer list.>

## Blocked by

<Ticket numbers and titles, or "None, can start immediately".>

## Acceptance criteria

- [ ] Observable criterion one
- [ ] Observable criterion two
```

## GitHub issue

```markdown
## Parent

<Optional parent issue reference. Omit this section when there is no parent.>

## What to build

<End-to-end behavior from the user's point of view, not a layer-by-layer list.>

## Blocked by

<Issue references, or "None, can start immediately".>

## Acceptance criteria

- [ ] Observable criterion one
- [ ] Observable criterion two
```

Omit file paths and code snippets because they go stale. A prototype-produced
snippet may be inlined when it records a decision more precisely than prose,
such as a state machine, reducer, schema, or type shape; trim it to the
decision-rich part and state that it came from a prototype.
