# Pattern Syntax

ast-grep uses "pattern code" to construct an AST tree and match it against target code. Patterns look like the source code but can contain meta-variables.

## Meta-Variables

Meta-variables act like wildcards that match AST nodes.

### Single Node Match (`$VAR`)
Matches any single AST node (expression, statement, etc.).
- **Syntax**: `$NAME` (starts with `$`, followed by uppercase letters, `_`, or digits).
- **Examples**: `$A`, `$VAR`, `$NODE_1`.
- **Invalid**: `$a` (lowercase), `$kebab-case`.

### Multi-Node Match (`$$$VAR`)
Matches zero or more AST nodes. Useful for arguments, parameters, or statement blocks.
- **Syntax**: `$$$NAME`
- **Example**: `foo($$$ARGS)` matches `foo()`, `foo(1)`, `foo(1, 2)`.

### Non-Capturing Match (`$_`)
Matches nodes but does not bind them to a named variable (optimization).
- **Syntax**: `$_` or `$_NAME`.
- **Example**: `$_FUNC($_ARGS)` matches function calls without saving the function name or arguments.

### Anonymous Match (`$$`)
Matches list of nodes without capturing.
- **Syntax**: `$$` or `$$NAME`.

## Capturing Behavior

- **Consistency**: If a meta-variable `$A` appears multiple times in a pattern (e.g., `$A == $A`), it enforces that the matched nodes are structurally identical.
- **Unification**: Used to find redundant code or specific logic patterns.

## Pattern Parsing

Patterns must be valid code in the target language.
- **Object-style Pattern**: If a code snippet is ambiguous (e.g., `{ key: val }` could be an object literal or a block), use the object format in YAML rules to specify context:

```yaml
rule:
  pattern:
    context: "{ key: value }"
    selector: pair
```

## Best Practices

- Use `$$$ARGS` for function arguments to handle variable arity.
- Use `$$$BODY` for function bodies or block statements.
- Use `$_` when you don't need to reference the node in `fix` or `transform`.
