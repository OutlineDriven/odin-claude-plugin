# srgn CLI Cookbook

## Table of Contents
1. Core Mental Model
2. Command Anatomy
3. Safe Execution Sequence
4. Search-Only Recipes
5. Transform Recipes (stdin/stdout)
6. Multi-File Recipes (`--glob`)
7. Action Reference by Use Case
8. Output and Pipeline Control
9. CI and Policy Enforcement
10. Common Mistakes and Fixes
11. Search Mode Caveat
12. Squeeze Caveat

## Core Mental Model

`srgn` is built on two ideas:
1. Scope: what to target.
2. Action: what to do to the targeted text.

In practice:
1. Use language scope to constrain syntax regions.
2. Use regex scope to refine within those regions.
3. Apply one or more actions.

## Command Anatomy

```bash
srgn [OPTIONS] [SCOPE] [-- <REPLACEMENT>]
```

High-signal options:
1. Scope modifiers:
   - `--python ...`, `--rust ...`, `--go ...`, `--typescript ...`, `--csharp ...`, `--hcl ...`, `--c ...`
   - `--python-query ...` and peers
   - `--python-query-file ...` and peers
2. Actions:
   - replacement: positional after `--`
   - `-d/--delete`
   - `-s/--squeeze`
   - `-u/--upper`, `-l/--lower`, `-t/--titlecase`
   - `-n/--normalize`
   - `-S/--symbols`
   - `-g/--german`
3. File processing:
   - `--glob`
   - `--dry-run`
   - `--sorted`
   - `--threads`
   - `--hidden`
   - `--gitignored`
4. Failure behavior:
   - `--fail-any`
   - `--fail-none`
   - `--fail-no-files`

## Safe Execution Sequence

Use this sequence for all destructive tasks:
1. Build a search-only command to verify scope.
2. Add replacement/action but keep stdin or single-file test.
3. Add `--glob ... --dry-run`.
4. Inspect output.
5. Run same command without `--dry-run`.

## Search-Only Recipes

1. Find `age` only inside Python classes:
```bash
srgn --python 'class' 'age'
```

2. Find Rust unsafe keyword usage (syntax-aware):
```bash
srgn --rust 'unsafe'
```

3. Search comments and docstrings together:
```bash
srgn -j --python 'comments' --python 'doc-strings' 'TODO|FIXME'
```

4. Literal replacement without regex escaping:
```bash
echo 'file.txt.backup' | srgn --literal-string '.' -- '_'
```

## Transform Recipes (stdin/stdout)

1. Basic replacement:
```bash
echo 'Hello World' | srgn 'World' -- 'Universe'
```

2. Capture-group swap:
```bash
echo 'John Doe' | srgn '(\w+) (\w+)' -- '$2, $1'
```

3. Delete punctuation:
```bash
echo 'Hello, World!' | srgn -d '[[:punct:]]'
```

4. Collapse repeated horizontal whitespace:
```bash
echo 'hello    world' | srgn '[[:blank:]]+' -- ' '
```

5. Scope + transform in Python function calls:
```bash
cat script.py | srgn --python 'function-calls' '^print$' -- 'logging.info'
```

6. Scope + transform in Rust imports:
```bash
cat lib.rs | srgn --rust 'uses' '^old_crate' -- 'new_crate'
```

## Multi-File Recipes (`--glob`)

1. Python import migration:
```bash
srgn --python 'imports' '^old_pkg' --glob '**/*.py' --dry-run -- 'new_pkg'
```

2. TypeScript module rename:
```bash
srgn --typescript 'imports' '^legacy-lib' --glob 'src/**/*.ts' --dry-run -- 'modern-lib'
```

3. Remove debug prints in Go code:
```bash
srgn --go 'func' --glob 'src/**/*.go' -d 'fmt\.Println\("DEBUG.*'
```

4. C# remove comments in repository:
```bash
srgn --csharp 'comments' --glob '**/*.cs' -d '.*'
```

5. Deterministic processing order:
```bash
srgn --python 'imports' '^x' --glob '**/*.py' --sorted --dry-run -- 'y'
```

## Action Reference by Use Case

1. Replacement:
   - Prefer anchored regex (`^name$`) when renaming identifiers.
2. Deletion (`-d`):
   - Always pass explicit scope.
   - Never run repository-wide without dry run first.
3. Squeeze (`-s`):
   - Use for repeated delimiters.
   - For whitespace normalization across lines, prefer explicit replacement (`'[[:blank:]]+' -- ' '`).
4. Case conversion:
   - Use without scope to affect all input.
   - Use with scope to affect only matches.
5. Normalize:
   - Use for Unicode simplification in text pipelines.
6. Symbols:
   - Convert ASCII operators to symbols.
   - Use `--invert` to reverse symbol mappings where supported.
7. German:
   - `--german` for dictionary-aware replacements.
   - `--german-naive` for forced substitutions.
   - `--german-prefer-original` for ambiguous forms.

## Output and Pipeline Control

1. Force machine-readable output:
```bash
srgn --python 'strings' --stdout-detection force-pipe '(foo|bar)'
```

2. Force tty-style output:
```bash
srgn --python 'strings' --stdout-detection force-tty '(foo|bar)'
```

3. Parse-friendly format is:
`<FILE>:<LINE>:<START-END[;START-END...]>:<LINE_TEXT>`

## CI and Policy Enforcement

1. Fail if anything matches (deny-list policy):
```bash
srgn --python 'doc-strings' --fail-any 'param.+type'
```

2. Fail if nothing matches (must-find policy):
```bash
srgn --rust 'attribute' --fail-none '^allow'
```

3. Fail when a glob matched zero files:
```bash
srgn --python 'imports' --glob 'src/**/*.py' --fail-no-files '^a' -- 'b'
```

## Common Mistakes and Fixes

1. Mistake: unquoted glob expands in shell.
   - Fix: quote glob (`'**/*.py'`).
2. Mistake: forgot `--` before replacement.
   - Fix: keep replacement as final positional argument after `--`.
3. Mistake: broad regex causes over-rewrites.
   - Fix: add language scope and regex anchors.
4. Mistake: assumed multi-language scopes OR by default.
   - Fix: default is intersection; pass `-j` for OR.
5. Mistake: deleting or squeezing without explicit scope.
   - Fix: always provide a scope; test on stdin first.

## Search Mode Caveat

In current `srgn` behavior, "no actions + regex-only scope" may emit an error log and return input unchanged.
Use language scopes for search mode, or include an action when you need transformation.

Example of ambiguous usage to avoid:
```bash
printf 'abc\n' | srgn 'a'
```

Preferred search mode:
```bash
printf 'x = \"foo\"\n' | srgn --python 'strings' 'foo'
```

## Squeeze Caveat

`-s/--squeeze` can work, but current behavior may still emit "not in search mode" logs in some cases.
Treat `-s` as optional optimization, not the primary normalization path for whitespace pipelines.

Safer normalization pattern:
```bash
echo 'hello    world' | srgn '[[:blank:]]+' -- ' '
```
