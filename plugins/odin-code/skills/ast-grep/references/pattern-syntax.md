# Pattern syntax

ast-grep uses "pattern code" to construct an AST tree and match it against target code. Patterns look like the source code but can contain meta-variables.

## Meta-variables

Meta-variables act like wildcards that match AST nodes.

### Single-node match (`$VAR`)
Matches any single AST node (expression, statement, etc.).
- Syntax: `$NAME` (starts with `$`, followed by uppercase letters, `_`, or digits).
- Examples: `$A`, `$VAR`, `$NODE_1`.
- Invalid: `$a` (lowercase), `$kebab-case`.

### Multi-node match (`$$$VAR`)
Matches zero or more AST nodes. Useful for arguments, parameters, or statement blocks.
- Syntax: `$$$NAME`
- Example: `foo($$$ARGS)` matches `foo()`, `foo(1)`, `foo(1, 2)`.

### Non-capturing match (`$_`)
Matches nodes but does not bind them to a named variable (optimization).
- Syntax: `$_` or `$_NAME`.
- Example: `$_FUNC($_ARGS)` matches function calls without saving the function name or arguments.

### Unnamed-node match (`$$VAR`)
Matches a single node the way `$VAR` does, but also matches unnamed nodes, which
`$VAR` skips. It is not a list form: `foo($$A)` matches `foo(a)` and not `foo(a, b)`.
- Syntax: `$$` or `$$NAME`.
- Source: [Capture Unnamed Nodes](https://ast-grep.github.io/guide/pattern-syntax.html), read 2026-09-01.

## Capturing behavior

- Consistency: If a meta-variable `$A` appears multiple times in a pattern (e.g., `$A == $A`), it enforces that the matched nodes are structurally identical.
- Unification: Used to find redundant code or specific logic patterns.

## Pattern parsing

Patterns must be valid code in the target language.
- Object-style Pattern: If a code snippet is ambiguous (e.g., `{ key: val }` could be an object literal or a block), use the object format in YAML rules to specify context:

```yaml
rule:
  pattern:
    context: "{ key: value }"
    selector: pair
```

## Best practices

- Use `$$$ARGS` for function arguments to handle variable arity.
- Use `$$$BODY` for function bodies or block statements.
- Use `$_` when you don't need to reference the node in `fix` or `transform`.
