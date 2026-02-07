# Utility Rules

Utility rules allow you to define reusable rule components, reducing duplication and enabling complex patterns like recursion.

## Local Utility Rules

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

## Global Utility Rules

Defined in separate files in a dedicated directory (configured in `sgconfig.yml`), accessible across the entire project.

1. **Configure `sgconfig.yml`**:
   ```yaml
   utilsDirs:
     - utils
   ```

2. **Define Global Util** (e.g., `utils/is-literal.yml`):
   ```yaml
   id: is-literal
   language: TypeScript
   rule:
     any:
       - kind: string_literal
       - kind: number_literal
   ```

3. **Use in Rule**:
   ```yaml
   # rules/my-rule.yml
   id: use-global-util
   language: TypeScript
   rule:
     matches: is-literal
   ```

## Recursive Rules

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
