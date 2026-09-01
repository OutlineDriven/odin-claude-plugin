# Rust strict-mode bootstrap (2026)

**Grounded: 2026-08-31**

## Cargo.toml

```toml
[package]
edition = "2024"
rust-version = "1.85"

[lints.rust]
unsafe_code = "forbid"
missing_docs = "warn"
unused_lifetimes = "warn"

[lints.clippy]
correctness = { level = "deny", priority = -1 }
suspicious  = { level = "warn", priority = -1 }
complexity  = { level = "warn", priority = -1 }
perf        = { level = "warn", priority = -1 }
pedantic    = { level = "warn", priority = -1 }
unwrap_used = "deny"
expect_used = "warn"
panic       = "warn"
```

Clippy's only deny-by-default level is `correctness`. The configuration above keeps that, then promotes `unwrap_used` to deny (matches the user's "fail-fast typed errors" stance) and pulls in `pedantic` at warn so style drift surfaces without blocking. `unsafe_code = "forbid"` is the crate-level stance — strictest available; cannot be relaxed by inner attributes. If a crate genuinely needs unsafe code, that crate is the wrong consumer of this skill: factor the unsafe surface into a separate crate that itself omits `forbid`, and consume it from the strict crate as a normal dependency.

## clippy.toml

```toml
allow-panic-in-tests = true
allow-unwrap-in-tests = true
allow-expect-in-tests = true
```

`allow-panic-in-tests` exempts `panic!` in test functions and `#[cfg(test)]` code from `clippy::panic`, so the failing-test pattern in `SKILL.md` step 6 (`panic!("SC-NN unmet: criterion")`) compiles under deny-warnings. `allow-unwrap-in-tests` and `allow-expect-in-tests` do the same for `unwrap_used` and `expect_used`, which the `[lints]` table above sets to deny and warn. The `[lints]` table accepts only `level` and `priority`; it cannot scope a lint to test targets, so these exemptions live in `clippy.toml`.

## rustfmt.toml

```toml
edition = "2024"
max_width = 100
imports_granularity = "Module"
group_imports = "StdExternalCrate"
reorder_imports = true
use_field_init_shorthand = true
use_try_shorthand = true
```

## Schema validators / typed errors at IO boundaries

```rust
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct Request {
    pub user_id: uuid::Uuid,
    pub payload: serde_json::Value,
}

#[derive(Debug, Error)]
pub enum RequestError {
    #[error("invalid request shape: {0}")]
    Shape(#[from] serde_json::Error),
    #[error("user_id is not a v4 UUID")]
    BadUuid,
}
```

`#[serde(deny_unknown_fields)]` is the Rust analogue of zod `.strict()` / pydantic `extra="forbid"` — extra fields fail the parse rather than silently dropping.

## Notes

- Deny-warnings under `#[cfg(test)]` is a source-level crate attribute, not a `[lints]` entry: `#![cfg_attr(test, deny(warnings))]` in the crate root. The config-merge step does not edit source files, so this is guidance the project applies separately. "No-ignored-tests" has no standard enforcement in Rust tooling (no clippy or rustc lint flags `#[ignore]`); do not promise it.
- The test runner is whatever the project already uses. `cargo test` is the built-in default; `cargo-nextest` is a separately installed third-party runner that must be verified as configured before use, not assumed as a default. This matches `SKILL.md` step 4, which says to infer the framework only from existing manifest dependencies or tests.
- The failing-test pattern in `SKILL.md` step 6 writes `panic!("SC-NN unmet: criterion")`, which `clippy::panic` flags once deny-warnings is on. The `clippy.toml` above sets `allow-panic-in-tests = true` (with `allow-unwrap-in-tests` and `allow-expect-in-tests`) so the strict config does not reject the very failing tests this skill installs. An equivalent source-level escape hatch is `#[cfg_attr(test, allow(clippy::panic, clippy::unwrap_used, clippy::expect_used))]` at the crate root.
