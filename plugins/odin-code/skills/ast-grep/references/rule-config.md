# Rule configuration (YAML)

YAML rules allow precise targeting of code using Atomic, Relational, and Composite matching.

## Anatomy of a rule

```yaml
id: my-rule-id
language: TypeScript # or other supported languages
severity: warning # error, warning, info, hint, off
rule:
  # ... rule logic ...
fix: # ... optional rewrite string ...
```

## Rule categories

### 1. Atomic rules
Match individual nodes based on intrinsic properties.
- pattern: Matches code structure (e.g., `console.log($MSG)`).
- kind: Matches AST node kind (e.g., `function_declaration`, `identifier`).
- regex: Matches text content against Rust regex.
- range: Matches specific line/column range.

### 2. Relational rules
Match nodes based on their relationship to other nodes.
- inside: Target is descendant of match.
  ```yaml
  inside:
    kind: function_declaration
    stopBy: end # Optional: search boundary
  ```
- has: Target has a descendant matching rule.
  ```yaml
  has:
    pattern: return $VAL
  ```
- follows: Target must **follow** (come after) a sibling node matching the sub-rule. The target and the surrounding node must be **siblings** (same parent). `stopBy: neighbor` (default) checks only the direct preceding sibling; `stopBy: end` searches all preceding siblings.
  ```yaml
  # Matches baz(2) only because it follows bar(1) as a sibling statement.
  # In Python, top-level calls are wrapped in expression_statement, so the
  # target and sub-rule must match at the statement level.
  rule:
    kind: expression_statement
    has:
      pattern: baz($A)
    follows:
      kind: expression_statement
      has:
        pattern: bar($B)
      stopBy: end
  ```
- precedes: Target must **precede** (come before) a sibling node matching the sub-rule. Same sibling constraint and `stopBy` options as `follows`.
  ```yaml
  # Matches bar(1) because it precedes baz(2) as a sibling statement.
  rule:
    kind: expression_statement
    has:
      pattern: bar($A)
    precedes:
      kind: expression_statement
      has:
        pattern: baz($B)
  ```

### 3. Composite rules
Combine multiple rules.
- all: AND logic. Match all sub-rules.
- any: OR logic. Match any sub-rule.
- not: NOT logic. Invert match.
- matches: Reference a utility rule.

## Utility rules
Reusable rule definitions.

```yaml
utils:
  is-literal:
    any:
      - kind: string_literal
      - kind: number_literal

rule:
  matches: is-literal
```

## Constraints
Add conditions to meta-variables.

```yaml
rule:
  pattern: $A + $B
constraints:
  A:
    regex: ^const_
```
