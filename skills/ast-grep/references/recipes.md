# ast-grep recipes — per-language copy-paste reference

Structural search/rewrite recipes adapted from the official ast-grep catalog (https://ast-grep.github.io/catalog/). Rows flagged **(community)** are not in the official catalog and carry sharper review obligation. Meta-var rules across every language: meta-vars must be UPPERCASE (`$A`, not `$a`); `$VAR` binds one named node; `$$$` binds zero-or-more nodes; `$$` binds unnamed nodes.

## TypeScript / JavaScript

Aliases `ts`/`tsx`/`js`/`jsx`. Use `--lang tsx` for files containing JSX — `--lang ts` mis-parses JSX angle brackets as type assertions.

| Pattern (-p) | Rewrite (-r) | Catches / Does | Gotcha |
| --- | --- | --- | --- |
| `console.log($$$A)` | `logger.info($$$A)` | Debug prints; `$$$A` swallows all args | To keep `console.error` inside a `catch`, drop the bare pattern and use a YAML rule with a `regex` constraint on the method name |
| `$A == $B` | `$A === $B` | Loose equality | `== null` checks are often intentional null+undefined guards — do not blind-apply |
| `var $A = $B` | `const $A = $B` | var→const modernization | Only sound when the binding is never reassigned; verify before `-U` |
| `require($A)` | (detection / manual import) | CommonJS `require` inventory | Bare `require` may sit inside an assignment or call that needs a contextual wrapper to match reliably |
| `$A \|\| $B` | `$A ?? $B` | Nullish-coalescing migration (detection-first) | `\|\|` and `??` diverge on falsy `0`/`''`/`false`; review each site, never bulk-apply |
| `useState<string>($A)` | `useState($A)` | Drops an inferrable primitive generic (TSX) | `--lang tsx` required; the generic only drops safely when the initializer fixes the type |

## Python

Alias `py`.

| Pattern (-p) | Rewrite (-r) | Catches / Does | Gotcha |
| --- | --- | --- | --- |
| `print($$$A)` | `logger.info($$$A)` | Debug prints | `$$$A` captures all positional args; keyword args (`sep=`, `end=`) ride along and may not translate |
| `Optional[$T]` | `$T \| None` | PEP 604 union syntax | Bare `Optional[$T]` parses as a subscript, not a generic type — needs a pattern object `{ context: 'a: Optional[$T]', selector: generic_type }`. Nested `Optional[Union[...]]` needs a `rewriters` array; a single pass rewrites only the outermost |
| `$B = lambda: $R` | `def $B():\n    return $R` | Named zero-arg lambda → def | Python block patterns need literal newlines + indentation; the `def` line's trailing colon is part of the grammar, not decoration |
| `except $E:\n    pass` | (detection) | Empty `except` clause | Node kind is `except_clause`; test emptiness with `not has` rather than matching `pass` text |

Python meta-var note: `$` is not a valid Python identifier char, so ast-grep's own engine parses meta-var patterns fine, but raw tree-sitter CST debug views may render `$` oddly. Trust an actual `ast-grep run` over raw CST dumps for Python.

## Rust

Alias `rs`.

| Pattern (-p) | Rewrite (-r) | Catches / Does | Gotcha |
| --- | --- | --- | --- |
| `$VAR.unwrap()` | (detection) | Panic-prone `unwrap` audit | Add `not inside: kind: test_item` to permit `unwrap` in tests while flagging production code |
| `$A.chars().enumerate()` | `$A.char_indices()` | Correct multibyte byte offsets | `enumerate()` yields char counts, `char_indices()` yields byte offsets — only swap when byte offsets are what the caller wants |
| `$VAR.clone()` | (detection) | Clone-cost audit | Matches any receiver indiscriminately; narrow with `inside`/`has` to the type or scope you care about |
| `pub use $B::$C;` | (relational detection) | Redundant re-export when preceded by `pub mod $A;` | Express as a relational rule pairing the `pub use` with the sibling `pub mod`; a bare pattern can't see the relationship |

## Go

Aliases `go`/`golang`.

| Pattern (-p) | Rewrite (-r) | Catches / Does | Gotcha |
| --- | --- | --- | --- |
| `if $ERR != nil { $$$BODY }` | (detection / inventory) | Canonical error-check shape | Inventory-grade; the same shape appears thousands of times, so scope with `inside` before acting |
| `fmt.Println($A)` | `log.Println($A)` | print→logger | Bare `fmt.Println($A)` can mis-parse; wrap contextually: `{ context: 'func t() { fmt.Println($A) }', selector: call_expression }` |
| (YAML rule) | (test discovery) | Test-func discovery | Use a YAML rule with `regex: '^Test'` on the `name` field — the `Test$_` meta-var prefix does NOT work (it tokenizes separately) |
| `kind: import_spec` | (import matching) | Match a specific import | Pair `kind: import_spec` with `has: { field: path, regex: ... }`; a string pattern alone is unreliable for import paths |

## Java

Alias `java`.

| Pattern (-p) | Rewrite (-r) | Catches / Does | Gotcha |
| --- | --- | --- | --- |
| `System.out.println($MSG)` | `logger.info($MSG)` | print→logger | `logger` must already be in scope — the rule rewrites the call but cannot add the import or field |
| `kind: field_declaration` | (typed-field detection) | Field declared with a given type | Use `has: { field: type, regex: '^String$' }`; `$MOD String $F;` fails because a meta-var can't stand in for the modifier node |
| `catch ($E) {}` | (detection) | Empty `catch` block | Detect emptiness with `not has: kind: expression_statement` rather than matching `{}` literally |

## Kotlin

Alias `kt`. **Catalog coverage is thin; every row below is community-derived (community).**

| Pattern (-p) | Rewrite (-r) | Catches / Does | Gotcha |
| --- | --- | --- | --- |
| `$EXPR!!` | (detection) | Non-null assertion (NPE risk) audit **(community)** | `!!` is a postfix/unnamed node — may need `kind: postfix_expression` + `has`, or a `$$` capture, rather than the bare pattern |
| `$A?.let { $$$BODY }` | (detection) | Safe-call + `let` idiom audit **(community)** | `$$$BODY` captures the lambda body; the receiver binding `it` is implicit and won't appear as a meta-var |
| `data class $NAME($$$PROPS)` | (detection) | Data-class property audit **(community)** | `$$$PROPS` captures the primary-constructor params; secondary constructors and body members are not in this capture |

## C

Alias `c`.

| Pattern (-p) | Rewrite (-r) | Catches / Does | Gotcha |
| --- | --- | --- | --- |
| `$M($$$)` | (call detection) | Function-call discovery | Requires `selector: call_expression` — a bare `foo(bar)` fragment parses as `macro_type_specifier` in tree-sitter-c fragment mode |
| `$A == $B` | `$B == $A` | Yoda-condition enforcement (const on right, inside `if`) | Constrain with `has: { field: right, kind: number_literal }` so only literal-on-right comparisons flip |

## C++

Aliases `cpp`/`cc`/`cxx`/`c++`.

| Pattern (-p) | Rewrite (-r) | Catches / Does | Gotcha |
| --- | --- | --- | --- |
| `NULL` | `nullptr` | C++11 null migration | `NULL` is a macro — match via `identifier` kind + `regex: '^NULL$'`, then rewrite, rather than matching `NULL` as a keyword |
| `$PRINTF($S, $VAR)` | `$PRINTF($S, "%s", $VAR)` | Format-string vuln when `$S` is not a string literal | Official C++ catalog rule; also applies to C. Guard so it only fires when `$S` is a non-literal expression |
| `struct $S: $INHERITS { $$$BODY; }` | (detection) | Struct-inheritance discovery | Bare `struct $X: $Y` won't match — include the `{ $$$BODY; }` body so the pattern spans a full struct definition |
| `case_statement` `not has: break_statement` | (relational detection) | Missing-`break` fall-through in `switch` **(community)** | Relational rule, not in the official catalog; intentional fall-through will be flagged as a false positive — review each hit |

## OCaml — NOT SUPPORTED

ast-grep ships no built-in OCaml grammar (OCaml is absent from https://ast-grep.github.io/reference/languages.html). Support would require registering the `tree-sitter-ocaml` grammar through a custom-language config, and no catalog recipes exist for it. OCaml is out of scope for this reference.

---

Cross-cutting: single-quote patterns in the shell so `$VAR` is not expanded by the shell; prefer the `ast-grep` binary over the `sg` alias (`sg` collides with shadow-utils' `sg`, the setgroups/newgrp "log in to a new group" binary, on Linux); always dry-run (default) before passing `-U`/`--update-all` to write changes.
