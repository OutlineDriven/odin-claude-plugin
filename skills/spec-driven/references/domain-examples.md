# Domain-specific examples for spec-driven

Worked illustrations pulled out of `spec-driven/SKILL.md` Phase 1. Read the block for the stack or domain that matches the current project; the other block in each pair is not needed for that run.

## Commands

   ```
   # Node / npm
   Build: npm run build
   Test:  npm test -- --coverage
   Lint:  npm run lint --fix
   Dev:   npm run dev

   # Rust / cargo
   Build: cargo build --release
   Test:  cargo test
   Lint:  cargo clippy -- -D warnings
   Run:   cargo run
   ```

## Project structure

   ```
   # TypeScript service
   src/      application source
   src/lib/  shared utilities
   tests/    unit + integration tests
   e2e/      end-to-end tests
   docs/     documentation

   # Python package
   src/pkg/       package source
   tests/         unit + integration tests
   docs/          documentation
   pyproject.toml build + dependency config
   ```

## Reframing requirements as success criteria

```
REQUIREMENT: "Make the dashboard faster"
REFRAMED:
- LCP < 2.5s on a 4G connection
- Initial data load completes in < 500ms
- No layout shift during load (CLS < 0.1)

REQUIREMENT: "The batch job is too slow"
REFRAMED:
- Processes 1M records in < 90s on the reference host
- Peak resident memory < 512 MB
- Exits non-zero on any partial failure
→ Are these the right targets?
```
