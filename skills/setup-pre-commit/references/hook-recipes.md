# Per-ecosystem hook contents

**Node ecosystems**: write `.husky/pre-commit`:

```
npx lint-staged
<pm> run typecheck
<pm> run test
```

Drop missing scripts and tell the user. Write `.lintstagedrc`:

```json
{ "*": "prettier --ignore-unknown --write" }
```

Formatter policy is **out of scope** for this skill. Do NOT auto-create `.prettierrc`. If no Prettier config exists, surface that fact and ask the user.

**Python**: write `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.6.0
    hooks:
      - id: ruff
      - id: ruff-format
  - repo: local
    hooks:
      - id: pyright
        name: pyright
        entry: pyright
        language: system
        pass_filenames: false
      - id: pytest
        name: pytest
        entry: pytest -q
        language: system
        pass_filenames: false
        stages: [pre-commit]
```

**Go**: write `lefthook.yml`:

```yaml
pre-commit:
  parallel: true
  commands:
    fmt:    { run: gofmt -l -w {staged_files} }
    vet:    { run: go vet ./... }
    test:   { run: go test -race ./... }
```

**Rust**: `Cargo.toml`:

```toml
[dev-dependencies]
cargo-husky = { version = "1", default-features = false, features = ["precommit-hook", "run-cargo-test", "run-cargo-clippy", "run-cargo-fmt"] }
```

**OCaml**: `.pre-commit-config.yaml`:

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
        entry: dune runtest
        language: system
        pass_filenames: false
```
