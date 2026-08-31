# Core concepts

A few concepts from the underlying Tree-sitter parser explain how ast-grep matches code.

## AST vs CST

- CST (Concrete Syntax Tree): Includes all details of the source code, including punctuation, parentheses, and whitespace.
- AST (Abstract Syntax Tree): A simplified tree that keeps only "named" nodes, omitting trivial details.

ast-grep uses **CST** for matching by default (via the `smart` algorithm) but can be configured to use AST-level matching.

## Named vs unnamed nodes

Tree-sitter distinguishes between:
- Named Nodes: Have a specific `kind` (e.g., `identifier`, `function_declaration`). Usually important.
- Unnamed Nodes: Anonymous tokens like `+`, `(`, `;`. Usually trivial.

Note: Meta-variables (e.g., `$VAR`) match **only named nodes** by default. Use double-dollar `$$VAR` to match unnamed nodes as well.

## Kind vs field

- Kind: The type of the node itself (e.g., `binary_expression`, `string_literal`).
- Field: The role of a node relative to its parent (e.g., `lhs`, `rhs` in a binary expression, or `key`, `value` in a pair).

In YAML rules:
```yaml
rule:
  kind: string_literal # Matches node kind
  inside:
    field: key # Matches node's role in parent
    kind: pair
```

## Matching algorithms (strictness)

ast-grep offers different "strictness" levels for matching patterns.

| Level | Description | Behavior |
|-------|-------------|----------|
| `smart` | **Default**. Matches pattern structure but ignores unnamed nodes in target code. | Good for most cases. `foo()` matches `foo();`. |
| `cst` | Exact match. | Requires strict punctuation/whitespace match. |
| `ast` | Match only named nodes. | Skips all punctuation/unnamed nodes in both pattern and target. |
| `relaxed` | Like `ast` but also ignores comments. | |
| `signature` | Matches only named node **kinds**. | Ignores text content (identifiers, literals). |

### Configuring strictness

CLI:
```bash
ast-grep run -p '$A' --strictness ast
```

YAML:
```yaml
rule:
  pattern:
    context: $A
    strictness: ast
```
