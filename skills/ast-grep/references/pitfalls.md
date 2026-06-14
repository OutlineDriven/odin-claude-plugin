# ast-grep pitfalls — failure-mode field guide

Read this when a search returns 0 matches unexpectedly, or before running a rewrite. ast-grep matches *AST shape*, not text. Most "0 matches" surprises trace to one of the sections below.

## §1 — ast-grep is NOT regex

A pattern is parsed as code, then matched structurally. Regex metacharacters are not interpreted — they either parse to literal code with the wrong meaning, or fail to parse and produce an `(ERROR ...)` node that silently matches nothing.

The only wildcards are meta-variables:

- `$VAR` — exactly one **named** AST node, captured under `VAR`.
- `$$$` — zero or more nodes (a node list).
- `$_` — one node, **anonymous** (matches but does not capture).
- `$$` — one **unnamed** node (operators, punctuation, keywords).

| You wrote | ast-grep saw | What you wanted |
| --- | --- | --- |
| `foo\|bar` | bitwise-or of `foo` and `bar` (valid code, wrong intent) | run two searches, or an `any:` YAML rule |
| `.*foo` | not parseable as code | `$$$ foo`, or use `rg` |
| `\w+` | not parseable → ERROR node | `$VAR` to capture any identifier |
| `[a-z]` | char class → not code | switch to `rg` |

Note: the helper's `validate` catches the `\w` / `\d` / `\s` / `.*` class as a hint, but its authoritative check is whether the pattern parses to a clean CST (no `(ERROR` nodes). A clean parse with the wrong intent — like `foo|bar` — passes validation yet still matches the wrong thing.

## §2 — Patterns must be valid code

The pattern is fed to the language's parser before matching. If the fragment is syntactically incomplete, it produces an ERROR node and matches nothing.

- `def $FN($$$):` fails — the trailing colon makes it an incomplete statement. Use `def $FN($$$)`.
- `function $NAME` fails — no parameter list or body. Use `function $NAME($$$) { $$$ }`.

Validate a suspect pattern:

```
ast-grep run -p '<pattern>' -l <lang> --debug-query=cst
```

If the output shows `(ERROR ...)` anywhere, the pattern is malformed — fix it before trusting the (empty) result.

## §3 — `--json` and `--update-all` conflict; preview and apply are separate passes

`--update-all` conflicts with `--json` (see `-U` in `ast-grep run --help`: "It conflicts with both the `--interactive`, `--json` ... flags"). You cannot get a JSON preview and a mutation from one invocation — combine them and files stay untouched while JSON still prints, so a script that expects the write to land silently never applies it.

Run two separate passes — never pass both flags together:

```
ast-grep run -p P -r R -l L --json=compact .   # pass 1: preview
ast-grep run -p P -r R -l L --update-all .     # pass 2: apply
```

The skill's `scripts/ast_grep_helper.py replace` does this automatically: dry-run (preview) by default, and `--apply` triggers the second pass that actually writes.

## §4 — Named vs unnamed nodes

`$VAR` captures **named** nodes — identifiers, expressions, statements. Operators, punctuation, and keywords are **unnamed** in the grammar; `$VAR` will not bind to them. Capture unnamed nodes with `$$`.

This bites on punctuation-heavy syntax:

- Kotlin `!!` (the non-null postfix operator — often unnamed).
- C `==` and other operators.
- Anything where the token you want is punctuation rather than an identifier or expression.

If a pattern aimed at an operator returns nothing, the operator is almost certainly an unnamed node — reach for `$$`.

## §5 — Contextual patterns for ambiguous grammars

A bare fragment can parse as the wrong node type, because the parser picks whatever production fits a standalone snippet. The match then never fires against real code where the fragment is a different kind of node.

Disambiguate with a context wrapper — the pattern-object form pairs a full-statement `context` with a `selector` naming the node kind you actually want:

```yaml
{ context: "func t() { $CALL }", selector: call_expression }
```

Common offenders that need a context wrapper:

- Go and C function calls.
- Python `Optional[$T]` (parses as subscript vs. type context).
- JS object literals (`{ $K: $V }` parses as a block, not an object).

Concrete trap: bare `foo($X)` in C parses as `macro_type_specifier`, not a call expression — so it silently misses every real call.

## §6 — Meta-variable naming

Meta-variable names must match `[A-Z_][A-Z_0-9]*` — start with an uppercase letter or underscore, then uppercase letters, digits, or underscores.

- Lowercase names like `$foo` **silently fail to match**. No error; just zero results.
- Digit-start names like `$123` are invalid — the name must begin with `[A-Z_]`, not a digit.
- `$_` is the anonymous, non-capturing wildcard (one node, not bound to a name).
- Using the **same** variable name twice requires both occurrences to bind to **identical** code. `$A == $A` matches `x == x` but not `x == y`.

If a pattern with a lowercase meta-variable returns nothing, rename it to uppercase first.

## §7 — stdin needs `--lang`; tsx ≠ ts; single-pass rewriting

- **stdin has no extension to infer from.** For file arguments, `run` / `scan` infer the language from the file extension. For `--stdin`, `--lang` is **MANDATORY** — there is nothing to infer, and omitting it errors or mis-parses.
- **`tsx` ≠ `ts`.** Use `--lang tsx` for any file containing JSX. `--lang ts` mis-parses JSX (the `<Tag>` syntax collides with type assertions / generics), so JSX patterns silently miss.
- **Rewrites are single-pass.** `fix:` / `-r` rewrites only the **outermost** matching node. Nested transforms — e.g. rewriting `Optional[Union[...]]` where both the outer and inner type need changing — require a `rewriters` array to recurse into the captured sub-nodes.

## §8 — `sg` ↔ `setgroups` collision (Linux)

The short binary name `sg` collides with shadow-utils' `sg` (the `setgroups` / run-a-command-with-group binary) on Linux. Invoking `sg` may run the wrong program.

Always invoke `ast-grep` by its full name, never `sg`. The skill's helper does this unconditionally.

## 0 matches but the code is there — debug ladder

Work down the rungs in order; stop at the first that explains the miss.

1. **Validate the pattern.** `helper validate '<pattern>' --lang L` — catches regex metacharacters, lowercase meta-variables, and parse errors.
2. **Check `--lang`.** Is it `tsx` vs `ts`? stdin without `--lang`? Wrong language parses to the wrong tree.
3. **Dump the pattern's CST.** `ast-grep run -p '<pattern>' -l L --debug-query=cst` — look for `(ERROR ...)` nodes that mean the pattern is malformed (§2).
4. **Inspect the target's CST.** `ast-grep run -p '$_' -l L --debug-query=cst <file> | head -40` — find the real node `kind` of the code you expected to match, then rebuild the pattern (or add a `selector`) around it.
5. **Reach for the playground.** Paste pattern + code at <https://ast-grep.github.io/playground.html> for an interactive CST view when the CLI dumps aren't enough.
