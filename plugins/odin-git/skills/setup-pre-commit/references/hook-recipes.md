# Per-ecosystem hook contents

**Grounded: 2026-09-04**

These recipes match the SKILL.md manager selection: Lefthook for JavaScript/TypeScript and Go; prek for Python, Rust, and OCaml. Do not install ESLint, Prettier, Black, isort, or mypy; the SKILL.md forbids them.

## JavaScript / TypeScript (Lefthook + Biome)

`lefthook.yml`:

```yaml
pre-commit:
  commands:
    biome:
      run: pnpm exec biome check --write --no-errors-on-unmatched .
    typecheck:
      run: pnpm run typecheck
    test:
      run: pnpm run test
```

Drop the `typecheck` or `test` command when the repo declares no such script, and tell the user. Biome is the formatter and linter; do not add Prettier or ESLint.

## Python (prek)

`.pre-commit-config.yaml`:

```yaml
repos:
  - repo: local
    hooks:
      - id: ruff-check
        name: ruff check
        entry: uv run ruff check --fix .
        language: system
        pass_filenames: false
      - id: ruff-format
        name: ruff format
        entry: uv run ruff format --check .
        language: system
        pass_filenames: false
      - id: pyright
        name: pyright
        entry: uv run pyright
        language: system
        pass_filenames: false
      - id: pytest
        name: pytest
        entry: uv run pytest -q
        language: system
        pass_filenames: false
        stages: [pre-commit]
```

Run via `prek run --all-files`. Do not add Black, isort, or mypy; ruff and pyright cover formatting, linting, and typing.

## Go (Lefthook)

`lefthook.yml`:

```yaml
pre-commit:
  commands:
    fmt:
      run: test -z "$(gofmt -l .)"
      fail_text: gofmt reported unformatted files; run gofmt -w .
    vet:
      run: go vet ./...
    test:
      run: go test -race ./...
```

## Rust (prek)

`.pre-commit-config.yaml`:

```yaml
repos:
  - repo: local
    hooks:
      - id: cargo-fmt
        name: cargo fmt
        entry: cargo fmt --check
        language: system
        pass_filenames: false
        types: [rust]
      - id: cargo-clippy
        name: cargo clippy
        entry: cargo clippy --all-targets -- -D warnings
        language: system
        pass_filenames: false
        types: [rust]
      - id: cargo-test
        name: cargo test
        entry: cargo test
        language: system
        pass_filenames: false
        types: [rust]
```

Replace the `cargo-test` entry with `cargo nextest run` when nextest is installed; `entry` runs without a shell, so `||` fallbacks do not work there.

## OCaml (prek)

`.pre-commit-config.yaml`:

```yaml
repos:
  - repo: local
    hooks:
      - id: dune-fmt
        name: dune fmt
        entry: dune fmt
        language: system
        pass_filenames: false
      - id: dune-build
        name: dune build
        entry: dune build
        language: system
        pass_filenames: false
      - id: dune-test
        name: dune runtest
        entry: dune build @runtest
        language: system
        pass_filenames: false
```

Use any stricter repository alias already declared when one exists.
