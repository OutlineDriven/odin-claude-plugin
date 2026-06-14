# ast-grep Agent Reference

> Distilled from `code-yeongyu/ast-grep-skill`. On Linux the binary is **`ast-grep`** — NOT `sg`, which collides with the util-linux `setgroups` command. Every example below invokes `ast-grep`.

ast-grep is a structural (AST-based) search/rewrite tool. It matches the *shape* of code, not its text. If you want text or regex search, use `rg`. If you want scope/type/data-flow analysis, use an LSP, Semgrep-with-types, or CodeQL.

---

## 1. Patterns are code, not regex (the #1 rule)

A pattern is a snippet of real source code in the target language. ast-grep parses it into a tree and matches that tree against your codebase. Regex syntax does **not** apply inside a pattern:

- `foo|bar` is parsed as a bitwise-OR expression, not alternation.
- `.*`, `\w+`, `^foo$`, `[a-z]+` are parsed as code (or fail to parse) — they are never regex.

For real regular expressions, use the YAML `regex:` field (ideally narrowed with a `kind:`). For text-shaped search, use `rg`.

### Metavariables

| Metavar    | Captures                          | Named? | Notes |
|------------|-----------------------------------|--------|-------|
| `$VAR`     | exactly one node                  | yes    | Bound; reusable by name. |
| `$$$ARGS`  | zero or more nodes                | yes    | Greedy; commits; no backtracking. Matches zero too. |
| `$_`       | exactly one node                  | no     | Wildcard; not captured/reusable. |
| `$$_`      | one or more nodes                 | no     | Anonymous multi; requires at least one node. |
| `$$$`      | zero or more nodes                | no     | Anonymous multi (bare). |

- **Names**: metavariable names use UPPERCASE letters, digits, and `_` only (e.g. `$ERR`, `$ARG1`, `$MY_VAR`). Lowercase names are not valid metavariables.
- **Same name must match identical text**: if a name appears more than once, every occurrence must capture byte-identical text. `$X === $X` matches `a === a` but NOT `a === b`.
- **`$$$` is greedy, commits, and does not backtrack**: once it has consumed a run of nodes it will not give them back to satisfy a later part of the pattern. It also matches zero nodes, so `f($$$ARGS)` matches `f()`.

---

## 2. Patterns must be valid (parseable) code

A pattern must parse as a single COMPLETE node in the target grammar. A fragment that the parser cannot complete produces an `ERROR` node and matches nothing. Fix fragments by completing them:

| Bad (fragment / wrong)     | Fixed (complete node)             | Why |
|----------------------------|-----------------------------------|-----|
| `function $N`              | `function $N($$$){ $$$ }`         | A bare keyword + name is not a complete function. |
| `def $F($$$):`            | `def $F($$$)`                     | The trailing `:` + body makes ast-grep expect a full suite; match the signature only. |
| `class Foo:`              | `class $C($$$)`                   | Match the class header as a node, not a partial colon-terminated line. |
| `if x`                    | `if x { $$$ }`                    | An `if` needs its block to be a complete statement. |

To check whether a pattern parses, dump its tree with `ast-grep run -p '<pattern>' --lang <lang> --debug-query=ast`. An `ERROR` node means it does not parse — fix the fragment before searching.

---

## 3. Strictness levels

Strictness controls how exactly the pattern tree must line up with the source tree (chiefly how trivia/unnamed nodes are treated).

| Level        | Behavior |
|--------------|----------|
| `cst`        | Strictest. Every node, including unnamed/trivia, must match. |
| `smart`      | **Default.** Match all nodes, but skip unnamed nodes present in the target that are absent from the pattern — so a concise pattern still matches verbose source. |
| `ast`        | Match only named AST nodes; ignore unnamed nodes. |
| `relaxed`    | Ignore unnamed nodes and comments. |
| `signature`  | Loosest. Ignore unnamed nodes, comments, and text of named leaf nodes — match by shape/signature only. |

---

## 4. context / selector pattern object

Some constructs are only valid *inside* a larger node and cannot stand alone as a pattern (e.g. an object property `{ key: value }`, a `case` clause, a class field). For these, use a pattern object with `context` (a complete, parseable snippet) and `selector` (the node kind to extract from it):

```yaml
rule:
  pattern:
    context: '{ key: value }'   # complete, parseable
    selector: pair              # the sub-node kind to actually match
```

ast-grep parses `context`, then matches only the `selector` sub-node. Use this whenever a bare sub-expression yields an `ERROR` node on its own.

---

## 5. CLI

Two primary subcommands:

### `ast-grep run` (default; ad-hoc search/rewrite)

```
ast-grep run -p 'PATTERN' -l <lang> -C 3        # search with 3 lines context
ast-grep run -p 'OLD' -r 'NEW'                  # preview a rewrite (no write)
ast-grep run -p 'OLD' -r 'NEW' -U               # apply the rewrite to disk
```

Common flags:
- `-p, --pattern` — the pattern.
- `-r, --rewrite` — replacement (may reference captured metavars).
- `-U, --update-all` — write changes to disk. Without it, ast-grep only previews.
- `-l, --lang` (`--lang`) — target language (e.g. `ts`, `js`, `py`, `go`, `rust`).
- `--json` / `--json=compact` — machine-readable output.
- `--debug-query=ast` — dump how the pattern parsed; an `ERROR` node means the pattern does not parse.

### `ast-grep scan -c sgconfig.yml` (project rules)

```
ast-grep scan -c sgconfig.yml                   # run all configured YAML rules
```

Runs the YAML rules registered in the project config. Use this for repeatable lint/codemod rule sets rather than one-off `run` invocations.

### CRITICAL two-pass apply gotcha

`--json` **silently disables `-U`** — combining them produces JSON output and writes ZERO files, with no error. Always two-pass:

1. **Preview**: `ast-grep run -p 'OLD' -r 'NEW' --json=compact -l <lang>`
2. **Apply**: a SECOND, separate run with `-U` (and without `--json`): `ast-grep run -p 'OLD' -r 'NEW' -U -l <lang>`

### "0 matches" debug recipe

When a pattern matches nothing, dump its parse tree against a known-good sample:

```
ast-grep run -p '<pattern>' --lang <lang> --debug-query=ast --stdin <<< '<sample code>'
```

If the dumped tree contains an `ERROR` node, the pattern does not parse — fix it into a complete node (Section 2). If it parses but still misses, check metavar names, strictness, and grammar-specific node kinds (Section 8).

---

## 6. YAML rules

A rule file requires three top-level keys: `id`, `language`, and `rule`. The `rule` is composed from three categories:

**Atomic rules** (match a single node):
- `pattern` — a code pattern (string or `{context, selector}` object).
- `kind` — the tree-sitter node kind (e.g. `function_declaration`).
- `regex` — a regular expression over the node's text.
- `nthChild` — position among siblings.
- `range` — a source line/column range.

**Relational rules** (match by neighbor relationship): `inside`, `has`, `precedes`, `follows`. Each takes a sub-rule and a `stopBy`:
- `stopBy: neighbor` — **DEFAULT**: only the direct parent/child/sibling (one hop).
- `stopBy: end` — search to any depth/distance.

So `has:` with no `stopBy` checks only direct children; add `stopBy: end` to find a descendant at any depth.

**Composite rules** (combine sub-rules): `all`, `any`, `not`, `matches` (reference a named util rule).

**Other rule fields**:
- `constraints` — additional predicates on captured metavars (e.g. restrict `$METHOD` by regex).
- `transform` — derive new metavars from captured ones for use in `fix`.
- `fix` — the rewrite template.
- `utils` + `matches` — define reusable named sub-rules under `utils:` and reference them with `matches:`.

A `regex` rule with no `kind` scans the text of EVERY node — slow on large trees. Pair `regex` with a `kind` to narrow the candidate set.

### Verbatim rule skeleton: `no-console` (TypeScript)

```yaml
id: no-console
language: TypeScript
rule:
  pattern: console.$METHOD($$$ARGS)
constraints:
  METHOD:
    regex: '^(log|info|warn|error|debug)$'
fix: logger.$METHOD($$$ARGS)
files:
  - 'src/**/*.ts'
ignores:
  - 'src/**/*.test.ts'
```

---

## 7. Rewrite recipes

All recipes preview by default; append `--update-all` to write. (Shown here with `--update-all` to mutate.)

```bash
# TS: console.log -> logger.info
ast-grep run -p 'console.log($$$A)' -r 'logger.info($$$A)' -l ts --update-all
# TS: strip `as any`
ast-grep run -p '$E as any' -r '$E' -l ts --update-all
# Python: print -> logger.info
ast-grep run -p 'print($$$A)' -r 'logger.info($$$A)' -l py --update-all
# Python: Optional[T] -> T | None  (expression context only; see caveat below)
ast-grep run -p 'Optional[$T]' -r '$T | None' -l py --update-all
# Go: wrap returned error  (refine to error returns only; see caveat below)
ast-grep run -p 'return $ERR' -r 'return fmt.Errorf("...: %w", $ERR)' -l go --update-all
# Rust: unwrap() -> ?
ast-grep run -p '$E.unwrap()' -r '$E?' -l rust --update-all
```

(For the Go recipe, refine the `return $ERR` pattern with a `constraints`/`kind` rule in real use so you only rewrite error returns, not every return.)

(The Python `Optional[$T]` recipe matches only expression-context occurrences and SILENTLY skips type-annotation positions — `x: Optional[int]`, `-> Optional[T]`, `z: Optional[int] = None` — which are the common case. `--update-all` reports no error while leaving annotations half-migrated. For annotation rewrites use a `kind`/`context` YAML rule instead.)

---

## 8. Pitfalls (field guide)

1. **Regex is not supported in patterns.** `foo|bar`, `.*`, `\w+`, `^$`, `[a-z]+` are parsed as code. Use the YAML `regex` field for real regex.
2. **Incomplete nodes match nothing.** `function $N` parses to an `ERROR`; write `function $N($$$){ $$$ }`.
3. **A pattern can parse as the WRONG kind.** A snippet may parse as a different node than you intended (e.g. an expression vs a statement). Dump the tree with `--debug-query=ast` to confirm the kind.
4. **Bare `|` is bitwise-or, not alternation.** `a | b` is one binary expression; it does not mean "a or b".
5. **Same metavar name must match identical text.** `$X + $X` will not match `a + b`. Use distinct names (`$X + $Y`) when the two may differ.
6. **`$$$` is greedy and matches zero.** `f($$$ARGS)` matches `f()` too; it commits and will not backtrack to satisfy later pattern parts.
7. **`kind` names are grammar-specific.** A function declaration is `function_declaration` in JS/TS, `function_definition` in Python, and `function_item` in Rust. Look up the actual node kind per language; do not assume.
8. **`inside`/`has` default to `stopBy: neighbor`.** They only check the direct parent/child by default — a descendant at depth needs `stopBy: end`.
9. **`--json` drops `--update-all`.** Combining them writes zero files silently. Preview with `--json=compact`, then a second run with `--update-all`.
10. **Composite rules apply to ONE node.** `all`/`any`/`not`/`matches` constrain a single matched node; they do not span multiple unrelated nodes.
11. **Field/child order is not guaranteed.** Do not rely on the textual order of unnamed children; match by named fields and node kinds.
12. **`regex` without `kind` is slow.** It scans every node's text. Always pair with a `kind` to narrow candidates.
13. **No scope/type/data-flow analysis.** ast-grep cannot tell variable shadowing, `async`/await semantics, or whether a function returns a Promise. Use an LSP, Semgrep-with-types, or CodeQL for those.
14. **The playground / `--debug-query` is the fastest debugger.** When a pattern misbehaves, dump its parse tree (or paste it into the ast-grep playground) before guessing — an `ERROR` node in the dump immediately explains a zero-match pattern.
