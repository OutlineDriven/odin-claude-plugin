---
name: ast-grep
description: Run structural code search, analysis, and refactoring with ast-grep. Use when doing AST-based modifications, structural search, linting across code shape, or replacing regex-fragile transformations.
---

# ast-grep (sg)

ast-grep is a fast and polyglot tool for code searching, linting, and rewriting based on Abstract Syntax Trees (AST). It excels at structural search and replace where regex fails.

## When to use

- **Structural Search**: Finding code based on structure (e.g., "all function calls to `foo` with 2 arguments") regardless of whitespace.
- **Refactoring**: Renaming variables, changing function signatures, or transforming code patterns safely.
- **Linting**: Creating custom rules to enforce code style or best practices.
- **Code Analysis**: Extracting information from codebases.

## Quick Start

### CLI Basics

```bash
# Search (pattern must be in single quotes)
ast-grep -p '$A + $B' --lang ts

# Rewrite (dry run)
ast-grep -p '$A != null' --rewrite '$A' --lang ts

# Interactive Rewrite
ast-grep -p 'var $A = $B' --rewrite 'const $A = $B' --interactive
```

### Pattern Syntax
- **Meta-variables**: `$VAR` matches any single node.
- **Multi-meta-variables**: `$$$ARGS` matches zero or more nodes (list of items).
- **Wildcard**: `$_` matches any node (non-capturing).
- **Anonymous**: `$$` matches any list of nodes (non-capturing).

See [Pattern Syntax](references/pattern-syntax.md) for details.

## The helper: validate first, dry-run first

`scripts/ast_grep_helper.py` wraps two safety gates:

```bash
# Lint a pattern before you search with it (exit 0 valid / exit 2 malformed; flags regex-smell)
python3 scripts/ast_grep_helper.py validate '$A + $B' --lang ts

# Preview a rewrite — diff + "N matches across M files", mutates nothing without --apply
python3 scripts/ast_grep_helper.py replace '$A != null' '$A' --lang ts src/
python3 scripts/ast_grep_helper.py replace '$A != null' '$A' --lang ts src/ --apply
```

`validate` compiles the pattern through ast-grep's own parser, so it catches malformed queries in every language (including Go/Python where `$` is not an identifier char). `replace` is two-pass: dry-run prints the blast radius, `--apply` writes.

## What to use, when

```text
structural shape (call/func/class/import shaped like X)  → ast-grep
text / regex / filenames / comments / string contents    → rg / grep
semantic (types, references, "who calls this symbol")     → LSP / compiler
across many repos                                         → search engine, then ast-grep per-repo
```

ast-grep matches syntax, not bytes.

## When a rewrite or search surprises you

Rewrite flow (never skip the dry-run):

1. `search` the pattern to confirm it matches what you think.
2. `replace` dry-run: read the diff.
3. Inspect the `N matches across M files` count; if the blast radius is wrong, stop.
4. Refine the pattern (tighten meta-vars, add `--lang`, add context).
5. Re-run with `--apply`.

0-matches ladder (in order):

1. `python3 scripts/ast_grep_helper.py validate '<pat>' --lang L`: is the pattern well-formed?
2. Check `--lang`: `tsx` ≠ `ts`; the wrong dialect silently matches nothing.
3. `ast-grep run -p '<pat>' -l L --debug-query=pattern`: look for `ERROR` in the dumped query tree.
4. Inspect the target's actual tree (`--debug-query=ast` on a known-matching snippet). Your node kinds may differ from your guess.
5. Reproduce in the online playground.

`references/pitfalls.md` is the deep field guide. Read it when 0 matches surprises you.

## Invariants (do not break)

- **Validate before you search**: lint the pattern via the helper first.
- **Dry-run before you apply**: never `--apply` (or `--update-all`) without reading the diff.
- **Writes are two-pass**: `--json` and `--update-all` conflict: combine them and `--json` silently wins, so the write is dropped with no error. Preview with `--json`, then apply with `--update-all` separately.
- **Single-quote patterns** in the shell: `$VAR` must reach ast-grep unexpanded.
- **`--lang` is required for stdin**`: piped input has no filename to infer the dialect from.
- **A pattern is code, not regex**: switch to rg the moment you'd need `|`, `.*`, `\w`, or `[...]`.
- **Invoke `ast-grep`, never `sg`**: `sg` collides with the `setgroups` binary on many systems.

## Core Concepts

Understanding **Named vs Unnamed nodes** and **Matching Strictness** is crucial for precise patterns.

- **Named Nodes**: `identifier`, `function_definition` (matched by `$VAR`).
- **Unnamed Nodes**: `(`, `)`, `;` (skipped by default in `smart` mode).
- **Strictness**: Control matching precision (`smart`, `cst`, `ast`, `relaxed`, `signature`).

See [Core Concepts](references/core-concepts.md) for details.

## Rule Configuration (YAML)

For complex tasks, use YAML configuration files.

```yaml
id: no-console-log
language: TypeScript
rule:
  pattern: console.log($$$ARGS)
  inside:
    kind: function_declaration
    stopBy: end
fix: '' # Remove the log
```

See [Rule Configuration](references/rule-config.md) for details.

## Advanced Rewriting

ast-grep supports complex transformations (regex replace, case conversion) and rewriters for sub-node transformation.

See [Rewriting & Transformations](references/rewriting.md) for details.

## Project Setup & Testing

For larger projects, organize rules and tests using `sgconfig.yml`.

- **Scaffold**: `ast-grep new project`
- **Config**: `sgconfig.yml` defines rule and test directories.
- **Testing**: Define `valid` and `invalid` cases to ensure rule accuracy.

See [Project Setup & Testing](references/project-setup.md) for details.

## Utility Rules

Reuse logic with local or global utility rules. Enables recursive matching.

```yaml
utils:
  is-literal:
    any: [{kind: string}, {kind: number}]
rule:
  matches: is-literal
```

See [Utility Rules](references/utility-rules.md) for details.

## Configuration Reference

Full reference for YAML fields (`id`, `severity`, `files`, `ignores`) and supported languages.

See [Configuration Reference](references/yaml-reference.md) for details.

## CLI Reference

Common commands: `scan`, `run`, `new`, `test`, `lsp`.

See [CLI Reference](references/cli.md) for details.

## Required reading

- [Recipes](references/recipes.md): per-language copy-paste patterns (TS/JS, Python, Rust, Go, Java, Kotlin, C, C++). Read this **first** when starting a task in a given language.
- [Pitfalls](references/pitfalls.md): failure-mode field guide (regex-vs-AST, incomplete patterns, the two-pass write, named/unnamed nodes, meta-var naming, stdin/tsx, `sg`↔setgroups, and the 0-matches debug ladder). Read this when **0 matches surprises you**.
