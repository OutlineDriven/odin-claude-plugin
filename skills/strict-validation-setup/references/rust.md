# Rust strict-mode bootstrap (2026)

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

- Test-side strict config (no-ignored-tests, deny-warnings under `#[cfg(test)]`) defers to whatever test runner the project uses (cargo-nextest is the 2026 default for parallel test execution).
- `#![forbid(unsafe_code)]` at crate root is the strictest stance and cannot be relaxed by inner attributes. Crates that need unsafe must factor the unsafe surface into a sibling crate (consumed as a normal dependency) rather than soften the forbid.
