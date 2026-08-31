# Rewriting and transformations

ast-grep replaces matched code with a `fix` string, or reshapes captured values with `transform` and `rewriters`.

**Grounded: 2026-08-26**

## Basic rewrite (`fix`)

The `fix` field in YAML or `--rewrite` CLI flag specifies the replacement string.

```yaml
rule:
  pattern: console.log($MSG)
fix: logger.info($MSG)
```

- Meta-variables: Preserved from pattern match.
- Indentation: Automatically adjusted to match context.

## Range expansion (`fix` object)

Expand the range of code to be replaced (e.g., to remove trailing commas).

```yaml
fix:
  template: '' # Replace with empty string
  expandEnd:
    regex: ',' # Extend deletion to include comma
```

## Transformations (`transform`)

Modify meta-variables before using them in `fix`.

```yaml
transform:
  NEW_VAR:
    # String-style syntax (ast-grep 0.45.x)
    substring($OLD_VAR, startChar=1, endChar=-1)
```

### Supported transformations
- substring: Extract part of string.
- replace: Regex replacement.
  ```yaml
  replace:
    source: $VAR
    replace: 'regex'
    by: 'replacement'
  ```
- convert: Case conversion (`camelCase`, `snake_case`, `PascalCase`, `kebab-case`, `UPPER_CASE`).

## Rewriters

For transforming sub-nodes (e.g., elements in a list) individually.

1. **Define rewriter**: top-level `rewriters` list.
2. **Apply rewriter**: use `rewrite` in `transform`.

### Example: dict args to literal

```yaml
rewriters:
- id: arg-to-pair
  rule:
    kind: keyword_argument
    pattern: $KEY=$VAL
  fix: "'$KEY': $VAL"

rule:
  pattern: dict($$$ARGS)

transform:
  DICT_BODY:
    rewrite:
      rewriters: [arg-to-pair]
      source: $$$ARGS
      joinBy: ', ' # Optional joiner

fix: '{ $DICT_BODY }'
```

This converts `dict(a=1, b=2)` into `{ 'a': 1, 'b': 2 }`.
