---
name: setup-pre-commit
description: Use when the user wants commit-time checks, or says "install husky/pre-commit/lefthook".
---

Detect the ecosystem, pick the right hook tool, install with formatter + type-check + test gates.

## Detection (run first)

Dispatch Explore agent, or for a single-language repo, probe directly via `fd` for lockfile / manifest signature. Map the first manifest hit to an ecosystem. Multi-language repos: ask the maintainer which surface to gate, or apply both.

## Ecosystem → hook tool

| Ecosystem            | Hook tool                  | Install command                                                  |
| -------------------- | -------------------------- | ---------------------------------------------------------------- |
| npm / yarn / pnpm / bun | husky + lint-staged     | `<pm> add -D husky lint-staged prettier && npx husky init`       |
| Python (poetry/pip)  | pre-commit (framework)     | `pipx install pre-commit && pre-commit install`                  |
| Go                   | lefthook (or pre-commit)   | `go install github.com/evilmartians/lefthook@latest && lefthook install` |
| Rust (cargo)         | cargo-husky (or pre-commit)| add `cargo-husky` as `[dev-dependencies]`; runs on `cargo test`  |
| OCaml (dune)         | pre-commit + dune hooks    | `pipx install pre-commit && pre-commit install`                  |

## Per-ecosystem hook contents

The exact file to write (Node/Python/Go/Rust/OCaml) lives in `references/hook-recipes.md` — read the block matching the ecosystem you detected above; a single-language repo never needs the other four.

## Verify

- `fd -d 2 -t f '\.husky|\.pre-commit-config\.yaml|lefthook\.yml'` shows the expected file.
- The hook is executable.
- Run a no-op commit (`git commit --allow-empty -m "chore: verify hooks"`). Every gate must run and pass.

## Commit

`chore: install pre-commit hooks (<tool>)`. The commit itself trips the new hook, a first-class smoke test.
