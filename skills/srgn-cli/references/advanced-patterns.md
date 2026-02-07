# srgn Advanced Patterns

## Table of Contents
1. Regex Capture Substitution
2. Literal Mode vs Regex Mode
3. Multiple Scopes and Join Semantics
4. Custom Tree-Sitter Queries
5. Query Files
6. Match-Ignoring with `_SRGN_IGNORE`
7. Output Format Controls
8. CI Guardrail Patterns
9. High-Safety Rollout Pattern
10. Shell Quoting Matrix
11. Regex Risk Notes

## Regex Capture Substitution

Use capture groups in scope regex and reference them in replacement:
1. Numbered groups: `$1`, `$2`, ...
2. Named groups: `$name`
3. Entire match: `$0`

Examples:
1. Numbered:
```bash
echo 'John Doe' | srgn '(\w+) (\w+)' -- '$2, $1'
```

2. Named:
```bash
echo 'let x = 3;' | srgn 'let (?<var>[a-z]+) = (?<expr>.+);' -- 'const $var = $expr;'
```

3. Disambiguation with braces:
```bash
echo '12' | srgn '(\d)(\d)' -- '$2${1}1'
```

## Literal Mode vs Regex Mode

Default scope parsing is regex.
Use literal mode when pattern contains many regex metacharacters.

Examples:
1. Literal dot:
```bash
echo 'file.txt.backup' | srgn --literal-string '.' -- '_'
```

2. Regex dot (equivalent intent):
```bash
echo 'file.txt.backup' | srgn '\.' -- '_'
```

Rule:
1. If user says "exact text", favor `--literal-string`.
2. If user needs pattern logic, stay in regex mode.

## Multiple Scopes and Join Semantics

Execution order:
1. Language scopes run first.
2. Regex scope runs on already-scoped regions.

Multiple language scopes:
1. Default: intersection (AND), left-to-right narrowing.
2. With `-j`: union (OR), independent scope matches joined.

Examples:
1. AND behavior:
```bash
srgn --python 'class' --python 'doc-strings' 'bird'
```

2. OR behavior:
```bash
srgn -j --python 'comments' --python 'doc-strings' 'bird'
```

## Custom Tree-Sitter Queries

Use custom query options when prepared scopes are not enough:
1. `--python-query`
2. `--rust-query`
3. `--go-query`
4. `--typescript-query`
5. `--csharp-query`
6. `--hcl-query`
7. `--c-query`

Example (Python if/else return pattern):
```bash
cat cond.py | srgn --python-query '(if_statement consequence: (block (return_statement)) alternative: (else_clause body: (block (return_statement)))) @cond'
```

Example (Go field/tag policy):
```bash
cat model.go | srgn --go-query '(field_declaration name: (field_identifier) @name tag: (raw_string_literal) @tag (#match? @name "[tT]oken") (#not-eq? @tag "`json:\"-\"`"))'
```

## Query Files

Use query files for readability and reuse:
1. Store query in `.scm`.
2. Use `--*-query-file`.

Example:
```bash
cat cond.py | srgn --python-query-file 'docs/python_cond_query.scm'
```

## Match-Ignoring with `_SRGN_IGNORE`

When part of a matched construct should not be transformed, mark captures with `_SRGN_IGNORE`.

Example:
```bash
cat wrong.rs | srgn --rust-query '((macro_invocation macro: (identifier) @_SRGN_IGNORE_name) @macro)' 'error' -- 'wrong'
```

This prevents replacing the macro name while still editing macro body contents.

## Output Format Controls

`srgn` auto-detects tty vs pipe output. Override when needed:
1. `--stdout-detection auto`
2. `--stdout-detection force-tty`
3. `--stdout-detection force-pipe`

Machine-readable output pattern:
`<FILE>:<LINE>:<START-END[;START-END...]>:<LINE_TEXT>`

Useful for:
1. post-processing scripts
2. custom lint wrappers
3. structured reporting in CI

## CI Guardrail Patterns

1. Reject forbidden patterns:
```bash
srgn --python 'doc-strings' --fail-any 'param.+type'
```

2. Require expected pattern presence:
```bash
srgn --rust 'attribute' --fail-none '^expect'
```

3. Fail if no files matched by glob:
```bash
srgn --go 'imports' --glob 'src/**/*.go' --fail-no-files '^old' -- 'new'
```

## High-Safety Rollout Pattern

For large migrations:
1. Start with search-only command.
2. Add transform on sample subset.
3. Run on all files with `--dry-run`.
4. Remove `--dry-run` and execute.
5. Re-run search-only command to verify post-state.

Template:
```bash
# verify scope
srgn --python 'imports' '^old_pkg' --glob 'src/**/*.py'

# preview changes
srgn --python 'imports' '^old_pkg' --glob 'src/**/*.py' --dry-run -- 'new_pkg'

# apply changes
srgn --python 'imports' '^old_pkg' --glob 'src/**/*.py' -- 'new_pkg'
```

## Shell Quoting Matrix

Use single quotes for most patterns and replacements:

1. Regex with backslashes:
```bash
srgn '\d+' -- 'NUM'
```
2. Literal mode with special chars:
```bash
srgn --literal-string '$' -- 'USD '
```
3. Globs must be quoted:
```bash
srgn --python 'imports' --glob '**/*.py' '^old' -- 'new'
```
4. Query strings should be single-quoted when possible:
```bash
srgn --python-query '(if_statement) @node'
```

## Regex Risk Notes

1. Prefer anchored patterns (`^...$`) for identifier-level changes.
2. Use lookarounds only when required; keep patterns simple for maintainability.
3. Validate broad patterns on stdin sample before using `--glob`.
4. If replacement uses group references near digits, prefer `${1}` style disambiguation.
