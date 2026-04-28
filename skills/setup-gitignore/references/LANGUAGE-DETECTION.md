# Language Detection Table

Map manifest filenames (found via `fd --max-depth 2 -t f`) to gitignore.io key(s).
Build the CSV from all keys whose manifests are present.

| Manifest file(s) | gitignore.io key(s) | Notes |
|---|---|---|
| `Cargo.toml` | `rust` | |
| `package.json` | `node` | Covers npm, pnpm, yarn, bun |
| `package.json` + `tsconfig.json` | `node,typescript` | |
| `pyproject.toml` or `setup.py` or `requirements.txt` | `python` | |
| `go.mod` | `go` | |
| `dune-project` | `ocaml` | |
| `pom.xml` | `maven,java` | |
| `build.gradle` | `gradle,java` | |
| `build.gradle.kts` + `*.kt` source files | `gradle,kotlin` | |
| `CMakeLists.txt` | `cmake,c++` | |
| `*.csproj` or `*.sln` | `csharp,visualstudio` | |
| `Gemfile` | `ruby` | |
| `mix.exs` | `elixir` | |
| `*.cabal` or `stack.yaml` | `haskell` | |
| `pubspec.yaml` | `flutter,dart` | |
| `composer.json` | `php,composer` | |
| `Package.swift` | `swift` | |
| `nx.json` | (bundled only — no gitignore.io Nx key) | Add `.nx/cache/` manually |
| `turbo.json` | (bundled only — no gitignore.io Turborepo key) | Add `.turbo/` manually |
| `WORKSPACE` or `MODULE.bazel` | (bundled only — no gitignore.io Bazel key) | Add `bazel-*` manually |
| `Makefile` (alone, no other manifest) | (skip — too ambiguous) | |

## Monorepo tool supplemental patterns

When the following manifests are detected, append these patterns to the empirical section (no gitignore.io call needed):

- `nx.json`: `.nx/cache/`, `.nx/workspace-data/`
- `turbo.json`: `.turbo/`
- `WORKSPACE` / `MODULE.bazel`: `bazel-bin`, `bazel-out`, `bazel-testlogs`, `bazel-<repo-name>`

## gitignore.io API endpoint

```
GET https://www.toptal.com/developers/gitignore/api/<csv>
```

Example: `curl -sf "https://www.toptal.com/developers/gitignore/api/rust,node,typescript"`

List all supported keys: `curl -sf "https://www.toptal.com/developers/gitignore/api/list"`

## What gitignore.io covers well (do NOT duplicate in bundled blocks)

- Language build artifacts and bytecode
- Dependency directories (`node_modules/`, `vendor/`, `.venv/`)
- Test coverage output (`.coverage`, `.pytest_cache/`, etc.)
- Framework-specific caches (`.next/`, `.nuxt/`, etc.)
- Environment files (`.env`, `.env.*`)

## Anti-patterns to warn users about

- `dist/` and `build/` without a leading `/` can hide committed scripts in subdirectories. Prefer `/dist/` anchored to repo root.
- `bin/` is too broad — shell scripts in `bin/` are commonly committed.
- Negation (`!build/important.sh`) does not work when the parent dir is ignored — restructure instead.
- **Already-tracked files**: `.gitignore` updates do not un-track committed files. Run `git rm --cached <path>` first.

## Notes

- Combine keys when multiple manifests are present (e.g., JS + Python monorepo → `node,python`).
- `fd` depth 2 avoids scanning deeply nested `node_modules/` or `vendor/` trees.
- If no manifests detected, proceed with an empty key list; bundled blocks still apply.
