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
- **pattern**: Matches code structure (e.g., `console.log($MSG)`).
- **kind**: Matches AST node kind (e.g., `function_declaration`, `identifier`).
- **regex**: Matches text content against Rust regex.
- **range**: Matches specific line/column range.

### 2. Relational rules
Match nodes based on their relationship to other nodes.
- **inside**: Target is descendant of match.
  ```yaml
  inside:
    kind: function_declaration
    stopBy: end # Optional: search boundary
  ```
- **has**: Target has a descendant matching rule.
  ```yaml
  has:
    pattern: return $VAL
  ```
- **follows**: Target is after match.
- **precedes**: Target is before match.

### 3. Composite rules
Combine multiple rules.
- **all**: AND logic. Match all sub-rules.
- **any**: OR logic. Match any sub-rule.
- **not**: NOT logic. Invert match.
- **matches**: Reference a utility rule.

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
