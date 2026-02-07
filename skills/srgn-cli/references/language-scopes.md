# srgn Language Scopes

## Table of Contents
1. How to Choose a Language Scope
2. Python
3. Rust
4. Go
5. TypeScript
6. C#
7. HCL (Terraform)
8. C
9. Multi-Language Scope Composition

## How to Choose a Language Scope

Pick the narrowest prepared query that matches the user goal:
1. Imports-only rewrite: use `imports` or `uses`.
2. Function-call rewrite: use `function-calls` or equivalent call-expression scope.
3. Documentation/comment cleanup: use `comments` or `doc-strings`.
4. Type-focused refactor: use type scopes (`struct`, `class`, `interface`, `type-def`).

Use regex after language scope to avoid over-matching.

## Python

High-value prepared scopes:
1. `comments`
2. `strings`
3. `imports`
4. `doc-strings`
5. `function-calls`
6. `class`
7. `def`
8. `methods`
9. `types`

Examples:
1. Imports rename:
```bash
srgn --python 'imports' '^good_company' --glob '**/*.py' --dry-run -- 'better_company'
```

2. Replace `print` calls only:
```bash
srgn --python 'function-calls' '^print$' --glob '**/*.py' --dry-run -- 'logging.info'
```

3. Search class docstrings only:
```bash
srgn --python 'class' --python 'doc-strings' 'bird'
```

## Rust

High-value prepared scopes:
1. `uses`
2. `attribute`
3. `unsafe`
4. `struct`
5. `enum`
6. `fn`
7. `trait`
8. `impl`
9. `strings`
10. `comments`

Dynamic scope examples:
1. `struct~Pattern`
2. `enum~Pattern`
3. `fn~Pattern`
4. `trait~Pattern`
5. `mod~Pattern`

Examples:
1. Rename import prefix:
```bash
srgn --rust 'uses' '^good_company' --glob '**/*.rs' --dry-run -- 'better_company'
```

2. Migrate lint attributes:
```bash
srgn --rust 'attribute' '^allow' --glob '**/*.rs' --dry-run -- 'expect'
```

3. Search only unsafe usages:
```bash
srgn --rust 'unsafe'
```

## Go

High-value prepared scopes:
1. `imports`
2. `struct`
3. `interface`
4. `func`
5. `method`
6. `strings`
7. `struct-tags`
8. `comments`

Dynamic scope examples:
1. `struct~[tT]est`
2. `func~Handle`
3. `interface~Repo`

Examples:
1. Rename imports:
```bash
srgn --go 'imports' '^oldmod' --glob '**/*.go' --dry-run -- 'newmod'
```

2. Focus only test structs:
```bash
srgn --go 'struct~[tT]est' 'Name'
```

3. Find candidate literals:
```bash
srgn --go 'strings' '\d+'
```

## TypeScript

High-value prepared scopes:
1. `imports`
2. `function`
3. `method`
4. `class`
5. `interface`
6. `type-alias`
7. `var-decl`
8. `comments`
9. `strings`

Examples:
1. Replace import source:
```bash
srgn --typescript 'imports' '^legacy-lib$' --glob 'src/**/*.ts' --dry-run -- 'modern-lib'
```

2. Clean TODO tags only in comments:
```bash
srgn --typescript 'comments' 'TODO(?=:)' --glob 'src/**/*.ts' --dry-run -- 'TODO(@owner)'
```

3. Search constructors only:
```bash
srgn --typescript 'constructor' '.+'
```

## C#

High-value prepared scopes:
1. `comments`
2. `strings`
3. `usings`
4. `class`
5. `method`
6. `property`
7. `field`
8. `identifier`

Examples:
1. Remove comments:
```bash
srgn --csharp 'comments' --glob '**/*.cs' -d '.*'
```

2. Rename namespace usage:
```bash
srgn --csharp 'usings' '^Old\.Namespace' --glob '**/*.cs' --dry-run -- 'New.Namespace'
```

3. Search identifiers:
```bash
srgn --csharp 'identifier' '^UserService$'
```

## HCL (Terraform)

High-value prepared scopes:
1. `resource`
2. `data`
3. `provider`
4. `module`
5. `variables`
6. `resource-names`
7. `data-names`
8. `strings`
9. `comments`

Examples:
1. Upgrade instance family in strings:
```bash
srgn --hcl 'strings' '^t2\.(\w+)$' --glob '**/*.tf' --dry-run -- 't3.$1'
```

2. Rename data names:
```bash
srgn --hcl 'data-names' '^tiny$' --glob '**/*.tf' --dry-run -- 'small'
```

3. Search provider blocks:
```bash
srgn --hcl 'provider' '.+'
```

## C

High-value prepared scopes:
1. `includes`
2. `function`
3. `function-def`
4. `function-decl`
5. `struct`
6. `enum`
7. `comments`
8. `strings`
9. `call-expression`

Examples:
1. Rename function declarations and calls:
```bash
srgn --c 'function' 'old_function_name' --glob '**/*.[ch]' --dry-run -- 'new_function_name'
```

2. Search includes only:
```bash
srgn --c 'includes' 'legacy_header'
```

3. Delete comments:
```bash
srgn --c 'comments' -d '.*'
```

## Multi-Language Scope Composition

Default behavior for multiple language scopes:
1. Intersection, left-to-right.
2. Each scope narrows prior scope.

Join behavior with `-j`:
1. OR semantics across language scopes.
2. Useful for "comments OR docstrings" style queries.

Examples:
1. Intersection:
```bash
srgn --python 'class' --python 'doc-strings' 'bird'
```

2. OR:
```bash
srgn -j --python 'comments' --python 'doc-strings' 'TODO'
```
