# OUTPUT-SHAPES Format

## Procedure shape

```md
# {Skill name}

{One-paragraph attribution: title, author, year.}

## When to use

{One trigger per branch, positively phrased.}

## Steps

1. {Action} — done when {checkable condition}
2. {Action} — done when {checkable condition}

## Rules

- {Constraint or guardrail}
```

## Reference shape

```md
# {Skill name}

{One-paragraph attribution: title, author, year.}

## When to use

{One trigger per branch, positively phrased.}

## Reference

{Definitions, distinctions, or judgment material consulted on demand. No ordered steps.}

## Rules

- {Constraint or guardrail}
```

## Rules

- Pick the shape its classification selects; a source with both gets the procedure shape with judgment material in `references/`.
- Every step ends on a checkable done condition; a reference shape carries no steps.
- Frontmatter `description` is the only place the trigger is worded; the body restates the when as prose but does not re-word the trigger for dispatch.
