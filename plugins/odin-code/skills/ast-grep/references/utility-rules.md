# Utility rules

Utility rules are reusable rule components: they cut duplication and enable patterns like recursion.

## Local utility rules

Defined within a rule file under the `utils` key. Accessible only within that file.

```yaml
id: my-rule
language: TypeScript
utils:
  is-literal:
    any:
      - kind: string_literal
      - kind: number_literal
rule:
  matches: is-literal # Reference the utility
```

## Global utility rules

Defined in separate files in a dedicated directory (configured in `sgconfig.yml`), accessible across the entire project.

1. **Configure `sgconfig.yml`**:
   ```yaml
   utilsDirs:
     - utils
   ```

2. **Define the global util** (e.g., `utils/is-literal.yml`):
   ```yaml
   id: is-literal
   language: TypeScript
   rule:
     any:
       - kind: string_literal
       - kind: number_literal
   ```

3. **Use it in a rule**:
   ```yaml
   # rules/my-rule.yml
   id: use-global-util
   language: TypeScript
   rule:
     matches: is-literal
   ```

## Recursive rules

You can use utility rules to match recursive structures (like nested parentheses).

```yaml
utils:
  is-number:
    any:
      - kind: number
      - kind: parenthesized_expression
        has:
          matches: is-number # Recursive reference
rule:
  matches: is-number
```

**Note**: Direct cyclic dependency in `rule` or `matches` causes infinite recursion. Use recursion inside relational components like `has` or `inside`.
