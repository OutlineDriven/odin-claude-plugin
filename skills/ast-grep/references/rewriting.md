# Rewriting & Transformations

ast-grep provides powerful tools for modifying code, from simple replacements to complex AST manipulations.

## Basic Rewrite (`fix`)

The `fix` field in YAML or `--rewrite` CLI flag specifies the replacement string.

```yaml
rule:
  pattern: console.log($MSG)
fix: logger.info($MSG)
```

- **Meta-variables**: Preserved from pattern match.
- **Indentation**: Automatically adjusted to match context.

## Range Expansion (`fix` object)

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
    # String-style syntax (v0.28.3+)
    substring($OLD_VAR, startChar=1, endChar=-1)
```

### Supported Transformations
- **substring**: Extract part of string.
- **replace**: Regex replacement.
  ```yaml
  replace:
    source: $VAR
    replace: 'regex'
    by: 'replacement'
  ```
- **convert**: Case conversion (`camelCase`, `snake_case`, `PascalCase`, `kebab-case`, `UPPER_CASE`).

## Rewriters

For transforming sub-nodes (e.g., elements in a list) individually.

1. **Define Rewriter**: Top-level `rewriters` list.
2. **Apply Rewriter**: Use `rewrite` in `transform`.

### Example: Dict Args to Literal

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

This transforms `dict(a=1, b=2)` into `{ 'a': 1, 'b': 2 }`.
